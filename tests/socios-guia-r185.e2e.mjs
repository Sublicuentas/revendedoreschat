// R185 · Guía maestra del Portal de Socios (07/11/2026): pruebas de aceptación (pág. 19) con Playwright.
// Mismo arnés que socios-rediseno.e2e.mjs (API simulada con la validación real del servidor). Datos FICTICIOS.
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
const OUT = process.env.E2E_OUT || path.join(root, 'tests/capturas-r185');
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
  if (p === '/rev/me') return ok(E.me || { nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena', capabilities: null });
  if (p === '/rev/clientes') { if (E.demora) await new Promise((r) => setTimeout(r, E.demora)); return ok(E.clientes || clientesSocio); }
  if (p === '/rev/precios') { const c = catalogo(); c[0].items[0].p += E.precioExtra; return ok(c); }
  if (p === '/rev/inventario') return ok({ items: [{ id: 'canva', estado: E.stock.canva <= 0 ? 'agotado' : 'bajo', stock: E.stock.canva }] });
  if (p === '/rev/metricas') { if (E.demora) await new Promise((r) => setTimeout(r, E.demora)); return ok(E.metricas ? E.metricas(url) : { operadoMes: 1450, comprasMes: 6, renovacionesMes: 9, pedidosPendientes: 1 }); }
  if (p === '/rev/avisos' && E.avisos) return ok(E.avisos(url));
  if (p === '/rev/avisos') return ok([{ id: 'a1', texto: 'Nuevo: Oleada TV ya se entrega con instalación guiada.', autor: 'Sublicuentas', ts: Date.now() - 3600000 }]);
  if (p === '/rev/gamificacion') return ok({ perfil: { nombreMostrar: 'Jimena', ventas: 12, nivel: 'Leyenda' }, ranking: [], insignias: [], recompensas: [], solicitudes: [], ...(E.gam || {}) });
  if (p === '/rev/metodos-pago') return ok({ ok: true, metodos: [{ id: 'bac', nombre: 'BAC Credomatic', titular: 'NOMBRE DE PRUEBA', cuenta: '000000000', nota: '' }, { id: 'tigo', nombre: 'Tigo Money', titular: 'NOMBRE DE PRUEBA', cuenta: '00000000', nota: '+6.5% comisión' }] });
  if (p === '/rev/compras/mias') { if (E.demora) await new Promise((r) => setTimeout(r, E.demora)); E.limites = [...(E.limites || []), url.searchParams.get('limit')]; } if (p === '/rev/compras/mias') return ok({ ok: true, items: [...E.pedidos.entries()].reverse().map(([id, x]) => CS.pedidoPublico(id, x)) });
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
/* ======================= R185 · datos ficticios de la guía ======================= */
const TZ = 'America/Tegucigalpa';
const perDe = (d) => { const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(d).forEach((x) => { p[x.type] = x.value; }); return `${p.year}-${p.month}`; };
const PER = perDe(new Date());
const [AY, AM] = PER.split('-').map(Number);
const haceMeses = (n) => { const d = new Date(Date.UTC(AY, AM - 1 - n, 15, 18)); return d; };
const cartera = [
  { id: 'c1', nombrePerfil: 'Ana López', telefono: '98765432', servicios: [{ plataforma: 'HBO Max', fechaRenovacion: en(3), precio: 100 }, { plataforma: 'Canva Pro', fechaRenovacion: en(20), precio: 70 }] },
  { id: 'c2', nombrePerfil: 'Carlos Mejía', telefono: '33445566', servicios: [{ plataforma: 'Disney Premium', fechaRenovacion: en(-2), precio: 90 }] },
  { id: 'c3', nombrePerfil: 'María José Hernández Castellanos de la Vega', telefono: '+13055550101', servicios: [{ plataforma: 'LatinTV', fechaRenovacion: en(0), precio: 200 }] },
  { id: 'c4', nombrePerfil: 'Lucía Gómez', telefono: '99887766', servicios: [{ plataforma: 'Netflix', fechaRenovacion: en(25), precio: 150 }, { plataforma: 'Prime Video', fechaRenovacion: en(30), precio: 80 }, { plataforma: 'Max', fechaRenovacion: en(12), precio: 90 }, { plataforma: 'Crunchyroll', fechaRenovacion: en(40), precio: 60 }] },
  { id: 'c5', nombrePerfil: 'Pedro Sin Servicio', telefono: '31112222', servicios: [] },
  { id: 'c6', nombrePerfil: 'Rosa Martínez', telefono: '94443333', servicios: [{ plataforma: 'Netflix', fechaRenovacion: en(-10), precio: 150 }, { plataforma: 'Spotify', fechaRenovacion: en(15), precio: 60 }] },
  { id: 'c4', nombrePerfil: 'Lucía Gómez', telefono: '99887766', servicios: [{ plataforma: 'Netflix', fechaRenovacion: en(25), precio: 150 }] }, // duplicado: no debe salir dos veces
];
const ESPERADO = { todos: 6, vigentes: 4, renovaciones: 2, vencidos: 2, sinservicio: 2 };
const AVISOS = [
  { id: 'av1', texto: 'Cuentas completas Disney y HBO disponibles\nYa pueden pedirlas desde Compras.', autor: 'Sublicuentas', ts: Date.now() - 2 * 86400000 },
  { id: 'av2', texto: '🛒 Pedido Netflix: Entregado', autor: 'Sublicuentas', ts: Date.now() - 3 * 86400000 },
  { id: 'av3', texto: 'Aviso de hace dos meses: horario de atención', autor: 'Sublicuentas', ts: haceMeses(2).getTime() },
  { id: 'av4', texto: 'Aviso del año pasado: cierre de inventario', autor: 'Naara', ts: new Date(Date.UTC(AY - 1, 2, 10, 18)).getTime() },
];
function estadoGuia({ metas = true, apiNueva = true } = {}) {
  const E = nuevoEstado();
  const ped = (id, estado, dias, svc, cli, monto) => E.pedidos.set(id, { version: 2, socio_norm: 'jimena', estado, clientePrincipal: { clienteId: '', nombre: cli.split(' ')[0], apellido: cli.split(' ')[1] || '' }, productos: [{ renglonId: 'r1', servicio: svc, servicioBase: svc, precioCatalogo: monto, cantidad: 1, clienteNombre: cli, destinatario: { tipo: 'principal' } }], totalCombo: monto, monto, banco: 'BAC', imagenUrl: 'x', createdAt: new Date(Date.now() - dias * 86400000).toISOString(), estadoHistorial: [{ estado, at: new Date().toISOString() }] });
  ped('web_ent0000NFX001', 'entregado', 5, 'Netflix VIP', 'Ana López', 150);
  ped('web_ent0000DSN002', 'entregado', 6, 'Disney+', 'Carlos Mejía', 110);
  ped('web_can0000MAX003', 'cancelado', 8, 'Max', 'Lucía Gómez', 90);
  ped('web_pen0000PRM004', 'pendiente', 0, 'Prime Video', 'Rosa Martínez', 80);
  E.clientes = cartera;
  E.me = { nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena', capabilities: null, ...(metas ? { metas: { [PER]: 2000 } } : {}) };
  E.metricas = (url) => { const q = url.searchParams.get('periodo'); if (q && apiNueva) return { ok: true, periodo: q, operadoMes: q === PER ? 1450 : 900, operacionesMes: 4 }; return { ok: true, periodo: PER, operadoMes: 1450, operacionesMes: 15, comprasMes: 6, renovacionesMes: 9, pedidosPendientes: 1 }; };
  E.avisos = (url) => { const q = url.searchParams.get('periodo'); const l = [...AVISOS].sort((a, b) => b.ts - a.ts); return q && apiNueva ? l.filter((a) => perDe(new Date(a.ts)) === q) : l.slice(0, 2); };
  return E;
}
const sinDesborde = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

await caso('R185-01 · Barra exacta y Más con las categorías originales', async () => {
  const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, estadoGuia());
  assert.deepEqual(await page.$$eval('#nav .nav-btn', (bs) => bs.map((b) => b.textContent.trim())), ['Inicio', 'Clientes', 'Compras', 'Catálogo', 'Más']);
  await page.click('#nav [data-v="mas"]'); await page.waitForSelector('.sxg-mas');
  assert.deepEqual(await page.$$eval('.sxg-mas-item b', (bs) => bs.map((b) => b.textContent.trim())), ['Renovaciones', 'Catálogo', 'Buzón', 'Subli Aula', 'Recompensas', 'Mi perfil']);
  assert.match(await page.textContent('.sxg-salir'), /Salir de mi cuenta/);
  assert.doesNotMatch(await page.textContent('.sxg-mas'), /Reportes|Ayuda|Configuración|Metas|Pedidos/);
  await shot(page, 'm-08-mas.png');
  await page.click('.sxg-mas [data-go="precios"]'); const viaMas = await page.evaluate(() => current);
  await page.click('#nav [data-v="precios"]'); assert.equal(await page.evaluate(() => current), viaMas, 'Catálogo: misma ruta desde la barra y desde Más');
  assert.equal(await page.locator('#nav [data-v="precios"].on').count(), 1);
  await page.waitForSelector('.sx-page'); await shot(page, 'm-09-catalogo.png');
  await page.click('#nav [data-v="mas"]'); await page.click('.sxg-mas [data-go="renovar"]'); assert.equal(await page.evaluate(() => current), 'renovar');
  assert.equal(await page.locator('#nav [data-v="mas"].on').count(), 1, 'Renovaciones (vía Más) marca Más');
  assert.deepEqual(errores, []);
  await ctx.close();
});

await caso('R185-02 · Inicio: nombre real, fecha/hora de Honduras, 4 tarjetas que cuadran con su destino y avisos reales (R190: sin Metas)', async () => {
  const E = estadoGuia();
  const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, E);
  await page.waitForFunction(() => document.querySelectorAll('.sxg-kpi[aria-busy]').length === 0 && document.querySelector('.sxg-av-lista'));
  assert.match(await page.textContent('.sxg-hola h1'), /^Hola, Jimena$/);
  const fecha = await page.textContent('#sxgFecha'), hora = await page.textContent('#sxgReloj');
  const esperadaF = new Date().toLocaleDateString('es-HN', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  assert.equal(fecha.toLowerCase(), esperadaF.toLowerCase()); assert.match(hora, /^\d{2}:\d{2}\s?[ap]\.\s?m\.$/);
  const kpi = await page.$$eval('.sxg-kpi', (ks) => ks.map((k) => [k.dataset.sxgGo, k.querySelector('b')?.textContent.trim()]));
  assert.deepEqual(kpi, [['clientes:todos', '6'], ['clientes:renovaciones', '2'], ['pedidos:ok', '2'], ['metas', 'L1,450']]);
  assert.equal(await page.locator('.sxg-metas').count(), 0, 'R190: Metas del mes ya no va en Inicio');
  const txt = await page.textContent('#content');
  assert.doesNotMatch(txt, /Nueva compra|Accesos rápidos|Actualización de planes|Promo Black|Hola, socio/);
  assert.match(await page.textContent('.sxg-avisos'), /Cuentas completas Disney y HBO/);
  assert.match(await page.textContent('.sxg-alerta'), /ABC123: falta información/, 'pedido con información pendiente sigue visible');
  await shot(page, 'm-01-inicio.png');
  // Cada tarjeta abre su destino real con la misma cifra
  await page.click('.sxg-kpi[data-sxg-go="clientes:renovaciones"]'); await page.waitForSelector('.sxg-clientes');
  assert.equal(await page.locator('.sxg-cli').count(), 2); assert.match(await page.textContent('.sxg-chip.on'), /Renovaciones 2/);
  await page.click('#nav [data-v="inicio"]'); await page.click('.sxg-kpi[data-sxg-go="pedidos:ok"]'); await page.waitForSelector('.sxg-compras');
  assert.equal(await page.locator('.sxg-ped').count(), 2); assert.match(await page.textContent('.sxg-tab.on'), /Entregados 2/);
  await page.click('#nav [data-v="inicio"]'); await page.click('.sxg-kpi[data-sxg-go="clientes:todos"]'); await page.waitForSelector('.sxg-clientes');
  assert.match(await page.textContent('.sxg-cuenta'), /^6 clientes en la cartera/);
  // La cabecera y las tarjetas no quedan tapadas por la barra
  await page.click('#nav [data-v="inicio"]'); await page.evaluate(() => { window.scrollTo(0, 1e6); document.body.scrollTop = 1e6; document.documentElement.scrollTop = 1e6; }); await page.waitForTimeout(250);
  const t = await page.evaluate(() => { const items = [...document.querySelectorAll('#content .sxg-card, #content .sxg-kpi')]; return { ult: items[items.length - 1].getBoundingClientRect().bottom, nav: document.getElementById('nav').getBoundingClientRect().top }; });
  assert.ok(t.ult <= t.nav, `la última tarjeta queda sobre la barra (${t.ult} ≤ ${t.nav})`);
  assert.deepEqual(errores, []);
  await ctx.close();
});

await caso('R185-03 · Carga lenta: esqueleto, sin ceros falsos; luego los datos', async () => {
  const E = estadoGuia(); E.demora = 1500;
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.evaluate(() => go('inicio'));
  await page.waitForSelector('.sxg-kpi[aria-busy] .sxg-esq');
  const durante = await page.$$eval('.sxg-kpi', (ks) => ks.map((k) => k.querySelector('b')?.textContent || ''));
  assert.ok(!durante.some((v) => /^L?0$/.test(v.trim())), 'sin ceros durante la carga: ' + durante);
  await shot(page, 'm-02-inicio-cargando.png');
  await page.evaluate(() => go('clientes')); await page.waitForSelector('.sxg-cli-esq');
  assert.equal(await page.locator('.sxg-chip span').count(), 0, 'chips sin contador hasta tener datos');
  await page.waitForSelector('.sxg-cli:not(.sxg-cli-esq)', { timeout: 10000 });
  assert.match(await page.textContent('.sxg-chip[data-v="todos"]'), /Todos 6/);
  await ctx.close();
});

await caso('R185-04 · Clientes: cinco filtros con contadores del mismo selector, búsqueda por servicio, sin duplicados', async () => {
  const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, estadoGuia());
  await page.click('#nav [data-v="clientes"]'); await page.waitForSelector('.sxg-cli:not(.sxg-cli-esq)');
  assert.deepEqual(await page.$$eval('.sxg-chip', (bs) => bs.map((b) => b.childNodes[0].textContent.trim())), ['Todos', 'Vigentes', 'Renovaciones', 'Vencidos', 'Sin servicio']);
  for (const [k, n] of Object.entries(ESPERADO)) {
    await page.click(`.sxg-chip[data-v="${k}"]`);
    assert.equal(await page.locator('.sxg-cli').count(), n, `${k}: lista`);
    assert.match(await page.textContent(`.sxg-chip[data-v="${k}"]`), new RegExp(` ${n}$`), `${k}: chip`);
  }
  await page.click('.sxg-chip[data-v="todos"]');
  const nombres = await page.$$eval('.sxg-cli b', (bs) => bs.map((b) => b.textContent));
  assert.equal(new Set(nombres).size, nombres.length, 'sin clientes duplicados');
  const chips = await page.$$eval('.sxg-chip', (bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return r.right <= window.innerWidth && r.left >= 0; }));
  assert.ok(chips.every(Boolean), 'los cinco filtros se ven completos en el celular');
  assert.match(await page.textContent('.sxg-cli[data-id="c4"]'), /4 servicios · Netflix \+ 3 más[\s\S]*L380 total/);
  await shot(page, 'm-03-clientes.png');
  await page.fill('#cliSearch', 'crunchy'); await page.waitForTimeout(80);
  assert.deepEqual(await page.$$eval('.sxg-cli b', (bs) => bs.map((b) => b.textContent)), ['Lucía Gómez'], 'busca por servicio');
  await page.fill('#cliSearch', ''); await page.waitForTimeout(50);
  assert.deepEqual(errores, []);
  await ctx.close();
});

await caso('R185-05 · Ficha: todos los servicios, "Renovar este servicio" dentro de cada uno, volver conserva filtro y búsqueda', async () => {
  const { page, ctx, E } = await abrir({ width: 390, height: 844 }, estadoGuia());
  await page.click('#nav [data-v="clientes"]'); await page.waitForSelector('.sxg-cli:not(.sxg-cli-esq)');
  await page.click('.sxg-chip[data-v="vigentes"]'); await page.fill('#cliSearch', 'g'); await page.waitForTimeout(60);
  await page.click('.sxg-cli[data-id="c4"]'); await page.waitForSelector('.sxg-ficha');
  assert.equal(await page.locator('.sxg-svc').count(), 4, 'no trunca servicios cuando hay más de tres');
  assert.equal(await page.locator('.sxg-svc [data-cli="renovar"]').count(), 4, 'un botón por servicio');
  assert.equal(await page.locator('.sxg-ficha > [data-cli="renovar"]').count(), 0, 'sin botón global de renovación');
  assert.match(await page.textContent('.sxg-svc:nth-child(3)'), /Max[\s\S]*L90/);
  assert.match(await page.textContent('.sxg-dos'), /Mensaje de cobro[\s\S]*WhatsApp/);
  await shot(page, 'm-04-ficha.png');
  const antes = E.calls.length;
  await page.click('.sxg-svc:nth-child(3) [data-cli="renovar"]'); await page.waitForSelector('#compOverlay.show');
  assert.match(await page.textContent('#compOverlay'), /Max/, 'la renovación abre solo ese servicio');
  await page.click('#compOverlay .mini-seg button:first-child');
  assert.notEqual(await page.inputValue('#compNuevaFecha'), '', 'muestra la nueva fecha antes de confirmar');
  await shot(page, 'm-05-renovar-vista-previa.png');
  assert.ok(!E.calls.slice(antes).some((c) => /POST/.test(c)), 'abrir la renovación no registra nada');
  await page.evaluate(() => closeComprobante());
  await page.click('.sxg-volver'); await page.waitForSelector('.sxg-clientes');
  assert.equal(await page.inputValue('#cliSearch'), 'g'); assert.match(await page.textContent('.sxg-chip.on'), /Vigentes/);
  await ctx.close();
});

await caso('R185-06 · Mis pedidos (R190: vista secundaria de Compras): pestañas, búsqueda, detalle con historial y volver a la tienda', async () => {
  const E = estadoGuia();
  const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, E);
  await page.click('#nav [data-v="compras"]'); await page.waitForSelector('#sxCompra'); await page.click('.sxg-mis-pedidos'); await page.waitForSelector('.sxg-ped');
  assert.equal(await page.locator('.sxg-ped').count(), 5, 'todo el historial (también cancelados y pendientes)');
  assert.ok((E.limites || []).includes('500'), 'pide el historial completo que permita el servidor');
  assert.match(await page.textContent('.sxg-tab[data-v="todos"]'), /Todos 5/); assert.match(await page.textContent('.sxg-tab[data-v="ok"]'), /Entregados 2/);
  assert.match(await page.textContent('.sxg-ped[data-id="web_pen0000PRM004"]'), /Recibido/, 'un pendiente nuevo NO aparece entregado');
  await shot(page, 'm-06-compras.png');
  await page.click('.sxg-tab[data-v="ok"]'); assert.equal(await page.locator('.sxg-ped').count(), 2);
  await page.fill('#sxPedBuscar', 'DSN002'); await page.waitForTimeout(80); assert.equal(await page.locator('.sxg-ped').count(), 1);
  await page.click('.sxg-ped'); await page.waitForSelector('#sxPedTitulo');
  assert.match(await page.textContent('.sx-timeline'), /Entregado/); assert.match(await page.textContent('[data-act="volver"]'), /Pedidos|Compras/);
  await page.click('[data-act="volver"]'); await page.waitForSelector('.sxg-compras');
  assert.equal(await page.inputValue('#sxPedBuscar'), 'DSN002', 'la búsqueda se conserva al volver');
  await page.click('[data-act="nueva"]'); await page.waitForSelector('#sxCompra');
  assert.equal(await page.locator('#nav [data-v="compras"].on').count(), 1, 'Compras queda marcado durante la compra');
  await page.evaluate(() => go('pedidos')); await page.click('[data-act="pedtab"][data-v="entregas"]'); await page.waitForSelector('.sx-ent-filtros');
  assert.deepEqual(errores, []);
  await ctx.close();
});

await caso('R185-07 · Buzón: Mis consultas + Avisos del equipo por mes y año (incluye años anteriores) y periodo vacío', async () => {
  const E = estadoGuia(); const R = await apiReal(E);
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.click('.sxg-av-lista button'); await page.waitForSelector('.sxg-av-pg');
  assert.match(await page.textContent('.sxg-av-full li.ab'), /Ya pueden pedirlas desde Compras/, 'abre el aviso completo');
  assert.match(await page.textContent('.sx-tabs'), /Mis consultas[\s\S]*Avisos del equipo/);
  await shot(page, 'm-07-buzon-avisos.png');
  await page.selectOption('#sxgAvPerY', String(AY - 1)); await page.selectOption('#sxgAvPerM', '3');
  await page.waitForFunction(() => /cierre de inventario/.test(document.querySelector('.sxg-av-pg')?.textContent || ''));
  await page.selectOption('#sxgAvPerM', '4'); await page.waitForSelector('.sxg-av-pg .sxg-vacio');
  assert.match(await page.textContent('.sxg-av-pg'), /No hay avisos para este periodo/);
  await page.click('[data-bz="tab"][data-v="consultas"]'); await page.click('[data-bz="tab"][data-v="avisos"]');
  assert.equal(await page.inputValue('#sxgAvPerM'), '4', 'el periodo se conserva al volver');
  assert.doesNotMatch(await page.textContent('.sxg-av-pg'), /consulta/i, 'una consulta privada no aparece como aviso');
  await ctx.close(); R.srv.close();
});

await caso('R185-08 · Metas (detalle desde «Mis ventas»; los datos de metas siguen intactos): meta real, sin meta, mes y año', async () => {
  let { page, ctx } = await abrir({ width: 390, height: 844 }, estadoGuia());
  await page.waitForSelector('.sxg-kpi[data-sxg-go="metas"]:not([aria-busy])');
  await page.click('.sxg-kpi[data-sxg-go="metas"]'); await page.waitForSelector('.sxg-metas-pg');
  assert.match(await page.textContent('.sxg-metas-pg'), /L1,450 \/ L2,000/);
  await shot(page, 'm-10-metas.png');
  const prev = AM === 1 ? [AY - 1, 12] : [AY, AM - 1];
  await page.selectOption('#sxgMetaY', String(prev[0])); await page.selectOption('#sxgMetaM', String(prev[1]));
  await page.waitForFunction(() => /L900/.test(document.querySelector('.sxg-metas-pg')?.textContent || ''));
  assert.match(await page.textContent('.sxg-metas-pg'), /Meta no configurada/, 'ese mes no tiene meta: no se inventa');
  assert.equal(await page.locator('#nav [data-v="inicio"].on').count(), 1, 'Metas no agrega botón a la barra');
  await ctx.close();
  ({ page, ctx } = await abrir({ width: 390, height: 844 }, estadoGuia({ metas: false, apiNueva: false })));
  await page.waitForSelector('.sxg-kpi[data-sxg-go="metas"]:not([aria-busy])');
  await page.click('.sxg-kpi[data-sxg-go="metas"]'); await page.waitForSelector('.sxg-metas-pg');
  assert.match(await page.textContent('.sxg-metas-pg'), /Meta no configurada/); assert.doesNotMatch(await page.textContent('.sxg-metas-pg'), /L60,000/);
  await page.selectOption('#sxgMetaY', String(AY - 1));
  await page.waitForFunction(() => /Todavía no hay datos de ese mes/.test(document.querySelector('.sxg-metas-pg')?.textContent || ''));
  await ctx.close();
});

await caso('R185-09 · Responsive (360, 390, 768, 1024, 1440) sin desplazamiento horizontal ni contenido tapado', async () => {
  for (const w of [360, 390, 768, 1024, 1440]) {
    const { page, ctx } = await abrir({ width: w, height: w < 900 ? 800 : 900 }, estadoGuia());
    for (const v of ['inicio', 'clientes', 'compras', 'pedidos', 'precios', 'buzon', 'metas', 'mas', 'perfil']) {
      await page.evaluate((v) => go(v), v); await page.waitForTimeout(90);
      assert.ok(await sinDesborde(page), `${w}px ${v}: desplazamiento horizontal`);
    }
    if (w < 900) {
      const nav = await page.$$eval('#nav .nav-btn', (bs) => bs.map((b) => { const r = b.getBoundingClientRect(), l = b.querySelector('.nav-lbl'); return r.height >= 44 && l.scrollWidth <= l.clientWidth + 1; }));
      assert.ok(nav.every(Boolean), `${w}px: barra completa, táctil y sin etiquetas cortadas`);
    }
    await page.evaluate(() => go('inicio')); await page.waitForTimeout(150);
    await shot(page, `r-${w}-inicio.png`);
    if (w === 1440 || w === 360) { await page.evaluate(() => go('clientes')); await page.waitForTimeout(120); await shot(page, `r-${w}-clientes.png`); }
    await ctx.close();
  }
});

await caso('R185-10 · Permisos: socio sin compras no ve Compras ni Inicio; Más respeta permisos', async () => {
  const E = estadoGuia(); E.me = { ...E.me, capabilities: { comprar: false } };
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.evaluate(() => { rev.capabilities = { comprar: false }; applySocioMode(); go('clientes'); });
  const barra = await page.$$eval('#nav .nav-btn', (bs) => bs.map((b) => b.dataset.v));
  assert.ok(!barra.includes('pedidos') && !barra.includes('compras'), 'sin Compras'); assert.deepEqual(barra, ['clientes', 'precios', 'mas']);
  await page.evaluate(() => go('pedidos')); assert.notEqual(await page.evaluate(() => current), 'pedidos');
  await page.evaluate(() => go('metas')); assert.notEqual(await page.evaluate(() => current), 'metas');
  await page.evaluate(() => go('clientes')); await page.waitForSelector('.sxg-cli');
  await page.click('.sxg-cli[data-id="c1"]'); await page.waitForSelector('.sxg-ficha');
  assert.equal(await page.locator('[data-cli="comprar"]').count(), 0, 'la ficha no ofrece compra');
  await shot(page, 'm-11-permisos-sin-compras.png');
  await ctx.close();
});

await caso('R185-11 · Accesibilidad: foco visible, botones táctiles ≥ 44 px, movimiento reducido', async () => {
  const { page, ctx } = await abrir({ width: 390, height: 844 }, estadoGuia(), { reducedMotion: 'reduce' });
  await page.waitForSelector('.sxg-kpi:not([aria-busy])');
  const bajos = await page.$$eval('#content button, #nav button, #topbarActions button, #sxoMenuBtn', (bs) => bs.filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).map((b) => b.textContent.trim().slice(0, 30) || b.getAttribute('aria-label')));
  assert.deepEqual(bajos, [], 'botones de menos de 44 px: ' + JSON.stringify(bajos));
  await page.focus('.sxg-kpi'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  const foco = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
  assert.ok(foco, 'anillo de foco visible');
  const tr = await page.$eval('.sxg-kpi', (k) => getComputedStyle(k).transitionDuration);
  assert.match(tr, /^0s/, 'sin animación con movimiento reducido');
  assert.ok(await page.$$eval('#nav .nav-btn, .sxg-kpi, .sxg-avatar, #sxoMenuBtn, .partner-inbox-btn', (bs) => bs.every((b) => b.textContent.trim() || b.getAttribute('aria-label'))), 'todos tienen nombre accesible');
  await ctx.close();
});

/* =========================== R190 · Correcciones finales (PDF 07/11): saludo, avatar, sin ☰, sin Metas, Compras = tienda =========================== */
await caso('R190-01/02 · «Hola, <primer nombre>» del socio autenticado (Yami / otro socio); nunca fijo ni «Hola» suelto si hay nombre', async () => {
  for (const [nombre, esperado] of [['Yami Valladares', 'Yami'], ['Carlos Mejía', 'Carlos']]) {
    const E = estadoGuia(); E.me = { ...(E.me || {}), nombre, nombreMostrar: '', nombre_norm: nombre.toLowerCase().split(' ')[0], usuario: nombre.toLowerCase().split(' ')[0] };
    E.gam = { perfil: { nombreMostrar: '', ventas: 1 } };
    const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, E);
    await page.waitForFunction((n) => (document.getElementById('sxgHola')?.textContent || '') === `Hola, ${n}`, esperado, { timeout: 8000 });
    assert.doesNotMatch(await page.textContent('#content'), /Hola, Jimena/);
    await shot(page, `r190-inicio-${esperado.toLowerCase()}.png`);
    assert.deepEqual(errores, []); await ctx.close();
  }
  // Sesión guardada SIN nombre (versión anterior): primero esqueleto, luego el nombre que devuelve el servidor (antes quedaba «Hola»).
  const E = estadoGuia(); E.me = { nombre: 'Yami Valladares', nombre_norm: 'yami', usuario: 'yami', capabilities: null }; E.gam = { perfil: { nombreMostrar: '', ventas: 1 } };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('_i')) { sessionStorage.setItem('_i', '1'); localStorage.setItem('rev_token', 'tok'); localStorage.setItem('rev_data', JSON.stringify({ nombre_norm: '', usuario: '' })); localStorage.setItem('rev_last', String(Date.now())); } });
  await ctx.route(`${API_HOST}/**`, async (route) => { if (new URL(route.request().url()).pathname === '/rev/me') await new Promise((r) => setTimeout(r, 900)); return api(route, E); });
  const page = await ctx.newPage(); await page.goto(BASE); await page.waitForSelector('#sxgHola');
  assert.equal(await page.locator('#sxgHola .sxg-esq-nombre').count(), 1, 'mientras carga: esqueleto, no «Hola» suelto');
  await page.waitForFunction(() => document.getElementById('sxgHola')?.textContent === 'Hola, Yami', null, { timeout: 8000 });
  assert.equal(await page.textContent('#sxgAvatar'), 'YV', 'iniciales reales, no un punto');
  await ctx.close();
});

await caso('R190-03/04 · Avatar: foto real del Perfil (toca → Mi perfil); sin foto → iniciales; nunca «·»', async () => {
  const foto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const E = estadoGuia(); E.gam = { perfil: { nombreMostrar: 'Jimena', avatar: foto, ventas: 12 } };
  const { page, ctx } = await abrir({ width: 390, height: 844 }, E);
  await page.waitForSelector('#sxgAvatar img');
  assert.equal(await page.getAttribute('#sxgAvatar img', 'src'), foto);
  const box = await page.$eval('#sxgAvatar', (a) => { const r = a.getBoundingClientRect(); return { right: window.innerWidth - r.right, top: r.top, w: r.width, otros: [...document.querySelectorAll('#app .topbar *')].filter((e) => e.offsetParent && e.getBoundingClientRect().left > r.right - 2 && e.children.length === 0).map((e) => e.outerHTML.slice(0, 80)) }; });
  await shot(page, 'r190-avatar-foto.png');
  assert.ok(box.right < 60 && box.otros.length === 0 && box.top < 70 && box.w >= 44, 'arriba a la derecha (último de la cabecera) y táctil: ' + JSON.stringify(box));

  await page.click('#sxgAvatar'); assert.equal(await page.evaluate(() => current), 'perfil');
  await ctx.close();
  const E2 = estadoGuia(); E2.gam = { perfil: { nombreMostrar: 'Jimena López', ventas: 1 } };
  const b = await abrir({ width: 390, height: 844 }, E2);
  await b.page.waitForFunction(() => document.getElementById('sxgAvatar')?.textContent === 'JL');
  assert.doesNotMatch(await b.page.textContent('#sxgAvatar'), /·/);
  await b.ctx.close();
});

await caso('R190-05/06 · Sin ☰ ni panel vacío, sin Metas en Inicio; barra exacta; Actualizar/Instalar/Salir siguen en Más', async () => {
  const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, estadoGuia());
  await page.waitForSelector('.sxg-kpi:not([aria-busy])');
  assert.equal(await page.locator('#sxoMenuBtn, #sxoMenu, .sxo-menu').count(), 0, 'sin menú de tres rayas ni su panel');
  assert.equal(await page.locator('.sxg-metas').count(), 0); assert.doesNotMatch(await page.textContent('#content'), /Metas del mes/);
  assert.deepEqual(await page.$$eval('#nav .nav-btn', (bs) => bs.map((b) => b.textContent.trim())), ['Inicio', 'Clientes', 'Compras', 'Catálogo', 'Más']);
  assert.ok(await page.locator('.partner-inbox-btn').isVisible(), 'la campana del Buzón se conserva');
  await page.click('#nav [data-v="mas"]'); await page.waitForSelector('.sxg-mas');
  assert.match(await page.textContent('.sxg-mas'), /Actualizar datos[\s\S]*Salir de mi cuenta/);
  assert.deepEqual(await page.$$eval('.sxg-mas-item b', (bs) => bs.map((b) => b.textContent.trim())), ['Renovaciones', 'Catálogo', 'Buzón', 'Subli Aula', 'Recompensas', 'Mi perfil'], 'Más sin categorías nuevas');
  assert.deepEqual(errores, []); await ctx.close();
});

await caso('R190-07/08/09/10/11 · Compras abre la tienda; cliente + 2 apps = 1 pedido; Mis pedidos secundario; volver conserva el carrito', async () => {
  const E = estadoGuia(); const antes = JSON.stringify([...E.pedidos.entries()]);
  const { page, ctx, errores } = await abrir({ width: 390, height: 844 }, E);
  await page.click('#nav [data-v="compras"]'); await page.waitForSelector('#sxCompra');
  assert.equal(await page.evaluate(() => current), 'compras', 'tienda, no historial');
  assert.match(await page.textContent('#sxCompra .sx-page-head h1'), /^Compras$/);
  assert.equal(await page.locator('.sxg-ped').count(), 0, 'el historial no está en la portada de Compras');
  await shot(page, 'r190-compras-tienda-390.png');
  // agregar 2 aplicaciones al carrito
  const add = () => page.locator('#sxCompra button[data-act="agregar"]:not([disabled])').first();
  assert.ok(await page.locator('#sxCompra button[data-act="agregar"]:not([disabled])').count() >= 2, 'hay productos para elegir');
  await add().click(); await page.waitForTimeout(120); await add().click(); await page.waitForTimeout(150);
  const enCarrito = await page.evaluate(() => SX.renglones.length); assert.ok(enCarrito >= 2, 'dos apps en el carrito');
  // Mis pedidos y volver: el carrito sigue
  await page.click('.sxg-mis-pedidos'); await page.waitForSelector('.sxg-ped');
  assert.equal(await page.evaluate(() => current), 'pedidos'); assert.equal(await page.locator('#nav [data-v="compras"].on').count(), 1, 'la pestaña inferior no cambia');
  assert.match(await page.textContent('.sxg-compras h1'), /Mis pedidos/);
  assert.equal(JSON.stringify([...E.pedidos.entries()]), antes, 'el historial no se tocó');
  await shot(page, 'r190-mis-pedidos-390.png');
  await page.click('[data-act="nueva"]'); await page.waitForSelector('#sxCompra');
  assert.equal(await page.evaluate(() => SX.renglones.length), enCarrito, 'al volver, el carrito sigue');
  assert.deepEqual(errores, []); await ctx.close();
});

await caso('R190-13 · Escritorio: Compras abre la tienda desde el menú lateral; sin desborde', async () => {
  const { page, ctx } = await abrir({ width: 1440, height: 900 }, estadoGuia());
  await page.waitForSelector('.sxg-kpi:not([aria-busy])'); await shot(page, 'r190-inicio-1440.png');
  await page.click('#nav [data-v="compras"]'); await page.waitForSelector('#sxCompra .sxg-mis-pedidos');
  assert.ok(await sinDesborde(page)); await shot(page, 'r190-compras-tienda-1440.png');
  for (const w of [320, 360, 430]) { await page.setViewportSize({ width: w, height: 800 }); await page.evaluate(() => go('inicio')); await page.waitForTimeout(120); assert.ok(await sinDesborde(page), `${w}px`); await page.evaluate(() => go('compras')); await page.waitForTimeout(120); assert.ok(await sinDesborde(page), `${w}px compras`); }
  await ctx.close();
});

await browser.close(); server.close();
const fallas = resultados.filter((r) => r[0] !== 'OK');
console.log(`\n${resultados.length - fallas.length}/${resultados.length} casos OK · capturas en ${OUT}`);
process.exit(fallas.length ? 1 : 0);
