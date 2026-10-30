/* ========================================================================
   SUBLICUENTAS · PANEL DE SOCIOS · ENTREGAS, BUZÓN Y TELEGRAM (30/10/2026)
   Brief "Entregas en panel + Telegram · Historial completo" + "Buzón unificado".
   - Pedidos → pestaña "Mis entregas": historial paginado por el servidor, filtros y detalle.
   - "Visto" solo al abrir el detalle (lo registra el servidor). Listar no es leer.
   - Portal del cliente y código: se piden con POST autenticado (auditado); nunca van en la URL.
   - Campanita con novedades persistentes; consulta periódica autenticada mientras el panel está abierto.
   - Buzón de dos vías: "Mis consultas" (hilos #C…) y "Avisos del equipo" (los avisos de siempre).
   - Perfil → Conectar / Cambiar / Desvincular Telegram (token de un solo uso, 10 minutos).
   Se carga DESPUÉS de socios-2026.js.
   ======================================================================== */

let sxNovedades = { total: 0, entregas: [], consultas: [] };
let sxEnt = { items: [], cursor: '', total: 0, cargando: false, cargado: false, error: '', f: { q: '', servicio: '', pedido: '', periodo: 'todas', desde: '', hasta: '', estado: 'todos' } };
let sxEntDetalle = null, sxEntAbiertaId = '';

/* ---------------- Mis entregas ---------------- */
function sxEntQuery(cursor) {
  const f = sxEnt.f, q = new URLSearchParams({ limit: '20' });
  if (cursor) q.set('cursor', cursor);
  if (f.q) q.set('cliente', f.q);
  if (f.servicio) q.set('servicio', f.servicio);
  if (f.pedido) q.set('pedido', f.pedido);
  const hoy = new Date(), iso = (d) => d.toISOString().slice(0, 10);
  if (f.periodo === '30') q.set('desde', iso(new Date(hoy - 30 * 86400000)));
  else if (f.periodo === '90') q.set('desde', iso(new Date(hoy - 90 * 86400000)));
  else if (f.periodo === 'anio') q.set('desde', `${hoy.getFullYear()}-01-01`);
  else if (f.periodo === 'rango') { if (f.desde) q.set('desde', f.desde); if (f.hasta) q.set('hasta', f.hasta); }
  if (f.estado === 'nuevas') q.set('nuevas', '1'); else if (f.estado !== 'todos') q.set('estado', f.estado);
  return q.toString();
}
async function sxEntCargar({ mas = false } = {}) {
  if (sxEnt.cargando) return;
  sxEnt.cargando = true; sxEnt.error = ''; if (!mas) sxEntPintarLista();
  try {
    const d = await API.call('/rev/entregas?' + sxEntQuery(mas ? sxEnt.cursor : ''), { cache: 'no-store', timeoutMs: 15000 });
    sxEnt.items = mas ? [...sxEnt.items, ...(d.items || [])] : (d.items || []);
    sxEnt.cursor = d.cursor || ''; sxEnt.total = Number(d.total) || 0; sxEnt.cargado = true;
  } catch (e) { sxEnt.error = e?.code === 'auth' ? 'Su sesión venció. Vuelva a entrar.' : 'No se pudieron cargar las entregas. Revise su conexión.'; }
  sxEnt.cargando = false;
  if (current === 'pedidos' && sxPedTab === 'entregas' && !sxEntAbiertaId) sxEntPintarLista();
}
function sxEntFecha(e) { return e.fechaOriginal ? sxFecha(e.fechaOriginal) : (e.historico ? 'Sin fecha confirmada' : '—'); }
function sxEntEstado(e) {
  if (e.estado === 'revocada') return ['off', 'Acceso revocado'];
  if (e.historicoIncompleto) return ['warn', 'Histórico incompleto'];
  if (e.historico) return ['info', 'Entrega histórica'];
  return ['ok', 'Entregado al socio'];
}
function sxEntItemHtml(e) {
  const [c, l] = sxEntEstado(e);
  return `<li class="sx-card sx-ent ${e.nueva ? 'nueva' : ''}"><div class="sx-ent-main"><b>Pedido #${sxEsc(e.pedidoRef || '—')} · ${sxEsc(e.clienteNombre || 'Cliente')}</b>
      <span>${sxEsc(e.servicio)} · <span class="sx-pill ${c}">${l}</span>${e.nueva ? ' <span class="sx-pill new">Nuevo</span>' : ''}</span>
      <small>Entregado: ${sxEntFecha(e)}${e.vencimiento ? ` · Vence: ${sxEsc(e.vencimiento)}` : ''}${e.historico && e.importadaAt ? ` · Importado ${sxFecha(e.importadaAt)}` : ''}</small></div>
    <div class="sx-row-actions"><button type="button" class="sx-btn ${e.nueva ? 'pri' : 'sec'} sm" data-act="ent-ver" data-id="${sxAttr(e.id)}">Ver entrega</button></div></li>`;
}
function sxEntregasVista() {
  sxEntAbiertaId ? sxEntPintarDetalle() : sxEntPintarLista();
  if (!sxEnt.cargado && !sxEnt.cargando && !sxEntAbiertaId) sxEntCargar();
}
function sxEntPintarLista() {
  if (current !== 'pedidos') return;
  const f = sxEnt.f;
  const chips = [['todos', 'Todas'], ['nuevas', 'Nuevas / sin ver'], ['publicada', 'Vigentes'], ['historico', 'Históricas'], ['revocada', 'Revocadas']];
  content.innerHTML = `<div class="sx-page"><header class="sx-page-head"><div><small>Seguimiento</small><h1>Pedidos</h1></div><div class="sx-head-actions"><button type="button" class="sx-btn pri" data-act="nueva">Nueva compra</button></div></header>
    ${sxPedTabsHtml()}
    <form class="sx-tools sx-ent-filtros" id="sxEntForm" role="search">
      <label class="sx-field sx-search"><span>Cliente</span><input name="q" type="search" value="${sxAttr(f.q)}" placeholder="Nombre del cliente"></label>
      <label class="sx-field"><span>Servicio</span><input name="servicio" type="search" value="${sxAttr(f.servicio)}" placeholder="Netflix, Canva…"></label>
      <label class="sx-field"><span>N.º de pedido</span><input name="pedido" type="search" value="${sxAttr(f.pedido)}" placeholder="#A1B2C3" autocapitalize="characters"></label>
      <label class="sx-field"><span>Período</span><select name="periodo">${[['todas', 'Todas las fechas'], ['30', 'Últimos 30 días'], ['90', 'Últimos 90 días'], ['anio', 'Este año'], ['rango', 'Elegir fechas…']].map(([v, l]) => `<option value="${v}" ${f.periodo === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${f.periodo === 'rango' ? `<label class="sx-field"><span>Desde</span><input name="desde" type="date" value="${sxAttr(f.desde)}"></label><label class="sx-field"><span>Hasta</span><input name="hasta" type="date" value="${sxAttr(f.hasta)}"></label>` : ''}
      <button type="submit" class="sx-btn sec">Buscar</button>
    </form>
    <div class="sx-filter" role="group" aria-label="Estado de la entrega">${chips.map(([k, l]) => `<button type="button" class="sx-chip ${f.estado === k ? 'on' : ''}" aria-pressed="${f.estado === k}" data-act="ent-estado" data-v="${k}">${l}</button>`).join('')}</div>
    ${sxEnt.error ? `<div class="sx-banner warn" role="alert"><span>${sxEsc(sxEnt.error)}</span><button type="button" class="sx-link" data-act="ent-recargar">Reintentar</button></div>` : ''}
    ${sxEnt.cargando && !sxEnt.items.length ? '<div class="sx-card"><p class="sx-help">Cargando entregas…</p></div>'
      : sxEnt.items.length ? `<p class="sx-help" aria-live="polite">${sxEnt.total} entrega${sxEnt.total === 1 ? '' : 's'}</p><ul class="sx-ents">${sxEnt.items.map(sxEntItemHtml).join('')}</ul>${sxEnt.cursor ? `<div class="sx-nav-actions"><button type="button" class="sx-btn sec" data-act="ent-mas" ${sxEnt.cargando ? 'disabled' : ''}>${sxEnt.cargando ? 'Cargando…' : 'Cargar más'}</button></div>` : ''}`
      : sxEnt.cargado ? '<div class="sx-card sx-empty"><b>Sin entregas en este filtro</b><p>Pruebe “Todas las fechas” o quite filtros. Las entregas aparecen cuando el equipo las publica.</p></div>' : ''}
  </div>`;
  const form = document.getElementById('sxEntForm');
  form?.addEventListener('submit', (ev) => { ev.preventDefault(); sxEntLeerForm(); sxEntCargar(); });
  form?.querySelector('[name="periodo"]')?.addEventListener('change', (ev) => { sxEnt.f.periodo = ev.target.value; if (ev.target.value === 'rango') sxEntPintarLista(); else sxEntCargar(); });
}
// Lo escrito en los filtros cuenta aunque no se haya tocado "Buscar" (p. ej. al elegir un estado).
function sxEntLeerForm() { const form = document.getElementById('sxEntForm'); if (!form) return; const fd = new FormData(form); ['q', 'servicio', 'pedido', 'periodo', 'desde', 'hasta'].forEach((k) => { if (fd.has(k)) sxEnt.f[k] = String(fd.get(k) || '').trim(); }); }
async function sxAbrirEntrega(id) {
  sxPedTab = 'entregas'; sxPedidoAbierto = ''; sxEntAbiertaId = id; sxEntDetalle = null;
  if (current !== 'pedidos') { go('pedidos'); sxEntAbiertaId = id; }
  sxEntPintarDetalle();
  try {
    const d = await API.call('/rev/entregas/' + encodeURIComponent(id), { cache: 'no-store', timeoutMs: 15000 });
    sxEntDetalle = d;
    // abrir el detalle marca "visto": refrescar campanita y lista
    sxNovedades.entregas = (sxNovedades.entregas || []).filter((x) => x.id !== id); sxPintarCampana();
    sxEnt.items = sxEnt.items.map((x) => (x.id === id ? { ...x, nueva: false } : x));
  } catch (e) { sxEntDetalle = { error: e?.status === 404 || e?.error === 'no_disponible' ? 'Esta entrega no está disponible para su usuario.' : 'No se pudo abrir la entrega. Revise su conexión.' }; }
  if (current === 'pedidos' && sxEntAbiertaId === id) sxEntPintarDetalle();
}
function sxEntPintarDetalle() {
  if (current !== 'pedidos') return;
  const d = sxEntDetalle;
  const volver = '<button type="button" class="sx-link" data-act="ent-volver">← Mis entregas</button>';
  if (!d) { content.innerHTML = `<div class="sx-page">${volver}<div class="sx-card"><p class="sx-help">Abriendo entrega…</p></div></div>`; return; }
  if (d.error) { content.innerHTML = `<div class="sx-page">${volver}<div class="sx-card sx-empty"><b>${sxEsc(d.error)}</b></div></div>`; return; }
  const e = d.entrega, p = d.pedido, [c, l] = sxEntEstado(e);
  const sa = e.servicioActual;
  content.innerHTML = `<div class="sx-page">${volver}
    <header class="sx-page-head"><div><small>Entrega · ${e.version > 1 ? `versión ${e.version}` : 'versión 1'}</small><h1 id="sxEntTitulo" tabindex="-1">Pedido #${sxEsc(e.pedidoRef || '—')} · ${sxEsc(e.clienteNombre || '')}</h1><p class="sx-help">${sxEsc(e.servicio)}</p></div><span class="sx-pill ${c} lg">${l}</span></header>
    ${e.estado === 'revocada' ? `<div class="sx-banner warn" role="alert"><span><b>Acceso revocado</b> el ${sxFecha(e.revocadaAt)}. Si cree que es un error, repórtelo abajo.</span></div>` : ''}
    ${e.motivoActualizacion && e.version > 1 && e.estado !== 'revocada' ? `<div class="sx-banner info" role="status"><span><b>Actualizada:</b> ${sxEsc(e.motivoActualizacion)}</span></div>` : ''}
    ${sa && sa.reemplazado ? '<div class="sx-banner warn" role="status"><span>El servicio original de esta entrega fue reemplazado o ya no existe. Consulte su ficha en Clientes o reporte un problema.</span></div>' : ''}
    <div class="sx-detail-grid">
      <section class="sx-card"><h2>Datos de la entrega</h2><dl class="sx-dl">
        <div><dt>Cliente</dt><dd>${sxEsc(p?.cliente || e.clienteNombre || '—')}</dd></div>
        <div><dt>Servicio</dt><dd>${sxEsc(e.servicio)}</dd></div>
        <div><dt>Entregado (fecha original)</dt><dd>${sxEntFecha(e)}</dd></div>
        ${e.actualizadaAt && e.publicadaAt && e.actualizadaAt !== e.publicadaAt ? `<div><dt>Última actualización</dt><dd>${sxFechaHora(e.actualizadaAt)}</dd></div>` : ''}
        <div><dt>Vence</dt><dd>${sxEsc(sa?.vence || e.vencimiento || 'Según el servicio')}</dd></div>
        ${e.historico ? `<div><dt>Importado al historial</dt><dd>${sxFecha(e.importadaAt)}</dd></div><div><dt>Importe</dt><dd>${e.importe == null ? 'Importe no registrado' : money(e.importe)}</dd></div>` : ''}
      </dl>${e.nota ? `<p class="sx-note"><b>Nota del equipo:</b> ${sxEsc(e.nota)}</p>` : ''}</section>
      <section class="sx-card"><h2>Acciones</h2>
        ${e.portalDisponible ? `<div class="sx-row-actions"><button type="button" class="sx-btn pri" data-act="ent-portal" data-id="${sxAttr(e.id)}">Abrir portal del cliente</button><button type="button" class="sx-btn sec" data-act="ent-portal-copiar" data-id="${sxAttr(e.id)}">Copiar enlace</button></div>` : `<p class="sx-help">${e.estado === 'publicada' ? 'Esta entrega no incluye portal del cliente.' : 'Sin accesos disponibles.'}</p>`}
        ${e.codigoDisponible ? `<div class="sx-code"><span id="sxEntCodigo" aria-live="polite">••••••••</span><button type="button" class="sx-btn sec sm" data-act="ent-codigo" data-id="${sxAttr(e.id)}">Ver código</button><button type="button" class="sx-btn sec sm" data-act="ent-codigo-copiar" data-id="${sxAttr(e.id)}">Copiar código</button></div>` : ''}
        ${e.mensajeCliente ? `<label class="sx-field"><span>Mensaje para el cliente</span><textarea readonly rows="4" id="sxEntMsgCli">${sxEsc(e.mensajeCliente)}</textarea></label><button type="button" class="sx-btn sec sm" data-act="ent-copiar-msg">Copiar mensaje al cliente</button>` : ''}
        <div class="sx-ent-report"><button type="button" class="sx-link" data-act="ent-reportar" data-id="${sxAttr(e.id)}" data-pedido="${sxAttr(p?.compraId || '')}">Reportar un problema con esta entrega</button></div>
      </section>
      ${p ? `<section class="sx-card"><h2>Pedido #${sxEsc(p.ref)}</h2><p><span class="sx-pill ${p.resumen.estado === 'entregado' ? 'ok' : p.resumen.estado === 'parcial' ? 'work' : 'info'}">${sxEsc(p.resumen.texto)}</span></p>
        <ul class="sx-list">${p.renglones.map((r) => `<li><div><b>${sxEsc(r.servicio)}</b></div><span class="sx-pill ${r.estado === 'entregado' ? 'ok' : r.estado === 'revocado' ? 'off' : 'info'}">${r.estado === 'entregado' ? 'Entregado' : r.estado === 'revocado' ? 'Revocado' : 'Pendiente'}</span>${r.entregaId && r.entregaId !== e.id ? `<button type="button" class="sx-link" data-act="ent-ver" data-id="${sxAttr(r.entregaId)}">Ver</button>` : ''}</li>`).join('')}</ul>
        <button type="button" class="sx-link" data-act="ent-pedido" data-id="${sxAttr(p.compraId)}">Ver pedido completo</button></section>` : ''}
    </div></div>`;
  window.scrollTo(0, 0);
  document.getElementById('sxEntTitulo')?.focus({ preventScroll: true });
}
async function sxEntPortal(id, copiar) {
  // La ventana se abre en el mismo toque (si no, el navegador la bloquea) y luego recibe la dirección.
  const w = copiar ? null : window.open('', '_blank');
  try {
    const r = await API.call(`/rev/entregas/${encodeURIComponent(id)}/portal`, { method: 'POST', body: '{}' });
    if (copiar) { await navigator.clipboard?.writeText(r.url); sxToast('Enlace del portal copiado.'); return; }
    if (w) { w.opener = null; w.location.href = r.url; } else location.href = r.url;
  } catch (e) { if (w) w.close(); sxToast(e?.error === 'servicio_reemplazado' ? 'El servicio fue reemplazado: el portal ya no aplica.' : 'No se pudo abrir el portal.'); }
}
async function sxEntCodigo(id, copiar) {
  try {
    const r = await API.call(`/rev/entregas/${encodeURIComponent(id)}/codigo`, { method: 'POST', body: '{}' });
    if (copiar) { await navigator.clipboard?.writeText(r.codigo); sxToast('Código copiado.'); return; }
    const el = document.getElementById('sxEntCodigo'); if (el) el.textContent = r.codigo;
  } catch (_) { sxToast('El código no está disponible.'); }
}
// Recibe los clics de la vista Pedidos (socios-2026.js delega aquí). Devuelve true si lo atendió.
function sxEntregasClick(ev, b) {
  const a = b.dataset.act;
  if (!a || !a.startsWith('ent-')) return false;
  if (a === 'ent-ver') sxAbrirEntrega(b.dataset.id);
  else if (a === 'ent-volver') { sxEntAbiertaId = ''; sxEntDetalle = null; sxEntPintarLista(); if (!sxEnt.cargado) sxEntCargar(); }
  else if (a === 'ent-estado') { sxEntLeerForm(); sxEnt.f.estado = b.dataset.v; sxEntCargar(); }
  else if (a === 'ent-mas') sxEntCargar({ mas: true });
  else if (a === 'ent-recargar') sxEntCargar();
  else if (a === 'ent-portal') sxEntPortal(b.dataset.id, false);
  else if (a === 'ent-portal-copiar') sxEntPortal(b.dataset.id, true);
  else if (a === 'ent-codigo') sxEntCodigo(b.dataset.id, false);
  else if (a === 'ent-codigo-copiar') sxEntCodigo(b.dataset.id, true);
  else if (a === 'ent-copiar-msg') { navigator.clipboard?.writeText(document.getElementById('sxEntMsgCli')?.value || ''); sxToast('Mensaje copiado.'); }
  else if (a === 'ent-reportar') { sxBz.nueva = { entregaId: b.dataset.id, pedidoId: b.dataset.pedido, asunto: `Problema con entrega · Pedido #${sxEntDetalle?.entrega?.pedidoRef || ''}` }; sxBz.tab = 'consultas'; sxBz.abierto = ''; go('buzon'); }
  else if (a === 'ent-pedido') { sxEntAbiertaId = ''; sxPedTab = 'pedidos'; sxPedidoAbierto = b.dataset.id; vPedidos(); }
  return true;
}

/* ---------------- Campanita + consulta periódica ---------------- */
function sxPintarCampana() {
  const host = document.getElementById('topbarActions'); if (!host) return;
  let btn = document.getElementById('sxBell');
  if (!btn) {
    btn = document.createElement('button'); btn.id = 'sxBell'; btn.type = 'button'; btn.className = 'icon-btn sx-bell';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.innerHTML = '🔔<span class="nav-badge" id="sxBellBadge"></span>';
    btn.addEventListener('click', sxAbrirNovedades);
    host.insertBefore(btn, host.querySelector('.partner-inbox-btn') || host.firstChild);
  }
  const n = (sxNovedades.entregas || []).length + (sxNovedades.consultas || []).reduce((a, c) => a + (c.noLeidas || 1), 0);
  btn.setAttribute('aria-label', n ? `Novedades: ${n}` : 'Novedades');
  const badge = document.getElementById('sxBellBadge'); if (badge) { badge.textContent = n > 9 ? '9+' : String(n || ''); badge.classList.toggle('show', n > 0); }
  btn.classList.toggle('hide', socioSinCompras() && !(sxNovedades.consultas || []).length);
}
function sxAbrirNovedades() {
  const ents = sxNovedades.entregas || [], cons = sxNovedades.consultas || [];
  let dlg = document.getElementById('sxNovDlg');
  if (!dlg) { dlg = document.createElement('div'); dlg.id = 'sxNovDlg'; dlg.className = 'sx-nov'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'sxNovT'); document.body.appendChild(dlg);
    dlg.addEventListener('click', (ev) => { const b = ev.target.closest('[data-nov]'); if (ev.target === dlg || b?.dataset.nov === 'cerrar') { dlg.classList.remove('on'); document.getElementById('sxBell')?.focus(); return; } if (!b) return; dlg.classList.remove('on'); if (b.dataset.nov === 'ent') sxAbrirEntrega(b.dataset.id); if (b.dataset.nov === 'con') sxAbrirHilo(b.dataset.id); });
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && dlg.classList.contains('on')) { dlg.classList.remove('on'); document.getElementById('sxBell')?.focus(); } }); }
  dlg.innerHTML = `<div class="sx-nov-panel"><header><h2 id="sxNovT">Novedades</h2><button type="button" class="sx-link" data-nov="cerrar">Cerrar</button></header>
    ${!ents.length && !cons.length ? '<p class="sx-help">No tiene novedades. ✅</p>' : ''}
    ${ents.length ? `<h3>Entregas nuevas</h3><ul class="sx-list">${ents.map((e) => `<li><button type="button" class="sx-nov-item" data-nov="ent" data-id="${sxAttr(e.id)}"><b>Pedido #${sxEsc(e.pedidoRef)} · ${sxEsc(e.clienteNombre)}</b><small>${sxEsc(e.servicio)}${e.version > 1 ? ' · actualizada' : ' · disponible'}</small></button></li>`).join('')}</ul>` : ''}
    ${cons.length ? `<h3>Respuestas del equipo</h3><ul class="sx-list">${cons.map((c) => `<li><button type="button" class="sx-nov-item" data-nov="con" data-id="${sxAttr(c.id)}"><b>Consulta #${sxEsc(c.numero)}</b><small>${sxEsc(c.asunto)} · ${c.noLeidas} sin leer</small></button></li>`).join('')}</ul>` : ''}</div>`;
  dlg.classList.add('on');
  dlg.querySelector('button')?.focus();
}
let sxNovTimer = null, sxNovEnCurso = false;
async function sxCargarNovedades() {
  if (sxNovEnCurso || !API.token || (isAdmin && !impersonating) || document.hidden) return;
  sxNovEnCurso = true;
  try {
    const d = await API.call('/rev/novedades?_=' + Date.now(), { cache: 'no-store', timeoutMs: 12000 });
    const antes = (sxNovedades.entregas || []).map((x) => `${x.id}:${x.version}`).join();
    sxNovedades = { total: Number(d.total) || 0, entregas: d.entregas || [], consultas: d.consultas || [] };
    sxPintarCampana(); actualizarBadgeBuzon();
    // Si llegó una entrega nueva mientras mira "Mis entregas", refrescar la lista.
    if (antes !== sxNovedades.entregas.map((x) => `${x.id}:${x.version}`).join() && current === 'pedidos' && sxPedTab === 'entregas' && !sxEntAbiertaId) sxEntCargar();
  } catch (_) { /* sin conexión: se reintenta en el próximo ciclo */ }
  sxNovEnCurso = false;
}
function sxIniciarNovedades() {
  clearInterval(sxNovTimer);
  sxNovTimer = setInterval(sxCargarNovedades, 60000);
  sxCargarNovedades();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) sxCargarNovedades(); });
const sxBadgeBase = actualizarBadgeBuzon;
actualizarBadgeBuzon = function () {
  sxBadgeBase();
  const el = document.getElementById('buzonBadge'); if (!el || current === 'buzon') return;
  const n = (current === 'buzon' ? 0 : avisosNoLeidos()) + (sxNovedades.consultas || []).reduce((a, c) => a + (c.noLeidas || 0), 0);
  if (n > 0) { el.textContent = n > 9 ? '9+' : n; el.classList.add('show'); } else el.classList.remove('show');
};

/* ---------------- Buzón de dos vías ---------------- */
const sxBz = { tab: 'consultas', lista: null, abierto: '', nueva: null, op: '', opResp: '', msg: { t: '', c: '' }, cargando: false };
const SX_BZ_EST = { abierta: 'info', en_atencion: 'work', esperando_socio: 'warn', resuelta: 'ok' };
async function sxBzCargar() {
  sxBz.cargando = true;
  try { const d = await API.call('/rev/consultas?_=' + Date.now(), { cache: 'no-store', timeoutMs: 15000 }); sxBz.lista = d.items || []; }
  catch (_) { sxBz.lista = sxBz.lista || []; sxBz.msg = { t: 'No se pudieron cargar las consultas. Revise su conexión.', c: 'err' }; }
  sxBz.cargando = false;
  if (current === 'buzon') vSugerencias();
}
function sxAbrirHilo(id) { sxBz.tab = 'consultas'; sxBz.abierto = id; sxBz.nueva = null; if (current !== 'buzon') go('buzon'); else vSugerencias(); }
function vSugerencias() {
  document.body.classList.remove('sx-con-barra');
  const nAvisos = avisosNoLeidos();
  const nCons = (sxBz.lista || []).reduce((a, c) => a + (c.noLeidas || 0), 0);
  const tabs = `<div class="sx-tabs" role="tablist" aria-label="Buzón"><button type="button" role="tab" class="sx-tab ${sxBz.tab === 'consultas' ? 'on' : ''}" aria-selected="${sxBz.tab === 'consultas'}" data-bz="tab" data-v="consultas">Mis consultas${nCons ? ` <span class="sx-dot">${nCons}</span>` : ''}</button><button type="button" role="tab" class="sx-tab ${sxBz.tab === 'avisos' ? 'on' : ''}" aria-selected="${sxBz.tab === 'avisos'}" data-bz="tab" data-v="avisos">Avisos del equipo${nAvisos ? ` <span class="sx-dot">${nAvisos}</span>` : ''}</button></div>`;
  let cuerpo = '';
  if (sxBz.tab === 'avisos') {
    marcarBuzonLeido();
    const msgs = [...(avisos || [])].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    cuerpo = `<section class="sx-card"><div class="sx-card-head"><h2>Avisos del equipo</h2><button type="button" class="sx-link" data-bz="avisos-recargar">Actualizar</button></div>${msgs.length ? `<ul class="sx-list">${msgs.map((a) => `<li><div><b>${sxEsc(a.texto)}</b><small>${sxEsc(a.autor || 'Sublicuentas')} · hace ${tiempoDesde(a.ts || 0)}</small></div></li>`).join('')}</ul>` : '<p class="sx-help">Sin avisos por ahora.</p>'}</section>`;
  } else if (sxBz.nueva) {
    const n = sxBz.nueva, pedidos = (misCompras || []).slice(0, 40);
    cuerpo = `<section class="sx-card"><h2 id="sxBzTitulo" tabindex="-1">Nueva consulta</h2>
      <label class="sx-field"><span>Asunto <i aria-hidden="true">*</i></span><input id="sxBzAsunto" maxlength="120" value="${sxAttr(n.asunto || '')}" placeholder="Ej. Netflix pide código"></label>
      <label class="sx-field"><span>Pedido o servicio (opcional)</span><select id="sxBzPedido"><option value="">Sin pedido</option>${pedidos.map((o) => `<option value="${sxAttr(o.id)}" ${n.pedidoId === o.id ? 'selected' : ''}>#${sxEsc(o.ref)} · ${sxEsc(sxPedidoCliente(o) || o.servicio)}</option>`).join('')}</select></label>
      ${n.pedidoId ? '' : `<fieldset class="sx-field"><legend>Para</legend><div class="sx-chips">${[['sublicuentas', 'Sublicuentas'], ['relojes', 'Relojes']].map(([v, l]) => `<button type="button" class="sx-chip ${(n.destino || 'sublicuentas') === v ? 'on' : ''}" aria-pressed="${(n.destino || 'sublicuentas') === v}" data-bz="destino" data-v="${v}">${l}</button>`).join('')}</div></fieldset>`}
      <label class="sx-field"><span>Mensaje <i aria-hidden="true">*</i></span><textarea id="sxBzTexto" rows="5" maxlength="3000" placeholder="Explique qué pasa. No escriba contraseñas.">${sxEsc(n.texto || '')}</textarea></label>
      ${sxBz.msg.t ? `<div class="sx-msg ${sxBz.msg.c}" role="alert">${sxEsc(sxBz.msg.t)}</div>` : ''}
      <div class="sx-row-actions"><button type="button" class="sx-btn pri" data-bz="enviar-nueva">Enviar consulta</button><button type="button" class="sx-link" data-bz="cancelar-nueva">Cancelar</button></div>
      <p class="sx-help">La respuesta llega aquí y, si conectó Telegram en su Perfil, también por Telegram. Puede responder desde cualquiera de los dos.</p></section>`;
  } else if (sxBz.abierto) {
    const c = (sxBz.lista || []).find((x) => x.id === sxBz.abierto);
    if (!c) cuerpo = sxBz.lista === null ? '<div class="sx-card"><p class="sx-help">Cargando…</p></div>' : '<div class="sx-card sx-empty"><b>Esta consulta no está disponible.</b></div>';
    else {
      if (c.noLeidas && !c.legacy) { API.call(`/rev/consultas/${encodeURIComponent(c.id)}/leida`, { method: 'POST', body: '{}' }).catch(() => {}); c.noLeidas = 0; sxNovedades.consultas = (sxNovedades.consultas || []).filter((x) => x.id !== c.id); sxPintarCampana(); }
      cuerpo = `<button type="button" class="sx-link" data-bz="volver">← Mis consultas</button>
        <section class="sx-card"><header class="sx-card-head"><div><h2 id="sxBzTitulo" tabindex="-1">${c.numero ? `#${sxEsc(c.numero)} · ` : ''}${sxEsc(c.asunto)}</h2><small class="sx-help">${c.pedidoRef ? `Pedido #${sxEsc(c.pedidoRef)} · ` : ''}${sxEsc(c.destinoLabel || '').replace(/^[^\p{L}]+/u, '')}</small></div><span class="sx-pill ${SX_BZ_EST[c.estado] || 'info'}">${sxEsc(c.estadoLabel)}</span></header>
        <ol class="sx-hilo" aria-label="Mensajes">${(c.mensajes || []).map((m) => `<li class="sx-hmsg ${m.autor === 'equipo' ? 'eq' : 'yo'}"><small><b>${m.autor === 'equipo' ? sxEsc(m.nombre || 'Equipo') : 'Usted'}</b> · ${m.origen === 'telegram' ? 'Telegram' : 'Web'} · ${sxFechaHora(m.at)}</small><p>${sxEsc(m.texto)}</p></li>`).join('')}</ol>
        ${c.legacy ? '<p class="sx-help">Sugerencia anterior (solo lectura).</p>' : `<label class="sx-field"><span>Responder</span><textarea id="sxBzResp" rows="3" maxlength="3000"></textarea></label>${sxBz.msg.t ? `<div class="sx-msg ${sxBz.msg.c}" role="status">${sxEsc(sxBz.msg.t)}</div>` : ''}<button type="button" class="sx-btn pri" data-bz="responder" data-id="${sxAttr(c.id)}">Enviar respuesta</button>`}</section>`;
    }
  } else {
    const l = sxBz.lista;
    cuerpo = `<div class="sx-row-actions"><button type="button" class="sx-btn pri" data-bz="nueva">Nueva consulta</button><button type="button" class="sx-link" data-bz="recargar">Actualizar</button></div>
      ${l === null ? '<div class="sx-card"><p class="sx-help">Cargando consultas…</p></div>' : l.length ? `<ul class="sx-ents">${l.map((c) => `<li class="sx-card sx-ent ${c.noLeidas ? 'nueva' : ''}"><button type="button" class="sx-bz-item" data-bz="abrir" data-id="${sxAttr(c.id)}"><b>${c.numero ? `#${sxEsc(c.numero)} · ` : ''}${sxEsc(c.asunto)}</b><span><span class="sx-pill ${SX_BZ_EST[c.estado] || 'info'}">${sxEsc(c.estadoLabel)}</span>${c.noLeidas ? ` <span class="sx-pill new">${c.noLeidas} nueva${c.noLeidas === 1 ? '' : 's'}</span>` : ''}${c.pedidoRef ? ` · Pedido #${sxEsc(c.pedidoRef)}` : ''}</span><small>${sxEsc((c.mensajes || []).slice(-1)[0]?.texto?.slice(0, 120) || '')}</small></button></li>`).join('')}</ul>` : '<div class="sx-card sx-empty"><b>Sin consultas</b><p>Use “Nueva consulta” para escribirle al equipo. Para un pedido, también puede consultar desde su detalle.</p></div>'}`;
  }
  content.innerHTML = `<div class="sx-page"><header class="sx-page-head"><div><small>Comunicación con el equipo</small><h1>Soporte y buzón</h1></div></header>${tabs}${cuerpo}</div>`;
  if (sxBz.lista === null && !sxBz.cargando) sxBzCargar();
  if (sxBz.nueva || sxBz.abierto) document.getElementById('sxBzTitulo')?.focus({ preventScroll: true });
  actualizarBadgeBuzon();
}
async function sxBzClick(ev) {
  const b = ev.target.closest('[data-bz]'); if (!b || current !== 'buzon') return;
  const a = b.dataset.bz;
  const leerNueva = () => { if (!sxBz.nueva) return; sxBz.nueva.asunto = document.getElementById('sxBzAsunto')?.value || ''; sxBz.nueva.texto = document.getElementById('sxBzTexto')?.value || ''; const sel = document.getElementById('sxBzPedido'); if (sel) sxBz.nueva.pedidoId = sel.value; };
  if (a === 'tab') { sxBz.tab = b.dataset.v; sxBz.abierto = ''; sxBz.msg = { t: '', c: '' }; vSugerencias(); return; }
  if (a === 'avisos-recargar') { await loadAvisos(); vSugerencias(); return; }
  if (a === 'recargar') { sxBz.lista = null; vSugerencias(); return; }
  if (a === 'nueva') { sxBz.nueva = {}; sxBz.op = ''; sxBz.msg = { t: '', c: '' }; vSugerencias(); return; }
  if (a === 'cancelar-nueva') { sxBz.nueva = null; sxBz.msg = { t: '', c: '' }; vSugerencias(); return; }
  if (a === 'destino') { leerNueva(); sxBz.nueva.destino = b.dataset.v; vSugerencias(); return; }
  if (a === 'abrir') { sxBz.abierto = b.dataset.id; sxBz.msg = { t: '', c: '' }; vSugerencias(); return; }
  if (a === 'volver') { sxBz.abierto = ''; sxBz.msg = { t: '', c: '' }; vSugerencias(); return; }
  if (a === 'enviar-nueva') {
    leerNueva(); const n = sxBz.nueva;
    if (!String(n.asunto || '').trim() || !String(n.texto || '').trim()) { sxBz.msg = { t: 'Escriba el asunto y el mensaje.', c: 'err' }; vSugerencias(); document.getElementById(!String(n.asunto || '').trim() ? 'sxBzAsunto' : 'sxBzTexto')?.focus(); return; }
    sxBz.op = sxBz.op || nuevoOpId(); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const r = await API.call('/rev/consultas', { method: 'POST', body: JSON.stringify({ asunto: n.asunto, texto: n.texto, pedidoId: n.pedidoId || '', entregaId: n.entregaId || '', destino: n.destino || 'sublicuentas', opId: sxBz.op }) });
      sxBz.nueva = null; sxBz.op = ''; sxBz.lista = [r.consulta, ...(sxBz.lista || []).filter((x) => x.id !== r.consulta.id)]; sxBz.abierto = r.consulta.id;
      sxBz.msg = { t: `✅ Consulta #${r.consulta.numero} enviada.`, c: 'ok' }; vSugerencias();
    } catch (e) { b.disabled = false; b.textContent = 'Enviar consulta'; sxBz.msg = { t: e?.error === 'pedido_ajeno' ? 'Ese pedido no es suyo.' : 'No se pudo enviar. Sus datos siguen aquí: intente de nuevo.', c: 'err' }; vSugerencias(); }
    return;
  }
  if (a === 'responder') {
    const ta = document.getElementById('sxBzResp'), txt = String(ta?.value || '').trim();
    if (!txt) { ta?.focus(); return; }
    sxBz.opResp = sxBz.opResp || nuevoOpId(); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const r = await API.call(`/rev/consultas/${encodeURIComponent(b.dataset.id)}/mensajes`, { method: 'POST', body: JSON.stringify({ texto: txt, opId: sxBz.opResp }) });
      sxBz.opResp = ''; sxBz.lista = (sxBz.lista || []).map((x) => (x.id === r.consulta.id ? r.consulta : x)); sxBz.msg = { t: '', c: '' }; vSugerencias();
    } catch (_) { b.disabled = false; b.textContent = 'Reintentar'; sxBz.msg = { t: 'No se pudo enviar. Su texto sigue aquí.', c: 'err' }; const keep = txt; vSugerencias(); const t2 = document.getElementById('sxBzResp'); if (t2) t2.value = keep; }
  }
}
content.addEventListener('click', sxBzClick);

/* ---------------- Perfil · Telegram ---------------- */
const sxPerfilBase = vPerfil;
vPerfil = async function () {
  await sxPerfilBase();
  if (current !== 'perfil') return;
  const host = content.querySelector('.profile-layout') || content;
  let card = document.getElementById('sxTgCard');
  if (!card) { card = document.createElement('section'); card.id = 'sxTgCard'; card.className = 'sx-card sx-tg'; host.appendChild(card); }
  card.innerHTML = '<h2>Telegram</h2><p class="sx-help">Consultando…</p>';
  let st = null; try { st = await API.call('/rev/telegram/estado?_=' + Date.now(), { cache: 'no-store', timeoutMs: 12000 }); } catch (_) {}
  sxTgPintar(card, st);
};
function sxTgPintar(card, st, enlace) {
  if (!st) { card.innerHTML = '<h2>Telegram</h2><p class="sx-help">No se pudo consultar el estado. Intente más tarde.</p>'; return; }
  card.innerHTML = `<h2>Telegram</h2>
    ${st.conectado ? `<p><span class="sx-pill ok">Telegram conectado</span>${st.desde ? ` <small class="sx-help">desde ${sxFecha(st.desde)}</small>` : ''}</p><p class="sx-help">Aquí le avisamos cuando un pedido está disponible y le llegan las respuestas del Buzón. El panel sigue siendo el registro principal.</p>
      <div class="sx-row-actions"><button type="button" class="sx-btn sec sm" data-tg="cambiar">Cambiar Telegram</button><button type="button" class="sx-link danger" data-tg="desvincular">Desvincular</button></div>`
    : `<p><span class="sx-pill off">Sin Telegram</span></p><p class="sx-help">Conecte su Telegram para recibir avisos privados de entregas y responder consultas desde el chat.</p>
      <button type="button" class="sx-btn pri sm" data-tg="conectar">Conectar Telegram</button>`}
    ${enlace ? `<div class="sx-banner info" role="status"><span>Toque el botón y presione <b>Iniciar</b> en Telegram. El enlace sirve una sola vez y vence en ${enlace.expiraMin} minutos.</span><a class="sx-btn pri sm" href="${sxAttr(enlace.url)}" target="_blank" rel="noopener noreferrer">Abrir Telegram</a></div>` : ''}`;
  card.onclick = async (ev) => {
    const b = ev.target.closest('[data-tg]'); if (!b) return;
    const a = b.dataset.tg;
    if (a === 'desvincular') {
      if (!confirm('¿Desvincular Telegram? Dejará de recibir avisos y respuestas en el chat (y el acceso al bot con esa cuenta). Los mensajes ya enviados no se borran.')) return;
      try { await API.call('/rev/telegram/desvincular', { method: 'POST', body: '{}' }); sxTgPintar(card, { conectado: false }); sxToast('Telegram desvinculado.'); } catch (_) { sxToast('No se pudo desvincular.'); }
      return;
    }
    if (a === 'conectar' || a === 'cambiar') {
      if (a === 'cambiar' && !confirm('¿Conectar otra cuenta de Telegram? La actual dejará de recibir avisos cuando confirme en la nueva.')) return;
      b.disabled = true;
      try { const r = await API.call('/rev/telegram/vincular', { method: 'POST', body: JSON.stringify({ reemplazar: a === 'cambiar' }) }); sxTgPintar(card, st, r); }
      catch (e) { b.disabled = false; sxToast(e?.error === 'bot_sin_usuario' ? 'El bot no está configurado. Avise a Sublicuentas.' : 'No se pudo generar el enlace.'); }
    }
  };
}

/* ---------------- enlace del aviso (?entrega=…) + arranque ---------------- */
(function sxEnlaceEntrega() {
  try {
    const u = new URL(location.href), id = u.searchParams.get('entrega');
    if (id && /^[A-Za-z0-9_-]{4,160}$/.test(id)) { sessionStorage.setItem('sx_ir_entrega', id); u.searchParams.delete('entrega'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); }
  } catch (_) {}
})();
const sxGoEntregas = go;
go = function (v) {
  if (v !== 'pedidos') sxEntAbiertaId = '';
  sxGoEntregas(v);
  if (!sxNovTimer && API.token && !(isAdmin && !impersonating)) sxIniciarNovedades();
  sxPintarCampana();
  // La caducidad del enlace no importa: se entra con la sesión del socio y el servidor vuelve a comprobar la propiedad.
  let ir = ''; try { ir = sessionStorage.getItem('sx_ir_entrega') || ''; } catch (_) {}
  if (ir && API.token && !(isAdmin && !impersonating)) { try { sessionStorage.removeItem('sx_ir_entrega'); } catch (_) {} setTimeout(() => sxAbrirEntrega(ir), 0); }
};
(function sxArranque() {
  const app = document.getElementById('app');
  if (API.token && app && !app.classList.contains('hide') && !(isAdmin && !impersonating)) go(current || 'inicio');
})();
