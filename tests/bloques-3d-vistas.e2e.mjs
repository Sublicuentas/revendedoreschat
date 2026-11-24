// R202 · Bloques 3D: capturas de TODAS las vistas (socio y Panel Dios) en 360–1440 px con el mismo simulador de las pruebas R185.
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
  if (p === '/rev/sublipoints') return ok({ ok: true, inicio: '2026-11-23T20:00:00.000Z', mes: '2026-11', puntos: 32, nivel: 'Leyenda', siguiente: { nivel: 'Inmortal', min: 50, faltan: 18 }, ventasNuevas: 8, renovaciones: 16, meses: [{ mes: '2026-11', puntos: 32, nivel: 'Leyenda' }, { mes: '2026-10', puntos: 12, nivel: 'Diamante' }], movimientos: [] });
  if (p === '/rev/recompensas-sp') return ok({ ok: true, resumen: { ok: true, excluido: false, mes: '2026-11', puntos: 32, nivel: 'Leyenda', siguiente: { nivel: 'Inmortal', min: 50, faltan: 18 }, ventasNuevas: 8, renovaciones: 16, meses: [] }, saldoPromocional: 100,
    items: [['dia_appletv','Diamante','Apple TV','Cuenta completa · duración por definir','bloqueado','Este mes le corresponde un premio Leyenda'],['dia_elevenreader','Diamante','Eleven Reader Ultra','Cuenta completa · duración por definir','bloqueado','Este mes le corresponde un premio Leyenda'],['dia_canva_edu','Diamante','Canva Edu Pro','Acceso · 2 meses','bloqueado','Este mes le corresponde un premio Leyenda'],['ley_duolingo','Leyenda','Duolingo Plus','Acceso · 3 meses','disponible','Puede elegirla este mes'],['ley_openenglish','Leyenda','Open English','Acceso · 3 meses','agotado','Sin disponibilidad por ahora'],['ley_prime','Leyenda','Prime Video','Cuenta completa · duración por definir','disponible','Puede elegirla este mes'],['inm_gemini','Inmortal','Gemini Pro','Acceso · 3 meses','bloqueado','Se desbloquea con Inmortal (50 puntos este mes)'],['inm_hbo','Inmortal','HBO Max','Acceso · 1 mes · plan por configurar','bloqueado','Se desbloquea con Inmortal (50 puntos este mes)'],['inm_giftcard_100','Inmortal','Gift Card Sublicuentas','L100 de saldo promocional · todos los productos menos Netflix','bloqueado','Se desbloquea con Inmortal (50 puntos este mes)']].map(([id, nivel, nombre, detalle, estado, motivo]) => ({ id, nivel, nombre, detalle, estado, motivo, tipo: 'producto' })),
    solicitudMes: null, solicitudes: [{ id: 'old1', programa: 'anterior', nivel: 'Diamante', recompensa: 'HBO Max · 1 mes', estado: 'entregada', estadoTexto: 'Entregada', mes: '' }] });
  if (p === '/rev/recompensas-sp/solicitar') return ok({ ok: true, solicitud: { id: 'sp_jimena_2026-11', recompensa: 'Duolingo Plus', estado: 'pendiente_aprobacion' } });
  if (p === '/rev/billetera') return ok({ ok: true, saldos: { sublicuentas: { negocio: 'sublicuentas', nombre: 'Sublicuentas', real: 500, promocional: 100, reservado: 0, disponible: 500 }, relojes: { negocio: 'relojes', nombre: 'Relojes', real: 0, promocional: 0, reservado: 0, disponible: 0 } },
    movimientos: [{ id: 'm1', fecha: '2026-11-23T20:00:00Z', negocio: 'sublicuentas', subcuenta: 'real', tipo: 'recarga', monto: 500, signo: 1, ref: 'AB12CD', detalle: 'Recarga BAC Honduras · ref 123456', saldoPosterior: 500 }, { id: 'm2', fecha: '2026-11-22T20:00:00Z', negocio: 'sublicuentas', subcuenta: 'promocional', tipo: 'premio', monto: 100, signo: 1, ref: 'XY99', detalle: 'Gift Card Sublicuentas', saldoPosterior: 100 }],
    recargas: [{ id: 'r1', ref: 'AB12CD', fecha: '2026-11-23T19:00:00Z', negocio: 'sublicuentas', negocioNombre: 'Sublicuentas', monto: 500, banco: 'BAC Honduras', referencia: '123456', estado: 'aprobada', montoAcreditado: 500 }, { id: 'r2', ref: 'EF34GH', fecha: '2026-11-23T21:00:00Z', negocio: 'relojes', negocioNombre: 'Relojes', monto: 300, banco: 'Banco Atlántida', referencia: '998877', estado: 'pendiente' }],
    pendientes: 1, bancos: ['BAC Honduras', 'Banco Atlántida', 'Otro'], negocios: { sublicuentas: 'Sublicuentas', relojes: 'Relojes' }, limites: { min: 10, max: 50000 } });
  if (p === '/rev/billetera/recargas') return ok({ ok: true, recarga: { id: 'r3', ref: 'NEW001', estado: 'pendiente' } });
  if (p === '/rev/admin/impersonate') return ok({ token: 'tok', nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena' });
  if (p === '/rev/admin/sublipoints') return ok({ ok: true, mes: '2026-11', inicio: '2026-11-23T20:00:00.000Z', ranking: [{ socio: 'Jimena', socio_norm: 'jimena', puntos: 32, nivel: 'Leyenda', ventasNuevas: 8, renovaciones: 16 }, { socio: 'Heber', socio_norm: 'heber', puntos: 6, nivel: 'Sin nivel', ventasNuevas: 2, renovaciones: 2 }] });
  if (/^\/rev\/admin\/comprobantes\/[^/]+\/pago$/.test(p)) return ok({ ok: true, estadoPago: 'confirmado', sublipoints: { ok: true, puntos: 1 } });
  if (p === '/rev/admin/revendedores') return ok([
    { id: 'relojes', nombre: 'Relojes', nombre_norm: 'relojes', usuario: 'relojes', clientes: 354, vencidos: 2, porVencer: 78, activo: true },
    { id: 'sublicuentas', nombre: 'Sublicuentas', nombre_norm: 'sublicuentas', usuario: 'sublicuentas', clientes: 194, vencidos: 2, porVencer: 49, activo: true },
    { id: 'jimena', nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena', clientes: 15, vencidos: 0, porVencer: 2, activo: true },
    { id: 'socio4', nombre: 'Socio de prueba', nombre_norm: 'socio de prueba', usuario: 'prueba', clientes: 0, vencidos: 0, porVencer: 0, activo: false } ]);
  if (p.startsWith('/rev/admin/comprobantes-telegram')) return ok({ total: 0, porEstado: {}, items: [], desde: new Date().toISOString() });
  if (p === '/rev/admin/comprobantes') return ok([{ id: 'k1', socio: 'Jimena', socio_norm: 'jimena', cliente: 'Cliente de prueba', servicio: 'HBO Max', ts: Date.now() - 7200000, monto: 100, renovado: true, nuevaFecha: '30/12/2026', estadoPago: 'sin_confirmar', renovadosCantidad: 1 }, { id: 'k2', socio: 'Heber', socio_norm: 'heber', cliente: 'Otro cliente', servicio: 'Disney Premium', ts: Date.now() - 9200000, monto: 90, renovado: true, nuevaFecha: '28/12/2026', estadoPago: 'confirmado', pagoConfirmadoPor: 'Sublicuentas', renovadosCantidad: 1 }]);
  if (p === '/rev/admin/compras') return ok([{ id: 'p1', socio: 'Jimena', socio_norm: 'jimena', cliente: 'Cliente de prueba', servicio: 'Canva Pro · 1 mes', ts: Date.now() - 3600000, monto: 70, destino: 'sublicuentas' }]);
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
    if (!['sublicuentas', 'relojes'].includes(b.destino)) return ok({ error: 'destino_requerido' }, 400); // R195 · igual que el servidor
    E.stock.canva -= canva;
    E.pedidos.set(id, { version: 2, socio_norm: 'jimena', clientePrincipal: b.clientePrincipal, productos, subtotalCatalogo: t.subtotal, descuentoCombo: t.descuento, totalCombo: t.total, monto: t.hayComision ? b.monto : t.total, banco: 'BAC Credomatic', comentario: b.comentario, imagenUrl: b.imagen ? 'ok' : '', estado: 'pendiente', createdAt: new Date().toISOString(), estadoHistorial: [{ estado: 'pendiente', detalle: 'Pedido recibido', at: new Date().toISOString() }] });
    if (E.cortarRespuesta > 0) { E.cortarRespuesta--; return route.abort('connectionreset'); } // el pedido llegó pero la respuesta se perdió
    E.ultimoDestino = b.destino;
    const notificacion = E.tgFalla ? { estado: 'error', texto: 'Error de envío' } : { estado: 'recibido', texto: 'Recibido en Telegram' };
    E.pedidos.get(id).notificacion = notificacion;
    return ok({ ok: true, id, ref: id.slice(-6).toUpperCase(), destino: b.destino, destinoLabel: b.destino === 'relojes' ? '⌚ Relojes' : '🟣 Sublicuentas', totalCombo: t.total, descuentoCombo: t.descuento, subtotalCatalogo: t.subtotal, estado: 'pendiente', comprobante: true, notificacion });
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
const ADMIN_INIT = () => { try { if (!sessionStorage.getItem('_sx_init')) { sessionStorage.setItem('_sx_init', '1'); localStorage.setItem('rev_token', 'tok'); localStorage.setItem('rev_admin', '1'); } } catch (_) {} };
async function abrir(viewport = { width: 390, height: 844 }, E = nuevoEstado(), extra = {}, admin = false) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra });
  if (admin) await ctx.addInitScript(ADMIN_INIT); else await ctx.addInitScript(() => {
    try { if (!sessionStorage.getItem('_sx_init')) { sessionStorage.setItem('_sx_init', '1'); localStorage.setItem('rev_token', 'tok'); localStorage.setItem('rev_data', JSON.stringify({ nombre: 'Jimena', nombre_norm: 'jimena', usuario: 'jimena' })); localStorage.setItem('rev_last', String(Date.now())); } } catch (_) {}
  });
  await ctx.route(`${API_HOST}/**`, (route) => api(route, E));
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await ctx.route('https://fonts.gstatic.com/**', (r) => r.abort());
  const page = await ctx.newPage();
  const errores = []; page.on('pageerror', (e) => errores.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE);
  await page.waitForSelector('#app:not(.hide)'); await page.waitForFunction(() => !!document.querySelector('#content > :not(.spin)'));
  return { ctx, page, E, errores };
}
const shot = (page, n) => page.screenshot({ path: path.join(OUT, n), fullPage: false });

const VISTAS = (process.env.VISTAS || 'inicio,clientes,compras,precios,renovar,buzon,aula,recompensas,perfil,billetera').split(',');
const ANCHOS = (process.env.ANCHOS || '390,1440').split(',').map(Number);
const errores = [];
for (const w of ANCHOS) {
  const vp = { width: w, height: w < 768 ? 844 : 900 };
  const { ctx, page, errores: err } = await abrir(vp);
  for (const v of VISTAS) {
    await page.evaluate((x) => go(x), v); await page.waitForTimeout(450);
    if (process.env.DUMP) { const c = await page.evaluate(() => { const m = {}; document.querySelectorAll('#app *, #nav *').forEach((e) => (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter(Boolean).forEach((k) => { m[k] = (m[k] || 0) + 1; })); return m; }); fs.appendFileSync(process.env.DUMP, `== ${w} ${v}\n` + Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ':' + n).join(' ') + '\n'); }
    await page.screenshot({ path: path.join(OUT, `${w}-${v}.png`), fullPage: process.env.FULL === '1' });
    if (v === 'recompensas' && await page.locator('.sp-nivel.on').count()) { await page.locator('.sp-nivel.on').scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await page.screenshot({ path: path.join(OUT, `${w}-recompensas-nivel.png`) });
      await page.locator('.sp-elegir').first().click(); await page.waitForTimeout(500); if (!(await page.locator('[data-sp-page=ok]').count())) errores.push(`${w}px: Recompensas no se repinta tras elegir`); }
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ov > 1) errores.push(`${w}px ${v}: desborde horizontal ${ov}px`);
    if (['inicio', 'recompensas'].includes(v) && !(await page.locator(`[data-sp=${v}]`).count())) errores.push(`${w}px ${v}: falta el bloque SubliPoints`);
    if (v === 'inicio' && !(await page.locator('[data-bl=inicio]').count())) errores.push(`${w}px: falta acceso a billetera en Inicio`);
    if (v === 'billetera') {
      if (!(await page.locator('[data-bl-page=ok] .bl-saldo').count())) errores.push(`${w}px: billetera sin saldos`);
      await page.locator('[data-bl=recargar]').click(); await page.waitForTimeout(250);
      await page.locator('[data-bl=enviar]').click(); if (!/Sublicuentas o para Relojes/.test(await page.locator('#blErr').textContent())) errores.push(`${w}px: la recarga no valida el negocio`);
      await page.screenshot({ path: path.join(OUT, `${w}-billetera-recargar.png`) });
      if (w >= 900 && !(await page.locator('#nav .nav-btn[data-v=billetera]').count())) errores.push(`${w}px: falta Mi billetera en el menú`);
    }
  }
  if (w < 768) { await page.evaluate(() => go('inicio')); await page.locator('.nav-btn').last().click().catch(() => {}); await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `${w}-mas.png`) }); }
  errores.push(...err.map((e) => `${w}px JS: ${e}`)); await ctx.close();
  const A = await abrir(vp, nuevoEstado(), {}, true);
  for (const m of ['socios', 'comprobantes', 'compras', 'usuarios']) {
    await A.page.evaluate((x) => setAdmMode(x), m); await A.page.waitForTimeout(350);
    if (process.env.DUMP) { const c = await A.page.evaluate(() => { const m = {}; document.querySelectorAll('#app *').forEach((e) => (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter(Boolean).forEach((k) => { m[k] = (m[k] || 0) + 1; })); return m; }); fs.appendFileSync(process.env.DUMP, `== ${w} admin ${m}\n` + Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ':' + n).join(' ') + '\n'); }
    await A.page.screenshot({ path: path.join(OUT, `${w}-admin-${m}.png`), fullPage: process.env.FULL === '1' });
    const ov = await A.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ov > 1) errores.push(`${w}px admin ${m}: desborde ${ov}px`);
    if (m === 'comprobantes') { if (!(await A.page.locator('.sp-confirmar').count())) errores.push(`${w}px: falta «Confirmar pago»`); if (!(await A.page.locator('#spRanking .sp-rank li').count())) errores.push(`${w}px: falta ranking SubliPoints`); }
  }
  // R205b · Panel Dios › «Ver socio»: Recompensas, SubliPoints y Billetera deben cargar con el token del socio.
  await A.page.evaluate(() => verComo('jimena', 'jimena', 'Jimena')); await A.page.waitForTimeout(600);
  await A.page.evaluate(() => go('recompensas')); await A.page.waitForTimeout(700);
  if (!(await A.page.locator('[data-sp-page=ok]').count())) errores.push(`${w}px: Recompensas no carga en «Ver socio»`);
  await A.page.evaluate(() => go('billetera')); await A.page.waitForTimeout(600);
  if (!(await A.page.locator('[data-bl-page=ok]').count())) errores.push(`${w}px: Billetera no carga en «Ver socio»`);
  errores.push(...A.errores.map((e) => `${w}px admin JS: ${e}`)); await A.ctx.close();
}

for (const w of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } });
  await ctx.route(`${API_HOST}/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ activo: false }) }));
  const pg = await ctx.newPage(); await pg.goto(BASE); await pg.waitForTimeout(1600);
  await pg.screenshot({ path: path.join(OUT, `${w}-login.png`) }); await ctx.close();
}
/* ---------- Tema único + sonido (R202) ---------- */
{
  const { ctx, page } = await abrir({ width: 390, height: 844 });
  await ctx.addInitScript(() => { window.__ac = 0; const A = window.AudioContext; if (A) window.AudioContext = class extends A { constructor(...x) { super(...x); window.__ac++; } }; });
  const t = await page.evaluate(() => ({ b3d: document.documentElement.classList.contains('b3d'), hero: getComputedStyle(document.querySelector('.sxg-hola')).backgroundColor, bg: getComputedStyle(document.body).backgroundColor, h1: getComputedStyle(document.querySelector('#sxgHola')).color }));
  if (!t.b3d) errores.push('falta la clase b3d');
  if (t.hero !== 'rgb(222, 31, 37)') errores.push('héroe no es rojo de bloques: ' + t.hero);
  if (t.bg !== 'rgb(245, 247, 252)') errores.push('fondo no es #F5F7FC: ' + t.bg);
  if (t.h1 !== 'rgb(255, 255, 255)') errores.push('saludo no es blanco: ' + t.h1);
  const b = page.locator('.b3d-snd');
  if ((await b.getAttribute('aria-pressed')) !== 'false') errores.push('el sonido no inicia APAGADO');
  if ((await b.getAttribute('aria-label')) !== 'Activar sonido') errores.push('falta aria-label del sonido'); // R210: «Activar sonido» / «Silenciar sonido»
  const durs = await page.evaluate(() => Object.fromEntries(Object.entries(SubliSonido._sfx).map(([k, v]) => [k, v.reduce((a, x) => a + x[1], 0)])));
  const rango = { click: [60, 90], nav: [90, 130], exito: [160, 260], error: [120, 220], logro: [350, 600] };
  for (const [k, [mi, ma]] of Object.entries(rango)) if (!(durs[k] >= mi && durs[k] <= ma)) errores.push(`sonido ${k} dura ${durs[k]} ms (pedido ${mi}-${ma})`);
  await page.evaluate(() => go('clientes')); await page.waitForTimeout(200);
  if (await page.evaluate(() => window.__ac || 0)) errores.push('se creó audio sin que el socio lo encendiera');
  await b.click(); if ((await b.getAttribute('aria-pressed')) !== 'true') errores.push('no enciende');
  await page.reload(); await page.waitForSelector('.b3d-snd');
  if ((await page.locator('.b3d-snd').getAttribute('aria-pressed')) !== 'true') errores.push('la preferencia no persiste al recargar');
  await page.evaluate(() => go('perfil')); await page.waitForSelector('.b3d-switch');
  if ((await page.locator('.b3d-switch').getAttribute('aria-checked')) !== 'true') errores.push('Mi perfil no muestra el estado');
  await page.locator('.b3d-switch').click();
  if ((await page.locator('.b3d-snd').getAttribute('aria-pressed')) !== 'false') errores.push('apagar desde Mi perfil no apaga la cabecera');
  await page.screenshot({ path: path.join(OUT, 'sonido-perfil.png') });
  await ctx.close();
  console.log('Tema y sonido: revisados');
}
await browser.close(); server.close();
console.log(errores.length ? 'PROBLEMAS:\n' + errores.join('\n') : 'Vistas OK · ' + OUT);
process.exit(errores.length ? 1 : 0);
