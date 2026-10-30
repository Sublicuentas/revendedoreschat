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
  return { pedidos, stock: { canva: 3 }, sugerencias: [], precioExtra: 0, calls: [], cortarRespuesta: 0 };
}

/* ---------- simulador de /rev/* (misma regla del servidor) ---------- */
async function api(route, E) {
  const req = route.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
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
  await page.waitForSelector('.sx-page');
  return { ctx, page, E, errores };
}
const shot = (page, n) => page.screenshot({ path: path.join(OUT, n), fullPage: false });
const resultados = [];
async function caso(nombre, fn) {
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
  assert.match(await page.textContent('.sx-page'), /Para Ana López/);
  await shot(page, '06-movil-detalle-pedido.png');
  assert.deepEqual(errores, []); await ctx.close();
});

await caso('B · Varios clientes: Disney para Carlos (excepción); cambiar el principal no borra la excepción', async () => {
  const { page, E, ctx } = await abrir({ width: 1440, height: 900 });
  await irCompras(page);
  await agregar(page, 'cat_hbo_platino'); await agregar(page, 'cat_disney_premium');
  await siguiente(page, 2);
  await page.fill('#sx_p_buscar', 'ana'); await page.click('[data-act="cliente-elegir"][data-scope="p"][data-id="c1"]');
  const [h, d] = await page.evaluate(() => SX.renglones.map((r) => r.rid));
  await page.check(`[data-sx="otroCliente"][data-rid="${d}"]`);
  await page.fill(`#sx_${d}_buscar`, 'carl'); await page.click(`[data-act="cliente-elegir"][data-scope="${d}"][data-id="c2"]`);
  await page.click(`[data-act="opcion"][data-rid="${h}"][data-v="celular"]`); await page.click(`[data-act="opcion"][data-rid="${d}"][data-v="tv"]`);
  await shot(page, '10-escritorio-paso2-dos-clientes.png');
  await page.click('[data-act="cliente-cambiar"][data-scope="p"]');
  await page.fill('#sx_p_nombre', 'Luis'); await page.fill('#sx_p_apellido', 'Ramos');
  assert.match(await page.textContent(`#sxr_${d}`), /Para Carlos Mejía/, 'la excepción permanece');
  assert.match(await page.textContent(`#sxr_${h}`), /Asignado a Luis Ramos/);
  await siguiente(page, 3);
  await page.click('[data-act="banco"][data-id="bac"]'); await page.setInputFiles('#sxFile', PNG); await page.waitForSelector('.sx-receipt');
  await shot(page, '11-escritorio-paso3.png');
  await page.click('#sxSummary [data-act="enviar"]'); await page.waitForSelector('.sx-confirm');
  await shot(page, '12-escritorio-confirmacion.png');
  const ped = [...E.pedidos.values()].pop();
  assert.equal(ped.productos[1].clienteNombre, 'Carlos Mejía'); assert.equal(ped.productos[1].destinatario.clienteId, 'c2');
  assert.equal(ped.productos[0].clienteNombre, 'Luis Ramos'); assert.equal(ped.productos[1].dispositivo, '📺 TV');
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
  assert.match(await page.textContent(`#sxr_${b}`), /unidad 2/);
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
  await page.reload(); await page.waitForSelector('.sx-page'); await irCompras(page);
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
  assert.equal(E.sugerencias[0].pedidoId, 'web_seed00ABC123');
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

await caso('Inicio, catálogo, clientes y renovaciones: tareas, agregar desde catálogo al mismo carrito, ficha del cliente, renovar con período', async () => {
  const { page, ctx, errores } = await abrir({ width: 1440, height: 900 });
  await page.evaluate(() => go('precios')); await page.waitForSelector('.sx-cat-grid');
  await page.click('[data-cat-act="agregar"][data-pid="cat_hbo_platino"]');
  assert.match(await page.textContent('.sx-page-head'), /Ir a la compra \(1\)/);
  await shot(page, '60-escritorio-catalogo.png');
  await page.evaluate(() => go('clientes')); await page.click('[data-cli="abrir"][data-id="c2"]');
  assert.match(await page.textContent('.sx-client.open'), /Disney Premium/);
  assert.match(await page.textContent('.sx-client.open'), /#ABC123|ABC123/i);
  await shot(page, '61-escritorio-cliente-ficha.png');
  await page.click('[data-cli="comprar"][data-id="c2"]'); await page.waitForSelector('#sxCompra');
  assert.equal(await page.evaluate(() => SX.principal.id), 'c2');
  await page.evaluate(() => go('renovar')); await page.waitForSelector('.sx-renews');
  await shot(page, '62-escritorio-renovaciones.png');
  await page.click('[data-ren="renovar"]'); await page.waitForSelector('#compOverlay.show');
  await page.click('#compOverlay .mini-seg button:first-child');
  assert.notEqual(await page.inputValue('#compNuevaFecha'), '', 'muestra la nueva fecha antes de confirmar');
  assert.deepEqual(errores, []);
  await ctx.close();
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
