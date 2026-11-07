'use strict';
/* ========================================================================
   SUBLICUENTAS · PORTAL DE SOCIOS · GUÍA MAESTRA (R185, 07/11/2026)
   Diseño claro con relieve 3D suave (sin neón, sin degradados).
   Barra inferior exacta: Inicio | Clientes | Compras | Catálogo | Más.
   Capa de presentación: reutiliza datos, rutas de la API, permisos y flujos existentes
   (compra, renovación con comprobante, entregas, buzón). No crea datos ni cambia reglas.
   Se carga al final, después de socios-orden.js.
   ======================================================================== */

const SXG_TZ = 'America/Tegucigalpa';
const SXG_IC = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.5.2 4.3 1.8 4.9 4.6"/>',
  cart: '<path d="M3 4h2.2l2.3 10.4h10.3L20 7H6.4"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  more: '<circle cx="5.5" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.9" fill="currentColor" stroke="none"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  renew: '<path d="M20 11a8 8 0 0 0-14.6-4.4L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.6 4.4l1.4-1.9"/><path d="M20 20v-4.5h-4.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  coins: '<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  mega: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 6 7.5-6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18M12 9v11M12 9c-1.5-3-5-4-5-1.5S10 9 12 9zm0 0c1.5-3 5-4 5-1.5S14 9 12 9z"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
};
function sxgIc(n, cls = '') { return `<svg class="sxg-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SXG_IC[n] || ''}</svg>`; }

/* ---------------- fechas en hora de Honduras ---------------- */
function sxgPartes(d = new Date()) {
  const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: SXG_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}
function sxgPeriodoHoy() { const p = sxgPartes(); return `${p.y}-${String(p.m).padStart(2, '0')}`; }
function sxgPeriodoDe(ts) { const n = Number(ts); if (!Number.isFinite(n) || n <= 0) return ''; const p = sxgPartes(new Date(n)); return `${p.y}-${String(p.m).padStart(2, '0')}`; }
const SXG_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function sxgCap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
function sxgPeriodoTxt(per) { const [y, m] = String(per).split('-').map(Number); return `${sxgCap(SXG_MESES[(m || 1) - 1])} ${y}`; }
function sxgFechaLarga(d = new Date()) { return sxgCap(d.toLocaleDateString('es-HN', { timeZone: SXG_TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })); }
function sxgHora(d = new Date()) { return d.toLocaleTimeString('es-HN', { timeZone: SXG_TZ, hour: '2-digit', minute: '2-digit', hour12: true }); }
function sxgFechaCorta(ts) { const n = Number(ts); if (!n) return ''; return new Date(n).toLocaleDateString('es-HN', { timeZone: SXG_TZ, day: '2-digit', month: 'short', year: 'numeric' }); }
function sxgTs(v) { if (v == null || v === '') return 0; if (typeof v === 'number') return v; if (v._seconds) return v._seconds * 1000; if (v.seconds) return v.seconds * 1000; const d = parseFecha(v); return d ? d.getTime() : (Date.parse(v) || 0); }

/* ---------------- selector común de clientes (Inicio, chips y lista usan lo mismo) ---------------- */
const SXG_FILTROS = [['todos', 'Todos'], ['vigentes', 'Vigentes'], ['renovaciones', 'Renovaciones'], ['vencidos', 'Vencidos'], ['sinservicio', 'Sin servicio']];
function sxgDiasSvc(s) { return sxoServicioEstado(s); }
function sxgVentanaRenovacion() { return Number(CONFIG.avisoDias ?? 7); } // la misma ventana que ya usa el panel (estado())
function sxgEnRenovacion(c) { const v = sxgVentanaRenovacion(); return (c.servicios || []).some((s) => { const n = sxgDiasSvc(s).n; return n >= 0 && n <= v; }); }
function sxgConVencidos(c) { return (c.servicios || []).some((s) => sxgDiasSvc(s).n < 0); }
function sxgCumple(c, f) {
  if (f === 'vigentes') return esClienteVigente(c);
  if (f === 'renovaciones') return sxgEnRenovacion(c);
  if (f === 'vencidos') return sxgConVencidos(c);
  if (f === 'sinservicio') return esClienteNoVigente(c);
  return true;
}
function sxgClientesUnicos() { // sin duplicados en la lista
  const vistos = new Set(), out = [];
  for (const c of clientes || []) { const k = String(c.id || '') || `${nombreCli(c)}|${c.telefono || ''}`; if (vistos.has(k)) continue; vistos.add(k); out.push(c); }
  return out;
}
function sxgConteos() { const l = sxgClientesUnicos(); return Object.fromEntries(SXG_FILTROS.map(([k]) => [k, l.filter((c) => sxgCumple(c, k)).length])); }
function sxgEstadoCli(c) {
  if (sxgConVencidos(c)) return ['warn', 'Vencido'];
  if (sxgEnRenovacion(c)) return ['info', 'Por renovar'];
  if (esClienteVigente(c)) return ['ok', 'Vigente'];
  return ['off', 'Sin servicio'];
}
function sxgNombreSvc(s) { return pick(s, CONFIG.campos.servicio) || 'Servicio'; }
function sxgProxima(c) {
  const fs = (c.servicios || []).map((s) => ({ f: parseFecha(pick(s, CONFIG.campos.vencimiento)), e: sxgDiasSvc(s) })).filter((x) => x.f);
  const futuras = fs.filter((x) => x.e.n >= 0).sort((a, b) => a.e.n - b.e.n);
  if (futuras.length) return { t: 'Renueva', f: futuras[0].f };
  const pasadas = fs.sort((a, b) => b.e.n - a.e.n);
  return pasadas.length ? { t: 'Venció', f: pasadas[0].f } : null;
}
function sxgCargado(tipo) { return Number(syncAt?.[tipo] || 0) > 0; }

/* ---------------- metas (solo datos reales; sin meta = "Meta no configurada") ---------------- */
function sxgMeta(per) {
  const r = rev || {};
  const tabla = r.metas && typeof r.metas === 'object' ? r.metas : r.metasVentas && typeof r.metasVentas === 'object' ? r.metasVentas : null;
  let v = tabla && tabla[per] != null ? tabla[per] : (r.metaMensual != null ? r.metaMensual : null);
  if (v && typeof v === 'object') v = v.monto ?? v.objetivo ?? v.targetAmount;
  v = Number(v);
  return Number.isFinite(v) && v > 0 ? v : null; // 0 o vacío: no configurada (nunca se divide entre 0)
}
const sxgVentasPer = {}; // periodo -> { estado:'ok'|'cargando'|'sin_datos', monto, ops }
function sxgVentas(per) {
  const m = metricasNegocio && typeof metricasNegocio === 'object' ? metricasNegocio : null;
  if (m && (m.periodo || sxgPeriodoHoy()) === per) {
    const v = Number(m.operadoMes ?? m.costoMes);
    if (Number.isFinite(v)) return { estado: 'ok', monto: v, ops: Number(m.operacionesMes) || 0 };
  }
  if (per === sxgPeriodoHoy() && !m) return { estado: 'cargando' };
  return sxgVentasPer[per] || null;
}
async function sxgCargarVentas(per) {
  if (sxgVentasPer[per] && sxgVentasPer[per].estado !== 'error') return;
  sxgVentasPer[per] = { estado: 'cargando' };
  try {
    const d = await API.call(`/rev/metricas?periodo=${encodeURIComponent(per)}&_=${Date.now()}`, { cache: 'no-store', timeoutMs: 12000 });
    // Si el servidor todavía no conoce ?periodo= devuelve el mes actual: no se mezclan meses.
    sxgVentasPer[per] = d && d.periodo === per ? { estado: 'ok', monto: Number(d.operadoMes ?? d.costoMes) || 0, ops: Number(d.operacionesMes) || 0 } : { estado: 'sin_datos' };
  } catch (_) { sxgVentasPer[per] = { estado: 'error' }; }
  if (current === 'metas') sxgVMetas(); else if (current === 'inicio') vInicio();
}

/* ---------------- avisos por mes y año (fecha original del aviso) ---------------- */
const sxgAv = { per: '', cache: {}, cargando: {}, abierto: '' };
function sxgAvisosDe(per) {
  const mapa = new Map();
  [...(avisos || []), ...(sxgAv.cache[per] || [])].forEach((a, i) => { const k = String(a.id || `${a.ts}|${i}`); if (!mapa.has(k)) mapa.set(k, a); });
  return [...mapa.values()].filter((a) => sxgPeriodoDe(a.ts) === per).sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
async function sxgCargarAvisos(per) {
  if (sxgAv.cache[per] || sxgAv.cargando[per]) return;
  sxgAv.cargando[per] = true;
  try { const d = await API.call(`/rev/avisos?periodo=${encodeURIComponent(per)}&_=${Date.now()}`, { cache: 'no-store', timeoutMs: 12000 }); sxgAv.cache[per] = Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : []; }
  catch (_) { sxgAv.cache[per] = []; }
  sxgAv.cargando[per] = false;
  if (current === 'buzon') vSugerencias();
}
function sxgAvTitulo(a) { const t = String(a.texto || '').trim(); const l = t.split(/\n/)[0]; return l.length > 90 ? l.slice(0, 88) + '…' : (l || 'Aviso'); }
function sxgAniosDisponibles() {
  const hoy = sxgPartes().y; let min = hoy - 2;
  (avisos || []).forEach((a) => { const p = sxgPeriodoDe(a.ts); if (p) min = Math.min(min, Number(p.slice(0, 4))); });
  const out = []; for (let y = hoy; y >= min; y--) out.push(y); return out;
}
function sxgSelPeriodo(id, per, accion) {
  const [y, m] = per.split('-').map(Number);
  return `<div class="sxg-periodo" data-sxg-per="${accion}">
    <label class="sxg-sel"><span class="sr">Mes</span><select id="${id}M" data-sxg="${accion}-mes">${SXG_MESES.map((n, i) => `<option value="${i + 1}" ${i + 1 === m ? 'selected' : ''}>${sxgCap(n)}</option>`).join('')}</select></label>
    <label class="sxg-sel"><span class="sr">Año</span><select id="${id}Y" data-sxg="${accion}-anio">${sxgAniosDisponibles().map((a) => `<option value="${a}" ${a === y ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
  </div>`;
}

/* ---------------- navegación: 5 botones exactos ---------------- */
function sxgNavItems() {
  return [
    { v: 'inicio', l: 'Inicio', ic: 'home' }, { v: 'clientes', l: 'Clientes', ic: 'users' },
    { v: sxgDestinoCompras(), l: 'Compras', ic: 'cart' }, { v: 'precios', l: 'Catálogo', ic: 'box' }, { v: 'mas', l: 'Más', ic: 'more' },
  ].filter((it) => vistaGeisellPermitida(it.v));
}
// R190 · «Compras» abre la TIENDA (nueva compra con carrito). El historial queda en «Mis pedidos» (vista secundaria).
// Si el socio no puede comprar, la pestaña sigue llevando a su historial (como antes), sin inventar otra ruta.
function sxgDestinoCompras() { return vistaGeisellPermitida('compras') && !socioSinCompras() ? 'compras' : 'pedidos'; }
function sxgNavActiva() {
  if (['pedidos', 'compras'].includes(current)) return sxgDestinoCompras();
  if (current === 'metas') return 'inicio';
  if (['inicio', 'clientes', 'precios'].includes(current)) return current;
  return 'mas';
}
function sxgMobileNav() {
  const nav = document.getElementById('nav'); if (!nav) return;
  const on = sxgNavActiva();
  nav.classList.add('sxo-nav', 'sxg-nav'); nav.setAttribute('aria-label', 'Navegación principal');
  nav.innerHTML = sxgNavItems().map((it) => `<button type="button" class="nav-btn sxg-nb ${on === it.v ? 'on' : ''}" data-v="${it.v}" ${on === it.v ? 'aria-current="page"' : ''} onclick="go('${it.v}')"><span class="nav-ico">${sxgIc(it.ic)}</span><span class="nav-lbl">${it.l}</span></button>`).join('');
}
sxoNavItems = sxgNavItems;
sxoMobileNav = sxgMobileNav;
renderMobileNav = sxgMobileNav;
try {
  WEB_NAV_ITEMS.splice(0, WEB_NAV_ITEMS.length,
    { v: 'inicio', label: 'Inicio', tone: 'blue', icon: 'home' }, { v: 'clientes', label: 'Clientes', tone: 'purple', icon: 'users' },
    { v: sxgDestinoCompras(), label: 'Compras', tone: 'cyan', icon: 'cart' }, { v: 'precios', label: 'Catálogo', tone: 'orange', icon: 'catalog' },
    { v: 'renovar', label: 'Renovaciones', tone: 'green', icon: 'renew' }, { v: 'buzon', label: 'Buzón', tone: 'cyan', icon: 'mail' },
    { v: 'aula', label: 'Subli Aula', tone: 'amber', icon: 'spark' }, { v: 'recompensas', label: 'Recompensas', tone: 'red', icon: 'gift' },
    { v: 'perfil', label: 'Mi perfil', tone: 'green', icon: 'user' });
} catch (_) {}
const sxgPermBase = vistaGeisellPermitida;
vistaGeisellPermitida = function (v) { if (v === 'metas') return sxgPermBase('inicio'); return sxgPermBase(v); };

/* ---------------- cabecera: logo · campana · avatar (R190: sin ☰ ni panel vacío) ---------------- */
// R190 · Nombre del socio desde la identidad AUTENTICADA, en este orden: nombre visible del Perfil (servidor) → el que devolvió
// /rev/me o el login → el del token de sesión emitido por el servidor. Solo se usa para mostrar; los permisos no salen de aquí.
// Causas del «Hola» sin nombre: (1) el login descartaba nombreMostrar; (2) Inicio no se repintaba cuando llegaba el perfil
// (renderTop solo actualizaba el saludo viejo); (3) sin nombre, el avatar dibujaba «·» en vez de la foto o las iniciales.
const SXG_NO_NOMBRE = ['', 'socio', 'sublicuentas', 'sublichat', 'admin', 'administrador'];
let sxgMeListo = false;
function sxgTokenPerfil() {
  try { const p = String((typeof API !== 'undefined' && API.token) || '').split('.')[1]; if (!p) return {}; const b = atob(p.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(p.length / 4) * 4, '=')); return JSON.parse(decodeURIComponent(Array.from(b, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''))) || {}; } catch (_) { return {}; }
}
function sxgNombreSocio() {
  const t = sxgTokenPerfil(), g = (typeof gamificacion === 'object' && gamificacion?.perfil) || {}, r = (typeof rev === 'object' && rev) || {};
  for (const v of [g.nombreMostrar, r.nombreMostrar, t.nombreMostrar, r.nombre, t.nombre, r.usuario]) {
    let n = String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
    if (norm(n) === 'geissel') n = 'Geisell';
    if (!SXG_NO_NOMBRE.includes(norm(n))) return n.slice(0, 60);
  }
  return '';
}
function sxgPrimerNombre() { const n = sxgNombreSocio().split(' ')[0] || ''; return n ? n.charAt(0).toUpperCase() + n.slice(1) : ''; }
function sxgIniciales() { const p = sxgNombreSocio().split(' ').filter(Boolean); return p.length ? (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase() : ''; }
function sxgFotoSocio() { const a = (typeof gamificacion === 'object' && gamificacion?.perfil?.avatar) || ''; return a ? safeImageSrc(a, '') : ''; }
function sxgAvatarHtml() {
  const foto = sxgFotoSocio(), ini = sxgIniciales();
  if (foto) return `<img src="${sxAttr(foto)}" alt="" width="44" height="44">`;
  return ini ? `<span>${sxEsc(ini)}</span>` : sxgIc('user');
}
function sxgSaludoHtml() {
  const n = sxgPrimerNombre();
  if (n) return `Hola, <span id="sxgHolaNombre">${sxEsc(n)}</span>`;
  return sxgMeListo ? 'Hola' : 'Hola, <span class="sxg-esq sxg-esq-nombre" aria-hidden="true"></span>';
}
// Repinta solo saludo y avatar cuando llega el perfil (sin re-renderizar Inicio ni perder el scroll).
function sxgPintarIdentidad() {
  const h = document.getElementById('sxgHola'); if (h) { h.innerHTML = sxgSaludoHtml(); h.setAttribute('aria-busy', String(!sxgPrimerNombre() && !sxgMeListo)); }
  const av = document.getElementById('sxgAvatar');
  if (av) { av.innerHTML = sxgAvatarHtml(); av.classList.toggle('con-foto', !!sxgFotoSocio()); av.setAttribute('aria-label', `Mi perfil${sxgNombreSocio() ? ` · ${sxgNombreSocio()}` : ''}`); }
}
function sxgQuitarMenu() { // R190 · el ☰ abría un panel vacío: se quitan botón, panel y su superposición
  document.getElementById('sxoMenuBtn')?.remove(); document.getElementById('sxoMenu')?.remove();
}
try { sxoMontarCabecera = function () { document.body.classList.add('sxo'); sxgQuitarMenu(); }; } catch (_) {}
function sxgCabecera() {
  document.body.classList.add('sxg');
  sxgQuitarMenu();
  const top = document.querySelector('#app .topbar'); if (!top) return;
  const tx = top.querySelector('.tb-txt');
  if (tx && !tx.querySelector('.sxg-logo')) tx.insertAdjacentHTML('afterbegin', '<span class="sxg-logo"><img src="assets/logo-sublicuentas.webp" alt="Sublicuentas" width="160" height="31"><small>Portal de Socios</small></span>');
  const buz = top.querySelector('.partner-inbox-btn');
  if (buz && !buz.dataset.sxg) { buz.dataset.sxg = '1'; const b = buz.querySelector('.nav-badge'); buz.innerHTML = sxgIc('bell'); if (b) buz.appendChild(b); buz.setAttribute('aria-label', 'Buzón y avisos'); }
  const acts = document.getElementById('topbarActions');
  if (acts && !document.getElementById('sxgAvatar')) { const a = document.createElement('button'); a.type = 'button'; a.id = 'sxgAvatar'; a.className = 'sxg-avatar'; a.addEventListener('click', () => go('perfil')); acts.appendChild(a); }
  sxgPintarIdentidad();
}
// Cuando llegan /rev/me (renderTop) o el perfil con foto (applySocioAvatar), se actualizan saludo y avatar.
try { const sxgRenderTopBase = renderTop; renderTop = function () { const out = sxgRenderTopBase.apply(this, arguments); sxgPintarIdentidad(); return out; }; } catch (_) {}
try { const sxgAvatarBase = applySocioAvatar; applySocioAvatar = function () { const out = sxgAvatarBase.apply(this, arguments); sxgPintarIdentidad(); return out; }; } catch (_) {}
try { const sxgSesionBase = loadSocioSession; loadSocioSession = async function () { try { return await sxgSesionBase.apply(this, arguments); } finally { sxgMeListo = true; sxgPintarIdentidad(); } }; } catch (_) {}
setTimeout(() => { sxgMeListo = true; sxgPintarIdentidad(); }, 12000); // sin respuesta del servidor: no dejar el esqueleto para siempre
(function sxgPerfilAlEntrar() { // la sesión guardada pudo abrir Inicio antes de cargar este archivo: pedir perfil y foto otra vez
  if (typeof API === 'undefined' || !API.token || (typeof isAdmin !== 'undefined' && isAdmin && !impersonating)) { sxgMeListo = true; return; }
  try { loadSocioSession(); } catch (_) {}
  try { if (!gamificacion?.perfil && typeof loadGamificacion === 'function') loadGamificacion(); } catch (_) {}
})();

/* ---------------- INICIO ---------------- */
function sxgEsq(n = 1) { return Array.from({ length: n }, () => '<span class="sxg-esq" aria-hidden="true"></span>').join(''); }
function sxgTarjeta({ go: g, ic, tono, titulo, valor, listo, sub = '' }) {
  return `<button type="button" class="sxg-kpi sxg-${tono}" data-sxg-go="${sxAttr(g)}" ${listo ? '' : 'aria-busy="true"'}><span class="sxg-kpi-ic">${sxgIc(ic)}</span><span class="sxg-kpi-tx"><small>${titulo}</small>${listo ? `<b>${valor}</b>` : sxgEsq()}${sub ? `<em>${sub}</em>` : ''}</span>${sxgIc('chev', 'sxg-chev')}</button>`;
}
function sxgMetaHtml(per, compacto) {
  const meta = sxgMeta(per), v = sxgVentas(per);
  const ventas = v && v.estado === 'ok' ? v.monto : null;
  let cuerpo;
  if (!v || v.estado === 'cargando') cuerpo = `<div class="sxg-meta-fila">${sxgEsq(2)}</div>`;
  else if (v.estado !== 'ok') cuerpo = `<p class="sxg-meta-nota">${v.estado === 'sin_datos' ? 'Todavía no hay datos de ese mes en el sistema.' : 'No se pudo consultar. Toque para reintentar.'}</p>`;
  else if (meta == null) cuerpo = `<div class="sxg-meta-fila"><span>Ventas: <b>${money(ventas)}</b></span><span class="sxg-meta-off">Meta no configurada</span></div>`;
  else {
    const pct = Math.round((ventas / meta) * 100);
    cuerpo = `<div class="sxg-meta-fila"><span>Ventas: <b>${money(ventas)}</b> / ${money(meta)}</span><span class="sxg-pct ${pct >= 100 ? 'ok' : ''}">${pct}%</span></div>
      <div class="sxg-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, pct)}" aria-label="Avance de la meta"><i style="width:${Math.min(100, Math.max(0, pct))}%"></i></div>`;
  }
  return compacto ? cuerpo : cuerpo;
}
function sxgVInicio() {
  document.body.classList.remove('sx-con-barra');
  sxgCabecera();
  const restricted = socioSinCompras();
  const per = sxgPeriodoHoy();
  const cliListo = sxgCargado('clientes') || (clientes || []).length > 0;
  const cnt = sxgConteos();
  const comprasListo = restricted || sxgCargado('compras');
  const entregados = (misCompras || []).filter((x) => sxEstadoPedido(x.estado)[0] === 'ok').length;
  const ventas = sxgVentas(per);
  const faltaInfo = restricted ? [] : (misCompras || []).filter((x) => sxEstadoPedido(x.estado)[0] === 'warn');
  const avListos = sxgCargado('avisos');
  const delMes = sxgAvisosDe(per);
  const avLista = (delMes.length ? delMes : [...(avisos || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0))).slice(0, 3);
  content.innerHTML = `<div class="sx-page sxg-inicio">
    <section class="sxg-hola" aria-label="Saludo">
      <div class="sxg-hola-tx"><h1 id="sxgHola">${sxgSaludoHtml()}</h1>
        <p>${sxgIc('cal')}<span id="sxgFecha">${sxEsc(sxgFechaLarga())}</span></p>
        <p>${sxgIc('clock')}<span id="sxgReloj">${sxEsc(sxgHora())}</span></p></div>
      <img src="${ROBOT_IMG}" alt="" width="112" height="112" class="sxg-robot">
    </section>
    ${faltaInfo.length ? `<button type="button" class="sxg-alerta" data-sxg-go="pedido:${sxAttr(faltaInfo[0].id)}"><b>Pedido #${sxEsc(faltaInfo[0].ref)}: falta información</b><small>${sxEsc(faltaInfo[0].detalleEstado || 'Revise qué dato pide el equipo.')}${faltaInfo.length > 1 ? ` · y ${faltaInfo.length - 1} más` : ''}</small><span>Completar</span></button>` : ''}
    <div class="sxg-kpis">
      ${sxgTarjeta({ go: 'clientes:todos', ic: 'users', tono: 'blue', titulo: 'Clientes', valor: cnt.todos.toLocaleString('es-HN'), listo: cliListo })}
      ${sxgTarjeta({ go: 'clientes:renovaciones', ic: 'renew', tono: 'purple', titulo: 'Renovaciones', valor: cnt.renovaciones.toLocaleString('es-HN'), listo: cliListo })}
      ${restricted ? '' : sxgTarjeta({ go: 'pedidos:ok', ic: 'check', tono: 'green', titulo: 'Pedidos entregados', valor: entregados.toLocaleString('es-HN'), listo: comprasListo })}
      ${restricted ? '' : sxgTarjeta({ go: 'metas', ic: 'coins', tono: 'amber', titulo: 'Mis ventas', valor: ventas && ventas.estado === 'ok' ? money(ventas.monto) : '—', listo: !!ventas && ventas.estado !== 'cargando', sub: 'Este mes' })}
    </div>
    ${''/* R190 · «Metas del mes» ya no se muestra en Inicio (los datos de metas no se tocan). */}
    ${restricted || !vistaGeisellPermitida('buzon') ? '' : `<section class="sxg-card sxg-avisos" aria-labelledby="sxgAvT"><div class="sxg-card-head"><span class="sxg-card-ic sxg-red">${sxgIc('mega')}</span><b id="sxgAvT">Avisos del equipo</b><span class="sxg-chip-per">${delMes.length || !avListos ? sxEsc(sxgPeriodoTxt(per)) : 'Últimos'}</span></div>
      ${!avListos ? `<div class="sxg-av-esq">${sxgEsq(3)}</div>` : avLista.length ? `<ul class="sxg-av-lista">${avLista.map((a) => `<li><button type="button" data-sxg-go="aviso:${sxAttr(a.id || '')}"><i aria-hidden="true"></i><span><b>${sxEsc(sxgAvTitulo(a))}</b><small>${sxEsc(a.autor || 'Sublicuentas')} · ${sxEsc(sxgFechaCorta(a.ts))}</small></span>${sxgIc('chev', 'sxg-chev')}</button></li>`).join('')}</ul>` : '<p class="sxg-vacio">No hay avisos del equipo por ahora.</p>'}
      <button type="button" class="sxg-link" data-sxg-go="buzon:avisos">Ver todos los avisos</button></section>`}
  </div>`;
  if (!restricted && !dataFresh('compras') && typeof loadMisCompras === 'function') loadMisCompras();
}

/* ---------------- METAS (detalle; no es categoría de la barra ni de Más) ---------------- */
let sxgMetaPer = '';
function sxgVMetas() {
  document.body.classList.remove('sx-con-barra');
  const per = sxgMetaPer || sxgPeriodoHoy();
  if (!sxgVentas(per) && per !== sxgPeriodoHoy()) sxgCargarVentas(per);
  if (per === sxgPeriodoHoy() && !metricasNegocio && typeof loadMetricas === 'function') loadMetricas()?.then?.(() => { if (current === 'metas') sxgVMetas(); });
  const meta = sxgMeta(per);
  content.innerHTML = `<div class="sx-page sxg-metas-pg">
    <button type="button" class="sxg-volver" data-sxg-go="inicio">${sxgIc('back')} Inicio</button>
    <header class="sxg-titulo"><h1>Metas del mes</h1></header>
    ${sxgSelPeriodo('sxgMeta', per, 'meta')}
    <section class="sxg-card"><h2>Meta de ventas</h2>${sxgMetaHtml(per)}
      <p class="sxg-nota">Ventas = compras y renovaciones registradas a Sublicuentas en el mes (misma cifra del Centro Financiero).</p></section>
    <section class="sxg-card"><h2>Objetivos adicionales</h2>
      <p class="sxg-nota">${meta == null ? 'Sin meta asignada: <b>No configurada</b>. La meta la define Sublicuentas.' : 'Solo se muestran metas configuradas por Sublicuentas.'}</p></section>
  </div>`;
}

/* ---------------- CLIENTES: cinco filtros + lista + ficha ---------------- */
let sxgCliScroll = 0;
function sxgColorSvc(nm) {
  const n = norm(nm);
  if (/netflix/.test(n)) return 'red'; if (/disney/.test(n)) return 'blue'; if (/max|hbo/.test(n)) return 'purple';
  if (/prime/.test(n)) return 'sky'; if (/crunchy|vix/.test(n)) return 'amber'; if (/spotify|deezer/.test(n)) return 'green';
  return 'slate';
}
function sxgClientesPintar(soloLista = false) {
  if (sxoCliAbierto) { const c = (clientes || []).find((x) => String(x.id) === sxoCliAbierto); if (c) { sxgFichaPintar(c); return; } sxoCliAbierto = ''; }
  if (!SXG_FILTROS.some(([k]) => k === cliEstado)) cliEstado = cliEstado === 'novigentes' ? 'sinservicio' : 'todos';
  const f = sxNorm(cliF), dig = String(cliF || '').replace(/\D/g, '');
  const base = sxgClientesUnicos();
  const list = base.filter((c) => sxgCumple(c, cliEstado) && (!f || sxNorm(nombreCli(c)).includes(f)
    || (dig.length >= 3 && String(c.telefono || c.telefono_norm || '').replace(/\D/g, '').includes(dig))
    || (c.servicios || []).some((s) => sxNorm(sxgNombreSvc(s)).includes(f))))
    .sort((a, b) => nombreCli(a).localeCompare(nombreCli(b), 'es', { numeric: true, sensitivity: 'base' }));
  const cargando = !base.length && !sxgCargado('clientes');
  const cnt = sxgConteos();
  const listaHtml = cargando ? `<ul class="sxg-lista">${Array.from({ length: 4 }, () => `<li class="sxg-cli sxg-cli-esq">${sxgEsq(3)}</li>`).join('')}</ul>`
    : list.length ? `<p class="sxg-cuenta" role="status">${list.length.toLocaleString('es-HN')} cliente${list.length === 1 ? '' : 's'}${cliEstado === 'todos' && !f ? ' en la cartera' : ''}</p><ul class="sxg-lista">${list.map((c) => {
      const svcs = c.servicios || [], n = svcs.length, [cls, txt] = sxgEstadoCli(c), prox = sxgProxima(c);
      const nombres = svcs.map(sxgNombreSvc); const resumen = nombres.length > 2 ? `${nombres[0]} + ${nombres.length - 1} más` : nombres.join(' + ');
      const total = svcs.reduce((t, s) => t + (Number(pick(s, CONFIG.campos.precio)) || 0), 0);
      return `<li><button type="button" class="sxg-cli" data-cli="abrir" data-id="${sxAttr(c.id)}"><span class="sxg-ini sxg-${sxgColorSvc(nombres[0] || '')}" aria-hidden="true">${sxEsc((nombreCli(c)[0] || '?').toUpperCase())}</span>
        <span class="sxg-cli-tx"><b>${sxEsc(nombreCli(c))}</b><small>${n} servicio${n === 1 ? '' : 's'}${resumen ? ` · ${sxEsc(resumen)}` : ''}</small>
        <small>${prox ? `${prox.t}: ${sxEsc(fmtFecha(prox.f))}` : 'Sin fecha de vencimiento'}${total ? ` · ${money(total)}${n > 1 ? ' total' : ''}` : ''}</small></span>
        <span class="sxg-pill ${cls}">${txt}</span></button></li>`;
    }).join('')}</ul>` : '<div class="sxg-card sxg-vacio-card"><b>Sin resultados</b><p>Pruebe otro nombre, teléfono, servicio o filtro.</p></div>';
  const chipsHtml = SXG_FILTROS.map(([k, l]) => `<button type="button" class="sxg-chip ${cliEstado === k ? 'on' : ''}" aria-pressed="${cliEstado === k}" data-cli="filtro" data-v="${k}">${l}${cargando ? '' : ` <span>${cnt[k]}</span>`}</button>`).join('');
  if (soloLista && document.getElementById('sxCliLista')) { document.getElementById('sxCliLista').innerHTML = listaHtml; const ch = content.querySelector('.sxg-chips'); if (ch) ch.innerHTML = chipsHtml; return; }
  content.innerHTML = `<div class="sx-page sxg-clientes">
    <header class="sxg-titulo"><h1>Clientes</h1></header>
    <div class="sxg-chips" role="group" aria-label="Filtrar clientes">${chipsHtml}</div>
    <label class="sxg-buscar">${sxgIc('search')}<span class="sr">Buscar cliente</span><input id="cliSearch" type="search" value="${sxAttr(cliF || '')}" placeholder="Buscar cliente, teléfono o servicio" autocomplete="off"></label>
    <div id="sxCliLista">${listaHtml}</div>
    ${cargando ? '' : (() => { const fs = flat(), suma = (a) => a.reduce((t, x) => t + (x.precio || 0), 0); const vig = fs.filter((x) => esVigente(x.est)), sem = fs.filter((x) => x.est.n >= 0 && x.est.n <= sxgVentanaRenovacion()), ven = fs.filter((x) => x.est.n < 0);
      return `<details class="sxg-card sxg-resumen"><summary>${socioGeisell() ? 'Resumen de renovaciones' : 'Resumen de cobros'}</summary><dl>
        <div><dt>Cartera vigente</dt><dd>${money(suma(vig))}<small>${vig.length} servicio(s)</small></dd></div>
        <div><dt>Por renovar (${sxgVentanaRenovacion()} días)</dt><dd>${money(suma(sem))}<small>${sem.length} servicio(s)</small></dd></div>
        <div><dt>Vencido por recuperar</dt><dd>${money(suma(ven))}<small>${ven.length} servicio(s)</small></dd></div></dl></details>`; })()}
  </div>`;
  content.querySelector('#cliSearch')?.addEventListener('input', (ev) => { cliF = ev.target.value; sxgClientesPintar(true); });
}
function sxgFichaPintar(c) {
  const svcs = Array.isArray(c.servicios) ? c.servicios : [], tel = c.telefono || c.telefono_norm || '';
  const nombre = nombreCli(c), corto = sxEsc(String(nombre).split(/\s+/)[0] || 'este cliente');
  const peds = socioSinCompras() ? [] : sxPedidosDeCliente(c);
  const puedeRenovar = vistaGeisellPermitida('renovar');
  content.innerHTML = `<div class="sx-page sxg-ficha sxo-ficha">
    <button type="button" class="sxg-volver" data-cli="volver">${sxgIc('back')} Clientes</button>
    <header class="sxg-titulo"><h1>Ficha del cliente</h1></header>
    <section class="sxg-card sxg-ficha-top"><span class="sxg-ini lg sxg-blue" aria-hidden="true">${sxEsc((nombre[0] || '?').toUpperCase())}</span><div><h2 id="sxoFichaT" tabindex="-1">${sxEsc(nombre)}</h2><p>${svcs.length} servicio${svcs.length === 1 ? '' : 's'} · ${sxEsc(tel || 'sin teléfono registrado')}</p></div></section>
    <h2 class="sxg-sec">Servicios y renovaciones</h2>
    ${svcs.length ? `<ul class="sxg-svcs">${svcs.map((s, ix) => {
      const nm = sxgNombreSvc(s), f = parseFecha(pick(s, CONFIG.campos.vencimiento)), e = estado(f);
      const orig = Number(s?.servicioIndexOriginal ?? s?._servicioIndexOriginal ?? ix);
      const precio = Number(pick(s, CONFIG.campos.precio)) || 0;
      const [cls, txt] = e.n < 0 ? ['warn', 'Vencido'] : e.n <= sxgVentanaRenovacion() ? ['info', 'Por renovar'] : e.n < 9999 ? ['ok', 'Vigente'] : ['off', 'Sin fecha'];
      return `<li class="sxg-card sxg-svc sxo-svc"><div class="sxg-svc-top"><span class="sxg-ini sxg-${sxgColorSvc(nm)}" aria-hidden="true">${sxEsc((nm[0] || '?').toUpperCase())}</span>
        <span class="sxg-svc-tx"><b>${sxEsc(nm)}</b><small>${f ? `${e.n < 0 ? 'Venció' : 'Renueva'}: ${sxEsc(fmtFecha(f))}` : 'Sin fecha de vencimiento'}</small><span class="sxg-pill ${cls}">${txt}</span></span>
        <b class="sxg-precio">${precio ? money(precio) : ''}</b></div>
        ${puedeRenovar ? `<button type="button" class="sxg-btn pri" data-cli="renovar" data-id="${sxAttr(c.id)}" data-nm="${sxAttr(nm)}" data-ix="${Number.isInteger(orig) ? orig : ix}">Renovar este servicio</button>` : ''}</li>`;
    }).join('')}</ul>` : '<div class="sxg-card"><p class="sxg-nota">Este cliente no tiene servicios registrados.</p></div>'}
    <div class="sxg-dos"><button type="button" class="sxg-btn sec" data-cli="cobro" data-id="${sxAttr(c.id)}">${sxEsc(etiquetaMensajeRenovacion())}</button>${waUrl(tel) ? `<a class="sxg-btn sec wa" href="${sxAttr(waUrl(tel))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : '<button type="button" class="sxg-btn sec" disabled>Sin WhatsApp</button>'}</div>
    ${socioSinCompras() ? '' : `<button type="button" class="sxg-btn sec full" data-cli="comprar" data-id="${sxAttr(c.id)}">${sxgIc('plus')} Nueva compra para ${corto}</button>
    <section class="sxo-peds"><h2 class="sxg-sec">Pedidos de ${corto}</h2>${peds.length ? `<ul class="sxg-lista">${peds.slice(0, 5).map((o) => { const [cls, label] = sxEstadoPedido(o.estado); return `<li><button type="button" class="sxg-ped" data-cli="pedido" data-id="${sxAttr(o.id)}"><span class="sxg-cli-tx"><b>#${sxEsc(o.ref || String(o.id).slice(-6).toUpperCase())} · ${sxEsc((o.productos || []).map((p) => p.servicioBase || p.servicio).join(' + ') || o.servicio || '')}</b><small>${sxEsc(sxgFechaCorta(sxgTs(o.createdAt)))}</small></span><span class="sxg-pill ${cls}">${sxEsc(label)}</span></button></li>`; }).join('')}</ul>` : `<p class="sxg-nota">${dataFresh('compras') ? 'Sin pedidos registrados para este cliente.' : 'Consultando pedidos…'}</p>`}</section>`}
  </div>`;
}
sxoClientesPintar = sxgClientesPintar;
sxoFichaPintar = sxgFichaPintar;
// Guardar y devolver el desplazamiento al entrar y salir de la ficha (filtro y búsqueda ya se conservan).
content.addEventListener('click', (ev) => {
  if (current !== 'clientes') return;
  const b = ev.target.closest('[data-cli]'); if (!b) return;
  if (b.dataset.cli === 'abrir') sxgCliScroll = window.scrollY;
  if (b.dataset.cli === 'volver') { const y = sxgCliScroll; setTimeout(() => window.scrollTo(0, y), 0); }
}, true);

/* ---------------- COMPRAS: historial con pestañas Todos / Entregados ---------------- */
const sxgPedBase = vPedidos;
function sxgVPedidos() {
  if (socioSinCompras()) { go('renovar'); return; }
  if (sxPedTab === 'entregas' || sxPedidoAbierto) {
    sxgPedBase();
    content.querySelectorAll('[data-act="volver"]').forEach((b) => { if (/Pedidos/.test(b.textContent)) b.textContent = '← Compras'; });
    content.querySelector('.sx-page-head h1')?.textContent === 'Pedidos y entregas' && (content.querySelector('.sx-page-head h1').textContent = 'Datos de entregas');
    return;
  }
  document.body.classList.remove('sx-con-barra');
  if (!['todos', 'ok'].includes(sxPedFiltro)) sxPedFiltro = 'todos';
  const q = sxNorm(sxPedBuscar);
  const todos = (misCompras || []).slice().sort((a, b) => sxgTs(b.createdAt) - sxgTs(a.createdAt));
  const lista = todos.filter((x) => (sxPedFiltro === 'todos' || sxEstadoPedido(x.estado)[0] === 'ok')
    && (!q || sxNorm([x.ref, x.id, x.servicio, sxPedidoCliente(x), ...(x.productos || []).map((p) => `${p.servicio} ${p.clienteNombre}`)].join(' ')).includes(q)));
  const nOk = todos.filter((x) => sxEstadoPedido(x.estado)[0] === 'ok').length;
  const cargando = !sxgCargado('compras') && !todos.length;
  const icono = (cls) => cls === 'ok' ? 'check' : cls === 'off' ? 'back' : 'cart';
  content.innerHTML = `<div class="sx-page sxg-compras">
    <header class="sxg-titulo sxg-titulo-acc"><div><h1>Mis pedidos</h1><p>Historial de pedidos del socio</p></div>${sxgDestinoCompras() === 'compras' ? `<button type="button" class="sxg-btn sm" data-act="nueva">← Compras</button>` : ''}</header>
    <div class="sxg-tabs" role="tablist" aria-label="Historial"><button type="button" role="tab" class="sxg-tab ${sxPedFiltro === 'todos' ? 'on' : ''}" aria-selected="${sxPedFiltro === 'todos'}" data-act="filtro" data-v="todos">Todos${cargando ? '' : ` <span>${todos.length}</span>`}</button><button type="button" role="tab" class="sxg-tab ${sxPedFiltro === 'ok' ? 'on' : ''}" aria-selected="${sxPedFiltro === 'ok'}" data-act="filtro" data-v="ok">Entregados${cargando ? '' : ` <span>${nOk}</span>`}</button></div>
    <label class="sxg-buscar">${sxgIc('search')}<span class="sr">Buscar pedido</span><input id="sxPedBuscar" type="search" value="${sxAttr(sxPedBuscar)}" placeholder="Buscar número de pedido, cliente o servicio" autocomplete="off"></label>
    ${cargando ? `<ul class="sxg-lista">${Array.from({ length: 3 }, () => `<li class="sxg-cli sxg-cli-esq">${sxgEsq(3)}</li>`).join('')}</ul>`
      : lista.length ? `<ul class="sxg-lista sx-orders">${lista.map((x) => { const [cls, label] = sxEstadoEntrega(x) || sxEstadoPedido(x.estado); const svc = (x.productos || []).map((p) => p.servicioBase || p.servicio).filter(Boolean).join(' + ') || x.servicio || 'Compra'; return `<li><button type="button" class="sxg-ped sx-order" data-act="abrir" data-id="${sxAttr(x.id)}"><span class="sxg-ped-ic ${cls}">${sxgIc(icono(cls))}</span><span class="sxg-cli-tx"><b>Pedido #${sxEsc(x.ref || String(x.id).slice(-6).toUpperCase())} · ${sxEsc(svc)}</b><small>Cliente: ${sxEsc(sxPedidoCliente(x) || '—')}</small><small>${sxEsc(sxgFechaCorta(sxgTs(x.createdAt)))} · ${money(x.totalCombo || x.monto)}</small></span><span class="sxg-pill ${cls}">${sxEsc(label)}</span></button></li>`; }).join('')}</ul>`
      : `<div class="sxg-card sxg-vacio-card"><b>${q ? 'Sin resultados' : sxPedFiltro === 'ok' ? 'Todavía no hay pedidos entregados' : 'Todavía no hay pedidos'}</b><p>${q ? 'Pruebe con otro número, cliente o servicio.' : 'Aquí aparecerán sus compras con su estado real.'}</p></div>`}
    ${todos.length >= 100 ? '<p class="sxg-nota">Se muestran los pedidos más recientes que entrega el servidor.</p>' : ''}
    <button type="button" class="sxg-link" data-act="pedtab" data-v="entregas">Ver datos de entregas (cuentas, PIN y accesos) →</button>
  </div>`;
  sxBindPedidos();
}
vPedidos = sxgVPedidos;
sxPedTabsHtml = function () { return sxPedTab === 'entregas' ? '<button type="button" class="sx-link" data-act="pedtab" data-v="pedidos">← Compras</button>' : ''; };
// Historial: pedir el máximo que acepta el servidor (antes 60). Misma ruta y mismos permisos.
loadMisCompras = (function (base) {
  return async function () {
    if (optionalUnavailable.has('compras')) return misCompras;
    return runSocioRequest('compras', async (epoch) => {
      try {
        const data = await API.call('/rev/compras/mias?limit=500&_=' + Date.now(), { cache: 'no-store', timeoutMs: 15000 });
        if (epoch !== socioEpoch) return misCompras;
        misCompras = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []; writeSocioCache('compras', misCompras);
      } catch (e) { if (e?.status === 404) optionalUnavailable.add('compras'); else { syncAt.compras = syncAt.compras || 1; } }
      if (current === 'compras' && typeof renderCompraForm === 'function') renderCompraForm(); else if (current === 'pedidos') vPedidos(); else if (current === 'inicio') vInicio(); else if (current === 'clientes' && sxoCliAbierto) sxgClientesPintar();
      return misCompras;
    });
  };
})(loadMisCompras);

/* ---------------- BUZÓN: mismas dos pestañas + avisos por mes y año ---------------- */
const sxgBuzonBase = vSugerencias;
vSugerencias = function () {
  sxgBuzonBase.apply(this, arguments);
  if (current !== 'buzon' || typeof sxBz !== 'object' || sxBz.tab !== 'avisos') return;
  const per = sxgAv.per || sxgPeriodoHoy(); sxgAv.per = per;
  sxgCargarAvisos(per);
  const lista = sxgAvisosDe(per), cargando = !!sxgAv.cargando[per] && !lista.length;
  const card = [...content.querySelectorAll('.sx-page > section.sx-card')].find((s) => /Avisos del equipo/.test(s.textContent));
  const html = `<section class="sxg-card sxg-av-pg" aria-labelledby="sxgAvPgT"><div class="sxg-card-head"><b id="sxgAvPgT">Avisos del equipo</b><button type="button" class="sxg-link sm" data-bz="avisos-recargar">Actualizar</button></div>
    ${sxgSelPeriodo('sxgAvPer', per, 'av')}
    ${cargando ? `<div class="sxg-av-esq">${sxgEsq(3)}</div>` : lista.length ? `<ul class="sxg-av-full">${lista.map((a) => { const id = String(a.id || a.ts); const ab = sxgAv.abierto === id; return `<li class="${ab ? 'ab' : ''}"><button type="button" data-sxg="av-abrir" data-id="${sxAttr(id)}" aria-expanded="${ab}"><i aria-hidden="true"></i><span><b>${sxEsc(sxgAvTitulo(a))}</b><small>${sxEsc(a.autor || 'Sublicuentas')} · ${sxEsc(sxgFechaCorta(a.ts))}</small></span>${sxgIc('chev', 'sxg-chev')}</button>${ab ? `<p class="sxg-av-texto">${sxEsc(a.texto || '')}</p>` : ''}</li>`; }).join('')}</ul>` : '<p class="sxg-vacio">No hay avisos para este periodo.</p>'}
    <p class="sxg-nota">Los avisos se muestran como los publicó el equipo; no se borran ni se reescriben.</p></section>`;
  if (card) card.outerHTML = html; else content.querySelector('.sx-page')?.insertAdjacentHTML('beforeend', html);
};

/* ---------------- MÁS: las seis categorías originales + Salir ---------------- */
const SXG_MAS = [
  { v: 'renovar', t: 'Renovaciones', d: 'Cobros y próximos vencimientos', ic: 'renew', tone: 'green' },
  { v: 'precios', t: 'Catálogo', d: 'Precios y condiciones', ic: 'box', tone: 'orange' },
  { v: 'buzon', t: 'Buzón', d: 'Consultas, respuestas y avisos', ic: 'mail', tone: 'sky' },
  { v: 'aula', t: 'Subli Aula', d: 'Formación y herramientas', ic: 'spark', tone: 'amber' },
  { v: 'recompensas', t: 'Recompensas', d: 'Progreso y beneficios', ic: 'gift', tone: 'red' },
  { v: 'perfil', t: 'Mi perfil', d: 'Telegram y configuración', ic: 'user', tone: 'purple' },
];
function sxgVMas() {
  document.body.classList.remove('sx-con-barra');
  const items = SXG_MAS.filter((x) => vistaGeisellPermitida(x.v));
  content.innerHTML = `<div class="sx-page sxg-mas sxo-mas"><header class="sxg-titulo"><h1>Más opciones</h1></header>
    <ul class="sxg-mas-lista">${items.map((x) => `<li><button type="button" class="sxg-mas-item" data-go="${x.v}"><span class="sxg-mas-ic sxg-${x.tone}">${sxgIc(x.ic)}</span><span class="sxg-cli-tx"><b>${x.t}</b><small>${x.d}</small></span>${sxgIc('chev', 'sxg-chev')}</button></li>`).join('')}</ul>
    <div class="sxg-mas-acc"><button type="button" class="sxg-link sm" data-m="sync">↻ Actualizar datos</button>${document.getElementById('installAppBtn') && !document.getElementById('installAppBtn').classList.contains('hide') ? '<button type="button" class="sxg-link sm" data-m="instalar">📲 Instalar aplicación</button>' : ''}</div>
    <button type="button" class="sxg-salir" data-m="salir">Salir de mi cuenta</button>
  </div>`;
  content.querySelector('[data-m="sync"]')?.addEventListener('click', () => refreshCurrentData(true)); // R190 · lo que tenía el menú ☰
  content.querySelector('[data-m="instalar"]')?.addEventListener('click', () => { if (typeof installPwa === 'function') installPwa(); });
  content.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  content.querySelector('[data-m="salir"]')?.addEventListener('click', () => logout());
}
sxoVMas = sxgVMas;

/* ---------------- enlaces de Inicio y selectores de periodo ---------------- */
function sxgIr(g) {
  if (g.startsWith('clientes:')) { cliEstado = g.slice(9); cliF = ''; sxoCliAbierto = ''; go('clientes'); return; }
  if (g.startsWith('pedidos:')) { sxPedTab = 'pedidos'; sxPedidoAbierto = ''; sxPedFiltro = g.slice(8); sxPedBuscar = ''; go('pedidos'); return; }
  if (g.startsWith('pedido:')) { sxPedTab = 'pedidos'; sxPedidoAbierto = g.slice(7); go('pedidos'); return; }
  if (g.startsWith('aviso:')) { sxBz.tab = 'avisos'; sxBz.abierto = ''; sxgAv.abierto = g.slice(6); const a = (avisos || []).find((x) => String(x.id || x.ts) === sxgAv.abierto); sxgAv.per = a ? sxgPeriodoDe(a.ts) : sxgPeriodoHoy(); go('buzon'); return; }
  if (g === 'buzon:avisos') { sxBz.tab = 'avisos'; sxBz.abierto = ''; sxgAv.per = sxgPeriodoHoy(); go('buzon'); return; }
  if (g === 'metas') { sxgMetaPer = sxgPeriodoHoy(); go('metas'); return; }
  go(g);
}
content.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-sxg-go]');
  if (b) { const g = b.dataset.sxgGo; if (g === 'metas' && current === 'inicio') { const per = sxgPeriodoHoy(); const v = sxgVentas(per); if (v && v.estado === 'error') { delete sxgVentasPer[per]; } } sxgIr(g); return; }
  const a = ev.target.closest('[data-sxg="av-abrir"]');
  if (a) { sxgAv.abierto = sxgAv.abierto === a.dataset.id ? '' : a.dataset.id; vSugerencias(); return; }
});
content.addEventListener('change', (ev) => {
  const s = ev.target.closest('select[data-sxg]'); if (!s) return;
  const box = s.closest('[data-sxg-per]'), m = box.querySelector('select[data-sxg$="-mes"]').value, y = box.querySelector('select[data-sxg$="-anio"]').value;
  const per = `${y}-${String(m).padStart(2, '0')}`;
  if (box.dataset.sxgPer === 'av') { sxgAv.per = per; sxgAv.abierto = ''; vSugerencias(); }
  if (box.dataset.sxgPer === 'meta') { sxgMetaPer = per; sxgVMetas(); }
});

/* ---------------- R190 · COMPRAS = tienda/carrito; «Mis pedidos» secundario ---------------- */
try {
  const sxgRenderCompraBase = sxRender;
  sxRender = function () {
    const out = sxgRenderCompraBase.apply(this, arguments);
    if (current !== 'compras' || sxConfirmacion) return out;
    const head = content.querySelector('#sxCompra .sx-page-head');
    if (head && !head.querySelector('.sxg-mis-pedidos')) {
      const h1 = head.querySelector('h1'); if (h1 && SX.paso === 1) { h1.textContent = 'Compras'; if (!head.querySelector('.sx-help')) h1.insertAdjacentHTML('afterend', '<p class="sx-help">Seleccione aplicaciones y planes</p>'); }
      head.classList.add('sxg-titulo-acc');
      head.insertAdjacentHTML('beforeend', '<button type="button" class="sxg-link sm sxg-mis-pedidos" data-sxg-go="pedidos:todos">Mis pedidos ›</button>');
    }
    return out;
  };
} catch (_) {}

/* ---------------- enlazar vistas y router ---------------- */
vInicio = sxgVInicio;
sxoVInicio = sxgVInicio; // socios-orden.js se llama a sí misma por nombre al llegar los pedidos
const sxgGoBase = go;
go = function (v) {
  if (v === 'metas') {
    if (!vistaGeisellPermitida('metas')) { sxgGoBase('inicio'); return; }
    try { sxoCerrarMenu(); } catch (_) {}
    current = 'metas'; window.scrollTo(0, 0); sxgVMetas(); renderUnifiedSidebar();
    try { updateSyncStatus(); actualizarBadgeBuzon(); } catch (_) {}
    return;
  }
  if (v === 'pedidos' && !vistaGeisellPermitida('pedidos')) v = socioSinCompras() ? 'clientes' : 'inicio';
  sxgGoBase(v);
  sxgCabecera();
  renderUnifiedSidebar();
};
setInterval(() => { const r = document.getElementById('sxgReloj'), f = document.getElementById('sxgFecha'); if (r) r.textContent = sxgHora(); if (f) f.textContent = sxgFechaLarga(); }, 20000);

const sxgSidebarBase = renderUnifiedSidebar;
renderUnifiedSidebar = function () {
  try { const it = WEB_NAV_ITEMS.find((x) => x.label === 'Compras'); if (it) it.v = sxgDestinoCompras(); } catch (_) {} // R190 · tienda, no historial
  const r = sxgSidebarBase.apply(this, arguments);
  if (webDesktopMode()) { const ped = document.querySelector(`#nav [data-v="${sxgDestinoCompras()}"] .nav-ico`); if (ped) ped.innerHTML = sxgIc('cart'); document.querySelectorAll('#nav .nav-btn').forEach((b) => b.classList.toggle('on', b.dataset.v === sxgNavActiva() || b.dataset.v === current)); }
  return r;
};
sxgCabecera();
renderUnifiedSidebar();
// Si la sesión guardada ya pidió los pedidos con el límite anterior (60), se vuelve a pedir una vez con el nuevo.
(function sxgHistorialCompleto() {
  if (typeof API === 'undefined' || !API.token || socioSinCompras()) return;
  const enCurso = dataRequests?.compras?.promise;
  Promise.resolve(enCurso).finally(() => { if (Number(syncAt.compras || 0) > 0 || enCurso) { syncAt.compras = 0; loadMisCompras(); } });
})();
(function sxgRepintar() {
  if (document.getElementById('app')?.classList.contains('hide') || typeof current === 'undefined') return;
  try { go(current || 'inicio'); } catch (_) {}
})();
