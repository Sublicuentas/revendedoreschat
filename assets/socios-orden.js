'use strict';
/* ========================================================================
   SUBLICUENTAS · PANEL DE SOCIOS · ORDEN VISUAL (guía 30/10/2026)
   Cinco accesos estables (Inicio, Clientes, Compras, Pedidos, Más), cabecera compacta,
   pantallas ordenadas. Misma lógica en celular y computadora: solo cambia la presentación.
   No toca cálculos, rutas de la API ni reglas: reutiliza las funciones existentes.
   Se carga después de socios-2026.js y socios-entregas.js.
   ======================================================================== */

const SXO_ICON = {
  box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>',
};
function sxoIcon(name) { return SXO_ICON[name] || (typeof webIcon === 'function' ? webIcon(name) : ''); }

/* Destinos de "Más" (en computadora aparecen directo en el menú lateral) */
const SXO_MAS = [
  { v: 'renovar', t: 'Renovaciones', d: 'Cobros y próximos vencimientos', ic: 'renew', tone: 'green' },
  { v: 'precios', t: 'Catálogo', d: 'Precios y condiciones', ic: 'catalog', tone: 'orange' },
  { v: 'buzon', t: 'Buzón', d: 'Consultas, respuestas y avisos', ic: 'mail', tone: 'cyan' },
  { v: 'aula', t: 'Subli Aula', d: 'Formación y herramientas', ic: 'spark', tone: 'amber' },
  { v: 'recompensas', t: 'Recompensas', d: 'Progreso y beneficios', ic: 'gift', tone: 'red' },
  { v: 'perfil', t: 'Mi perfil', d: 'Telegram y configuración', ic: 'user', tone: 'purple' },
];

/* Permisos: "Más" siempre; "Pedidos" igual que Compras. */
const sxoPermBase = vistaGeisellPermitida;
vistaGeisellPermitida = function (v) {
  if (v === 'mas') return true;
  if (v === 'pedidos') return sxoPermBase('compras');
  return sxoPermBase(v);
};

/* ---------------- Navegación ---------------- */
function sxoNavItems() {
  const items = socioSinCompras()
    ? [{ v: 'clientes', l: 'Clientes', ic: 'users', tone: 'purple' }, { v: 'renovar', l: 'Renovar', ic: 'renew', tone: 'green' }, { v: 'precios', l: 'Catálogo', ic: 'catalog', tone: 'orange' }, { v: 'mas', l: 'Más', ic: 'more', tone: 'teal' }]
    : [{ v: 'inicio', l: 'Inicio', ic: 'home', tone: 'cyan' }, { v: 'clientes', l: 'Clientes', ic: 'users', tone: 'purple' }, { v: 'compras', l: 'Compras', ic: 'cart', tone: 'pink' }, { v: 'pedidos', l: 'Pedidos', ic: 'box', tone: 'amber' }, { v: 'mas', l: 'Más', ic: 'more', tone: 'teal' }];
  return items.filter((it) => vistaGeisellPermitida(it.v));
}
function sxoMobileNav() {
  const nav = document.getElementById('nav'); if (!nav) return;
  const items = sxoNavItems();
  const enBarra = items.some((x) => x.v === current);
  nav.classList.add('sxo-nav');
  nav.innerHTML = items.map((it) => {
    const on = current === it.v || (it.v === 'mas' && !enBarra);
    return `<button type="button" class="nav-btn sxo-nb sxo-${it.tone} ${on ? 'on' : ''}" data-v="${it.v}" ${on ? 'aria-current="page"' : ''} onclick="go('${it.v}')"><span class="nav-ico">${sxoIcon(it.ic)}</span><span class="nav-lbl">${it.l}</span></button>`;
  }).join('');
  try { applyNavPermissions(); } catch (_) {}
}
renderMobileNav = sxoMobileNav;
// Computadora: el menú lateral de siempre con los mismos destinos y en el orden de la guía.
try {
  WEB_NAV_ITEMS.splice(0, WEB_NAV_ITEMS.length,
    { v: 'inicio', label: 'Inicio', tone: 'blue', icon: 'home' }, { v: 'clientes', label: 'Clientes', tone: 'purple', icon: 'users' },
    { v: 'compras', label: 'Compras', tone: 'cyan', icon: 'cart' }, { v: 'pedidos', label: 'Pedidos', tone: 'orange', icon: 'box' },
    { v: 'renovar', label: 'Renovaciones', tone: 'green', icon: 'renew' }, { v: 'precios', label: 'Catálogo', tone: 'orange', icon: 'catalog' },
    { v: 'buzon', label: 'Buzón', tone: 'cyan', icon: 'mail' }, { v: 'aula', label: 'Subli Aula', tone: 'amber', icon: 'spark' },
    { v: 'recompensas', label: 'Recompensas', tone: 'red', icon: 'gift' }, { v: 'perfil', label: 'Mi perfil', tone: 'green', icon: 'user' });
} catch (_) {}
const sxoSidebarBase = renderUnifiedSidebar;
renderUnifiedSidebar = function () {
  if (!webDesktopMode()) { sxoMobileNav(); try { actualizarBadgeBuzon(); } catch (_) {} return; }
  document.getElementById('nav')?.classList.remove('sxo-nav');
  sxoSidebarBase();
  const ped = document.querySelector('#nav [data-v="pedidos"] .nav-ico'); if (ped) ped.innerHTML = SXO_ICON.box;
  if (current === 'mas') document.querySelectorAll('#nav .nav-btn').forEach((b) => b.classList.remove('on'));
};
openPartnerQuick = function () { go('mas'); };

/* ---------------- Cabecera compacta: marca + Buzón + menú "⋯" ---------------- */
function sxoMontarCabecera() {
  document.body.classList.add('sxo');
  const host = document.getElementById('topbarActions'); if (!host || document.getElementById('sxoMenuBtn')) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'sxoMenuBtn'; btn.className = 'icon-btn sxo-menu-btn';
  btn.setAttribute('aria-label', 'Opciones de la cuenta'); btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span aria-hidden="true">⋯</span><span class="nav-badge" id="sxoMenuDot"></span>';
  host.appendChild(btn);
  const menu = document.createElement('div');
  menu.id = 'sxoMenu'; menu.className = 'sxo-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
  document.body.appendChild(menu);
  btn.addEventListener('click', (ev) => { ev.stopPropagation(); menu.hidden ? sxoAbrirMenu() : sxoCerrarMenu(); });
  document.addEventListener('click', (ev) => { if (!menu.hidden && !menu.contains(ev.target)) sxoCerrarMenu(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !menu.hidden) { sxoCerrarMenu(); btn.focus(); } });
  menu.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]'); if (!b) return;
    sxoCerrarMenu();
    const m = b.dataset.m;
    if (m === 'sync') refreshCurrentData(true);
    if (m === 'novedades' && typeof sxAbrirNovedades === 'function') sxAbrirNovedades();
    if (m === 'instalar' && typeof installPwa === 'function') installPwa();
    if (m === 'salir') logout();
  });
}
function sxoNovTotal() { return typeof sxNovedades === 'object' && sxNovedades ? Number(sxNovedades.total || 0) : 0; }
function sxoAbrirMenu() {
  const menu = document.getElementById('sxoMenu'), btn = document.getElementById('sxoMenuBtn'); if (!menu || !btn) return;
  const n = sxoNovTotal();
  const instalar = !document.getElementById('installAppBtn')?.classList.contains('hide');
  const sync = document.getElementById('syncStatus')?.textContent || '';
  menu.innerHTML = `<p class="sxo-menu-sync">${sxEsc(sync)}</p>
    <button type="button" role="menuitem" data-m="sync">↻ Actualizar datos</button>
    <button type="button" role="menuitem" data-m="novedades">🔔 Novedades${n ? ` <span class="sx-dot">${n}</span>` : ''}</button>
    ${instalar ? '<button type="button" role="menuitem" data-m="instalar">📲 Instalar aplicación</button>' : ''}
    <button type="button" role="menuitem" data-m="salir" class="sxo-menu-salir">Salir de mi cuenta</button>`;
  const r = btn.getBoundingClientRect();
  menu.style.top = `${Math.round(r.bottom + window.scrollY + 6)}px`;
  menu.style.right = `${Math.max(12, Math.round(document.documentElement.clientWidth - r.right))}px`;
  menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
  menu.querySelector('button')?.focus();
}
function sxoCerrarMenu() { const m = document.getElementById('sxoMenu'); if (m) m.hidden = true; document.getElementById('sxoMenuBtn')?.setAttribute('aria-expanded', 'false'); }
function sxoPintarMenuDot() {
  const d = document.getElementById('sxoMenuDot'); if (!d) return;
  const n = sxoNovTotal(); d.textContent = n > 9 ? '9+' : String(n || ''); d.style.display = n ? 'flex' : 'none';
}
if (typeof sxPintarCampana === 'function') {
  const sxoCampanaBase = sxPintarCampana;
  sxPintarCampana = function () { const r = sxoCampanaBase.apply(this, arguments); sxoPintarMenuDot(); return r; };
}

/* ---------------- Utilidades de pantalla ---------------- */
function sxoFila(cls, titulo, detalle, accion, etiqueta = 'Abrir') {
  return `<li><button type="button" class="sxo-item ${cls}" data-go="${sxAttr(accion)}"><span class="sxo-item-tx"><b>${titulo}</b><small>${detalle}</small></span><span class="sxo-item-go">${etiqueta}</span></button></li>`;
}
function sxoIr(g) {
  if (g.startsWith('pedido:')) { sxPedTab = 'pedidos'; sxPedidoAbierto = g.slice(7); go('pedidos'); return; }
  if (g === 'entregas') { sxPedTab = 'entregas'; sxPedidoAbierto = ''; go('pedidos'); return; }
  if (g === 'pedidos') { sxPedTab = 'pedidos'; sxPedidoAbierto = ''; go('pedidos'); return; }
  if (g.startsWith('renovar:')) { renF = g.slice(8); go('renovar'); return; }
  if (g === 'buzon:consultas' && typeof sxBz === 'object') { sxBz.tab = 'consultas'; sxBz.abierto = ''; go('buzon'); return; }
  go(g);
}
function sxoCargando(t = 'Cargando…') { return `<div class="sx-card sxo-estado" role="status"><p class="sx-help">${t}</p></div>`; }

/* ---------------- INICIO: tareas primero ---------------- */
function sxoVInicio() {
  document.body.classList.remove('sx-con-barra');
  const restricted = socioSinCompras();
  const fs = flat(), hoy = fs.filter((s) => s.est.n === 0), vencidos = fs.filter((s) => s.est.n < 0), semana = fs.filter((s) => s.est.n > 0 && s.est.n <= 7), vigentes = fs.filter((s) => esVigente(s.est));
  const suma = (a) => a.reduce((t, s) => t + (s.precio || 0), 0);
  const pedidos = restricted ? [] : (misCompras || []);
  const faltaInfo = pedidos.filter((x) => sxEstadoPedido(x.estado)[0] === 'warn');
  const enCurso = pedidos.filter((x) => ['info', 'work'].includes(sxEstadoPedido(x.estado)[0]));
  const nov = typeof sxNovedades === 'object' && sxNovedades ? sxNovedades : { entregas: [], consultas: [] };
  const borrador = !restricted && sxTieneBorrador();
  const cliVig = clientes.filter(clienteTieneVigente).length;
  const tareas = [
    ...faltaInfo.slice(0, 3).map((x) => sxoFila('warn', `Pedido #${sxEsc(x.ref)}: falta información`, sxEsc(x.detalleEstado || 'Revise qué dato pide el equipo.'), `pedido:${x.id}`, 'Completar')),
    (nov.entregas || []).length ? sxoFila('new', `${nov.entregas.length} entrega${nov.entregas.length === 1 ? '' : 's'} nueva${nov.entregas.length === 1 ? '' : 's'}`, 'Datos listos para sus clientes', 'entregas', 'Ver') : '',
    (nov.consultas || []).length ? sxoFila('new', `${nov.consultas.length} respuesta${nov.consultas.length === 1 ? '' : 's'} del equipo`, 'En su Buzón', 'buzon:consultas', 'Leer') : '',
    enCurso.length ? sxoFila('', `${enCurso.length} pedido${enCurso.length === 1 ? '' : 's'} por revisar`, 'Recibidos o en preparación', 'pedidos') : '',
    ...(!restricted ? sxGuardados().slice(0, 2).map((g) => sxoFila('', `Compra guardada para ${sxEsc(sxNombreCompleto(g.principal) || 'otro cliente')}`, `${g.renglones.length} servicio(s) sin enviar`, 'compras', 'Ver')) : []),
    vencidos.length ? sxoFila('warn', `${uniqueClientCount(vencidos)} cliente${uniqueClientCount(vencidos) === 1 ? '' : 's'} con servicio vencido`, `${vencidos.length} servicio(s) · ${money(suma(vencidos))} por cobrar`, 'renovar:vencidos') : '',
    hoy.length ? sxoFila('', `${hoy.length} servicio${hoy.length === 1 ? ' vence' : 's vencen'} hoy`, `Ver clientes por renovar · ${money(suma(hoy))}`, 'renovar:hoy') : '',
    semana.length ? sxoFila('', `${semana.length} renovación${semana.length === 1 ? '' : 'es'} en 7 días`, money(suma(semana)), 'renovar:porvencer', 'Ver') : '',
  ].filter(Boolean);
  const m = metricasNegocio && typeof metricasNegocio === 'object' ? metricasNegocio : {};
  const fin = (k) => Number.isFinite(Number(m[k])) && m[k] !== null && m[k] !== '' ? Number(m[k]) : null;
  const operado = fin('operadoMes') ?? fin('costoMes');
  const filasFin = [
    ['Cartera vigente', money(suma(vigentes)), `${vigentes.length} servicios activos`],
    ['Clientes con servicio activo', `${cliVig} de ${clientes.length}`, clientes.length ? `${Math.round((cliVig / clientes.length) * 100)} % de su cartera` : ''],
    ['Vence hoy', money(suma(hoy)), `${hoy.length} servicio(s)`],
    ['Próximos 7 días', money(suma(semana)), `${semana.length} servicio(s)`],
    ['Vencido por recuperar', money(suma(vencidos)), `${vencidos.length} servicio(s)`],
    operado !== null ? ['Pagado a Sublicuentas este mes', money(operado), 'Compras y renovaciones registradas'] : null,
    fin('operacionesMes') !== null ? ['Operaciones del mes', String(fin('operacionesMes')), `${fin('comprasMes') ?? 0} compras · ${fin('renovacionesMes') ?? 0} renovaciones`] : null,
    fin('pedidosPendientes') !== null ? ['Pedidos pendientes', String(fin('pedidosPendientes')), 'Todavía no entregados'] : null,
  ].filter(Boolean);
  const cargandoCli = !clientes.length && !Number(syncAt?.clientes || 0);
  content.innerHTML = `<div class="sx-page sxo-inicio">
    <section class="sxo-hola"><div><h1>Hola, ${sxEsc(revName())}</h1><p>Sus tareas, en un solo lugar.</p></div><img src="${ROBOT_IMG}" alt="" width="64" height="64"></section>
    ${restricted ? '' : `<button type="button" class="sx-btn pri full" data-go="compras">${borrador ? 'Continuar compra' : '＋ Nueva compra'}</button>`}
    <section aria-labelledby="sxoPendT"><h2 class="sxo-sec" id="sxoPendT">Pendientes de hoy</h2>
      ${cargandoCli ? sxoCargando('Cargando sus clientes…') : tareas.length ? `<ul class="sxo-list sx-tasks">${tareas.join('')}</ul>` : '<div class="sx-card sxo-estado"><p class="sx-help">No tiene pendientes por ahora. ✅</p></div>'}
    </section>
    <div class="sxo-metricas">
      <div class="sx-card sxo-metrica"><small>Clientes vigentes</small><b>${cliVig}</b></div>
      <div class="sx-card sxo-metrica"><small>Cartera vigente</small><b>${money(suma(vigentes))}</b></div>
    </div>
    <details class="sx-card sxo-resumen"><summary>Ver resumen financiero</summary>
      <dl class="sx-dl">${filasFin.map(([a, b, c]) => `<div><dt>${sxEsc(a)}</dt><dd>${sxEsc(b)}${c ? `<small>${sxEsc(c)}</small>` : ''}</dd></div>`).join('')}</dl>
    </details>
  </div>`;
  content.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => sxoIr(b.dataset.go)));
  if (!restricted && !dataFresh('compras') && typeof loadMisCompras === 'function') loadMisCompras()?.then?.(() => { if (current === 'inicio') sxoVInicio(); });
}

/* ---------------- MÁS ---------------- */
function sxoVMas() {
  document.body.classList.remove('sx-con-barra');
  const enBarra = new Set(webDesktopMode() ? [] : sxoNavItems().map((x) => x.v));
  const items = SXO_MAS.filter((x) => vistaGeisellPermitida(x.v) && !enBarra.has(x.v));
  content.innerHTML = `<div class="sx-page sxo-mas">${sxHero('', 'Más opciones', '')}
    <ul class="sxo-list">${items.map((x) => `<li><button type="button" class="sxo-item sxo-row" data-go="${x.v}"><span class="sxo-row-ic sxo-${x.tone}">${sxoIcon(x.ic)}</span><span class="sxo-item-tx"><b>${x.t}</b><small>${x.d}</small></span><span class="sxo-item-go" aria-hidden="true">→</span></button></li>`).join('')}</ul>
    <button type="button" class="sx-link sxo-salir" data-m="salir">Salir de mi cuenta</button>
  </div>`;
  content.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  content.querySelector('[data-m="salir"]')?.addEventListener('click', () => logout());
}

/* ---------------- CLIENTES: listado compacto + ficha ---------------- */
let sxoCliAbierto = '';
function sxoServicioEstado(s) { return estado(parseFecha(pick(s, CONFIG.campos.vencimiento))); }
function sxoResumenCliente(c) {
  const svcs = Array.isArray(c.servicios) ? c.servicios : [];
  const peor = svcs.map(sxoServicioEstado).reduce((a, b) => (b.n < a.n ? b : a), { n: 9999 });
  const ec = estadoCliente(c);
  if (ec.c !== 'ok') return ['off', 'Sin servicio vigente'];
  if (peor.n < 0) return ['warn', 'Con vencidos'];
  if (peor.n <= 7) return ['info', 'Vence pronto'];
  return ['ok', 'Al día'];
}
function sxoVClientes() { document.body.classList.remove('sx-con-barra'); sxoClientesPintar(); }
function sxoClientesPintar(soloLista = false) {
  if (sxoCliAbierto) { const c = (clientes || []).find((x) => String(x.id) === sxoCliAbierto); if (c) { sxoFichaPintar(c); return; } sxoCliAbierto = ''; }
  const f = sxNorm(cliF), dig = String(cliF || '').replace(/\D/g, '');
  const list = (clientes || []).filter((c) => {
    if (cliEstado === 'vigentes' && !esClienteVigente(c)) return false;
    if (cliEstado === 'novigentes' && !esClienteNoVigente(c)) return false;
    if (cliEstado === 'vencidos' && !(c.servicios || []).some((s) => sxoServicioEstado(s).n < 0)) return false;
    return !f || sxNorm(nombreCli(c)).includes(f) || (dig.length >= 3 && String(c.telefono || c.telefono_norm || '').replace(/\D/g, '').includes(dig));
  }).sort((a, b) => nombreCli(a).localeCompare(nombreCli(b), 'es', { numeric: true, sensitivity: 'base' }));
  const cargando = !(clientes || []).length && !Number(syncAt?.clientes || 0);
  const listaHtml = cargando ? sxoCargando('Cargando sus clientes…') : list.length ? `<ul class="sxo-list sx-clients">${list.map((c) => {
    const n = (c.servicios || []).length, [cls, txt] = sxoResumenCliente(c);
    return `<li><button type="button" class="sxo-item sx-client" data-cli="abrir" data-id="${sxAttr(c.id)}"><span class="sxo-item-tx"><b>${sxEsc(nombreCli(c))}</b><small>${n} servicio${n === 1 ? '' : 's'} · <span class="sxo-est ${cls}">${txt}</span></small></span><span class="sxo-item-go">Abrir</span></button></li>`;
  }).join('')}</ul>` : '<div class="sx-card sx-empty"><b>Sin resultados</b><p>Pruebe otro nombre, teléfono o filtro.</p></div>';
  if (soloLista && document.getElementById('sxCliLista')) { document.getElementById('sxCliLista').innerHTML = listaHtml; return; }
  const fs = flat(), suma = (a) => a.reduce((t, s) => t + (s.precio || 0), 0);
  const vig = fs.filter((s) => esVigente(s.est)), sem = fs.filter((s) => s.est.n >= 0 && s.est.n <= 7), ven = fs.filter((s) => s.est.n < 0);
  const filtros = [['todos', 'Todos'], ['vigentes', 'Vigentes'], ['vencidos', 'Vencidos'], ['novigentes', 'Sin servicio vigente']];
  content.innerHTML = `<div class="sx-page sxo-clientes">${sxHero('clients', 'Clientes', `${(clientes || []).length} clientes · ${(clientes || []).filter(esClienteVigente).length} vigentes`)}
    <label class="sx-field sx-search"><span class="sr">Buscar cliente</span><input id="cliSearch" type="search" value="${sxAttr(cliF || '')}" placeholder="Buscar nombre o teléfono" autocomplete="off"></label>
    <div class="sx-filter" role="group" aria-label="Filtrar clientes">${filtros.map(([k, l]) => `<button type="button" class="sx-chip ${cliEstado === k ? 'on' : ''}" aria-pressed="${cliEstado === k}" data-cli="filtro" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="sxCliLista">${listaHtml}</div>
    <details class="sx-card sxo-resumen"><summary>${socioGeisell() ? 'Resumen de renovaciones' : 'Resumen de cobros'}</summary>
      <dl class="sx-dl">
        <div><dt>Clientes vigentes</dt><dd>${(clientes || []).filter(esClienteVigente).length}</dd></div>
        <div><dt>Sin servicio vigente</dt><dd>${(clientes || []).filter(esClienteNoVigente).length}</dd></div>
        <div><dt>Cobrar esta semana</dt><dd>${money(suma(sem))}<small>${sem.length} servicio(s)</small></dd></div>
        <div><dt>Vencidos</dt><dd>${money(suma(ven))}<small>${ven.length} servicio(s)</small></dd></div>
        <div><dt>Cartera vigente</dt><dd>${money(suma(vig))}<small>${vig.length} servicio(s)</small></dd></div>
      </dl></details>
  </div>`;
  content.querySelector('#cliSearch')?.addEventListener('input', (ev) => { cliF = ev.target.value; sxoClientesPintar(true); });
}
function sxoFichaPintar(c) {
  const svcs = Array.isArray(c.servicios) ? c.servicios : [], tel = c.telefono || c.telefono_norm || '';
  const nombre = nombreCli(c), corto = sxEsc(String(nombre).split(/\s+/)[0] || 'este cliente');
  const peds = socioSinCompras() ? [] : sxPedidosDeCliente(c);
  content.innerHTML = `<div class="sx-page sxo-ficha">
    <button type="button" class="sx-link sxo-volver" data-cli="volver">← Clientes</button>
    ${sxHero('clients', 'Ficha del cliente', '')}
    <section class="sx-card"><h2 id="sxoFichaT" tabindex="-1">${sxEsc(nombre)}</h2><p class="sx-help">${sxEsc(tel || 'Sin teléfono registrado')} · ${svcs.length} servicio${svcs.length === 1 ? '' : 's'}</p></section>
    <h2 class="sxo-sec">Servicios</h2>
    ${svcs.length ? `<ul class="sxo-list">${svcs.map((s, ix) => {
      const nm = pick(s, CONFIG.campos.servicio) || 'Servicio', f = parseFecha(pick(s, CONFIG.campos.vencimiento)), e = estado(f);
      const orig = Number(s?.servicioIndexOriginal ?? s?._servicioIndexOriginal ?? ix);
      const cls = e.n < 0 ? 'warn' : e.n <= 7 ? 'info' : e.n < 9999 ? 'ok' : 'off';
      return `<li class="sx-card sxo-svc"><div class="sxo-item-tx"><b>${sxEsc(nm)}</b><small>${f ? `Vence: ${sxEsc(fmtFecha(f))}` : 'Sin fecha de vencimiento'}</small><span class="sx-pill ${cls}">${sxEsc(e.t || '')}</span></div><button type="button" class="sx-btn sec sm" data-cli="renovar" data-id="${sxAttr(c.id)}" data-nm="${sxAttr(nm)}" data-ix="${Number.isInteger(orig) ? orig : ix}">Renovar</button></li>`;
    }).join('')}</ul>` : '<div class="sx-card sxo-estado"><p class="sx-help">Este cliente no tiene servicios registrados.</p></div>'}
    ${socioSinCompras() ? '' : `<button type="button" class="sx-btn pri full" data-cli="comprar" data-id="${sxAttr(c.id)}">＋ Nueva compra para ${corto}</button>`}
    <div class="sxo-dos"><button type="button" class="sx-btn sec" data-cli="cobro" data-id="${sxAttr(c.id)}">${sxEsc(etiquetaMensajeRenovacion())}</button>${waUrl(tel) ? `<a class="sx-btn sec" href="${sxAttr(waUrl(tel))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : '<button type="button" class="sx-btn sec" disabled>Sin WhatsApp</button>'}</div>
    ${socioSinCompras() ? '' : `<section class="sxo-peds"><h2 class="sxo-sec">Pedidos de ${corto}</h2>${peds.length ? `<ul class="sxo-list">${peds.slice(0, 5).map((o) => { const [cls, label] = sxEstadoPedido(o.estado); return `<li><button type="button" class="sxo-item" data-cli="pedido" data-id="${sxAttr(o.id)}"><span class="sxo-item-tx"><b>#${sxEsc(o.ref || String(o.id).slice(-6).toUpperCase())} · ${sxEsc((o.productos || []).map((p) => p.servicioBase || p.servicio).join(' + ') || o.servicio || '')}</b><small><span class="sx-pill ${cls}">${sxEsc(label)}</span></small></span><span class="sxo-item-go">Ver</span></button></li>`; }).join('')}</ul>` : `<p class="sx-help">${dataFresh('compras') ? 'Sin pedidos registrados para este cliente.' : 'Consultando pedidos…'}</p>`}</section>`}
  </div>`;
}
function sxoClickClientes(ev) {
  const b = ev.target.closest('[data-cli]'); if (!b) return;
  const a = b.dataset.cli;
  if (a === 'filtro') { cliEstado = b.dataset.v; sxoClientesPintar(); return; }
  if (a === 'abrir') { sxoCliAbierto = String(b.dataset.id); window.scrollTo(0, 0); sxoClientesPintar(); document.getElementById('sxoFichaT')?.focus({ preventScroll: true }); if (!socioSinCompras() && !dataFresh('compras')) loadMisCompras()?.then?.(() => { if (current === 'clientes' && sxoCliAbierto) sxoClientesPintar(); }); return; }
  if (a === 'volver') { sxoCliAbierto = ''; sxoClientesPintar(); return; }
  sxOnClickClientes(ev);
}

/* ---------------- PERFIL: configuración agrupada ---------------- */
async function sxoVPerfil() {
  document.body.classList.remove('sx-con-barra');
  content.innerHTML = '<div class="spin"></div>'; await loadGamificacion(); if (current !== 'perfil') return;
  const me = gamificacion.perfil || { ventas: 0, score: 0, nivel: 'Sin nivel', racha: 0, cursos: 0, avatar: '' };
  const avatar = safeImageSrc(me.avatar, ROBOT_IMG), nombre = me.nombreMostrar || revName(), nivel = me.nivel || 'Sin nivel';
  const insignias = (gamificacion.insignias || []).map((b) => `<div class="sales-badge ${b.activa ? 'on' : ''}" title="${escAttr(b.detalle || '')}"><i>${escHtml(b.icon || '🏅')}</i><b>${escHtml(b.nombre || 'Insignia')}</b></div>`).join('');
  const notif = typeof Notification === 'undefined' ? 'No disponible en este navegador' : Notification.permission === 'granted' ? 'Activadas' : Notification.permission === 'denied' ? 'Bloqueadas en el navegador' : 'Desactivadas';
  const grupo = (id, titulo, sub, cuerpo, etiqueta = 'Ver', abierto = false) => `<details class="sx-card sxo-grupo" id="${id}" ${abierto ? 'open' : ''}><summary><span class="sxo-item-tx"><b>${titulo}</b><small>${sub}</small></span><span class="sxo-item-go">${etiqueta}</span></summary><div class="sxo-grupo-body">${cuerpo}</div></details>`;
  content.innerHTML = `<div class="sx-page sxo-perfil">${sxHero('', 'Mi perfil', '')}
    <section class="sx-card sxo-perfil-top"><div class="profile-photo-wrap"><img class="profile-photo" src="${escAttr(avatar)}" alt="Foto de ${escAttr(nombre)}"><button type="button" class="profile-photo-edit" aria-label="Cambiar foto" onclick="document.getElementById('socioPhoto').click()">📷</button><input id="socioPhoto" type="file" accept="image/*" hidden onchange="saveSocioPhoto(this)"></div>
      <div><h2>${escHtml(nombre)}</h2><p class="sx-help">${escHtml(nivel)} · ${Number(me.ventas || 0)} ventas</p></div></section>
    <div class="sxo-list">
      ${grupo('sxoGTelegram', 'Telegram', 'Avisos de entregas y respuestas del Buzón', '<div id="sxTgHost"></div>', 'Ver', true)}
      ${grupo('sxoGNotif', 'Notificaciones', `Estado: ${notif}`, typeof Notification !== 'undefined' ? `<button type="button" class="sx-btn sec" onclick="enablePartnerNotifications()">${Notification.permission === 'granted' ? 'Revisar notificaciones' : 'Activar notificaciones'}</button>` : '<p class="sx-help">Este navegador no permite notificaciones.</p>')}
      ${grupo('sxoGNivel', 'Mi nivel y recompensas', `${escHtml(nivel)} · Score ${Number(me.score || 0)}`, `<dl class="sx-dl"><div><dt>Ventas</dt><dd>${Number(me.ventas || 0)}</dd></div><div><dt>Score</dt><dd>${Number(me.score || 0)}</dd></div><div><dt>Racha de renovaciones</dt><dd>${Number(me.racha || 0)}</dd></div><div><dt>Cursos</dt><dd>${Number(me.cursos || 0)}</dd></div></dl>
        <div class="level-track"><div class="level-chip ${nivel === 'Diamante' ? 'on' : ''}">💎 Diamante<br>1–9 ventas</div><div class="level-chip ${nivel === 'Leyenda' ? 'on' : ''}">🏆 Leyenda<br>10–25 ventas</div><div class="level-chip ${nivel === 'Inmortal' ? 'on' : ''}">👑 Inmortal<br>26+ ventas</div></div>
        ${insignias ? `<h3>Insignias</h3><div class="badge-grid">${insignias}</div>` : ''}
        <button type="button" class="sx-btn sec" onclick="go('recompensas')">Ver recompensas</button>`)}
      ${grupo('sxoGDatos', 'Datos de mi perfil', 'Nombre y foto', `<div id="editSocioBox"><label class="sx-field"><span>Nombre visible</span><input id="socioNombre" maxlength="45" value="${escAttr(nombre)}"></label><button type="button" class="sx-btn pri" onclick="saveSocioProfile()">Guardar cambios</button><p class="sx-help">La foto se cambia con el botón 📷.</p></div>`, 'Editar')}
    </div>
    <button type="button" class="sx-link sxo-salir" onclick="logout()">Salir de mi cuenta</button>
  </div>`;
  const host = document.getElementById('sxTgHost');
  if (host && typeof sxTgPintar === 'function') {
    const card = document.createElement('section'); card.id = 'sxTgCard'; card.className = 'sx-tg'; host.appendChild(card);
    card.innerHTML = '<p class="sx-help">Consultando…</p>';
    let st = null; try { st = await API.call('/rev/telegram/estado?_=' + Date.now(), { cache: 'no-store', timeoutMs: 12000 }); } catch (_) {}
    if (current === 'perfil') { sxTgPintar(card, st); sxoTgEstado = st; }
  }
}
toggleEditSocio = function () { const d = document.getElementById('sxoGDatos'); if (d) { d.open = !d.open; if (d.open) document.getElementById('socioNombre')?.focus(); } };

/* ---------------- BUZÓN: estado de Telegram en "Mis consultas" ---------------- */
let sxoTgEstado = null, sxoTgPedido = false;
const sxoBuzonBase = vSugerencias;
function sxoVBuzon() {
  sxoBuzonBase.apply(this, arguments);
  if (current !== 'buzon' || typeof sxBz !== 'object' || sxBz.tab !== 'consultas' || sxBz.abierto || sxBz.nueva) return;
  const page = content.querySelector('.sx-page'); if (!page) return;
  const vinc = !!(sxoTgEstado && sxoTgEstado.conectado);
  page.insertAdjacentHTML('beforeend', `<button type="button" class="sx-card sxo-tg-mini ${vinc ? 'ok' : ''}" data-go="perfil"><b>${sxoTgEstado === null ? 'Telegram' : vinc ? 'Telegram conectado' : 'Conectar Telegram'}</b><small>${sxoTgEstado === null ? 'Consultando estado…' : vinc ? 'Continúe el mismo hilo desde el bot.' : 'Reciba las respuestas y responda desde el bot.'}</small></button>`);
  page.querySelector('.sxo-tg-mini')?.addEventListener('click', () => go('perfil'));
  if (sxoTgEstado === null && !sxoTgPedido) {
    sxoTgPedido = true;
    API.call('/rev/telegram/estado?_=' + Date.now(), { cache: 'no-store', timeoutMs: 12000 }).then((st) => { sxoTgEstado = st || {}; }).catch(() => { sxoTgEstado = {}; })
      .finally(() => { if (current === 'buzon') vSugerencias(); });
  }
}

/* ---------------- CATÁLOGO: condiciones plegables + un acceso discreto a recompensas ---------------- */
function sxoVPrecios() {
  sxVPreciosNuevo();
  const page = content.querySelector('.sx-page'); if (!page) return;
  page.querySelectorAll('.sx-conds').forEach((ul) => {
    if (ul.closest('details')) return;
    const d = document.createElement('details'); d.className = 'sxo-conds'; d.innerHTML = '<summary>Ver condiciones</summary>';
    ul.replaceWith(d); d.appendChild(ul);
  });
  if (!page.querySelector('.sxo-recomp') && vistaGeisellPermitida('recompensas')) {
    const pol = page.querySelector('.sx-politicas');
    const a = document.createElement('button'); a.type = 'button'; a.className = 'sx-link sxo-recomp'; a.textContent = 'Ver recompensas de socio →';
    a.addEventListener('click', () => go('recompensas'));
    pol ? pol.before(a) : page.appendChild(a);
  }
}

/* ---------------- Enlazar vistas ---------------- */
vInicio = sxoVInicio;
vClientes = sxoVClientes;
renderCli = function () { if (current === 'clientes') sxoClientesPintar(!sxoCliAbierto); };
vRenovar = sxVRenovarNuevo;
renderRen = sxRenderRenNuevo;
vPrecios = sxoVPrecios;
vPerfil = sxoVPerfil;
vSugerencias = sxoVBuzon;

content.addEventListener('click', (ev) => {
  if (current === 'clientes') sxoClickClientes(ev);
  else if (current === 'renovar') sxOnClickRen(ev);
});

const sxoGoBase = go;
go = function (v) {
  sxoCerrarMenu();
  if (v === 'mas') {
    if (webDesktopMode()) { sxoGoBase('inicio'); return; }
    current = 'mas'; window.scrollTo(0, 0); sxoVMas();
    renderUnifiedSidebar(); try { updateSyncStatus(); actualizarBadgeBuzon(); } catch (_) {}
    return;
  }
  if (v !== 'clientes') sxoCliAbierto = '';
  sxoGoBase(v);
  renderUnifiedSidebar();
};

/* Cambio celular ↔ computadora: la misma pantalla, otra presentación */
try { (typeof SX_MQ_DESK !== 'undefined' ? SX_MQ_DESK : window.matchMedia('(min-width:900px)')).addEventListener('change', () => { if (current === 'mas' && webDesktopMode()) go('inicio'); else renderUnifiedSidebar(); }); } catch (_) {}

sxoMontarCabecera();
renderUnifiedSidebar();
(function sxoRepintar() {
  if (document.getElementById('app')?.classList.contains('hide') || typeof current === 'undefined') return;
  const v = current;
  if (['inicio', 'clientes', 'renovar', 'precios', 'perfil', 'buzon'].includes(v)) { try { go(v); } catch (_) {} }
})();
