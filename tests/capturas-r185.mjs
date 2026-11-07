// R185 · Capturas comparativas antes/después con los MISMOS datos ficticios. Uso: E2E_OUT=carpeta PREFIJO=antes|despues node tests/capturas-r185.mjs
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
const root = path.resolve(process.env.ROOT_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
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
  if (p === '/rev/gamificacion') return ok({ perfil: { nombreMostrar: 'Jimena', ventas: 12, nivel: 'Leyenda' }, ranking: [], insignias: [], recompensas: [], solicitudes: [] });
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
async function siguiente(page, n) { await page.evaluate((n) => sxIrPaso(n), n); }/* ======================= R185 · datos ficticios de la guía ======================= */
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

const PRE = process.env.PREFIJO || 'x';
const vistas = [['inicio', 'inicio'], ['clientes', 'clientes'], ['ficha', 'ficha'], ['pedidos', 'compras'], ['buzon', 'buzon-avisos'], ['mas', 'mas'], ['precios', 'catalogo']];
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const { page, ctx } = await abrir({ width: w, height: h }, estadoGuia());
  await page.waitForTimeout(1200);
  for (const [v, n] of vistas) {
    await page.evaluate((v) => {
      if (v === 'ficha') { try { sxoCliAbierto = 'c4'; } catch (_) {} go('clientes'); if (typeof sxoCliAbierto === 'undefined') { const b = document.querySelector('[data-cli="abrir"][data-id="c4"]'); b && b.click(); } return; }
      if (v === 'buzon') { try { sxBz.tab = 'avisos'; } catch (_) {} }
      if (v === 'mas' && innerWidth >= 900) return;
      go(v);
    }, v);
    await page.waitForTimeout(700);
    if (v === 'mas' && w >= 900) continue;
    await page.screenshot({ path: path.join(OUT, `${PRE}-${w}-${n}.png`) });
  }
  await ctx.close();
}
await browser.close(); server.close(); process.exit(0);
