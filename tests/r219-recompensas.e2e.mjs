// R219 · Recompensas + SubliPoints en bloques 3D: progreso, 3 niveles × 3 premios, estados de canje, Gift Card y «← Admin» solo desde administración.
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
  await db.collection('revendedores').doc('jimena').set({ nombre: 'Jimena', nombre_norm: 'jimena', telegramId: E.tgConectado ? '900123' : '', activo: true });
  await db.collection('revendedores').doc('otra').set({ nombre: 'Otra', nombre_norm: 'otra', telegramId: '555', activo: true });
  for (const [id, x] of E.pedidos) await db.collection('compras').doc(id).set(x);
  const srv = await new Promise((r) => { const s2 = app.listen(0, () => r(s2)); });
  const base = `http://127.0.0.1:${srv.address().port}`;
  const admin = async (method, url, body) => { const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', 'x-admin': '1', 'x-sublichat-actor': 'naara' }, body: body ? JSON.stringify(body) : undefined }); return r.json(); };
  E.real = { db, srv, base, admin };
  return E.real;
}
const RUTAS_REALES = /^\/rev\/(entregas|novedades|consultas|telegram)(\/|$|\?)/;


/* ---------- R219 · misma regla del servidor (lib_recompensas_sp.vistaSocio) para armar la vista ---------- */
const CAT = [['dia_appletv','Diamante','Apple TV','Cuenta completa · duración por definir'],['dia_elevenreader','Diamante','Eleven Reader Ultra','Cuenta completa · duración por definir'],['dia_canva_edu','Diamante','Canva Edu Pro','Acceso · 2 meses'],['ley_duolingo','Leyenda','Duolingo Plus','Acceso · 3 meses'],['ley_openenglish','Leyenda','Open English','Acceso · 3 meses'],['ley_prime','Leyenda','Prime Video','Cuenta completa · duración por definir'],['inm_gemini','Inmortal','Gemini Pro','Acceso · 3 meses'],['inm_hbo','Inmortal','HBO Max','Acceso · 1 mes · plan por configurar'],['inm_giftcard_100','Inmortal','Gift Card Sublicuentas','L100 de saldo promocional · todos los productos menos Netflix']];
const ORD = { 'Sin nivel': 0, Diamante: 1, Leyenda: 2, Inmortal: 3 }, MIN = { Diamante: 10, Leyenda: 25, Inmortal: 50 };
const ESTT = { pendiente_aprobacion: 'Pendiente de aprobación', aprobada: 'Aprobada · pendiente de entrega', entregada: 'Entregada', rechazada: 'Rechazada' };
const nivelDe = (p) => (p >= 50 ? 'Inmortal' : p >= 25 ? 'Leyenda' : p >= 10 ? 'Diamante' : 'Sin nivel');
function vistaRec(E) {
  const R = E.rw || (E.rw = { puntos: 32, ventas: 8, renov: 16, agotados: ['ley_openenglish'], sols: [], promo: 0 });
  const nivel = nivelDe(R.puntos), sig = [['Diamante', 10], ['Leyenda', 25], ['Inmortal', 50]].find(([, m]) => R.puntos < m);
  const resumen = { ok: true, excluido: false, mes: '2026-11', puntos: R.puntos, nivel, siguiente: sig ? { nivel: sig[0], min: sig[1], faltan: sig[1] - R.puntos } : null, ventasNuevas: R.ventas, renovaciones: R.renov };
  const delMes = R.sols.find((s) => s.mes === '2026-11' && s.estado !== 'rechazada') || null;
  const items = CAT.map(([id, niv, nombre, detalle]) => {
    let estado = 'bloqueado', motivo = `Se desbloquea con ${niv} (${MIN[niv]} puntos este mes)`;
    if (delMes) { estado = delMes.recompensaId === id ? 'solicitado' : 'bloqueado'; motivo = delMes.recompensaId === id ? ESTT[delMes.estado] : 'Ya eligió su recompensa de este mes'; }
    else if (R.agotados.includes(id)) { estado = 'agotado'; motivo = 'Sin disponibilidad por ahora'; }
    else if (nivel === niv) { estado = 'disponible'; motivo = 'Puede elegirla este mes'; }
    else if (ORD[nivel] > ORD[niv]) motivo = `Este mes le corresponde un premio ${nivel}`;
    return { id, nivel: niv, nombre, detalle, tipo: id.includes('gift') ? 'giftcard' : 'producto', estado, motivo };
  });
  const pub = (s) => ({ ...s, programa: 'sublipoints', estadoTexto: ESTT[s.estado], motivo: s.motivo || '', nota: s.nota || '' });
  return { ok: true, resumen, items, solicitudMes: delMes ? pub(delMes) : null, solicitudes: R.sols.map(pub), saldoPromocional: R.promo };
}
function solicitar(E, b, ok) {
  const v = vistaRec(E), it = v.items.find((x) => x.id === b.recompensaId);
  E.solicitudesPost = (E.solicitudesPost || 0) + 1;
  if (v.solicitudMes) return ok({ error: 'ya_eligio_este_mes' }, 409);
  if (!it || it.estado !== 'disponible') return ok({ error: 'nivel_no_corresponde' }, 409);
  E.rw.sols = E.rw.sols.filter((s) => s.estado !== 'rechazada' || s.mes !== '2026-11');
  E.rw.sols.unshift({ id: 'sp_jimena_2026-11', mes: '2026-11', nivel: it.nivel, recompensa: it.nombre, recompensaId: it.id, estado: 'pendiente_aprobacion' });
  return ok({ ok: true, solicitud: E.rw.sols[0] });
}
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
  if (p === '/rev/recompensas-sp') return ok(vistaRec(E));
  if (p === '/rev/recompensas-sp/solicitar') return solicitar(E, req.postDataJSON(), ok);
  if (p === '/rev/billetera' && E.billeteraError) return ok({ error: 'server' }, 500);
  if (p === '/rev/billetera' && E.billeteraVacia) return ok({ ok: true, saldos: { sublicuentas: { negocio: 'sublicuentas', nombre: 'Sublicuentas', real: 0, promocional: 0, reservado: 0, disponible: 0 }, relojes: { negocio: 'relojes', nombre: 'Relojes', real: 0, promocional: 0, reservado: 0, disponible: 0 } }, negocios: { sublicuentas: 'Sublicuentas', relojes: 'Relojes' }, movimientos: [], recargas: [], pendientes: 0, bancos: ['BAC Honduras'], limites: { min: 10, max: 50000 } });
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
const ir = async (page) => { await page.evaluate(() => go('recompensas')); await page.waitForSelector('.rw-page'); await page.waitForTimeout(300); };
const recargar = async (page) => { await page.evaluate(() => SubliPoints.recargar && SubliPoints.recargar()); await page.waitForTimeout(500); };
const revisar = async (page, w) => {
  const r = await page.evaluate(() => ({ sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > innerWidth + 1,
    corte: [...document.querySelectorAll('.rw-badge, .rw-elegir, .rw-premio-tx b, .rw-nivel-tx b, .rw-head h1, .rw-prog-tx b')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim() + ':' + e.scrollWidth + '/' + e.clientWidth),
    fuera: [...document.querySelectorAll('.rw-page *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.left < -1 || b.right > innerWidth + 1); }).map((e) => e.className.baseVal ?? e.className).slice(0, 6).length }));
  assert.deepEqual(r, { sw: false, corte: [], fuera: 0 }, 'sin cortes ' + w);
};
for (const w of (process.env.ANCHOS || '320,360,390,430,768,1280').split(',').map(Number)) {
  // 1 · 0 puntos = Sin nivel, todo bloqueado con su requisito
  const E = nuevoEstado(); E.rw = { puntos: 0, ventas: 0, renov: 0, agotados: [], sols: [], promo: 0 };
  const { ctx, page, errores } = await abrir({ width: w, height: w < 600 ? 844 : 900 }, E);
  await ir(page);
  assert.equal(await page.$('#webAdminReturn'), null, 'socio directo: sin «← Admin»');
  assert.match(await page.textContent('.rw-head'), /Recompensas\s*SubliPoints · noviembre 2026/);
  assert.match(await page.textContent('.rw-prog-tx'), /Puntos de noviembre 2026\s*0 puntos · Sin nivel/);
  assert.match(await page.textContent('.rw-prog'), /Le faltan 10 puntos para Diamante/);
  const niv = await page.$$eval('.rw-nivel', (x) => x.map((n) => [n.querySelector('.rw-nivel-tx').innerText.replace(/\s+/g, ' ').trim(), n.querySelectorAll('.rw-premio').length, !!n.querySelector('.rw-st'), !!n.querySelector('.rw-insig')]));
  assert.deepEqual(niv, [['Diamante 10–24 puntos al mes', 3, true, true], ['Leyenda 25–49 puntos al mes', 3, true, true], ['Inmortal 50+ puntos al mes', 3, true, true]]);
  const prem = await page.$$eval('.rw-premio', (x) => x.map((p) => [p.querySelector('b').textContent, p.querySelector('small').textContent, p.querySelector('.rw-badge').textContent.trim(), !!p.querySelector('.rw-prod-ic svg'), !!p.querySelector('.rw-elegir')]));
  assert.equal(prem.length, 9); assert.ok(prem.every((p) => p[2] === 'Bloqueado' && p[3] && !p[4]), 'bloqueados sin botón');
  assert.deepEqual(prem.map((p) => p[0]), ['Apple TV', 'Eleven Reader Ultra', 'Canva Edu Pro', 'Duolingo Plus', 'Open English', 'Prime Video', 'Gemini Pro', 'HBO Max', 'Gift Card Sublicuentas']);
  assert.equal(prem[0][1], 'Cuenta completa · duración por definir', 'no inventa duraciones');
  assert.match(await page.textContent('.rw-premio:first-child em'), /Se desbloquea con Diamante \(10 puntos este mes\)/);
  assert.equal(await page.$$eval('img', (x) => x.filter((i) => /apple|canva|duolingo|prime|gemini|hbo|max/i.test(i.src)).length), 0, 'sin logos de marcas');
  await revisar(page, w);
  await page.evaluate(() => { document.body.scrollTop = 0; window.scrollTo(0, 0); });
  await page.screenshot({ path: path.join(OUT, `recompensas-${w}-sin-nivel.png`) }); await full(page, `recompensas-${w}-sin-nivel-completa.png`);
  // 2 · Leyenda: disponible / agotado / bloqueado; elegir = solicitud pendiente (una sola, aunque se toque dos veces)
  E.rw = { puntos: 32, ventas: 8, renov: 16, agotados: ['ley_openenglish'], sols: [], promo: 0 }; await recargar(page); await ir(page);
  assert.match(await page.textContent('.rw-prog-tx'), /32 puntos · Leyenda/); assert.match(await page.textContent('.rw-desglose'), /8 ventas nuevas \+16\s*16 renovaciones \+16/);
  assert.match(await page.textContent('.rw-prog'), /Le faltan 18 puntos para Inmortal/);
  assert.ok(await page.$('.rw-nivel.on[aria-label="Nivel Leyenda"] .rw-su'));
  const est = await page.$$eval('.rw-premio', (x) => Object.fromEntries(x.map((p) => [p.querySelector('b').textContent, p.querySelector('.rw-badge').textContent.trim()])));
  assert.equal(est['Duolingo Plus'], 'Disponible'); assert.equal(est['Prime Video'], 'Disponible'); assert.equal(est['Open English'], 'Agotado'); assert.equal(est['Apple TV'], 'Bloqueado'); assert.equal(est['Gemini Pro'], 'Bloqueado');
  for (const b of await page.$$('.rw-elegir')) assert.ok((await b.boundingBox()).height >= 44);
  assert.equal(await page.$$eval('.rw-elegir', (x) => x.length), 2);
  await revisar(page, w);
  if ([390, 1280].includes(w)) { await page.locator('.rw-nivel.on').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(OUT, `recompensas-${w}-leyenda.png`) }); await full(page, `recompensas-${w}-leyenda-completa.png`); }
  const b1 = page.locator('.rw-premio', { hasText: 'Duolingo Plus' }).locator('.rw-elegir');
  await b1.click(); await page.waitForSelector('.rw-sol'); await page.waitForTimeout(300);
  assert.equal(E.solicitudesPost, 1);
  assert.match(await page.textContent('.rw-sol'), /Duolingo Plus/); assert.match(await page.textContent('.rw-sol .rw-badge'), /Pendiente/);
  assert.equal((await page.locator('.rw-premio', { hasText: 'Duolingo Plus' }).locator('.rw-badge').textContent()).trim(), 'Pendiente');
  assert.equal(await page.$$eval('.rw-elegir', (x) => x.length), 0, 'una por mes: ya no hay más botones');
  if (w === 390) await full(page, `recompensas-390-pendiente.png`);
  assert.deepEqual(errores, []); await ctx.close(); console.log('ok', w);
}
// 3 · Inmortal con Gift Card entregada (máximo nivel, sin «siguiente»)
{ const E = nuevoEstado(); E.rw = { puntos: 57, ventas: 20, renov: 17, agotados: [], promo: 100, sols: [{ id: 'sp_jimena_2026-11', mes: '2026-11', nivel: 'Inmortal', recompensa: 'Gift Card Sublicuentas', recompensaId: 'inm_giftcard_100', estado: 'entregada', nota: 'Saldo promocional de L100 acreditado' }, { id: 'sp_jimena_2026-10', mes: '2026-10', nivel: 'Diamante', recompensa: 'Canva Edu Pro', recompensaId: 'dia_canva_edu', estado: 'entregada' }] };
  for (const w of [390, 1280]) {
    const { ctx, page, errores } = await abrir({ width: w, height: w < 600 ? 844 : 900 }, E); await ir(page);
    assert.match(await page.textContent('.rw-prog'), /57 puntos · Inmortal/); assert.match(await page.textContent('.rw-prog'), /Nivel máximo del mes alcanzado/); assert.doesNotMatch(await page.textContent('.rw-prog'), /Le faltan/);
    assert.equal((await page.locator('.rw-premio', { hasText: 'Gift Card' }).locator('.rw-badge').textContent()).trim(), 'Entregado');
    assert.match(await page.textContent('.rw-gift'), /L100/); assert.match(await page.textContent('.rw-gift'), /menos Netflix/);
    assert.match(await page.textContent('.rw-hist'), /Canva Edu Pro/);
    await revisar(page, w); await full(page, `recompensas-${w}-inmortal-entregada.png`);
    assert.deepEqual(errores, []); await ctx.close(); }
  console.log('ok inmortal'); }
// 4 · Rechazada: se ve el motivo y puede elegir otra
{ const E = nuevoEstado(); E.rw = { puntos: 14, ventas: 5, renov: 4, agotados: [], promo: 0, sols: [{ id: 'sp_jimena_2026-11', mes: '2026-11', nivel: 'Diamante', recompensa: 'Apple TV', recompensaId: 'dia_appletv', estado: 'rechazada', motivo: 'Sin cuentas disponibles esta semana' }] };
  const { ctx, page, errores } = await abrir({ width: 390, height: 844 }, E); await ir(page);
  assert.match(await page.textContent('.rw-rech'), /Rechazada: Sin cuentas disponibles esta semana/); assert.match(await page.textContent('.rw-rech .rw-badge'), /Rechazado/);
  assert.equal(await page.$$eval('.rw-elegir', (x) => x.length), 3, 'puede elegir otra de Diamante');
  await full(page, 'recompensas-390-rechazada.png'); assert.deepEqual(errores, []); await ctx.close(); console.log('ok rechazada'); }
// 5 · «← Admin» solo desde administración
{ const ad = await abrir({ width: 390, height: 844 }, nuevoEstado(), {}, true); await ad.page.waitForTimeout(1500);
  await ad.page.evaluate(() => verComo('jimena', 'jimena', 'Jimena')); await ad.page.waitForTimeout(1500);
  assert.ok(await ad.page.evaluate(() => impersonating)); await ir(ad.page);
  assert.ok(await ad.page.$('#webAdminReturn'), 'desde administración sí aparece');
  await ad.page.evaluate(() => { document.body.scrollTop = 0; window.scrollTo(0, 0); }); await ad.page.screenshot({ path: path.join(OUT, 'recompensas-390-desde-admin.png') });
  await ad.ctx.close(); console.log('ok admin'); }
await browser.close(); server.close(); process.exit(0);
