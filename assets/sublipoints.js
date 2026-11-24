/* =====================================================================================================
   R203 · SubliPoints (Fase 1) en el Panel de Socios.
   · Inicio: bloque «SubliPoints del mes» (puntos, nivel, cuánto falta, ventas nuevas y renovaciones cobradas).
   · Recompensas: los tres niveles del mes con su rango de puntos y el historial de meses.
   · Panel Dios › Comprobantes: «Confirmar pago» por renovación (solo así suma +1) y ranking del mes.
   · Pedidos: el estado «Pago confirmado» se muestra como tal.
   Solo lee /rev/sublipoints (lo suyo) y, en Panel Dios, /rev/admin/sublipoints. No cambia compras ni precios.
   ===================================================================================================== */
(function () {
  'use strict';
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NIV = [['Diamante', 10, 24, 'blue'], ['Leyenda', 25, 49, 'purple'], ['Inmortal', 50, null, 'amber']];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesTxt = (m) => { const [y, n] = String(m || '').split('-'); return n ? `${MESES[Number(n) - 1]} ${y}` : ''; };
  let datos = null, cargando = null, cargadoAt = 0;

  async function cargar(forzar) {
    if (typeof API === 'undefined' || !API.token || (typeof isAdmin !== 'undefined' && isAdmin)) return null;
    if (!forzar && datos && Date.now() - cargadoAt < 60000) return datos;
    if (cargando) return cargando;
    cargando = API.call('/rev/sublipoints').then((d) => { datos = d && d.ok ? d : null; cargadoAt = Date.now(); return datos; }).catch(() => null).finally(() => { cargando = null; });
    return cargando;
  }

  function barra(d) {
    const p = Number(d.puntos) || 0, sig = d.siguiente;
    if (!sig) return { pct: 100, txt: 'Nivel máximo del mes alcanzado' };
    const base = p < 10 ? 0 : p < 25 ? 10 : 25;
    return { pct: Math.max(4, Math.min(100, Math.round(((p - base) / (sig.min - base)) * 100))), txt: `Le faltan ${sig.faltan} punto${sig.faltan === 1 ? '' : 's'} para ${sig.nivel}` };
  }
  function tarjetaInicio(d) {
    const b = barra(d);
    return `<section class="sx-card sp-card" data-sp="inicio" aria-label="SubliPoints del mes">
      <div class="sp-top"><span class="sp-ic" aria-hidden="true">★</span><div class="sp-tx"><small>SubliPoints · ${esc(mesTxt(d.mes))}</small><b><span class="sp-num">${Number(d.puntos) || 0}</span> puntos · ${esc(d.nivel)}</b></div><button type="button" class="sx-link sp-ver" onclick="go('recompensas')">Ver niveles</button></div>
      <div class="sp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.pct}" aria-label="${esc(b.txt)}"><i style="width:${b.pct}%"></i></div>
      <p class="sp-help">${esc(b.txt)} · ${Number(d.ventasNuevas) || 0} venta${d.ventasNuevas === 1 ? '' : 's'} nueva${d.ventasNuevas === 1 ? '' : 's'} (+2) · ${Number(d.renovaciones) || 0} renovaci${d.renovaciones === 1 ? 'ón' : 'ones'} (+1)</p>
    </section>`;
  }
  let vistaRec = null, cargandoRec = null, cargadoRecAt = 0;
  async function cargarRec(forzar) {
    if (typeof API === 'undefined' || !API.token || (typeof isAdmin !== 'undefined' && isAdmin)) return null;
    if (!forzar && vistaRec && Date.now() - cargadoRecAt < 30000) return vistaRec;
    if (cargandoRec) return cargandoRec;
    cargandoRec = API.call('/rev/recompensas-sp').then((d) => { if (d && d.ok) { vistaRec = d; cargadoRecAt = Date.now(); datos = d.resumen; cargadoAt = Date.now(); } return vistaRec; }).catch(() => vistaRec).finally(() => { cargandoRec = null; });
    return cargandoRec;
  }
  const CHIP = { disponible: ['ok', 'Disponible'], bloqueado: ['off', 'Bloqueado'], agotado: ['bad', 'Agotado'], solicitado: ['info', 'Solicitado'] };
  const ESTADO_CHIP = { pendiente_aprobacion: 'warn', aprobada: 'info', entregada: 'ok', rechazada: 'bad', pendiente: 'warn' };
  function paginaRecompensas(v) {
    const d = v.resumen || {}; const b = barra(d);
    const porNivel = NIV.map(([n, min, max, tone]) => {
      const items = v.items.filter((x) => x.nivel === n).map((x) => {
        const [k, t] = CHIP[x.estado] || CHIP.bloqueado;
        return `<li class="sp-premio sp-${x.estado}"><div class="sp-premio-tx"><b>${esc(x.nombre)}</b><small>${esc(x.detalle)}</small><span class="sx-pill ${k === 'off' ? '' : k}">${t}</span><em>${esc(x.motivo)}</em></div>${x.estado === 'disponible' ? `<button type="button" class="sx-btn pri sp-elegir" data-sp-elegir="${esc(x.id)}" data-sp-nombre="${esc(x.nombre)}">Elegir</button>` : ''}</li>`;
      }).join('');
      const on = d.nivel === n;
      return `<section class="sx-card sp-nivel sp-${tone}${on ? ' on' : ''}" aria-label="Nivel ${n}"><header><b>${n}</b><small>${min}${max ? `–${max}` : '+'} puntos al mes</small>${on ? '<span class="sx-pill ok">Su nivel este mes</span>' : ''}</header><ul class="sp-premios">${items}</ul></section>`;
    }).join('');
    const sm = v.solicitudMes;
    const solMes = sm ? `<section class="sx-card sp-card sp-sol"><div class="sp-top"><span class="sp-ic" aria-hidden="true">🎁</span><div class="sp-tx"><small>Su recompensa de ${esc(mesTxt(sm.mes))}</small><b>${esc(sm.recompensa)}</b></div><span class="sx-pill ${ESTADO_CHIP[sm.estado] || ''}">${esc(sm.estadoTexto)}</span></div><p class="sp-help">${sm.estado === 'pendiente_aprobacion' ? 'El equipo revisa la disponibilidad y se la entrega manualmente. Le avisamos en Buzón.' : sm.estado === 'aprobada' ? 'Aprobada. El equipo la está preparando para entregarla.' : sm.estado === 'entregada' ? esc(sm.nota || 'Entregada. Revise su Buzón.') : esc(sm.motivo || '')}</p></section>` : '';
    const promo = Number(v.saldoPromocional) > 0 ? `<section class="sx-card sp-card sp-promo"><div class="sp-top"><span class="sp-ic" aria-hidden="true">💳</span><div class="sp-tx"><small>Gift Card Sublicuentas · saldo promocional</small><b>L${Number(v.saldoPromocional).toLocaleString('es-HN')}</b></div></div><p class="sp-help">No es efectivo ni se puede retirar. Se podrá usar en la tienda (todos los productos menos Netflix) cuando se active el pago con saldo.</p></section>` : '';
    const hist = (v.solicitudes || []).filter((s) => !sm || s.id !== sm.id).slice(0, 12).map((s) => `<li><span>${esc(s.recompensa)}<small>${s.programa === 'sublipoints' ? esc(mesTxt(s.mes)) + ' · ' + esc(s.nivel) : 'Programa anterior · ' + esc(s.nivel)}</small></span><span class="sx-pill ${ESTADO_CHIP[s.estado] || (s.estado === 'entregada' ? 'ok' : '')}">${esc(s.estadoTexto)}</span></li>`).join('');
    const excl = d.excluido ? '<section class="sx-card sp-card"><b>Las cuentas de Sublicuentas y Relojes no participan en SubliPoints.</b><p class="sp-help">Aquí se ve el programa tal como lo ven los socios.</p></section>' : '';
    return `<div class="sx-page sp-page" data-sp-page="ok" data-v="${cargadoRecAt}">
      <div class="sx-page-head"><h1>Recompensas</h1><small>SubliPoints · ${esc(mesTxt(d.mes))}</small></div>
      ${excl}
      <section class="sx-card sp-card" data-sp="recompensas"><div class="sp-top"><span class="sp-ic" aria-hidden="true">★</span><div class="sp-tx"><small>Puntos de ${esc(mesTxt(d.mes))}</small><b><span class="sp-num">${Number(d.puntos) || 0}</span> puntos · ${esc(d.nivel || 'Sin nivel')}</b></div></div>
        <div class="sp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.pct}" aria-label="${esc(b.txt)}"><i style="width:${b.pct}%"></i></div>
        <p class="sp-help">${esc(b.txt)}. Venta nueva con pago confirmado <b>+2</b> por servicio · renovación con pago confirmado <b>+1</b>. Una recompensa por mes, del nivel más alto que tenga cuando la elija. Los puntos empiezan de cero cada mes.</p></section>
      ${solMes}${promo}
      ${porNivel}
      ${hist ? `<section class="sx-card sp-card"><b>Historial de recompensas</b><ul class="sp-histrec">${hist}</ul></section>` : ''}
    </div>`;
  }
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('[data-sp-elegir]'); if (!btn) return;
    const nombre = btn.dataset.spNombre, nivel = (vistaRec && vistaRec.resumen && vistaRec.resumen.nivel) || '';
    if (!confirm(`¿Elegir «${nombre}» como su recompensa ${nivel} de este mes?\n\nSolo puede elegir UNA por mes. Si sube de nivel después, ya no podrá cambiarla.`)) return;
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      await API.call('/rev/recompensas-sp/solicitar', { method: 'POST', body: JSON.stringify({ recompensaId: btn.dataset.spElegir }) });
      if (typeof sxToast === 'function') sxToast('Recompensa solicitada. El equipo la revisa y se la entrega manualmente.');
    } catch (err) {
      const m = { ya_eligio_este_mes: 'Ya eligió su recompensa de este mes.', nivel_no_corresponde: err.detail || 'Ese premio no corresponde a su nivel de este mes.', agotado: 'Ese premio se agotó. Elija otro de su nivel.', sin_nivel: 'Necesita al menos 10 puntos este mes.', no_participa: 'Esta cuenta no participa.' }[err.error] || 'No se pudo enviar. Intente de nuevo.';
      if (typeof sxToast === 'function') sxToast(m);
    }
    await cargarRec(true); const c = document.getElementById('content'); if (c && current === 'recompensas') c.innerHTML = paginaRecompensas(vistaRec);
  });

  async function pintar() {
    if (typeof current === 'undefined') return;
    const content = document.getElementById('content'); if (!content) return;
    if (current === 'inicio') {
      const kpis = content.querySelector('.sxg-kpis'); if (!kpis || content.querySelector('[data-sp=inicio]')) return;
      const d = await cargar(); if (!d || current !== 'inicio' || content.querySelector('[data-sp=inicio]')) return;
      kpis.insertAdjacentHTML('afterend', tarjetaInicio(d));
    } else if (current === 'recompensas') {
      if (content.querySelector('[data-sp-page]')) return;
      // R204 · La página de Recompensas ahora es la de SubliPoints (reemplaza la vista anterior por ventas totales).
      content.innerHTML = vistaRec ? paginaRecompensas(vistaRec) : '<div class="sx-page" data-sp-page="cargando"><div class="spin"></div></div>';
      const v = await cargarRec(); if (current !== 'recompensas') return;
      const pag = content.querySelector('[data-sp-page]');
      if (!v) { if (pag && pag.dataset.spPage === 'cargando') content.innerHTML = '<div class="sx-page" data-sp-page="error"><section class="sx-card sp-card"><b>No se pudo cargar Recompensas.</b><p class="sp-help">Revise su conexión e intente de nuevo.</p><button type="button" class="sx-btn pri" onclick="SubliPoints.recargar()">Reintentar</button></section></div>'; return; }
      if (!pag || pag.dataset.spPage !== 'ok' || pag.dataset.v !== String(cargadoRecAt)) content.innerHTML = paginaRecompensas(v);
    }
  }

  /* ---------- Panel Dios ---------- */
  function etiquetaPago(c) {
    if (c.estadoPago === 'confirmado') return `<span class="adm-tag good">💰 Pago confirmado${c.pagoConfirmadoPor ? ' · ' + esc(c.pagoConfirmadoPor) : ''}</span>`;
    if (c.estadoPago === 'anulado') return '<span class="adm-tag tg-err">Pago anulado</span>';
    return '<span class="adm-tag tg-pend">Pago sin confirmar</span>';
  }
  function envolverCompCard() {
    if (typeof compCard !== 'function' || compCard.__sp) return;
    const orig = compCard;
    window.compCard = function (c) {
      let html = orig(c);
      if (!c || !c.renovado) return html;
      const btn = c.estadoPago === 'confirmado'
        ? `<button type="button" class="adm-tg-btn sp-anular" onclick="spPagoRenovacion('${esc(c.id)}','anular')">Anular pago</button>`
        : `<button type="button" class="adm-tg-btn sp-confirmar" onclick="spPagoRenovacion('${esc(c.id)}','confirmar')">Confirmar pago (+${Math.max(1, Number(c.renovadosCantidad) || 1)} SubliPoint${(Number(c.renovadosCantidad) || 1) > 1 ? 's' : ''})</button>`;
      return html.replace(/<\/div>\s*<\/div>\s*$/, `<div class="adm-comp-tags">${etiquetaPago(c)}</div>${btn}</div></div>`);
    };
    window.compCard.__sp = true;
  }
  window.spPagoRenovacion = async function (id, accion) {
    if (accion === 'anular' && !confirm('¿Anular el pago de esta renovación? Se descuentan sus SubliPoints (queda en el historial).')) return;
    const botones = document.querySelectorAll(`[onclick*="spPagoRenovacion('${id}'"]`); botones.forEach((b) => { b.disabled = true; b.textContent = 'Guardando…'; });
    try {
      const r = await API.call(`/rev/admin/comprobantes/${encodeURIComponent(id)}/pago`, { method: 'POST', headers: { Authorization: 'Bearer ' + adminToken }, body: JSON.stringify({ accion }) });
      const c = (typeof adminComps !== 'undefined' ? adminComps : []).find((x) => x.id === id); if (c) { c.estadoPago = r.estadoPago; if (accion === 'confirmar') c.pagoConfirmadoPor = 'usted'; }
      if (typeof renderAdmComps === 'function') renderAdmComps();
      if (typeof sxToast === 'function') sxToast(accion === 'confirmar' ? (r.sublipoints && r.sublipoints.duplicado ? 'Ya estaba confirmado: no se suman puntos dos veces.' : r.sublipoints && r.sublipoints.omitido === 'antes_del_inicio' ? 'Pago confirmado. Es anterior al inicio de SubliPoints: no suma puntos.' : 'Pago confirmado. SubliPoints sumados al socio.') : 'Pago anulado. Puntos descontados.');
      rankingAdmin(true);
    } catch (e) {
      botones.forEach((b) => { b.disabled = false; b.textContent = accion === 'confirmar' ? 'Confirmar pago' : 'Anular pago'; });
      if (typeof sxToast === 'function') sxToast('No se pudo guardar. Intente de nuevo.');
    }
  };
  let ranking = null;
  async function rankingAdmin(forzar) {
    const list = document.getElementById('admCompList'); if (!list || typeof adminToken === 'undefined' || !adminToken) return;
    let box = document.getElementById('spRanking');
    if (!box) { box = document.createElement('div'); box.id = 'spRanking'; list.parentNode.insertBefore(box, list); }
    if (!ranking || forzar) { try { ranking = await API.call('/rev/admin/sublipoints', { headers: { Authorization: 'Bearer ' + adminToken } }); } catch (_) { ranking = null; } }
    if (!ranking) { box.innerHTML = ''; return; }
    const filas = (ranking.ranking || []).slice(0, 12).map((x, i) => `<li><span>${i + 1}. ${esc(x.socio || x.socio_norm)}</span><b>${x.puntos} pts · ${esc(x.nivel)}</b><small>${x.ventasNuevas} nuevas · ${x.renovaciones} renov.</small></li>`).join('');
    box.innerHTML = `<div class="sx-card sp-card sp-admin"><div class="sp-top"><span class="sp-ic" aria-hidden="true">★</span><div class="sp-tx"><small>SubliPoints · ${esc(mesTxt(ranking.mes))}</small><b>Ranking del mes</b></div></div>
      <p class="sp-help">Las renovaciones suman solo al tocar «Confirmar pago». Los pedidos suman al marcarlos «Pago confirmado» o «Entregado» en Sublichat › Revendedores. En vigor desde ${esc(new Date(ranking.inicio).toLocaleString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</p>
      ${filas ? `<ol class="sp-rank">${filas}</ol>` : '<p class="sp-help">Todavía no hay puntos este mes.</p>'}</div>`;
  }
  function envolverRenderAdmComps() {
    if (typeof renderAdmComps !== 'function' || renderAdmComps.__sp) return;
    const orig = renderAdmComps;
    window.renderAdmComps = function () { const r = orig.apply(this, arguments); rankingAdmin(false); return r; };
    window.renderAdmComps.__sp = true;
  }

  /* ---------- Estado «Pago confirmado» en pedidos del socio ---------- */
  function envolverEstados() {
    if (typeof sxEstadoPedido === 'function' && !sxEstadoPedido.__sp) {
      const o = sxEstadoPedido; window.sxEstadoPedido = function (v) { const s = String(v || '').trim().toLowerCase(); if (s === 'pago confirmado') return ['work', 'Pago confirmado']; return o.apply(this, arguments); }; window.sxEstadoPedido.__sp = true;
    }
    if (typeof orderStatusLabel === 'function' && !orderStatusLabel.__sp) {
      const o = orderStatusLabel; window.orderStatusLabel = function (v) { const s = String(v || '').trim().toLowerCase(); if (s === 'pago confirmado') return ['work', 'Pago confirmado']; return o.apply(this, arguments); }; window.orderStatusLabel.__sp = true;
    }
  }

  const obs = new MutationObserver(() => { pintar(); });
  function iniciar() {
    envolverCompCard(); envolverRenderAdmComps(); envolverEstados();
    const content = document.getElementById('content'); if (content && !iniciar.__obs) { obs.observe(content, { childList: true }); iniciar.__obs = true; }
    pintar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.addEventListener('load', iniciar);
  window.SubliPoints = { cargar, pintar, _tarjetaInicio: tarjetaInicio, recargar: async () => { await cargarRec(true); const c = document.getElementById('content'); if (c) c.innerHTML = ''; pintar(); } };
})();
