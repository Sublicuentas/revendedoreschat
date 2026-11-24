// R214 · Renovaciones en bloques 3D: contadores-filtro, búsqueda, Listado/Calendario/Resumen, Renovar, Mensaje de cobro y menú ⋯.
// Base: R202 · Bloques 3D: capturas de TODAS las vistas (socio y Panel Dios) en 360–1440 px con el mismo simulador de las pruebas R185.
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
const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Tegucigalpa' })); // fecha de Honduras
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
  { id: 'c4', nombrePerfil: 'Karen Prueba', telefono: '31800000', servicios: [{ plataforma: 'vipnetflix', fechaRenovacion: en(-3), precio: 130 }] },
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
  if (p === '/rev/mensaje-dia') { const MD = require(path.join(BOT_DIR, 'lib_mensaje_dia.js')); const f = MD.fechaHN(); return ok({ ok: true, fecha: f, texto: (E.mensajeDia && E.mensajeDia[f]) || MD.respaldo(f), fuente: 'respaldo' }); } // R213 · misma regla del servidor
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


const full = async (page, n) => { await page.addStyleTag({ content: 'html,body{height:auto!important;overflow:visible!important}' }); await page.waitForTimeout(150); await page.screenshot({ path: path.join(OUT, n), fullPage: true }); await page.evaluate(() => document.querySelectorAll('style').forEach((x) => { if (x.textContent.startsWith('html,body{height:auto!important')) x.remove(); })); };

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const larga = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return `${d.getDate()} de ${MES[d.getMonth()]} de ${d.getFullYear()}`; };
for (const w of (process.env.ANCHOS || '320,360,390,430,768,1280').split(',').map(Number)) {
  const { ctx, page, errores, E } = await abrir({ width: w, height: w < 600 ? 844 : 900 });
  await page.evaluate(() => go('renovar')); await page.waitForSelector('.b3-ren-kpi'); await page.waitForTimeout(300);
  assert.equal(await page.$('#webAdminReturn'), null, 'socio directo: sin «← Admin»');
  // A · banner compacto claro, sin el bloque azul marino
  const hero = await page.$eval('.b3-ren-hero', (h) => { const r = h.getBoundingClientRect(); return { bg: getComputedStyle(h).backgroundColor, h: r.height, txt: h.textContent }; });
  const [r, g, b] = hero.bg.match(/\d+/g).map(Number); assert.ok(r > 240 && g > 240 && b > 240, 'banner claro: ' + hero.bg);
  assert.ok(hero.h < (w < 600 ? 190 : 200), 'banner compacto: ' + hero.h);
  assert.match(hero.txt, /Al renovar elige el período y ve la nueva fecha antes de confirmar/);
  assert.equal(await page.$$eval('.b3-ren-hero .b3-st', (x) => x.length) >= 3, true, 'piezas con studs');
  // B · cuatro métricas 3D con conteo real, sin recortes
  const kpi = await page.$$eval('.b3-ren-kpi', (x) => x.map((b) => { const n = b.querySelector('b'), sm = b.querySelector('small'); return [b.dataset.v, n.textContent.trim(), b.getBoundingClientRect().height, n.scrollWidth <= n.clientWidth + 1 && sm.scrollWidth <= sm.clientWidth + 1, !!b.querySelector('.b3-st'), getComputedStyle(b).boxShadow !== 'none']; }));
  assert.deepEqual(kpi.map((k) => k[0]), ['todos', 'vencidos', 'hoy', 'porvencer']);
  assert.deepEqual(kpi.map((k) => k[1]), ['5', '2', '1', '2'], 'conteos del servidor (5 servicios: 2 vencidos, 1 hoy, 1 en 3 días)');
  for (const k of kpi) { assert.ok(k[2] >= 44); assert.ok(k[3], 'sin cortar ' + k[0]); assert.ok(k[4] && k[5], 'studs y relieve ' + k[0]); }
  // D · tarjetas
  const karen = page.locator('.b3-ren', { hasText: 'Karen Prueba' }).first();
  assert.match(await karen.locator('.b3-ren-pill').textContent(), /^Corte hace 3d$/);
  assert.match(await karen.locator('.b3-ren-fecha').textContent(), new RegExp('Vence ' + larga(-3)));
  assert.equal((await karen.locator('.b3-ren-svc').textContent()).trim(), 'Vvipnetflix · L130');
  assert.equal(await karen.locator('.b3-ren-svc-ic').getAttribute('class'), 'b3-ren-svc-ic t-red', 'ícono por catálogo (rojo Netflix), no de otra marca');
  assert.equal(await karen.locator('.b3-ren-pz').count(), 2); assert.equal(await karen.locator('.b3-ren-av .b3-st').count(), 1);
  const ana = page.locator('.b3-ren', { hasText: 'Ana López' }).first();
  assert.match(await ana.locator('.b3-ren-pill').textContent(), /^En 3d$/);
  assert.equal(await page.locator('.b3-ren', { hasText: 'María José' }).first().locator('.b3-ren-pill').textContent(), 'Pago hoy');
  for (const bt of await page.$$('.b3-ren-renovar, .b3-ren-cobro, .b3-ren-vista, .b3-ren-buscar input')) assert.ok((await bt.boundingBox()).height >= 44);
  const corte = await page.evaluate(() => [...document.querySelectorAll('.b3-ren-renovar, .b3-ren-cobro, .b3-ren-nom, .b3-ren-pill, .b3-ren-vista span')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  assert.deepEqual(corte, [], 'texto sin truncar ' + w);
  // filtro vencidos = contador
  await page.click('.b3-ren-kpi[data-v="vencidos"]'); await page.waitForTimeout(150);
  assert.equal(await page.getAttribute('.b3-ren-kpi[data-v="vencidos"]', 'aria-pressed'), 'true');
  const pills = await page.$$eval('.b3-ren-pill', (x) => x.map((p) => p.textContent.trim())); assert.deepEqual(pills, ['Corte hace 3d', 'Corte hace 2d']);
  await page.click('.b3-ren-kpi[data-v="todos"]'); await page.waitForTimeout(150);
  // búsqueda por teléfono, servicio y nombre
  await page.fill('#sxRenBuscar', '3344'); await page.waitForTimeout(150); assert.deepEqual(await page.$$eval('.b3-ren-nom', (x) => x.map((b) => b.textContent)), ['Carlos Mejía']);
  await page.fill('#sxRenBuscar', 'canva'); await page.waitForTimeout(150); assert.match(await page.textContent('#sxRenLista'), /Canva Pro/);
  await page.fill('#sxRenBuscar', 'karen'); await page.waitForTimeout(150); assert.deepEqual(await page.$$eval('.b3-ren-nom', (x) => x.map((b) => b.textContent)), ['Karen Prueba']);
  await page.fill('#sxRenBuscar', ''); await page.waitForTimeout(150);
  await page.evaluate(() => { document.body.scrollTop = 0; window.scrollTo(0, 0); });
  await page.screenshot({ path: path.join(OUT, `renovaciones-${w}.png`) }); await full(page, `renovaciones-${w}-completa.png`);
  // Renovar abre el flujo con período y nueva fecha; Mensaje de cobro abre su hoja sin enviar nada
  const card = page.locator('.b3-ren', { hasText: 'Carlos Mejía' }).first();
  const escrituras = () => E.calls.filter((c) => !c.startsWith('GET')).length, e0 = escrituras();
  await card.locator('[data-ren="renovar"]').click(); await page.waitForSelector('#compOverlay.show');
  assert.match(await page.textContent('#compSub'), /Carlos Mejía/);
  if (w === 390) await page.screenshot({ path: path.join(OUT, 'renovaciones-390-renovar.png') });
  await page.evaluate(() => closeComprobante());
  await card.locator('[data-ren="cobro"]').click(); await page.waitForSelector('#cobroOverlay.show');
  if (w === 390) await page.screenshot({ path: path.join(OUT, 'renovaciones-390-cobro.png') });
  await page.evaluate(() => closeCobro());
  // nombre → ficha del cliente
  await card.locator('.b3-ren-nom').click(); await page.waitForSelector('.sxg-ficha'); assert.match(await page.textContent('.sxg-ficha'), /Carlos Mejía/);
  // vistas funcionales
  await page.evaluate(() => go('renovar')); await page.waitForSelector('.b3-ren-kpi');
  await page.click('[data-ren="vista"][data-v="calendario"]'); await page.waitForSelector('.b3-ren-cal'); assert.ok((await page.$$('.b3-ren-dia')).length >= 2);
  assert.match(await page.textContent('.b3-ren-dia-h'), new RegExp(larga(-3)));
  if (w === 390 || w === 1280) await full(page, `renovaciones-${w}-calendario.png`);
  await page.click('[data-ren="vista"][data-v="resumen"]'); await page.waitForSelector('.b3-ren-res');
  const total = await page.$$eval('.b3-ren-res-g dd small', (x) => x.reduce((a, s) => a + Number(s.textContent.match(/\d+/)[0]), 0)); assert.equal(total, 5, 'el resumen cuadra con «Todas»');
  if (w === 390 || w === 1280) await full(page, `renovaciones-${w}-resumen.png`);
  await page.click('[data-ren="vista"][data-v="listado"]');
  // sin desbordes ni tapado por la barra
  const ov = await page.evaluate(async () => { const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth + 1; document.body.scrollTop = 1e6; window.scrollTo(0, 1e6); await new Promise((r) => setTimeout(r, 200)); const l = [...document.querySelectorAll('.b3-ren')].pop().getBoundingClientRect(); const n = document.getElementById('nav'); const lim = n && getComputedStyle(n).position === 'fixed' && n.getBoundingClientRect().top > innerHeight / 2 ? n.getBoundingClientRect().top : innerHeight; return { sw, tapa: l.bottom > lim + 1 }; });
  assert.deepEqual(ov, { sw: false, tapa: false });
  // sonido: ícono visible en ambos estados
  await page.evaluate(() => { document.body.scrollTop = 0; window.scrollTo(0, 0); }); const snd = await page.$('.b3d-snd'); assert.ok(snd, 'botón de sonido');
  if (snd) { for (let i = 0; i < 2; i++) { const vis = await snd.evaluate((b) => { const s = b.querySelector('svg'); return !!s && s.getBoundingClientRect().width > 8; }); assert.ok(vis, 'ícono de sonido visible'); await snd.click(); await page.waitForTimeout(100); } }
  // ninguna llamada de escritura por abrir hojas
  assert.equal(escrituras(), e0, 'abrir Renovar / Mensaje de cobro no envía ni renueva nada');
  assert.deepEqual(errores, []); await ctx.close(); console.log('ok', w);
}
// días contados con fecha de Honduras aunque el teléfono esté en otra zona horaria
{ const o = await abrir({ width: 390, height: 844 }, nuevoEstado(), { timezoneId: 'Asia/Tokyo' }); await o.page.evaluate(() => go('renovar')); await o.page.waitForSelector('.b3-ren-kpi');
  assert.match(await o.page.locator('.b3-ren', { hasText: 'Karen Prueba' }).first().locator('.b3-ren-pill').textContent(), /^Corte hace 3d$/);
  await o.ctx.close(); console.log('ok zona'); }
// «← Admin» solo al entrar como administrador con «Ver socio»
{ const ad = await abrir({ width: 390, height: 844 }, nuevoEstado(), {}, true); await ad.page.waitForTimeout(1500);
  await ad.page.evaluate(() => verComo('jimena', 'jimena', 'Jimena')); await ad.page.waitForTimeout(1500);
  assert.ok(await ad.page.evaluate(() => impersonating));
  await ad.page.evaluate(() => go('renovar')); await ad.page.waitForSelector('.b3-ren-kpi'); await ad.page.waitForTimeout(300);
  assert.ok(await ad.page.$('#webAdminReturn'), 'desde administración sí aparece');
  await ad.page.screenshot({ path: path.join(OUT, 'renovaciones-390-desde-admin.png') });
  await ad.ctx.close(); console.log('ok admin'); }
await browser.close(); server.close(); process.exit(0);
