/* =====================================================================================================
   R208 · Ficha del cliente + Compras en bloques 3D (PDF «Rediseño Ficha cliente + Compras 3D», 24/11/2026).
   Solo PRESENTACIÓN: agrega íconos SVG originales, piezas decorativas y clases de estilo a lo que ya pintan
   socios-guia.js (Ficha) y socios-2026.js (Compras). No toca datos, precios, stock, descuentos, rutas,
   permisos, renovaciones ni el flujo de compra. Cada botón conserva su data-* y su evento original.
   Para volver atrás: quitar este archivo y bloques-ficha-compras.css del index.html.
   ===================================================================================================== */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('b3d')) return;
  const SVG = (inner, cls = '', vb = '0 0 24 24') => `<svg class="b3i ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
  const I = {
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7.5 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    chat: '<path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.8c.3 2.6 2.5 5 5.4 5.7l1.1-1.3-1.8-.9-.8.8c-1-.5-1.9-1.4-2.4-2.4l.8-.8-.9-1.8Z" fill="currentColor"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    chev: '<path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    cart: '<path d="M3 4h2.3l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.6" fill="currentColor"/><circle cx="17" cy="19.5" r="1.6" fill="currentColor"/>',
    search: '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    pct: '<circle cx="7.5" cy="7.5" r="2.6" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16.5" cy="16.5" r="2.6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  };
  /* Pieza de bloque dibujada aquí (original, colores planos): cara + canto + 2 studs */
  const pieza = (x, y, w, col, dark, studs = 2) => {
    let s = `<rect x="${x}" y="${y + 8}" width="${w}" height="26" rx="4" fill="${dark}"/><rect x="${x}" y="${y + 6}" width="${w}" height="22" rx="4" fill="${col}"/>`;
    const gap = w / (studs + 1);
    for (let i = 1; i <= studs; i++) { const cx = x + gap * i; s += `<rect x="${cx - 7}" y="${y}" width="14" height="9" rx="2.5" fill="${dark}"/><rect x="${cx - 7}" y="${y - 1}" width="14" height="7" rx="2.5" fill="${col}"/>`; }
    return s;
  };
  const DECO = `<svg class="b3-deco" viewBox="0 0 150 84" aria-hidden="true" focusable="false">${pieza(10, 44, 50, '#F8BA15', '#C68F00')}${pieza(44, 14, 58, '#148DE1', '#0C68AA')}${pieza(90, 44, 54, '#DE1F25', '#A9141A')}</svg>`;
  const VACIO = `<svg class="b3-vacio-ill" viewBox="0 0 220 110" aria-hidden="true" focusable="false">
    ${pieza(18, 64, 52, '#148DE1', '#0C68AA')}${pieza(150, 64, 52, '#DE1F25', '#A9141A')}
    <path d="M70 52 110 40l40 12v42l-40 12-40-12Z" fill="#C68F00"/><path d="M70 52l40 12 40-12v42l-40 12-40-12Z" fill="#F8BA15"/><path d="M110 64v42" stroke="#C68F00" stroke-width="3"/>
    <path d="M70 52 58 36l40-10 12 14Z" fill="#FFD45C"/><path d="M150 52l12-16-40-10-12 14Z" fill="#FFD45C"/>
    <path d="M100 18l-4-10M112 14V3M124 18l5-9" stroke="#F8BA15" stroke-width="4" stroke-linecap="round"/></svg>`;
  const ini = (t) => (String(t || '?').trim()[0] || '?').toUpperCase();
  const tono = (n) => { try { return typeof sxgColorSvc === 'function' ? sxgColorSvc(n) : 'slate'; } catch (_) { return 'slate'; } };
  const hecho = (el, k) => { if (!el || el.dataset['b3' + k]) return true; el.dataset['b3' + k] = '1'; return false; };

  function ficha(root) {
    const pg = root.querySelector('.sxg-ficha'); if (!pg) return;
    const t = pg.querySelector('.sxg-titulo'); if (t && !hecho(t, 'd')) t.insertAdjacentHTML('beforeend', DECO);
    pg.querySelectorAll('.sxg-sec').forEach((s) => s.classList.add('b3-sec'));
    pg.querySelectorAll('.sxg-svc').forEach((li) => {
      if (hecho(li, 's')) return;
      li.classList.add('b3-svc');
      const b = li.querySelector('[data-cli="renovar"]'); if (b) { b.innerHTML = `<span>${b.textContent}</span>${SVG(I.chev, 'chev')}`; b.classList.add('b3-renovar'); }
      li.querySelectorAll('.sxg-pill.ok').forEach((p) => p.insertAdjacentHTML('afterbegin', SVG(I.check, 'ok')));
    });
    pg.querySelectorAll('.sxg-dos > [data-cli="cobro"]').forEach((b) => { if (!hecho(b, 'i')) { b.insertAdjacentHTML('afterbegin', SVG(I.mail)); b.classList.add('b3-cobro'); } });
    pg.querySelectorAll('.sxg-dos > a.wa').forEach((b) => { if (!hecho(b, 'i')) b.insertAdjacentHTML('afterbegin', SVG(I.chat)); });
    const nc = pg.querySelector('[data-cli="comprar"]'); if (nc && !hecho(nc, 'i')) { nc.classList.add('b3-amarillo'); nc.querySelector('svg')?.remove(); nc.insertAdjacentHTML('afterbegin', SVG(I.plus)); }
    const peds = pg.querySelector('.sxo-peds');
    if (peds && !hecho(peds, 'v')) {
      const vacio = [...peds.querySelectorAll('p,.sxg-nota,.sxg-vacio')].find((p) => /Sin pedidos/i.test(p.textContent));
      if (vacio) vacio.outerHTML = `<div class="sxg-card b3-vacio">${VACIO}<p>${vacio.textContent.trim()}</p></div>`;
    }
  }

  function compras(root) {
    const c = root.querySelector('#sxCompra'); if (!c) return;
    c.classList.add('b3-compra');
    const head = c.querySelector('.sx-page-head');
    if (head && !hecho(head, 'h')) {
      const tx = head.querySelector('h1')?.parentElement;
      if (tx && tx !== head) { tx.classList.add('b3-head-tx'); tx.insertAdjacentHTML('beforebegin', `<span class="b3-head-ic" aria-hidden="true">${SVG(I.cart)}</span>`); }
      head.insertAdjacentHTML('beforeend', DECO);
    }
    const card = c.querySelector('.sx-step-card'); if (card && !hecho(card, 'd')) card.insertAdjacentHTML('afterbegin', DECO.replace('b3-deco', 'b3-deco sm'));
    const bus = c.querySelector('.sx-search'); if (bus && !hecho(bus, 'i')) { bus.classList.add('b3-buscar'); bus.querySelector('input')?.insertAdjacentHTML('beforebegin', SVG(I.search, 'lupa')); }
    c.querySelectorAll('.sx-step-card > .sx-help').forEach((p) => { if (/Descuento automático/.test(p.textContent) && !hecho(p, 'i')) { p.classList.add('b3-desc'); p.innerHTML = `<span class="b3-desc-ic" aria-hidden="true">${SVG(I.pct)}</span><span>${p.innerHTML.replace(/(L\d+)/g, '<b>$1</b>')}</span>`; } });
    prods(c);
  }
  function prods(c) {
    c.querySelectorAll('.sx-prod').forEach((a) => {
      if (hecho(a, 'p')) return;
      const ic = a.querySelector('.sx-prod-ic'), nm = a.querySelector('.sx-prod-main h3')?.textContent || '';
      if (ic) { ic.textContent = ini(nm); ic.classList.add('b3-ladrillo', 'b3-' + tono(nm)); }
      const st = a.querySelector('.sx-stock'); if (st && !/(out|unknown)/.test(st.className) && /Disponible|Poco/i.test(st.textContent)) st.insertAdjacentHTML('afterbegin', SVG(I.check, 'ok'));
    });
  }
  function barra() {
    const bar = document.getElementById('sxBottomBar'); const sp = bar && bar.querySelector(':scope > span');
    if (sp && !sp.querySelector('.b3-bar-ic')) sp.insertAdjacentHTML('afterbegin', `<i class="b3-bar-ic" aria-hidden="true">${SVG(I.cart)}</i>`);
  }
  function decorar() {
    const root = document.getElementById('content') || document.body;
    try { if (typeof current !== 'undefined' && current === 'clientes') ficha(root); } catch (_) {}
    try { if (typeof current !== 'undefined' && current === 'compras') { compras(root); barra(); } } catch (_) {}
  }
  let pend = false;
  const mo = new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; decorar(); }); });
  const arrancar = () => { mo.observe(document.body, { childList: true, subtree: true }); decorar(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  window.B3FichaCompras = { decorar };
})();
