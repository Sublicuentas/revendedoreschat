/* =====================================================================================================
   R205 · Mi billetera (Fase 3) en el Panel de Socios.
   · Dos saldos separados: Sublicuentas y Relojes (cada recarga va al negocio que el socio elige).
   · Gift Card / saldo promocional aparte: nunca se presenta como efectivo.
   · Recargar = enviar comprobante. NO acredita nada hasta que el equipo confirme el depósito real.
   · Los saldos vienen del servidor (libro de movimientos). Aquí no se calcula ni suma nada.
   · R206 · Fase 4: «Comprar con saldo» abre Nueva compra; en el paso Pago se elige «Saldo de billetera».
     El cargo, el descuento y la Gift Card los calcula el servidor. La compra con comprobante sigue igual.
   ===================================================================================================== */
(function () {
  'use strict';
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = (n) => `L${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('es-HN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const fecha = (iso) => { try { return new Date(iso).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; } };
  const ICONO = '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M16 13.5h2"/>';
  const TIPOS = { recarga: 'Recarga', compra: 'Pago de pedido', reserva: 'Reserva', liberacion: 'Reserva liberada', devolucion: 'Devolución', premio: 'Premio', ajuste: 'Ajuste' };
  const EST = { pendiente: ['warn', 'Pendiente de verificar'], aprobada: ['ok', 'Acreditada'], rechazada: ['bad', 'Rechazada'] };
  let vista = null, cargando = null, at = 0, formAbierto = false, enviando = false, comprobante = '', reqId = '';
  const puede = () => typeof API !== 'undefined' && API.token && !(typeof isAdmin !== 'undefined' && isAdmin && !(typeof impersonating !== 'undefined' && impersonating)) && !(typeof socioSinCompras === 'function' && socioSinCompras());

  async function cargar(forzar) {
    if (!puede()) return null;
    if (!forzar && vista && Date.now() - at < 30000) return vista;
    if (cargando) return cargando;
    cargando = API.call('/rev/billetera').then((d) => { if (d && d.ok) { vista = d; at = Date.now(); } return vista; }).catch(() => vista).finally(() => { cargando = null; });
    return cargando;
  }
  function nuevoReqId() { reqId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`); }

  function tarjetaSaldo(s) {
    return `<div class="bl-saldo"><small>${esc(s.nombre)}</small><b>${L(s.disponible)}</b><span>Disponible para comprar</span>
      ${s.reservado ? `<em>Reservado en pedidos: ${L(s.reservado)}</em>` : ''}
      ${s.promocional ? `<em class="bl-promo">Gift Card (promocional): ${L(s.promocional)} · no es efectivo</em>` : ''}</div>`;
  }
  function formulario(v) {
    const neg = Object.entries(v.negocios || { sublicuentas: 'Sublicuentas', relojes: 'Relojes' });
    return `<section class="sx-card bl-form" id="blForm" aria-label="Recargar saldo">
      <b class="bl-tit">Recargar saldo</b>
      <p class="sp-help">Haga la transferencia y envíe el comprobante. El saldo se acredita <b>solo cuando el equipo confirme que el dinero llegó</b>.</p>
      <label>¿A qué negocio?<select id="blNeg"><option value="">Elija…</option>${neg.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></label>
      <label>Monto en Lempiras<input id="blMonto" type="number" inputmode="decimal" min="${v.limites.min}" max="${v.limites.max}" step="0.01" placeholder="Ej. 500"></label>
      <label>Banco desde el que pagó<select id="blBanco"><option value="">Elija…</option>${(v.bancos || []).map((b) => `<option>${esc(b)}</option>`).join('')}</select></label>
      <label>Número de referencia o autorización<input id="blRef" maxlength="40" autocomplete="off" placeholder="Como aparece en su comprobante"></label>
      <label>Foto del comprobante<input id="blImg" type="file" accept="image/*"></label>
      <div id="blPrev" class="bl-prev">${comprobante ? '<span class="sx-pill ok">Comprobante listo</span>' : ''}</div>
      <p class="bl-err" id="blErr" role="alert"></p>
      <div class="bl-acc"><button type="button" class="sx-btn sec" data-bl="cerrar">Cancelar</button><button type="button" class="sx-btn pri" data-bl="enviar" ${enviando ? 'disabled' : ''}>${enviando ? 'Enviando…' : 'Enviar comprobante'}</button></div>
    </section>`;
  }
  function pagina(v) {
    const s = v.saldos || {};
    const rec = (v.recargas || []).map((r) => { const [k, t] = EST[r.estado] || ['', r.estado]; return `<li><div><b>${L(r.monto)} · ${esc(r.negocioNombre)}</b><small>${esc(fecha(r.fecha))} · ${esc(r.banco)} · ref ${esc(r.referencia)} · #${esc(r.ref)}</small>${r.estado === 'rechazada' && r.motivo ? `<small class="bl-mot">Motivo: ${esc(r.motivo)}</small>` : ''}${r.estado === 'aprobada' && r.montoAcreditado != null && r.montoAcreditado !== r.monto ? `<small>Acreditado: ${L(r.montoAcreditado)}</small>` : ''}</div><span class="sx-pill ${k}">${t}</span></li>`; }).join('');
    const mov = (v.movimientos || []).map((m) => `<li><div><b>${esc(TIPOS[m.tipo] || m.tipo)}${m.subcuenta === 'promocional' ? ' · promocional' : ''} · ${esc((v.negocios || {})[m.negocio] || m.negocio)}</b><small>${esc(fecha(m.fecha))}${m.ref ? ` · #${esc(m.ref)}` : ''}${m.detalle ? ` · ${esc(m.detalle)}` : ''}</small></div><span class="bl-mov ${m.signo < 0 ? 'neg' : 'pos'}">${m.signo < 0 ? '−' : '+'}${L(m.monto)}<small>Saldo: ${L(m.saldoPosterior)}</small></span></li>`).join('');
    return `<div class="sx-page bl-page" data-bl-page="ok">
      <div class="sx-page-head"><h1>Mi billetera</h1><small>Saldo para comprar sin enviar comprobante en cada pedido</small></div>
      <section class="sx-card bl-card"><div class="bl-saldos">${tarjetaSaldo(s.sublicuentas || { nombre: 'Sublicuentas' })}${tarjetaSaldo(s.relojes || { nombre: 'Relojes' })}</div>
        <div class="bl-acc"><button type="button" class="sx-btn pri" data-bl="recargar">Recargar</button><button type="button" class="sx-btn sec" data-bl="comprar">Comprar con saldo</button><a class="sx-btn sec" href="#blMovs">Ver movimientos</a>${v.pendientes ? `<a class="sx-btn sec" href="#blRecs">Pendientes (${v.pendientes})</a>` : ''}</div>
        <p class="sp-help">Puede seguir comprando como siempre, con transferencia y comprobante en cada pedido. La billetera es opcional.</p></section>
      ${formAbierto ? formulario(v) : ''}
      <section class="sx-card bl-list" id="blRecs"><b class="bl-tit">Mis recargas</b>${rec ? `<ul>${rec}</ul>` : '<p class="sp-help">Todavía no ha enviado recargas.</p>'}</section>
      <section class="sx-card bl-list" id="blMovs"><b class="bl-tit">Movimientos</b>${mov ? `<ul>${mov}</ul>` : '<p class="sp-help">Sin movimientos todavía. Su saldo empieza en L0.</p>'}</section>
    </div>`;
  }
  async function render() {
    const c = document.getElementById('content'); if (!c) return;
    if (!vista) c.innerHTML = '<div class="sx-page" data-bl-page="cargando"><div class="spin"></div></div>';
    const v = await cargar(); if (typeof current === 'undefined' || current !== 'billetera') return;
    c.innerHTML = v ? pagina(v) : '<div class="sx-page" data-bl-page="error"><section class="sx-card"><b>No se pudo cargar su billetera.</b><p class="sp-help">Revise su conexión.</p><button type="button" class="sx-btn pri" data-bl="reintentar">Reintentar</button></section></div>';
  }
  function verBilletera() {
    current = 'billetera';
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('on', b.dataset.v === 'billetera'));
    window.scrollTo(0, 0); render();
  }

  document.addEventListener('change', async (e) => {
    if (e.target && e.target.id === 'blImg') {
      const f = e.target.files && e.target.files[0]; const prev = document.getElementById('blPrev'); comprobante = '';
      if (!f) return;
      if (!/^image\//.test(f.type) || f.size > 12 * 1024 * 1024) { if (prev) prev.innerHTML = '<span class="sx-pill bad">Use una foto (JPG o PNG) de menos de 12 MB</span>'; return; }
      try { comprobante = typeof compressImage === 'function' ? await compressImage(f, 1600, 0.82) : await new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = mal; r.readAsDataURL(f); }); if (prev) prev.innerHTML = '<span class="sx-pill ok">Comprobante listo</span>'; }
      catch (_) { if (prev) prev.innerHTML = '<span class="sx-pill bad">No se pudo leer la foto</span>'; }
    }
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest && e.target.closest('[data-bl]'); if (!b) return;
    const a = b.dataset.bl;
    if (a === 'comprar') { try { if (typeof SX !== 'undefined') { SX.metodo = 'billetera'; } } catch (_) {} go('compras'); if (typeof sxToast === 'function') sxToast('Elija los productos. En el paso «Pago» use «Saldo de billetera».'); return; }
    if (a === 'recargar') { formAbierto = true; comprobante = ''; nuevoReqId(); await render(); document.getElementById('blForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (a === 'cerrar') { formAbierto = false; render(); return; }
    if (a === 'reintentar') { cargar(true).then(render); return; }
    if (a === 'ir') { go('billetera'); return; }
    if (a === 'enviar' && !enviando) {
      const val = (id) => (document.getElementById(id) || {}).value || '';
      const err = document.getElementById('blErr'); const fallo = (t) => { if (err) err.textContent = t; };
      const body = { negocio: val('blNeg'), monto: Number(val('blMonto')), banco: val('blBanco'), referencia: val('blRef').trim(), imagen: comprobante, requestId: reqId };
      if (!body.negocio) return fallo('Elija si la recarga es para Sublicuentas o para Relojes.');
      if (!(body.monto >= vista.limites.min && body.monto <= vista.limites.max)) return fallo(`El monto debe estar entre L${vista.limites.min} y L${vista.limites.max.toLocaleString('es-HN')}.`);
      if (!body.banco) return fallo('Elija el banco desde el que pagó.');
      if (body.referencia.length < 4) return fallo('Escriba el número de referencia del depósito.');
      if (!comprobante) return fallo('Adjunte la foto del comprobante.');
      enviando = true; b.disabled = true; b.textContent = 'Enviando…';
      try {
        const r = await API.call('/rev/billetera/recargas', { method: 'POST', body: JSON.stringify(body), timeoutMs: 45000 });
        formAbierto = false; comprobante = '';
        if (typeof sxToast === 'function') sxToast(r && r.duplicado ? 'Esa recarga ya estaba enviada.' : 'Recarga enviada. Le avisamos cuando se confirme el depósito.');
        await cargar(true);
      } catch (x) {
        fallo((x && x.detail) || { referencia_repetida: 'Esa referencia ya se usó en otra recarga.', comprobante_repetido: 'Ese comprobante ya se envió.', comprobante_ya_usado: 'Ese comprobante ya se usó para pagar un pedido.', imagen_muy_grande: 'La foto es muy pesada.' }[x && x.error] || 'No se pudo enviar. Intente de nuevo.');
      } finally { enviando = false; if (!formAbierto) render(); else { b.disabled = false; b.textContent = 'Enviar comprobante'; } }
    }
  });

  /* Menú: escritorio (barra lateral) y celular («Más»). Inicio: acceso con el saldo. */
  function menu() {
    try {
      if (typeof WEB_NAV_ITEMS !== 'undefined' && !WEB_NAV_ITEMS.some((x) => x.v === 'billetera')) {
        const i = WEB_NAV_ITEMS.findIndex((x) => x.v === 'pedidos' || x.v === 'compras');
        WEB_NAV_ITEMS.splice(i >= 0 ? i + 1 : WEB_NAV_ITEMS.length, 0, { v: 'billetera', label: 'Mi billetera', tone: 'green', icon: 'wallet' });
        if (typeof renderUnifiedSidebar === 'function') renderUnifiedSidebar();
      }
      document.querySelectorAll('#nav .nav-btn[data-v=billetera] .nav-ico').forEach((ic) => { if (!ic.dataset.bl) ic.dataset.bl = '1', ic.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONO}</svg>`; });
      if (typeof SXG_MAS !== 'undefined' && !SXG_MAS.some((x) => x.v === 'billetera')) SXG_MAS.splice(0, 0, { v: 'billetera', t: 'Mi billetera', d: 'Saldo, recargas y movimientos', ic: 'gift', tone: 'green' });
      if (typeof SXG_IC !== 'undefined' && SXG_IC && !SXG_IC.wallet) { SXG_IC.wallet = ICONO; const m = SXG_MAS.find((x) => x.v === 'billetera'); if (m) m.ic = 'wallet'; }
    } catch (_) { /* el menú nunca debe romper el panel */ }
  }
  async function inicio() {
    if (typeof current === 'undefined' || current !== 'inicio' || !puede()) return;
    const c = document.getElementById('content'); const ancla = c && (c.querySelector('[data-sp=inicio]') || c.querySelector('.sxg-kpis'));
    if (!ancla || c.querySelector('[data-bl=inicio]')) return;
    const v = await cargar(); if (!v || current !== 'inicio' || c.querySelector('[data-bl=inicio]')) return;
    const s = v.saldos || {};
    const html = `<section class="sx-card bl-inicio" data-bl="inicio"><div class="sp-top"><span class="sp-ic bl-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">${ICONO}</svg></span><div class="sp-tx"><small>Mi billetera</small><b>Sublicuentas ${L((s.sublicuentas || {}).disponible)} · Relojes ${L((s.relojes || {}).disponible)}</b></div><button type="button" class="sx-link sp-ver" data-bl="ir">Ver</button></div>${v.pendientes ? `<p class="sp-help">${v.pendientes} recarga${v.pendientes > 1 ? 's' : ''} pendiente${v.pendientes > 1 ? 's' : ''} de verificar.</p>` : ''}</section>`;
    (c.querySelector('[data-sp=inicio]') || ancla).insertAdjacentHTML('afterend', html);
  }

  function envolverGo() {
    if (typeof go !== 'function' || go.__bl) return;
    const original = go;
    window.go = function (v) { if (v === 'billetera') { if (!puede()) return original.call(this, 'inicio'); return verBilletera(); } formAbierto = false; return original.apply(this, arguments); };
    window.go.__bl = true;
  }
  const obs = new MutationObserver(() => { menu(); inicio(); });
  function iniciar() {
    envolverGo(); menu();
    const c = document.getElementById('content'); if (c && !iniciar.__o) { obs.observe(c, { childList: true }); iniciar.__o = true; }
    const n = document.getElementById('nav'); if (n && !iniciar.__n) { new MutationObserver(menu).observe(n, { childList: true }); iniciar.__n = true; }
    inicio();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.addEventListener('load', iniciar);
  window.SubliBilletera = { cargar, ver: verBilletera };
  window.blRecargar = () => { at = 0; return cargar(true); };
})();
