// Rediseño Panel de Socios (30/10/2026) · pruebas de aceptación del brief (pág. 13) con Playwright.
// Sirve el panel local y responde la API /rev/* con un simulador que usa la MISMA validación del servidor
// (sublicuentas-tg-bot/lib_compra_socios.js). Datos ficticios; no se crean ventas reales.
// Uso: BOT_DIR=../sublicuentas-tg-bot node tests/socios-rediseno.e2e.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOT_DIR = path.resolve(root, process.env.BOT_DIR || '../bot');
const CS = require(path.join(BOT_DIR, 'lib_compra_socios.js'));
// Entregas, Buzón y Telegram: se sirven con las rutas REALES del bot (rev_entregas_api.js) sobre un Firestore en memoria.
const express = require(path.join(BOT_DIR, 'node_modules/express'));
const { FakeDb } = require(path.join(BOT_DIR, 'tests/helpers/fake-firestore.js'));
const ENT_KEY = require('node:crypto').randomBytes(32).toString('base64');
const OUT = process.env.E2E_OUT || path.join(root, 'tests/capturas');
fs.mkdirSync(OUT, { recursive: true });
const API_HOST = 'https://sublicuentas-panel-api.onrender.com';

/* ---------- datos ficticios ---------- */
const hoy = new Date();
const dmy = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const en = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return dmy(d); };
function catalogo() {
  return [
    { cat: '📺 Streaming', sub: 'Plan mensual', items: [
      { id: 'hbo_platino', n: 'HBO Max', s: 'Platino', p: 100, d: '👤 1 perfil\n📱 1 dispositivo\n🛡️ Garantía 30 días', entregaTipo: 'perfil', entregaCanal: 'manual', pideDispositivo: 'auto' },
      { id: 'disney_premium', n: 'Disney Premium', s: '1 mes', p: 90, d: '👤 1 perfil', entregaTipo: '', entregaCanal: 'manual' },
      { id: 'netflix_completa_largo_nombre', n: 'Netflix cuenta completa 4 pantallas con nombre largo de prueba', s: '1 mes', p: 350, d: '4 pantallas', entregaTipo: 'cuenta_completa', entregaCanal: 'inventario' },
    ] },
    { cat: '🎨 Diseño y productividad', sub: '', items: [
      { id: 'canva', n: 'Canva Pro', s: '1 mes', p: 70, d: '✉️ Invitación al correo', entregaTipo: 'correo', entregaCanal: 'invitacion', stockModo: 'manual', stockCantidad: 3 },
      { id: 'office2021', n: 'Office 2021', s: 'Licencia permanente', p: 300, d: '🔑 KEY de activación', entregaTipo: 'serial_key', entregaCanal: 'manual' },
    ] },
    { cat: '📡 TV digital', sub: '', items: [
      { id: 'oleada_1', n: 'Oleada TV', s: '1 dispositivo', p: 150, d: 'Canales en vivo', entregaTipo: 'tv_digital', entregaCanal: 'manual' },
      { id: 'latintv_1', n: 'LatinTV', s: '1 pantalla', p: 200, d: 'IPTV', entregaTipo: '', entregaCanal: 'iptv' },
    ] },
    { cat: '🎮 Recargas', sub: '', items: [
      { id: 'ff_520', n: 'Free Fire', s: '520 diamantes', p: 120, d: 'Recarga directa', entregaTipo: 'detalle', datoRequerido: 'ID de jugador' },
      { id: 'especial', n: 'Servicio especial', s: '', p: null, d: 'Precio por comisión', entregaTipo: 'detalle' },
    ] },
  ];
}
const clientesSocio = [
  { id: 'c1', nombrePerfil: 'Ana López', telefono: '98765432', servicios: [{ plataforma: 'HBO Max', fechaRenovacion: en(3), precio: 100 }, { plataforma: 'Canva Pro', fechaRenovacion: en(20), precio: 70 }] },
  { id: 'c2', nombrePerfil: 'Carlos Mejía', telefono: '33445566', servicios: [{ plataforma: 'Disney Premium', fechaRenovacion: en(-2), precio: 90 }] },
  { id: 'c3', nombrePerfil: 'María José Hernández Castellanos de la Vega', telefono: '+13055550101', servicios: [{ plataforma: 'LatinTV', fechaRenovacion: en(0), precio: 200 }] },
];
function nuevoEstado() {
  const pedidos = new Map();
  const viejo = { version: 2, socio_norm: 'jimena', estado: 'falta información', detalleEstado: 'Envíe el correo correcto de Canva', clientePrincipal: { clienteId: 'c2', nombre: 'Carlos', apellido: 'Mejía' }, productos: [{ renglonId: 'r1', catalogId: 'canva', servicio: 'Canva Pro · 1 mes', servicioBase: 'Canva Pro', precioCatalogo: 70, cantidad: 1, clienteNombre: 'Carlos Mejía', correo: 'carlos@correo', destinatario: { tipo: 'principal' } }], subtotalCatalogo: 70, descuentoCombo: 0, totalCombo: 70, monto: 70, banco: 'BAC', imagenUrl: 'x', createdAt: new Date(Date.now() - 86400000).toISOString(), estadoHistorial: [{ estado: 'pendiente', at: new Date(Date.now() - 86400000).toISOString() }, { estado: 'falta información', detalle: 'Envíe el correo correcto de Canva', at: new Date().toISOString() }] };
  pedidos.set('web_seed00ABC123', viejo);
  return { pedidos, stock: { canva: 3 }, sugerencias: [], precioExtra: 0, calls: [], cortarRespuesta: 0, real: null };
}
const norm = (v) => String(v || '').toLowerCase().trim();
async function apiReal(E) {
  if (E.real) return E.real;
  const db = new FakeDb(), app = express(); app.use(express.json());
  const revAuth = (req, res, next) => { if (!/Bearer/.test(req.headers.authorization || '')) return res.status(401).json({ error: 'auth' }); req.rev = { id: 'jimena', nombre_norm: 'jimena', nombre: 'Jimena' }; next(); };
  const revAdminAuth = (req, res, next) => { if (!req.headers['x-admin']) return res.status(401).end(); req.admin = { nombre: 'Admin', permissions: ['*'] }; next(); };
  require(path.join(BOT_DIR, 'rev_entregas_api.js')).registrar(app, {
    db, revAuth, revAdminAuth, adminAnyPermission: () => (q, r, n) => n(), isFullAdmin: () => true, adminScopeProfile: () => 'sublicuentas',
    revLiveProfile: async (rev) => { const s = await db.collection('revendedores').doc(rev.id).get(); return { id: rev.id, ...(s.data() || {}) }; },
    revSocioAliases: (live) => [norm(live.nombre_norm || live.id)], revNormKey: norm,
    revFiltrarClientePorAliases: (c, a) => ({ ...c, servicios: (c.servicios || []).filter((x) => a.includes(norm(x.vendedor))) }),
    destinoInfo: (d) => ({ key: d || 'sublicuentas', label: '🟣 Sublicuentas' }), getDestinoChatIds: async () => ['900001'], bot: { getMe: async () => ({ username: 'SubliBotPrueba' }) },
    env: { ENTREGAS_CODIGOS_KEY: ENT_KEY, SOCIOS_PANEL_URL: 'https://socios.ejemplo.test', PORTAL_CLIENTE_BASE: 'https://sublichat.ejemplo.test' },
  });
  await db.collection('revendedores').doc('jimena').set({ nombre: 'Jimena', nombre_norm: 'jimena', telegramId: '', activo: true });
  await db.collection('revendedores').doc('otra').set({ nombre: 'Otra', nombre_norm: 'otra', telegramId: '555', activo: true });
  for (const [id, x] of E.pedidos) await db.collection('compras').doc(id).set(x);
  const srv = await new Promise((r) => { const s2 = app.listen(0, () => r(s2)); });
  const base = `http://127.0.0.1:${srv.address().port}`;
  const admin = async (method, url, body) => { const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-admin': '1', 'x-sublichat-actor': 'naara' }, body: body ? JSON.stringify(body) : undefined }); return r.json(); };
  E.real = { db, srv, base, admin };
  return E.real;
}
const RUTAS_REALES = /^\/rev\/(entregas|novedades|consultas|telegram)(\/|$|\?)/;

/* ---------- simulador de /rev/* (misma regla del servidor) ---------- */
async function api(route, E) {
  const req = route.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
  if (RUTAS_REALES.test(p)) {
    const R = await apiReal(E);
    const r = await fetch(R.base + p + url.search, { method, headers: { 'Content-Type': 'application/json', Authorization: req.headers().authorization || '' }, body: ['GET', 'HEAD'].includes(method) ? undefined : (req.postData() || undefined) });
    return route.fulfill({ status: r.status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: await r.text() });
  }
  const ok = (json, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
  E.calls.push(`${method} ${p}`);
  if (p === '/health') return ok({ ok: true });
  if (p === '/rev/me') return ok({ nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena', capabilities: null });
  if (p === '/rev/clientes') return ok(clientesSocio);
  if (p === '/rev/precios') { const c = catalogo(); c[0].items[0].p += E.precioExtra; return ok(c); }
  if (p === '/rev/inventario') return ok({ items: [{ id: 'canva', estado: E.stock.canva <= 0 ? 'agotado' : 'bajo', stock: E.stock.canva }] });
  if (p === '/rev/metricas') return ok({ operadoMes: 1450, comprasMes: 6, renovacionesMes: 9, pedidosPendientes: 1 });
  if (p === '/rev/avisos') return ok([{ id: 'a1', texto: 'Nuevo: Oleada TV ya se entrega con instalación guiada.', autor: 'Sublicuentas', ts: Date.now() - 3600000 }]);
  if (p === '/rev/gamificacion') return ok({ perfil: { nombreMostrar: 'Jimena', ventas: 12, nivel: 'Leyenda' }, ranking: [], insignias: [], recompensas: [], solicitudes: [] });
  if (p === '/rev/metodos-pago') return ok({ ok: true, metodos: [{ id: 'bac', nombre: 'BAC Credomatic', titular: 'NOMBRE DE PRUEBA', cuenta: '000000000', nota: '' }, { id: 'tigo', nombre: 'Tigo Money', titular: 'NOMBRE DE PRUEBA', cuenta: '00000000', nota: '+6.5% comisión' }] });
  if (p === '/rev/compras/mias') return ok({ ok: true, items: [...E.pedidos.entries()].reverse().map(([id, x]) => CS.pedidoPublico(id, x)) });
  if (p === '/rev/sugerencias/mias') return ok(E.sugerencias);
  if (p === '/rev/sugerencia' && method === 'POST') { const b = req.postDataJSON(); E.sugerencias.push({ id: 's' + E.sugerencias.length, texto: b.texto, pedidoId: b.pedidoId || '', estado: 'enviada' }); return ok({ ok: true }); }
  if (p === '/rev/compra/estado') { const id = 'web_' + url.searchParams.get('requestId'); const x = E.pedidos.get(id); return ok(x ? { ok: true, existe: true, pedido: CS.pedidoPublico(id, x) } : { ok: true, existe: false }); }
  if (p === '/rev/compra' && method === 'POST') {
    const b = req.postDataJSON(), id = 'web_' + b.requestId;
    // Igual que server_api.js: un pedido = un cliente. Un renglón "para otro cliente" se rechaza aunque el navegador se manipule.
    if ((b.productos || []).some((x) => x?.destinatario?.tipo === 'otro')) return ok({ error: 'cliente_unico' }, 400);
    if (E.pedidos.has(id)) { const d = E.pedidos.get(id); return ok({ ok: true, id, ref: id.slice(-6).toUpperCase(), duplicate: true, estado: d.estado, totalCombo: d.totalCombo, descuentoCombo: d.descuentoCombo }); }
    const plano = catalogo().flatMap((g) => g.items.map((it) => ({ ...it, categoria: g.cat })));
    plano[0].p += E.precioExtra;
    const productos = [], errores = [...CS.validarPrincipal(b.clientePrincipal || {})];
    for (const [i, raw] of (b.productos || []).entries()) {
      const item = plano.find((x) => x.id === raw.catalogId);
      if (!item) return ok({ error: 'producto_fuera_catalogo' }, 400);
      const { renglon, errores: e } = CS.normalizarRenglon(raw, item, b.clientePrincipal || {}, i);
      errores.push(...e);
      productos.push({ ...renglon, catalogId: item.id, servicio: item.s ? `${item.n} · ${item.s}` : item.n, servicioBase: item.n, precioCatalogo: item.p });
    }
    if (errores.length) return ok({ error: 'datos_incompletos', errores }, 400);
    const t = CS.totales(productos.map((x) => ({ precio: x.precioCatalogo, cantidad: x.cantidad })));
    if (b.totalEsperado != null && !t.hayComision && Number(b.totalEsperado) !== t.total) return ok({ error: 'precio_cambio', totalCombo: t.total, descuentoCombo: t.descuento, subtotalCatalogo: t.subtotal }, 409);
    const canva = productos.filter((x) => x.catalogId === 'canva').length;
    if (canva > E.stock.canva) return ok({ error: 'sin_stock', detail: 'Canva Pro · 1 mes: no hay disponibilidad suficiente.' }, 409);
    if (!b.bancoId) return ok({ error: 'falta_banco' }, 400);
    E.stock.canva -= canva;
    E.pedidos.set(id, { version: 2, socio_norm: 'jimena', clientePrincipal: b.clientePrincipal, productos, subtotalCatalogo: t.subtotal, descuentoCombo: t.descuento, totalCombo: t.total, monto: t.hayComision ? b.monto : t.total, banco: 'BAC Credomatic', comentario: b.comentario, imagenUrl: b.imagen ? 'ok' : '', estado: 'pendiente', createdAt: new Date().toISOString(), estadoHistorial: [{ estado: 'pendiente', detalle: 'Pedido recibido', at: new Date().toISOString() }] });
    if (E.cortarRespuesta > 0) { E.cortarRespuesta--; return route.abort('connectionreset'); } // el pedido llegó pero la respuesta se perdió
    return ok({ ok: true, id, ref: id.slice(-6).toUpperCase(), destinoLabel: '🟣 Sublicuentas', totalCombo: t.total, descuentoCombo: t.descuento, subtotalCatalogo: t.subtotal, estado: 'pendiente', comprobante: true });
  }
  return ok({ error: 'no_simulado', path: p }, 404);
}

/* ---------- servidor de archivos ---------- */
const server = http.createServer((q, r) => {
  const u = new URL(q.url, 'http://x'); const f = path.join(root, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/json' };
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;
const PNG = path.join(OUT, '_comprobante.png');
fs.writeFileSync(PNG, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));

const browser = await chromium.launch();
async function abrir(viewport = { width: 390, height: 844 }, E = nuevoEstado(), extra = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra });
  await ctx.addInitScript(() => {
    try { if (!sessionStorage.getItem('_sx_init')) { sessionStorage.setItem('_sx_init', '1'); localStorage.setItem('rev_token', 'tok'); localStorage.setItem('rev_data', JSON.stringify({ nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena' })); localStorage.setItem('rev_last', String(Date.now())); } } catch (_) {}
  });
  await ctx.route(`${API_HOST}/**`, (route) => api(route, E));
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await ctx.route('https://fonts.gstatic.com/**', (r) => r.abort());
  const page = await ctx.newPage();
  const errores = []; page.on('pageerror', (e) => errores.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);
  await page.waitForSelector('#app:not(.hide)'); await page.waitForFunction(() => typeof current !== 'undefined' && !!document.querySelector('#content > :not(.spin)'));
  return { ctx, page, E, errores };
}
const shot = (page, n) => page.screenshot({ path: path.join(OUT, n), fullPage: false });
const resultados = [];
async function caso(nombre, fn) {
  if (process.env.E2E_SOLO && !nombre.includes(process.env.E2E_SOLO)) return;
  try { await fn(); resultados.push(['OK', nombre]); console.log('✔', nombre); }
  catch (e) { resultados.push(['FALLA', nombre, e.message]); console.log('✖', nombre, '\n   ', e.message.split('\n').slice(0, 4).join('\n    ')); }
}
async function irCompras(page) { await page.evaluate(() => go('compras')); await page.waitForSelector('#sxCompra'); }
async function agregar(page, pid) { await page.click(`.sx-prod[data-pid="${pid}"] [data-act="agregar"], .sx-prod[data-pid="${pid}"] [data-act="mas"]`); }
async function continuar(page) { await page.click('#sxBottomBar [data-act="paso"], #sxSummary [data-act="paso"]', { strict: false }).catch(async () => { await page.locator('[data-act="paso"]').last().click(); }); }
async function siguiente(page, n) { await page.evaluate((n) => sxIrPaso(n), n); }

await caso('A · Un cliente, varios servicios: HBO (dispositivo) + Canva (correo); payload y pedido guardado con destinatarios', async () => {
  const { page, E, errores, ctx } = await abrir();
  await shot(page, '01-movil-inicio.png');
  await irCompras(page);
  await agregar(page, 'cat_hbo_platino'); await agregar(page, 'cat_canva');
  const y0 = await page.evaluate(() => window.scrollY);
  await agregar(page, 'cat_oleada_1'); await page.click('.sx-prod[data-pid="cat_oleada_1"] [data-act="menos"]');
  assert.equal(await page.evaluate(() => window.scrollY), y0, 'agregar no manda al inicio');
  await shot(page, '02-movil-paso1-productos.png');
  await siguiente(page, 2);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'sxPasoTitulo', 'enfoca el título del paso');
  await page.fill('#sx_p_nombre', 'Ana'); await page.fill('#sx_p_apellido', 'López');
  const hbo = await page.evaluate(() => SX.renglones[0].rid), canva = await page.evaluate(() => SX.renglones[1].rid);
  await page.click(`[data-act="opcion"][data-rid="${hbo}"][data-v="tv"]`);
  await page.fill(`#sx_${canva}_correo`, 'ana@ejemplo.com');
  assert.match(await page.textContent(`#sxr_${hbo}`), /Asignado a Ana López/);
  await shot(page, '03-movil-paso2-datos.png');
  await siguiente(page, 3);
  await page.click('[data-act="banco"][data-id="bac"]');
  await page.setInputFiles('#sxFile', PNG);
  await page.waitForSelector('.sx-receipt');
  await page.fill('textarea[data-sx="comentario"]', 'Entregar hoy');
  await shot(page, '04-movil-paso3-pago.png');
  await page.click('#sxBottomBar [data-act="enviar"]');
  await page.waitForSelector('.sx-confirm');
  await shot(page, '05-movil-confirmacion.png');
  const [id, ped] = [...E.pedidos.entries()].pop();
  assert.equal(ped.clientePrincipal.nombre, 'Ana');
  assert.equal(ped.productos[0].dispositivo, '📺 TV'); assert.equal(ped.productos[0].perfil, 'Ana López');
  assert.equal(ped.productos[1].correo, 'ana@ejemplo.com'); assert.equal(ped.productos[1].dispositivo, '', 'no copia el dispositivo a Canva');
  assert.equal(ped.totalCombo, 160, 'HBO L100 + Canva L70 − L10');
  assert.match(await page.textContent('.sx-confirm'), new RegExp(id.slice(-6).toUpperCase()));
  assert.equal(await page.evaluate(() => localStorage.getItem(sxBorradorKey())), null, 'borrador limpio al confirmar');
  await page.click('[data-act="ver-pedido"]'); await page.waitForSelector('#sxPedTitulo');
  assert.match(await page.textContent('.sx-page'), /Cliente: Ana López/);
  assert.equal((await page.textContent('.sx-review')).match(/Pendiente/g)?.length, 2, 'cada servicio con su propio estado de entrega');
  await shot(page, '06-movil-detalle-pedido.png');
  assert.deepEqual(errores, []); await ctx.close();
});

await caso('B · Un solo cliente: sin "otro cliente"; cambiar de cliente limpia sus datos; "Nueva compra para otro cliente" guarda la actual; el servidor rechaza un payload manipulado', async () => {
  const { page, E, ctx } = await abrir({ width: 1440, height: 900 });
  await irCompras(page);
  await agregar(page, 'cat_hbo_platino'); await agregar(page, 'cat_disney_premium');
  await siguiente(page, 2);
  await page.fill('#sx_p_buscar', 'ana'); await page.click('[data-act="cliente-elegir"][data-scope="p"][data-id="c1"]');
  assert.equal(await page.locator('[data-sx="otroCliente"]').count(), 0, 'ya no existe "Este servicio es para otro cliente"');
  assert.doesNotMatch(await page.textContent('#sxCompra'), /Este servicio es para otro cliente/);
  const [h, d] = await page.evaluate(() => SX.renglones.map((r) => r.rid));
  await page.click(`[data-act="opcion"][data-rid="${h}"][data-v="celular"]`); await page.click(`[data-act="opcion"][data-rid="${d}"][data-v="tv"]`);
  assert.match(await page.textContent(`#sxr_${h} [data-act="duplicar"]`), /Agregar otro perfil para Ana/);
  for (const a of ['otro-servicio', 'otro-cliente']) assert.equal(await page.locator(`[data-act="${a}"]`).count(), 0, 'sin enlaces repetidos al pie');
  assert.doesNotMatch(await page.textContent('#sxMain'), /Volver a productos|Nueva compra para otro cliente|Agregar otro servicio/);
  await shot(page, '10-escritorio-paso2-un-cliente.png');
  // Cambiar el cliente antes de enviar: avisa (diálogo aceptado) y limpia los datos personales; conserva productos.
  await page.click('[data-act="cliente-cambiar"][data-scope="p"]');
  assert.deepEqual(await page.evaluate(() => SX.renglones.map((r) => r.dispositivo)), ['', ''], 'no arrastra datos de Ana');
  assert.equal(await page.evaluate(() => SX.renglones.length), 2);
  await page.fill('#sx_p_nombre', 'Luis'); await page.fill('#sx_p_apellido', 'Ramos');
  assert.match(await page.textContent(`#sxr_${d}`), /Asignado a Luis Ramos/);
  await page.click(`[data-act="opcion"][data-rid="${h}"][data-v="celular"]`); await page.click(`[data-act="opcion"][data-rid="${d}"][data-v="tv"]`);
  // Nueva compra para otro cliente: guarda la de Luis y empieza vacía
  await page.evaluate(() => sxNuevaCompraOtroCliente()); // sigue disponible desde Clientes ("Nueva compra para este cliente")
  assert.equal(await page.evaluate(() => SX.renglones.length), 0);
  await page.waitForSelector('[data-act="borrador-abrir"]');
  assert.match(await page.textContent('#sxCompra'), /Compras guardadas[\s\S]*Luis Ramos/);
  await shot(page, '13-escritorio-compras-guardadas.png');
  await page.click('[data-act="borrador-abrir"]');
  assert.equal(await page.evaluate(() => SX.principal.nombre), 'Luis');
  await siguiente(page, 3);
  await page.click('[data-act="banco"][data-id="bac"]'); await page.setInputFiles('#sxFile', PNG); await page.waitForSelector('.sx-receipt');
  await shot(page, '11-escritorio-paso3.png');
  await page.click('#sxSummary [data-act="enviar"]'); await page.waitForSelector('.sx-confirm');
  await shot(page, '12-escritorio-confirmacion.png');
  const ped = [...E.pedidos.values()].pop();
  assert.deepEqual(ped.productos.map((x) => x.clienteNombre), ['Luis Ramos', 'Luis Ramos']); assert.equal(ped.productos[1].dispositivo, '📺 TV');
  assert.ok(ped.productos.every((x) => x.destinatario.tipo === 'principal'));
  // Payload manipulado con dos clientes → rechazado por el servidor
  const r = await page.evaluate(async () => { try { await sxPost('/rev/compra', { ...sxPayload(), version: 2, requestId: 'manipulado', clientePrincipal: { nombre: 'Ana', apellido: 'López' }, productos: [{ renglonId: 'r1', catalogId: 'hbo_platino', dispositivo: 'tv', destinatario: { tipo: 'otro', nombre: 'Carlos', apellido: 'Mejía' } }] }); return 'aceptado'; } catch (e) { return e.error; } });
  assert.equal(r, 'cliente_unico');
  await ctx.close();
});

await caso('C · Mismo plan repetido: dos perfiles HBO = dos renglones con ID y datos propios; quitar uno no borra el otro', async () => {
  const { page, E, ctx } = await abrir();
  await irCompras(page);
  await agregar(page, 'cat_hbo_platino'); await page.click('.sx-prod[data-pid="cat_hbo_platino"] [data-act="mas"]');
  await siguiente(page, 2);
  await page.fill('#sx_p_nombre', 'Ana'); await page.fill('#sx_p_apellido', 'López');
  const [a, b] = await page.evaluate(() => SX.renglones.map((r) => r.rid));
  assert.notEqual(a, b);
  await page.click(`[data-act="opcion"][data-rid="${a}"][data-v="tv"]`);
  await page.click(`[data-act="opcion"][data-rid="${b}"][data-v="celular"]`);
  await page.check(`[data-sx="otroPerfil"][data-rid="${b}"]`); await page.fill(`#sx_${b}_perfilNombre`, 'Niños');
  assert.match(await page.textContent(`#sxr_${b}`), /Perfil 2/); assert.doesNotMatch(await page.textContent(`#sxr_${b}`), /unidad/i);
  assert.match(await page.textContent(`#sxr_${b} [data-act="duplicar"]`), /Agregar otro perfil para Ana/);
  // agregar una tercera unidad y quitarla
  await page.click(`[data-act="duplicar"][data-rid="${b}"]`);
  const c = await page.evaluate(() => SX.renglones[2].rid);
  await page.click(`[data-act="quitar"][data-rid="${c}"]`);
  assert.equal(await page.evaluate(() => SX.renglones.length), 2);
  assert.equal(await page.evaluate((b) => SX.renglones.find((r) => r.rid === b).perfilNombre, b), 'Niños');
  await siguiente(page, 3); await page.click('[data-act="banco"][data-id="bac"]'); await page.setInputFiles('#sxFile', PNG); await page.waitForSelector('.sx-receipt');
  await page.click('#sxBottomBar [data-act="enviar"]'); await page.waitForSelector('.sx-confirm');
  const ped = [...E.pedidos.values()].pop();
  assert.deepEqual(ped.productos.map((p) => [p.perfil, p.dispositivo]), [['Ana López', '📺 TV'], ['Niños', '📱 Celular']]);
  await ctx.close();
});

await caso('Modalidades: invitación, cuenta completa, licencia, recarga con ID de jugador y TV digital (celular sin marca de TV; Oleada por catálogo)', async () => {
  const { page, E, ctx } = await abrir({ width: 768, height: 1024 });
  await irCompras(page);
  for (const pid of ['cat_netflix_completa_largo_nombre', 'cat_office2021', 'cat_ff_520', 'cat_oleada_1', 'cat_latintv_1']) await agregar(page, pid);
  await page.click('.sx-prod[data-pid="cat_netflix_completa_largo_nombre"] [data-act="mas"]'); // cuenta completa: + suma cantidad, no renglones
  assert.equal(await page.evaluate(() => SX.renglones.filter((r) => r.pid === 'cat_netflix_completa_largo_nombre').length), 1);
  await siguiente(page, 2);
  await page.fill('#sx_p_nombre', 'Ana'); await page.fill('#sx_p_apellido', 'López');
  await siguiente(page, 3);
  assert.equal(await page.evaluate(() => SX.paso), 2, 'no avanza con datos faltantes');
  assert.ok(await page.locator('.sx-field.err').count() >= 3);
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'INPUT', 'foco en el primer error');
  await shot(page, '20-tablet-errores-de-campo.png');
  const rid = (pid) => page.evaluate((pid) => SX.renglones.find((r) => r.pid === pid).rid, pid);
  const ff = await rid('cat_ff_520'), ol = await rid('cat_oleada_1'), lt = await rid('cat_latintv_1');
  assert.match(await page.textContent(`#sxr_${ff}`), /ID de jugador/);
  await page.fill(`#sx_${ff}_detalle`, '123456789');
  await page.click(`[data-act="opcion"][data-rid="${ol}"][data-v="celular"]`);
  assert.equal(await page.locator(`[data-rid="${ol}"][data-campo="marcaTv"]`).count(), 0, 'celular: no pide marca de TV');
  await page.click(`[data-act="opcion"][data-rid="${lt}"][data-v="tv"]`);
  await page.click(`[data-act="opcion"][data-rid="${lt}"][data-v="otro"]`); await page.fill(`#sx_${lt}_marcaOtra`, 'Hisense 55A6');
  assert.equal(await page.textContent('#sx_p_nombre').catch(() => ''), '', 'lo escrito se conserva');
  assert.equal(await page.inputValue('#sx_p_nombre'), 'Ana');
  await siguiente(page, 3);
  assert.equal(await page.evaluate(() => SX.paso), 3);
  await page.click('[data-act="banco"][data-id="tigo"]'); await page.setInputFiles('#sxFile', PNG); await page.waitForSelector('.sx-receipt');
  assert.match(await page.textContent('.sx-pay-info'), /Cuenta: 00000000/);
  await page.click('#sxBottomBar [data-act="enviar"]'); await page.waitForSelector('.sx-confirm');
  const ped = [...E.pedidos.values()].pop();
  const by = (n) => ped.productos.find((p) => p.servicioBase.startsWith(n));
  assert.equal(by('Netflix').cantidad, 2); assert.equal(by('Netflix').dispositivo, '');
  assert.equal(by('Office').modalidad, 'licencia'); assert.equal(by('Free Fire').detalleServicio, '123456789');
  assert.equal(by('Oleada').modalidad, 'tv_digital'); assert.equal(by('Oleada').marcaTv, '');
  assert.equal(by('LatinTV').marcaTv, 'Hisense 55A6');
  await ctx.close();
});

await caso('Totales y stock: descuento vigente, cambio de precio avisado antes de registrar, comisión, stock insuficiente sin cobrar', async () => {
  const E = nuevoEstado();
  const { page, ctx } = await abrir({ width: 1024, height: 900 }, E);
  await irCompras(page);
  await agregar(page, 'cat_hbo_platino'); await agregar(page, 'cat_canva');
  await siguiente(page, 2);
  await page.fill('#sx_p_nombre', 'Ana'); await page.fill('#sx_p_apellido', 'López');
  const [h, c] = await page.evaluate(() => SX.renglones.map((r) => r.rid));
  await page.click(`[data-act="opcion"][data-rid="${h}"][data-v="tv"]`); await page.fill(`#sx_${c}_correo`, 'ana@ejemplo.com');
  await siguiente(page, 3); await page.click('[data-act="banco"][data-id="bac"]'); await page.setInputFiles('#sxFile', PNG); await page.waitForSelector('.sx-receipt');
  E.precioExtra = 10; // el catálogo sube HBO a L110 mientras el socio paga
  await page.click('#sxBottomBar [data-act="enviar"]');
  await page.waitForSelector('.sx-banner.warn');
  assert.match(await page.textContent('.sx-banner.warn'), /de L160 a L170/);
  assert.equal(E.pedidos.size, 1, 'no se registró nada con el precio viejo');
  await shot(page, '30-cambio-de-precio.png');
  E.stock.canva = 0;
  await page.click('#sxBottomBar [data-act="enviar"]');
  await page.waitForSelector('.sx-msg.err');
  assert.match(await page.textContent('.sx-msg.err'), /no hay disponibilidad/);
  assert.equal(E.pedidos.size, 1, 'sin stock: no se confirma ni se cobra');
  E.stock.canva = 2;
  await page.click('#sxBottomBar [data-act="enviar"]'); await page.waitForSelector('.sx-confirm');
  assert.equal([...E.pedidos.values()].pop().totalCombo, 170);
  // comisión: pide monto pagado y muestra "importe por confirmar"
  await page.click('[data-act="nueva-compra"]'); await agregar(page, 'cat_especial');
  assert.match(await page.textContent('#sxProdList'), /Importe por confirmar/);
  await ctx.close();
});

await caso('Borrador y errores: atrás, cambio de sección, rotación y recarga conservan la compra; imagen inválida no borra datos', async () => {
  const { page, ctx } = await abrir({ width: 390, height: 844 }, nuevoEstado(), { hasTouch: true, isMobile: true });
  await irCompras(page);
  await agregar(page, 'cat_hbo_platino'); await agregar(page, 'cat_canva');
  await siguiente(page, 2);
  await page.fill('#sx_p_nombre', 'Ana'); await page.fill('#sx_p_apellido', 'López');
  const [h0, c] = await page.evaluate(() => SX.renglones.map((r) => r.rid));
  await page.click(`[data-act="opcion"][data-rid="${h0}"][data-v="tv"]`);
  await page.fill(`#sx_${c}_correo`, 'ana@ejemplo.com'); await page.waitForTimeout(400);
  await page.evaluate(() => go('clientes')); await page.evaluate(() => go('compras'));
  assert.equal(await page.inputValue(`#sx_${c}_correo`), 'ana@ejemplo.com', 'cambio de sección');
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(150);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150);
  assert.equal(await page.inputValue('#sx_p_apellido'), 'López', 'rotación');
  await page.reload(); await page.waitForSelector('#app:not(.hide)'); await irCompras(page);
  assert.match(await page.textContent('.sx-banner.info'), /Recuperamos su compra/);
  assert.equal(await page.inputValue(`#sx_${c}_correo`), 'ana@ejemplo.com', 'recarga');
  const borrador = await page.evaluate(() => localStorage.getItem(sxBorradorKey()));
  assert.doesNotMatch(borrador, /data:image|clave|password/i, 'el borrador no guarda comprobante ni claves');
  await siguiente(page, 3);
  fs.writeFileSync(path.join(OUT, '_malo.txt'), 'no soy imagen');
  await page.setInputFiles('#sxFile', path.join(OUT, '_malo.txt'));
  await page.waitForSelector('#sx_pago_comprobante .sx-err');
  await siguiente(page, 2);
  assert.equal(await page.inputValue('#sx_p_nombre'), 'Ana', 'error de imagen no borra datos');
  await shot(page, '40-movil-borrador-recuperado.png');
  await ctx.close();
});

await caso('Envío repetido: doble toque y respuesta perdida generan UN pedido con número persistente', async () => {
  const E = nuevoEstado(); E.cortarRespuesta = 1;
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await irCompras(page);
  await agregar(page, 'cat_office2021');
  await siguiente(page, 2); await page.fill('#sx_p_nombre', 'Ana'); await page.fill('#sx_p_apellido', 'López');
  await siguiente(page, 3); await page.click('[data-act="banco"][data-id="bac"]'); await page.setInputFiles('#sxFile', PNG); await page.waitForSelector('.sx-receipt');
  await page.evaluate(() => { const b = document.querySelector('#sxBottomBar [data-act="enviar"]'); b.click(); b.click(); b.click(); });
  await page.waitForSelector('.sx-confirm', { timeout: 10000 });
  assert.equal(E.pedidos.size, 2, 'un solo pedido nuevo (más el de ejemplo)');
  assert.equal(E.calls.filter((x) => x === 'POST /rev/compra').length, 1, 'doble toque bloqueado');
  assert.ok(E.calls.includes('GET /rev/compra/estado'), 'consultó el resultado antes de reintentar');
  const ref = [...E.pedidos.keys()].pop().slice(-6).toUpperCase();
  assert.match(await page.textContent('.sx-confirm h1'), new RegExp(`#${ref}`));
  await ctx.close();
});

await caso('Pedidos: lista filtrable, detalle, falta información con consulta vinculada y "Volver a comprar" sin pago duplicado', async () => {
  const E = nuevoEstado();
  const { page, ctx } = await abrir({ width: 1440, height: 900 }, E);
  await shot(page, '50-escritorio-inicio.png');
  assert.match(await page.textContent('.sx-tasks'), /falta información/);
  await page.evaluate(() => go('pedidos')); await page.waitForSelector('.sx-orders');
  await page.click('[data-act="filtro"][data-v="warn"]');
  assert.equal(await page.locator('.sx-order').count(), 1);
  await shot(page, '51-escritorio-pedidos.png');
  await page.click('.sx-order'); await page.waitForSelector('#sxPedTitulo');
  await page.fill('#sxConsulta', 'El correo correcto es carlos@correo.com');
  await page.click('[data-act="consultar"]'); await page.waitForSelector('#sxConsultaMsg.ok');
  const cons = Object.values(E.real.db.dump('buzon_consultas'));
  assert.equal(cons.length, 1); assert.equal(cons[0].pedidoId, 'web_seed00ABC123'); assert.equal(cons[0].numero, 'C101');
  await page.waitForSelector('.sx-consultas');
  await shot(page, '52-escritorio-detalle-falta-info.png');
  await page.click('[data-act="recomprar"]'); await page.waitForSelector('#sxCompra');
  assert.equal(await page.evaluate(() => SX.paso), 2);
  assert.equal(await page.inputValue('#sx_p_nombre').catch(() => ''), '', 'cliente guardado (c2) aparece elegido');
  assert.match(await page.textContent('.sx-banner.warn'), /precios de hoy/);
  await siguiente(page, 3);
  assert.equal(await page.locator('.sx-receipt').count(), 0, 'no reutiliza el comprobante');
  await ctx.close();
});

await caso('Orden visual: cinco accesos, "Más" con todos los destinos, menú ⋯, Inicio con tareas, cliente → ficha → compra/renovar, catálogo al mismo carrito, cierre de compra sin tapar contenido', async () => {
  // Computadora: menú lateral con los mismos destinos y en el orden de la guía
  const E = nuevoEstado();
  const { page, ctx, errores } = await abrir({ width: 1440, height: 900 }, E);
  const lateral = await page.$$eval('#nav .nav-btn', (bs) => bs.map((b) => b.textContent.trim()));
  assert.deepEqual(lateral, ['Inicio', 'Clientes', 'Compras', 'Pedidos', 'Renovaciones', 'Catálogo', 'Buzón', 'Subli Aula', 'Recompensas', 'Mi perfil']);
  await page.waitForSelector('.sx-tasks'); assert.match(await page.textContent('.sx-tasks'), /falta información/);
  await page.evaluate(() => go('precios')); await page.waitForSelector('.sx-cat-grid');
  await page.click('[data-cat-act="agregar"][data-pid="cat_hbo_platino"]');
  assert.equal(await page.evaluate(() => current), 'precios', 'agregar conserva la posición');
  assert.match(await page.textContent('.sx-page-head'), /Ir a la compra \(1\)/);
  await shot(page, '60-escritorio-catalogo.png');
  await page.evaluate(() => go('clientes')); await page.click('[data-cli="abrir"][data-id="c2"]'); await page.waitForSelector('.sxo-ficha');
  assert.match(await page.textContent('.sxo-ficha'), /Disney Premium/);
  await page.waitForFunction(() => /ABC123/.test(document.querySelector('.sxo-peds')?.textContent || ''));
  await shot(page, '61-escritorio-cliente-ficha.png');
  await page.click('.sxo-ficha [data-cli="comprar"][data-id="c2"]'); await page.waitForSelector('#sxCompra');
  assert.equal(await page.evaluate(() => SX.principal.id), 'c2');
  await page.evaluate(() => go('renovar')); await page.waitForSelector('.sx-renews');
  await shot(page, '62-escritorio-renovaciones.png');
  await page.click('[data-ren="renovar"]'); await page.waitForSelector('#compOverlay.show');
  await page.click('#compOverlay .mini-seg button:first-child');
  assert.notEqual(await page.inputValue('#compNuevaFecha'), '', 'muestra la nueva fecha antes de confirmar');
  assert.deepEqual(errores, []);
  await ctx.close();

  // Celular
  const m = await abrir({ width: 390, height: 844 }, E);
  const barra = await m.page.$$eval('#nav .nav-btn', (bs) => bs.map((b) => b.dataset.v));
  assert.deepEqual(barra, ['inicio', 'clientes', 'compras', 'pedidos', 'mas']);
  const pedidosAntes = E.pedidos.size;
  await m.page.click('#nav [data-v="mas"]'); await m.page.waitForSelector('.sxo-mas');
  assert.equal(E.pedidos.size, pedidosAntes, '"Más" no crea pedidos');
  await shot(m.page, '63-movil-mas.png');
  for (const v of ['renovar', 'precios', 'buzon', 'aula', 'recompensas', 'perfil']) {
    await m.page.click('#nav [data-v="mas"]'); await m.page.click(`.sxo-mas [data-go="${v}"]`);
    assert.equal(await m.page.evaluate(() => current), v);
    assert.equal(await m.page.locator('#nav [data-v="mas"].on').count(), 1, `"Más" queda marcado en ${v}`);
  }
  await m.page.click('#sxoMenuBtn'); await m.page.waitForSelector('#sxoMenu:not([hidden])');
  assert.match(await m.page.textContent('#sxoMenu'), /Actualizar datos[\s\S]*Salir de mi cuenta/);
  await m.page.keyboard.press('Escape');
  await m.page.click('#nav [data-v="clientes"]'); await m.page.click('[data-cli="abrir"][data-id="c1"]');
  await m.page.click('.sxo-svc [data-cli="renovar"]'); await m.page.waitForSelector('#compOverlay.show');
  await m.page.evaluate(() => { document.getElementById('compOverlay')?.classList.remove('show'); go('compras'); });
  await m.page.waitForSelector('#sxCompra'); await agregar(m.page, 'cat_hbo_platino'); await agregar(m.page, 'cat_canva');
  await m.page.evaluate(() => { window.scrollTo(0, 1e6); document.body.scrollTop = 1e6; }); await m.page.waitForTimeout(300);
  const tapa = await m.page.evaluate(() => { const bar = document.getElementById('sxBottomBar').getBoundingClientRect(); const items = [...document.querySelectorAll('#sxMain .sx-card, #sxMain .sx-prod')]; const ult = items[items.length - 1].getBoundingClientRect(); return { ult: ult.bottom, bar: bar.top, nav: document.getElementById('nav').getBoundingClientRect().top, barBottom: bar.bottom }; });
  assert.ok(tapa.ult <= tapa.bar + 1, `la última tarjeta queda sobre el cierre (${tapa.ult} ≤ ${tapa.bar})`);
  assert.ok(tapa.barBottom <= tapa.nav + 1, 'el cierre queda sobre la barra inferior');
  await shot(m.page, '64-movil-compra-final.png');
  assert.equal(await m.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  assert.deepEqual(m.errores, []);
  await m.ctx.close();
});

await caso('Responsividad: 360, 390, 768, 1024, 1440 px y zoom 200 %; nombres largos; sin desplazamiento horizontal', async () => {
  for (const w of [360, 390, 768, 1024, 1440]) {
    const { page, ctx } = await abrir({ width: w, height: 900 });
    await irCompras(page);
    await agregar(page, 'cat_netflix_completa_largo_nombre'); await agregar(page, 'cat_hbo_platino');
    for (let i = 0; i < 4; i++) await page.click('.sx-prod[data-pid="cat_hbo_platino"] [data-act="mas"]');
    await siguiente(page, 2);
    await page.fill('#sx_p_buscar', 'maría'); await page.click('[data-act="cliente-elegir"][data-scope="p"]');
    for (const v of ['inicio', 'pedidos', 'clientes', 'renovar', 'precios', 'compras']) {
      await page.evaluate((v) => go(v), v); await page.waitForTimeout(60);
      const ancho = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(ancho[0] <= ancho[1] + 1, `${w}px ${v}: desplazamiento horizontal ${ancho}`);
    }
    if (w === 360 || w === 1440) await shot(page, `70-${w}-paso2-muchos-servicios.png`);
    await ctx.close();
  }
  const { page, ctx } = await abrir({ width: 1280, height: 900 });
  assert.doesNotMatch(await page.getAttribute('meta[name=viewport]', 'content'), /user-scalable=no|maximum-scale/);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await irCompras(page); await agregar(page, 'cat_hbo_platino'); await siguiente(page, 2);
  const ancho = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  await shot(page, '71-zoom-200.png');
  assert.ok(ancho[0] <= ancho[1] * 2 + 2, `zoom 200 % ${ancho}`);
  const h = await page.evaluate(() => getComputedStyle(document.querySelector('#sx_p_nombre')).minHeight);
  assert.equal(h, '52px', 'campos de 52 px');
  await ctx.close();
});

await caso('Entregas: parcial 1 de 2, campanita, "Mis entregas" paginado con filtros, detalle marca visto, portal por POST, otro socio no ve nada', async () => {
  const E = nuevoEstado();
  E.pedidos.set('web_seedHBOCANVA', { version: 2, socio_norm: 'jimena', estado: 'pendiente', clientePrincipal: { nombre: 'Ana', apellido: 'López', clienteId: 'c1' }, productos: [{ renglonId: 'r1', servicio: 'HBO Max · Platino', servicioBase: 'HBO Max', precioCatalogo: 100, cantidad: 1, clienteNombre: 'Ana López', destinatario: { tipo: 'principal' } }, { renglonId: 'r2', servicio: 'Canva Pro · 1 mes', servicioBase: 'Canva Pro', precioCatalogo: 70, cantidad: 1, clienteNombre: 'Ana López', correo: 'ana@ejemplo.com', destinatario: { tipo: 'principal' } }], subtotalCatalogo: 170, descuentoCombo: 10, totalCombo: 160, monto: 160, banco: 'BAC', imagenUrl: 'x', createdAt: new Date().toISOString() });
  const R = await apiReal(E);
  await R.db.collection('clientes').doc('cli_ana').set({ nombre: 'Ana López', servicios: [{ plataforma: 'HBO Max', compraId: 'svc_hbo', vendedor: 'jimena', fechaRenovacion: en(30) }], accesosBeneficiarios: { titular: { token: 'tokAnaDemo' } } });
  for (let i = 0; i < 24; i++) await R.db.collection('entregas_socios').doc(`enth_compras_hist${i}_r1`).set({ compraId: `hist${String(i).padStart(4, '0')}`, pedidoRef: `H${String(i).padStart(5, '0')}`, renglonId: 'r1', socio_norm: 'jimena', estado: 'publicada', version: 1, historico: true, visibleSocio: true, servicio: i % 2 ? 'Netflix · 1 perfil' : 'Disney Premium', clienteNombre: `Cliente histórico ${i}`, fechaOriginal: i === 0 ? null : new Date(Date.UTC(2025, 0, 1 + i * 7)), importadaAt: new Date(), visto: { version: 1 } });
  const pub = await R.admin('POST', '/rev/admin/entregas/guardar', { accion: 'publicar', compraId: 'web_seedHBOCANVA', renglonId: 'r1', opId: 'e2e1', ficha: { clienteId: 'cli_ana', servicioCompraId: 'svc_hbo', servicioIndex: 0 }, portalAutorizado: true, notaSocio: 'Perfil “Ana” creado.', mensajeCliente: 'Hola Ana, su HBO Max ya está listo.' });
  const c = (await R.db.collection('compras').doc('web_seedHBOCANVA').get()).data();
  E.pedidos.set('web_seedHBOCANVA', { ...E.pedidos.get('web_seedHBOCANVA'), entregas: c.entregas, estado: c.estado, detalleEstado: c.detalleEstado });
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.waitForFunction(() => document.getElementById('sxBellBadge')?.textContent === '1');
  await page.waitForFunction(() => document.getElementById('sxoMenuDot')?.textContent === '1');
  await shot(page, '90-movil-novedades.png');
  await page.evaluate(() => go('pedidos')); await page.waitForSelector('.sx-orders');
  assert.match(await page.textContent('.sx-orders'), /Entrega parcial · 1 de 2 servicios/);
  await page.click('[data-act="abrir"][data-id="web_seedHBOCANVA"]'); await page.waitForSelector('#sxPedTitulo');
  const lineas = await page.locator('.sx-review li').allTextContents();
  assert.match(lineas[0], /Entregado/); assert.match(lineas[1], /Pendiente/); assert.doesNotMatch(lineas[1], /Entregado/);
  await shot(page, '91-movil-pedido-parcial.png');
  await page.click('[data-act="volver"]'); await page.click('[data-act="pedtab"][data-v="entregas"]');
  await page.waitForSelector('.sx-ents');
  assert.equal(await page.locator('.sx-ent').count(), 20, 'primera página del servidor');
  await shot(page, '92-movil-mis-entregas.png');
  await page.click('[data-act="ent-mas"]'); await page.waitForFunction(() => document.querySelectorAll('.sx-ent').length === 25);
  assert.match(await page.textContent('.sx-ents'), /Sin fecha confirmada/, 'histórico sin fecha: no se inventa');
  await page.fill('#sxEntForm [name="servicio"]', 'disney'); await page.click('#sxEntForm button[type="submit"]');
  await page.waitForFunction(() => [...document.querySelectorAll('.sx-ent')].every((x) => /Disney/.test(x.textContent)) && document.querySelectorAll('.sx-ent').length === 12);
  await page.fill('#sxEntForm [name="servicio"]', ''); await page.click('[data-act="ent-estado"][data-v="nuevas"]');
  await page.waitForFunction(() => document.querySelectorAll('.sx-ent').length === 1);
  await page.click('[data-act="ent-ver"]'); await page.waitForSelector('#sxEntTitulo');
  assert.match(await page.textContent('.sx-page'), /Hola Ana, su HBO Max ya está listo/);
  assert.match(await page.textContent('.sx-page'), /Entrega parcial · 1 de 2/);
  await shot(page, '93-movil-detalle-entrega.png');
  const e = (await R.db.collection('entregas_socios').doc(pub.id).get()).data();
  assert.equal(e.visto.version, 1, 'visto al abrir el detalle');
  await page.waitForFunction(() => !document.getElementById('sxBellBadge')?.classList.contains('show'));
  await ctx.route('https://sublichat.ejemplo.test/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Portal del cliente (prueba)</h1>' }));
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.click('[data-act="ent-portal"]')]);
  await popup.waitForURL(/sublichat\.ejemplo\.test\/c\/tokAnaDemo/).catch(() => {});
  assert.match(popup.url(), /\/c\/tokAnaDemo/);
  assert.ok(!page.url().includes('tokAnaDemo'), 'el enlace nunca va en la URL del panel');
  await popup.close();
  // Escritorio
  await page.setViewportSize({ width: 1440, height: 900 }); await page.evaluate(() => sxAbrirEntrega(sxEntAbiertaId)); await page.waitForSelector('#sxEntTitulo');
  await shot(page, '94-escritorio-detalle-entrega.png');
  // Otro socio con el enlace directo: acceso denegado (el servidor revalida la propiedad)
  const ajeno = await fetch(R.base + '/rev/entregas/' + pub.id, { headers: { Authorization: 'Bearer tok' } }).then((r) => r.status);
  assert.equal(ajeno, 200);
  await R.db.collection('entregas_socios').doc(pub.id).set({ socio_norm: 'otra' }, { merge: true });
  const negado = await fetch(R.base + '/rev/entregas/' + pub.id, { headers: { Authorization: 'Bearer tok' } }).then((r) => r.status);
  assert.equal(negado, 404);
  await ctx.close(); R.srv.close();
});

await caso('Enlace del aviso (?entrega=…): abre la entrega después de la sesión, sin datos sensibles en la URL', async () => {
  const E = nuevoEstado(); const R = await apiReal(E);
  await R.db.collection('entregas_socios').doc('ent_web_seed00ABC123_r1').set({ compraId: 'web_seed00ABC123', pedidoRef: '0ABC123'.slice(-6), renglonId: 'r1', socio_norm: 'jimena', estado: 'publicada', version: 1, visibleSocio: true, servicio: 'Canva Pro · 1 mes', clienteNombre: 'Carlos Mejía', publicadaAt: new Date(), visto: null });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('rev_token', 'tok'); localStorage.setItem('rev_data', JSON.stringify({ nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena' })); } catch (_) {} });
  await ctx.route(`${API_HOST}/**`, (route) => api(route, E));
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.abort()); await ctx.route('https://fonts.gstatic.com/**', (r) => r.abort());
  const page = await ctx.newPage(); page.on('dialog', (d) => d.accept());
  await page.goto(BASE + '?entrega=ent_web_seed00ABC123_r1');
  await page.waitForSelector('#sxEntTitulo');
  assert.match(await page.textContent('#sxEntTitulo'), /Carlos Mejía/);
  assert.ok(!page.url().includes('entrega='), 'se limpia de la barra de direcciones');
  await ctx.close(); R.srv.close();
});

await caso('Buzón de dos vías: nueva consulta, respuesta del equipo con aviso no leído, respuesta del socio en el mismo hilo; avisos del equipo en su pestaña', async () => {
  const E = nuevoEstado(); const R = await apiReal(E);
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.evaluate(() => go('buzon')); await page.waitForSelector('[data-bz="nueva"]');
  await page.click('[data-bz="nueva"]');
  await page.fill('#sxBzAsunto', 'Netflix pide código'); await page.selectOption('#sxBzPedido', 'web_seed00ABC123'); await page.fill('#sxBzTexto', 'Mi cliente no puede entrar desde la TV.');
  await shot(page, '95-movil-nueva-consulta.png');
  await page.click('[data-bz="enviar-nueva"]'); await page.waitForSelector('.sx-hilo');
  const [id] = Object.keys(R.db.dump('buzon_consultas'));
  await R.admin('POST', `/rev/admin/consultas/${id}/mensajes`, { texto: 'Nota interna: revisar', interna: true, opId: 'i1' });
  await R.admin('POST', `/rev/admin/consultas/${id}/mensajes`, { texto: 'Ya lo revisamos, intente de nuevo.', opId: 'r1' });
  await page.evaluate(() => sxCargarNovedades()); await page.waitForFunction(() => document.getElementById('sxBellBadge')?.textContent === '1');
  await page.click('[data-bz="volver"]'); await page.click('[data-bz="recargar"]'); await page.waitForSelector('.sx-bz-item');
  assert.match(await page.textContent('.sx-ents'), /1 nueva/);
  await page.click('.sx-bz-item'); await page.waitForSelector('#sxBzResp');
  assert.doesNotMatch(await page.textContent('.sx-hilo'), /Nota interna/);
  await page.fill('#sxBzResp', 'Ya funcionó, gracias.'); await page.click('[data-bz="responder"]');
  await page.waitForFunction(() => document.querySelectorAll('.sx-hmsg').length === 3);
  await shot(page, '96-movil-hilo-consulta.png');
  const c = R.db.dump('buzon_consultas')[id];
  assert.equal(c.mensajes.length, 4); assert.equal(c.estado, 'en_atencion'); assert.equal(c.noLeidasSocio, 0);
  await page.click('[data-bz="tab"][data-v="avisos"]'); assert.match(await page.textContent('.sx-page'), /Oleada TV/);
  await page.setViewportSize({ width: 1440, height: 900 }); await page.click('[data-bz="tab"][data-v="consultas"]'); await page.click('.sx-bz-item');
  await shot(page, '97-escritorio-buzon-hilo.png');
  await ctx.close(); R.srv.close();
});

await caso('Perfil · Telegram: conectar genera enlace de un solo uso (sin datos del socio); desvincular', async () => {
  const E = nuevoEstado(); const R = await apiReal(E);
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.evaluate(() => go('perfil')); await page.waitForSelector('#sxTgCard [data-tg="conectar"]');
  await page.click('[data-tg="conectar"]'); await page.waitForSelector('#sxTgCard a[href^="https://t.me/SubliBotPrueba?start=v_"]');
  const href = await page.getAttribute('#sxTgCard a', 'href');
  assert.ok(!/jimena/i.test(href));
  await page.locator('#sxTgCard').scrollIntoViewIfNeeded(); await shot(page, '98-movil-perfil-telegram.png');
  await R.db.collection('revendedores').doc('jimena').set({ telegramId: '777777', telegramVinculo: { estado: 'vinculado', metodo: 'token', desde: new Date() } }, { merge: true });
  await page.evaluate(() => vPerfil()); await page.waitForSelector('#sxTgCard [data-tg="desvincular"]');
  await page.click('[data-tg="desvincular"]'); await page.waitForSelector('#sxTgCard [data-tg="conectar"]');
  assert.equal((await R.db.collection('revendedores').doc('jimena').get()).data().telegramId, '');
  await ctx.close(); R.srv.close();
});

await caso('Permisos: un socio sin permiso de compra no ve Compras ni Pedidos; Aula, recompensas, buzón y perfil siguen disponibles', async () => {
  const E = nuevoEstado();
  const { page, ctx } = await abrir({ width: 1440, height: 900 }, E);
  await page.evaluate(() => { rev.capabilities = { comprar: false }; applySocioMode(); go('compras'); });
  assert.notEqual(await page.evaluate(() => current), 'compras');
  await page.evaluate(() => go('pedidos'));
  assert.notEqual(await page.evaluate(() => current), 'pedidos');
  await page.evaluate(() => { rev.capabilities = null; applySocioMode(); renderUnifiedSidebar(); });
  for (const v of ['aula', 'recompensas', 'buzon', 'perfil']) { await page.evaluate((v) => go(v), v); await page.waitForTimeout(80); assert.equal(await page.evaluate(() => current), v); }
  await shot(page, '80-escritorio-buzon.png');
  await ctx.close();
});

await browser.close(); server.close();
const fallas = resultados.filter((r) => r[0] !== 'OK');
console.log(`\n${resultados.length - fallas.length}/${resultados.length} casos OK · capturas en ${OUT}`);
process.exit(fallas.length ? 1 : 0);
