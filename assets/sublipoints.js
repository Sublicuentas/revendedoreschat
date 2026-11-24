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
    if (typeof API === 'undefined' || !API.token || (typeof isAdmin !== 'undefined' && isAdmin && !(typeof impersonating !== 'undefined' && impersonating))) return null;
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
  let vistaRec = null, cargandoRec = null, cargadoRecAt = 0, errRec = null;
  async function cargarRec(forzar) {
    if (typeof API === 'undefined' || !API.token || (typeof isAdmin !== 'undefined' && isAdmin && !(typeof impersonating !== 'undefined' && impersonating))) return null;
    if (!forzar && vistaRec && Date.now() - cargadoRecAt < 30000) return vistaRec;
    if (cargandoRec) return cargandoRec;
    cargandoRec = API.call('/rev/recompensas-sp').then((d) => { errRec = null; if (d && d.ok) { vistaRec = d; cargadoRecAt = Date.now(); datos = d.resumen; cargadoAt = Date.now(); } return vistaRec; }).catch((e) => { errRec = e || { error: 'network' }; return vistaRec; }).finally(() => { cargandoRec = null; });
    return cargandoRec;
  }
  /* R219 · Recompensas en bloques 3D (PDF «Recompensas + SubliPoints · maqueta 3D»). Misma lógica y datos del
     servidor (/rev/recompensas-sp): solo cambia la presentación. Íconos propios en SVG (sin logos de marcas). */
  const CHIP = { disponible: ['ok', 'Disponible'], bloqueado: ['off', 'Bloqueado'], agotado: ['bad', 'Agotado'], solicitado: ['info', 'Solicitado'] };
  const ESTADO_CHIP = { pendiente_aprobacion: 'warn', aprobada: 'info', entregada: 'ok', rechazada: 'bad', pendiente: 'warn' };
  const SOL_CHIP = { pendiente_aprobacion: ['warn', 'Pendiente'], pendiente: ['warn', 'Pendiente'], aprobada: ['info', 'Aprobada'], entregada: ['ok', 'Entregado'], rechazada: ['bad', 'Rechazado'] };
  const S = (inner, vb = '0 0 24 24', cls = '') => `<svg class="rw-i ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
  const ST = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const IC = {
    candado: `<rect x="5" y="10.5" width="14" height="10" rx="2.2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${ST}/>`,
    check: `<path d="m5 12.5 4.5 4.5L19 7.5" ${ST} stroke-width="3"/>`,
    reloj: `<circle cx="12" cy="12" r="8.5" ${ST}/><path d="M12 7.5V12l3 2" ${ST}/>`,
    cruz: `<path d="M7 7l10 10M17 7 7 17" ${ST} stroke-width="2.8"/>`,
    vacio: `<circle cx="12" cy="12" r="8.5" ${ST}/><path d="M6 18 18 6" ${ST}/>`,
    regalo: `<rect x="3.5" y="9" width="17" height="11.5" rx="2" ${ST}/><path d="M2.5 9h19M12 9v11.5M12 9c-1.5-4-6-4.5-6-2s3.5 2 6 2c2.5 0 6 .5 6-2s-4.5-2-6 2" ${ST}/>`,
    tv: `<rect x="2.5" y="4.5" width="19" height="12.5" rx="2" ${ST}/><path d="M8 20.5h8M12 17v3.5" ${ST}/>`,
    libro: `<path d="M3 5.5c3-1 6-1 9 1v13c-3-2-6-2-9-1Z" ${ST}/><path d="M21 5.5c-3-1-6-1-9 1v13c3-2 6-2 9-1Z" ${ST}/>`,
    pincel: `<path d="M14.5 4.5 19.5 9.5 11 18H6v-5Z" ${ST}/><path d="m12.5 6.5 5 5" ${ST}/>`,
    idioma: `<path d="M4 5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3.5V14H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" ${ST}/><path d="M17.5 9H20a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-3.5-3H12" ${ST}/>`,
    birrete: `<path d="m2 9.5 10-5 10 5-10 5Z" ${ST}/><path d="M6 11.5V16c1.6 1.6 3.8 2.5 6 2.5s4.4-.9 6-2.5v-4.5M21.5 9.5v5" ${ST}/>`,
    play: `<rect x="2.5" y="4.5" width="19" height="13" rx="2.5" ${ST}/><path d="M10 8.3v5.4l4.6-2.7Z" fill="currentColor"/><path d="M8 20.5h8" ${ST}/>`,
    chispa: `<path d="M12 2.5c.6 4.9 4.6 8.9 9.5 9.5-4.9.6-8.9 4.6-9.5 9.5-.6-4.9-4.6-8.9-9.5-9.5 4.9-.6 8.9-4.6 9.5-9.5Z" fill="currentColor"/>`,
    claqueta: `<rect x="3" y="9" width="18" height="11.5" rx="2" ${ST}/><path d="M3 9 4.6 4.2l16.2 2.5L21 9M8.5 4.9 7.5 9M14 5.8 13 9" ${ST}/>`,
    tarjeta: `<rect x="2.5" y="5.5" width="19" height="13" rx="2.5" ${ST}/><path d="M2.5 10h19M6 15h4" ${ST}/>`,
  };
  const PROD = { dia_appletv: ['slate', IC.tv], dia_elevenreader: ['vio', IC.libro], dia_canva_edu: ['cyan', IC.pincel], ley_duolingo: ['green', IC.idioma], ley_openenglish: ['blue', IC.birrete], ley_prime: ['sky', IC.play], inm_gemini: ['indigo', IC.chispa], inm_hbo: ['plum', IC.claqueta], inm_giftcard_100: ['red', IC.regalo] };
  const prodIc = (x) => { const [t, i] = PROD[x.id] || (x.tipo === 'giftcard' ? ['red', IC.regalo] : ['slate', IC.regalo]); return `<span class="rw-prod-ic t-${t}" aria-hidden="true">${S(i)}</span>`; };
  /* piezas: studs dibujados (cilindro + tapa), color por --t/--td */
  const studs = (n, cls = '') => { const w = 22, g = 14, W = n * w + (n - 1) * g; let r = ''; for (let i = 0; i < n; i++) { const x = i * (w + g); r += `<rect x="${x}" y="4" width="${w}" height="9" rx="3" class="sd"/><ellipse cx="${x + w / 2}" cy="4.5" rx="${w / 2}" ry="4" class="st"/><ellipse cx="${x + w / 2 - 3}" cy="3.6" rx="4.5" ry="1.4" class="sh"/>`; } return `<svg class="rw-st ${cls}" viewBox="0 0 ${W} 13" preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">${r}</svg>`; };
  const TROFEO = `<svg class="rw-trofeo" viewBox="0 0 80 80" aria-hidden="true" focusable="false"><rect x="14" y="58" width="52" height="20" rx="4" fill="#A9141A"/><rect x="14" y="56" width="52" height="17" rx="4" fill="#DE1F25"/><rect x="22" y="51" width="11" height="7" rx="2.5" fill="#A9141A"/><rect x="47" y="51" width="11" height="7" rx="2.5" fill="#A9141A"/>
    <path d="M14 14h8v8a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-2a6 6 0 0 1 6-6Zm52 0h-8v8a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-2a6 6 0 0 0-6-6Z" fill="none" stroke="#C68F00" stroke-width="5"/>
    <path d="M20 6h40v18a20 20 0 0 1-40 0Z" fill="#C68F00"/><path d="M20 4h40v18a20 20 0 0 1-40 0Z" fill="#F8BA15"/><rect x="34" y="40" width="12" height="10" fill="#C68F00"/><rect x="28" y="47" width="24" height="7" rx="2" fill="#F8BA15"/>
    <path d="m40 11 3.1 6.3 6.9 1-5 4.9 1.2 6.9L40 26.8l-6.2 3.3 1.2-6.9-5-4.9 6.9-1Z" fill="#fff"/></svg>`;
  const DECO_PIEZAS = `<svg class="rw-deco" viewBox="0 0 120 70" aria-hidden="true" focusable="false"><g transform="rotate(-8 40 30)"><rect x="6" y="24" width="64" height="26" rx="4" fill="#A9141A"/><rect x="6" y="22" width="64" height="22" rx="4" fill="#DE1F25"/><rect x="14" y="15" width="14" height="9" rx="3" fill="#A9141A"/><ellipse cx="21" cy="15.5" rx="7" ry="3" fill="#DE1F25"/><rect x="44" y="15" width="14" height="9" rx="3" fill="#A9141A"/><ellipse cx="51" cy="15.5" rx="7" ry="3" fill="#DE1F25"/></g><g transform="rotate(-10 88 46)"><rect x="62" y="44" width="52" height="24" rx="4" fill="#0C68AA"/><rect x="62" y="42" width="52" height="20" rx="4" fill="#148DE1"/><rect x="70" y="35" width="13" height="9" rx="3" fill="#0C68AA"/><ellipse cx="76.5" cy="35.5" rx="6.5" ry="3" fill="#148DE1"/><rect x="93" y="35" width="13" height="9" rx="3" fill="#0C68AA"/><ellipse cx="99.5" cy="35.5" rx="6.5" ry="3" fill="#148DE1"/></g></svg>`;
  const ESTRELLA = `<svg class="rw-estrella" viewBox="0 0 64 60" aria-hidden="true" focusable="false"><rect x="4" y="14" width="56" height="44" rx="8" fill="#C68F00"/><rect x="4" y="12" width="56" height="40" rx="8" fill="#F8BA15"/><rect x="13" y="4" width="14" height="10" rx="3" fill="#C68F00"/><ellipse cx="20" cy="4.8" rx="7" ry="3" fill="#FFD45C"/><rect x="37" y="4" width="14" height="10" rx="3" fill="#C68F00"/><ellipse cx="44" cy="4.8" rx="7" ry="3" fill="#FFD45C"/><path d="m32 18 4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3L32 39.4l-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4Z" fill="#fff"/></svg>`;
  const INSIGNIA = {
    Diamante: `<svg class="rw-insig" viewBox="0 0 64 60" aria-hidden="true" focusable="false"><path d="M8 50h48l-4 8H12Z" fill="#0C68AA"/><path d="M16 6h32l12 16-28 32L4 22Z" fill="#0C68AA"/><path d="M16 4h32l12 16-28 32L4 20Z" fill="#3FB0F5"/><path d="M4 20h56M22 4l-6 16 16 32 16-32-6-16M16 20l16-16 16 16" fill="none" stroke="#0C68AA" stroke-width="2" stroke-linejoin="round"/><path d="M20 8h8l-5 8h-9Z" fill="#fff" opacity=".55"/></svg>`,
    Leyenda: `<svg class="rw-insig" viewBox="0 0 64 60" aria-hidden="true" focusable="false"><rect x="8" y="44" width="48" height="14" rx="4" fill="#5629A0"/><rect x="8" y="42" width="48" height="12" rx="4" fill="#783ED2"/><path d="M8 40 4 12l16 12 12-18 12 18 16-12-4 28Z" fill="#C68F00"/><path d="M8 38 4 10l16 12 12-18 12 18 16-12-4 28Z" fill="#F8BA15"/><circle cx="32" cy="27" r="5" fill="#DE1F25"/><circle cx="4" cy="10" r="3.5" fill="#F8BA15"/><circle cx="60" cy="10" r="3.5" fill="#F8BA15"/><circle cx="32" cy="4" r="3.5" fill="#F8BA15"/></svg>`,
    Inmortal: `<svg class="rw-insig" viewBox="0 0 72 60" aria-hidden="true" focusable="false"><path d="M18 30C8 30 2 22 2 14c6 6 12 6 16 4Zm36 0c10 0 16-8 16-16-6 6-12 6-16 4Z" fill="#C68F00"/><path d="M18 26C9 26 3 19 3 12c6 5 11 5 15 3Zm36 0c9 0 15-7 15-14-6 5-11 5-15 3Z" fill="#FFD45C"/><rect x="18" y="46" width="36" height="12" rx="4" fill="#C68F00"/><rect x="18" y="44" width="36" height="10" rx="4" fill="#F8BA15"/><path d="m36 6 6.8 13.8 15.2 2.2-11 10.7 2.6 15.2L36 40.8l-13.6 7.1L25 32.7 14 22l15.2-2.2Z" fill="#C68F00"/><path d="m36 3 6.8 13.8 15.2 2.2-11 10.7 2.6 15.2L36 37.8l-13.6 7.1L25 29.7 14 19l15.2-2.2Z" fill="#F8BA15"/><path d="m36 10 3 6-6 1Z" fill="#fff" opacity=".6"/></svg>`,
  };
  /* la fila de studs lleva solo piezas completas según el ancho real de la tarjeta */
  function ajustarStuds(root) {
    requestAnimationFrame(() => (root || document).querySelectorAll('.rw-page .rw-st.fila').forEach((sv) => {
      const w = sv.parentElement.getBoundingClientRect().width - 56; if (w <= 0) return;
      const n = Math.max(3, Math.floor((w + 14) / 36)), html = studs(n, 'fila'), t = document.createElement('div'); t.innerHTML = html;
      const nuevo = t.firstChild; nuevo.style.width = (n * 36 - 14) + 'px'; nuevo.style.left = '50%'; nuevo.style.marginLeft = -((n * 36 - 14) / 2) + 'px'; sv.replaceWith(nuevo);
    }));
  }
  let rwT = 0; window.addEventListener('resize', () => { clearTimeout(rwT); rwT = setTimeout(() => { if (typeof current !== 'undefined' && current === 'recompensas') ajustarStuds(document.getElementById('content')); }, 150); });
  const NIV_TONO = { Diamante: 'blue', Leyenda: 'vio', Inmortal: 'gold' };
  function badgeItem(x, sm) {
    if (x.estado === 'solicitado' && sm) { const [k, t] = SOL_CHIP[sm.estado] || ['warn', 'Pendiente']; return `<span class="rw-badge ${k}">${S(sm.estado === 'entregada' ? IC.check : IC.reloj)}${t}</span>`; }
    if (x.estado === 'disponible') return `<span class="rw-badge ok">${S(IC.check)}Disponible</span>`;
    if (x.estado === 'agotado') return `<span class="rw-badge bad">${S(IC.vacio)}Agotado</span>`;
    return `<span class="rw-badge off">${S(IC.candado)}Bloqueado</span>`;
  }
  function paginaRecompensas(v) {
    const d = v.resumen || {}; const b = barra(d); const sm = v.solicitudMes;
    const nivelActual = d.nivel || 'Sin nivel';
    const porNivel = NIV.map(([n, min, max]) => {
      const tono = NIV_TONO[n], on = nivelActual === n;
      const items = v.items.filter((x) => x.nivel === n).map((x) => `<li class="sp-premio sp-${x.estado} rw-premio">
          ${prodIc(x)}<div class="rw-premio-tx"><b>${esc(x.nombre)}</b><small>${esc(x.detalle)}</small></div>
          <div class="rw-premio-est">${badgeItem(x, sm)}<em>${esc(x.motivo)}</em></div>
          ${x.estado === 'disponible' ? `<button type="button" class="sx-btn pri sp-elegir rw-elegir" data-sp-elegir="${esc(x.id)}" data-sp-nombre="${esc(x.nombre)}">${S(IC.regalo)}Elegir</button>` : ''}</li>`).join('');
      return `<section class="sx-card sp-nivel rw-nivel t-${tono}${on ? ' on' : ''}" aria-label="Nivel ${n}">${studs(14, 'fila')}
        <header class="rw-nivel-h">${INSIGNIA[n]}<span class="rw-nivel-tx"><b>${n}</b><small>${min}${max ? `–${max}` : '+'} puntos al mes</small></span>${on ? `<span class="rw-badge ok rw-su">${S(IC.check)}Su nivel este mes</span>` : ''}<i class="rw-nivel-esq" aria-hidden="true"><i></i><i></i></i></header>
        <ul class="sp-premios rw-premios">${items}</ul></section>`;
    }).join('');
    const solMes = sm ? (() => { const [k, t] = SOL_CHIP[sm.estado] || ['warn', sm.estadoTexto]; return `<section class="sx-card sp-card sp-sol rw-sol"><span class="rw-sol-ic" aria-hidden="true">${S(IC.regalo)}</span><div class="rw-sol-tx"><small>Su recompensa de ${esc(mesTxt(sm.mes))}</small><b>${esc(sm.recompensa)}</b><p>${sm.estado === 'pendiente_aprobacion' ? 'Solicitud recibida. El equipo revisa la disponibilidad y se la entrega manualmente. Le avisamos en Buzón.' : sm.estado === 'aprobada' ? 'Aprobada. El equipo la está preparando para entregarla.' : sm.estado === 'entregada' ? esc(sm.nota || 'Entregada. Revise su Buzón.') : esc(sm.motivo || '')}</p></div><span class="rw-badge ${k}" title="${esc(sm.estadoTexto)}">${S(sm.estado === 'entregada' ? IC.check : IC.reloj)}${esc(t)}</span></section>`; })() : '';
    const rech = !sm ? (v.solicitudes || []).find((s) => s.programa === 'sublipoints' && s.mes === d.mes && s.estado === 'rechazada') : null;
    const rechHtml = rech ? `<section class="sx-card sp-card rw-sol rw-rech"><span class="rw-sol-ic" aria-hidden="true">${S(IC.cruz)}</span><div class="rw-sol-tx"><small>Solicitud de ${esc(mesTxt(rech.mes))}</small><b>${esc(rech.recompensa)}</b><p>Rechazada${rech.motivo ? ': ' + esc(rech.motivo) : ''}. Puede elegir otra recompensa de su nivel.</p></div><span class="rw-badge bad">${S(IC.cruz)}Rechazado</span></section>` : '';
    const promo = Number(v.saldoPromocional) > 0 ? `<section class="sx-card sp-card sp-promo rw-gift"><div class="rw-gift-card" aria-hidden="true"><span>SUBLICUENTAS</span><b>GIFT CARD</b>${S(IC.tarjeta)}</div><div class="rw-sol-tx"><small>Gift Card Sublicuentas · saldo promocional</small><b class="rw-gift-monto">L${Number(v.saldoPromocional).toLocaleString('es-HN')}</b><p>No es efectivo ni se puede retirar. Úsela al pagar un pedido con «Saldo de billetera» (todos los productos menos Netflix).</p></div></section>` : '';
    const hist = (v.solicitudes || []).filter((s) => (!sm || s.id !== sm.id) && (!rech || s.id !== rech.id)).slice(0, 12).map((s) => `<li><span>${esc(s.recompensa)}<small>${s.programa === 'sublipoints' ? esc(mesTxt(s.mes)) + ' · ' + esc(s.nivel) : 'Programa anterior · ' + esc(s.nivel)}${s.estado === 'rechazada' && s.motivo ? ' · ' + esc(s.motivo) : ''}</small></span><span class="sx-pill ${ESTADO_CHIP[s.estado] || (s.estado === 'entregada' ? 'ok' : '')}">${esc(s.estadoTexto)}</span></li>`).join('');
    const excl = d.excluido ? '<section class="sx-card sp-card rw-aviso"><b>Las cuentas de Sublicuentas y Relojes no participan en SubliPoints.</b><p class="sp-help">Aquí se ve el programa tal como lo ven los socios.</p></section>' : '';
    const vn = Number(d.ventasNuevas) || 0, rn = Number(d.renovaciones) || 0;
    return `<div class="sx-page sp-page rw-page" data-sp-page="ok" data-v="${cargadoRecAt}">
      <div class="sx-page-head rw-head">${TROFEO}<div class="rw-head-tx"><h1>Recompensas</h1><small>SubliPoints · ${esc(mesTxt(d.mes))}</small></div>${DECO_PIEZAS}</div>
      ${excl}
      <section class="sx-card sp-card rw-prog" data-sp="recompensas">${studs(14, 'fila')}<i class="rw-prog-esq" aria-hidden="true"></i>
        <div class="rw-prog-top">${ESTRELLA}<div class="rw-prog-tx"><small>Puntos de ${esc(mesTxt(d.mes))}</small><b><span class="sp-num">${Number(d.puntos) || 0}</span> puntos · ${esc(nivelActual)}</b></div></div>
        <div class="sp-bar rw-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${b.pct}" aria-label="${esc(b.txt)}"><i style="width:${b.pct}%"></i></div>
        <div class="rw-desglose"><span>${vn} venta${vn === 1 ? '' : 's'} nueva${vn === 1 ? '' : 's'} <b>+${vn * 2}</b></span><span>${rn} renovaci${rn === 1 ? 'ón' : 'ones'} <b>+${rn}</b></span></div>
        <p class="sp-help rw-help">${esc(b.txt)}. Venta nueva con pago confirmado <b>+2</b> por servicio · renovación con pago confirmado <b>+1</b>. Una recompensa por mes, del nivel más alto que tenga cuando la elija. Los puntos empiezan de cero cada mes.</p></section>
      ${solMes}${rechHtml}${promo}
      <div class="rw-niveles">${porNivel}</div>
      ${hist ? `<section class="sx-card sp-card rw-hist"><b>Historial de recompensas</b><ul class="sp-histrec">${hist}</ul></section>` : ''}
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
    await cargarRec(true); const c = document.getElementById('content'); if (c && current === 'recompensas') { c.innerHTML = paginaRecompensas(vistaRec); ajustarStuds(c); }
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
      content.innerHTML = vistaRec ? paginaRecompensas(vistaRec) : '<div class="sx-page" data-sp-page="cargando"><div class="spin"></div></div>'; ajustarStuds(content);
      const v = await cargarRec(); if (current !== 'recompensas') return;
      const pag = content.querySelector('[data-sp-page]');
      if (!v) { if (pag && pag.dataset.spPage === 'cargando') content.innerHTML = `<div class="sx-page" data-sp-page="error"><section class="sx-card sp-card"><b>${errRec && errRec.error === 'sin_permiso_recompensas' ? 'Recompensas no está activado para esta cuenta.' : 'No se pudo cargar Recompensas.'}</b><p class="sp-help">${errRec && errRec.error === 'sin_permiso_recompensas' ? 'Pídale al equipo de Sublicuentas que active Recompensas en su perfil de socio.' : 'Revise su conexión e intente de nuevo.'}</p><button type="button" class="sx-btn pri" onclick="SubliPoints.recargar()">Reintentar</button></section></div>`; return; }
      if (!pag || pag.dataset.spPage !== 'ok' || pag.dataset.v !== String(cargadoRecAt)) { content.innerHTML = paginaRecompensas(v); ajustarStuds(content); }
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
