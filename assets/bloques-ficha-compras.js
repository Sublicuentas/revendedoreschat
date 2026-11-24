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
    users: '<circle cx="9" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M18 14.6c1.6.6 2.7 2.2 3 4.9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    renew: '<path d="M20 8a8.5 8.5 0 0 0-15.3-1.5M4 16a8.5 8.5 0 0 0 15.3 1.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><path d="M20 3.5V8h-4.5M4 20.5V16h4.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    alerta: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    nada: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M6 18 18 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    capas: '<path d="m12 3 9 5-9 5-9-5Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="m3 12.5 9 5 9-5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>',
    monedas: '<ellipse cx="12" cy="6.5" rx="7.5" ry="3" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M4.5 6.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5M4.5 11.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5" fill="none" stroke="currentColor" stroke-width="2.1"/>',
    reloj: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    flecha: '<path d="M4 12h15m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
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

  /* ---------- R211 · lista de Clientes ---------- */
  const FIL = { todos: ['users', 'blue'], vigentes: ['check', 'green'], renovaciones: ['renew', 'sky'], vencidos: ['alerta', 'red'], sinservicio: ['nada', 'slate'] };
  const PILL = { ok: 'check', info: 'reloj', warn: 'alerta', off: 'nada' };
  function clientes(root) {
    const pg = root.querySelector('.sxg-clientes'); if (!pg) return;
    pg.classList.add('b3-clientes');
    const t = pg.querySelector('.sxg-titulo');
    if (t && !hecho(t, 'd')) { t.insertAdjacentHTML('afterbegin', `<span class="b3-head-ic b3-tit-ic" aria-hidden="true">${SVG(I.users)}</span>`); t.insertAdjacentHTML('beforeend', DECO); }
    pg.querySelectorAll('.sxg-chips .sxg-chip').forEach((b) => {
      if (b.querySelector('.b3-fil-ic')) return;
      const [ic] = FIL[b.dataset.v] || ['users'];
      b.classList.add('b3-fil'); const tx = document.createElement('span'); tx.className = 'b3-fil-tx'; while (b.firstChild) tx.appendChild(b.firstChild); b.appendChild(tx); b.insertAdjacentHTML('afterbegin', `<span class="b3-fil-ic" aria-hidden="true">${SVG(ic === 'check' ? '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' : I[ic])}</span>`);
    });
    const hint = pg.querySelector('.sxg-chips-hint'); if (hint && !hecho(hint, 'i')) { hint.classList.add('b3-hint'); hint.innerHTML = `<span>${hint.textContent.replace(/\s*→\s*$/, '')}</span>${SVG(I.flecha)}`; }
    const bus = pg.querySelector('.sxg-buscar'); if (bus) bus.classList.add('b3-buscar-blq');
    const cta = pg.querySelector('.sxg-cuenta'); if (cta && !cta.querySelector('svg')) { cta.classList.add('b3-cuenta'); cta.insertAdjacentHTML('afterbegin', SVG(I.users)); }
    pg.querySelectorAll('.sxg-lista .sxg-cli:not(.sxg-cli-esq)').forEach((b) => {
      if (hecho(b, 'c')) return;
      b.classList.add('b3-cli');
      const sm = b.querySelectorAll('.sxg-cli-tx > small');
      if (sm[0]) { sm[0].classList.add('b3-ln'); sm[0].insertAdjacentHTML('afterbegin', SVG(I.capas)); }
      if (sm[1]) {
        const txt = sm[1].textContent, i = txt.search(/ · L[\d,.]+/);
        const fecha = i >= 0 ? txt.slice(0, i) : txt, monto = i >= 0 ? txt.slice(i + 3) : '';
        sm[1].classList.add('b3-ln'); sm[1].innerHTML = `${SVG(I.cal)}<span>${fecha.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
        if (monto) sm[1].insertAdjacentHTML('afterend', `<small class="b3-ln b3-monto">${SVG(I.monedas)}<span>${monto.replace(/[&<>]/g, '')}</span></small>`);
      }
      const p = b.querySelector('.sxg-pill'); if (p && !p.querySelector('svg')) { const k = ['ok', 'info', 'warn', 'off'].find((c) => p.classList.contains(c)); if (k) p.insertAdjacentHTML('afterbegin', SVG(k === 'ok' ? '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>' : I[PILL[k]])); }
    });
  }

  /* ---------- R212 · Más opciones ---------- */
  const DECO_ESQ = `<svg class="b3-esq" viewBox="0 0 120 70" aria-hidden="true" focusable="false">${pieza(8, 30, 56, '#DE1F25', '#A9141A')}${pieza(56, 14, 56, '#FFFFFF', '#C9D4E4')}</svg>`;
  const I2 = {
    gorro: '<path d="m2.5 9.5 9.5-5 9.5 5-9.5 5Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="M6.5 11.6V16c1.4 1.6 3.4 2.5 5.5 2.5s4.1-.9 5.5-2.5v-4.4M21.5 9.5v5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    bajar: '<rect x="5" y="3" width="14" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M12 7.5v7m-3-3 3 3 3-3M9 17.5h6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    salir: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M3.5 12h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  function mas(root) {
    const pg = root.querySelector('.sxg-mas'); if (!pg) return;
    pg.classList.add('b3-mas');
    const t = pg.querySelector('.sxg-titulo'); if (t && !hecho(t, 'd')) { t.insertAdjacentHTML('afterbegin', DECO_ESQ.replace('b3-esq', 'b3-esq izq')); t.insertAdjacentHTML('beforeend', DECO_ESQ.replace('b3-esq', 'b3-esq der')); }
    pg.querySelectorAll('.sxg-mas-item').forEach((b) => {
      if (hecho(b, 'm')) return;
      b.classList.add('b3-mas-it');
      const ic = b.querySelector('.sxg-mas-ic'); if (ic) { ic.classList.add('b3-mas-ic'); if (b.dataset.go === 'aula') ic.innerHTML = SVG(I2.gorro); }
      const tono = (ic && [...ic.classList].find((c) => /^sxg-(green|red|blue|sky|amber|orange|purple|slate)$/.test(c))) || '';
      if (tono) b.dataset.tono = tono.slice(4);
    });
    const acc = pg.querySelector('.sxg-mas-acc');
    if (acc && !hecho(acc, 'a')) {
      acc.classList.add('b3-mas-acc');
      acc.querySelectorAll('[data-m]').forEach((x) => {
        const ic = x.dataset.m === 'sync' ? I.renew : I2.bajar;
        x.classList.add('b3-acc-btn'); x.innerHTML = `${SVG(ic)}<span>${x.textContent.replace(/^[^\p{L}]+/u, '').trim()}</span>`;
      });
    }
    const sal = pg.querySelector('.sxg-salir'); if (sal && !hecho(sal, 'i')) { sal.classList.add('b3-salir'); sal.insertAdjacentHTML('afterbegin', SVG(I2.salir)); }
  }

  /* ---------- R216 · Buzón (Mis consultas / Avisos del equipo) ---------- */
  const I3 = {
    sobre: '<rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m4 7.5 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    megafono: '<path d="M4 10v4a1 1 0 0 0 1 1h2l8 4.5V4.5L7 9H5a1 1 0 0 0-1 1Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="M8 15v3.5a1.5 1.5 0 0 0 3 0V16.2M18.5 9.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    lapiz: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="m13.5 7 3 3" stroke="currentColor" stroke-width="2.2"/>',
    avion: '<path d="M21 4 3 11l6.5 2.5L12 20l3-5.5L21 4Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><path d="m9.5 13.5 5.5-4" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    okc: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const BANDEJA = `<svg class="b3-bz-ill" viewBox="0 0 160 110" aria-hidden="true" focusable="false">
    <g transform="rotate(-10 62 40)"><rect x="34" y="14" width="56" height="40" rx="4" fill="#fff" stroke="#9FB0C8" stroke-width="2.5"/><path d="m36 17 26 18 26-18" fill="none" stroke="#9FB0C8" stroke-width="2.5"/><path d="M34 50h56" stroke="#DE1F25" stroke-width="3" stroke-dasharray="6 4"/></g>
    <g transform="rotate(8 98 40)"><rect x="70" y="16" width="56" height="40" rx="4" fill="#fff" stroke="#9FB0C8" stroke-width="2.5"/><path d="m72 19 26 18 26-18" fill="none" stroke="#9FB0C8" stroke-width="2.5"/><path d="M70 52h56" stroke="#148DE1" stroke-width="3" stroke-dasharray="6 4"/></g>
    <path d="M18 56 h124 v32 a8 8 0 0 1 -8 8 H26 a8 8 0 0 1 -8 -8Z" fill="#A9141A"/><path d="M18 52 h124 v32 a8 8 0 0 1 -8 8 H26 a8 8 0 0 1 -8 -8Z" fill="#DE1F25"/>
    <rect x="30" y="64" width="100" height="9" rx="4.5" fill="#A9141A" opacity=".5"/>
    ${[34, 60, 86, 112].map((x) => `<rect x="${x}" y="45" width="14" height="9" rx="3" fill="#A9141A"/><rect x="${x}" y="44" width="14" height="7" rx="3" fill="#DE1F25"/>`).join('')}
    <path d="M128 14l6-9M136 24l10-4M140 10l6-6" stroke="#F8BA15" stroke-width="4" stroke-linecap="round"/></svg>`;
  function buzon(root) {
    const pg = root.querySelector('#content > .sx-page'); if (!pg || !pg.querySelector('.sx-tabs')) return;
    pg.classList.add('b3-buzon');
    const head = pg.querySelector(':scope > .sx-page-head');
    if (head && !hecho(head, 'h')) {
      head.classList.add('b3-bz-hero');
      const tx = head.querySelector('h1')?.parentElement;
      if (tx && tx !== head) { tx.insertAdjacentHTML('beforebegin', `<span class="b3-bz-hero-ic" aria-hidden="true">${SVG(I3.sobre)}</span>`); if (!tx.querySelector('p')) tx.insertAdjacentHTML('beforeend', '<p>Consultas y avisos del equipo en un solo lugar.</p>'); }
      try { head.insertAdjacentHTML('beforeend', `<img src="${ROBOT_IMG}" alt="" width="88" height="88" class="b3-bz-robot" decoding="async">`); } catch (_) {}
    }
    pg.querySelectorAll('.sx-tabs .sx-tab').forEach((t) => { if (!t.querySelector('.b3i')) { t.classList.add('b3-bz-tab'); t.insertAdjacentHTML('afterbegin', SVG(t.dataset.v === 'avisos' ? I3.megafono : I3.sobre)); } });
    const nueva = pg.querySelector('[data-bz="nueva"]'); if (nueva && !nueva.querySelector('.b3i')) { nueva.classList.add('b3-bz-nueva'); nueva.insertAdjacentHTML('afterbegin', SVG(I3.lapiz)); }
    pg.querySelectorAll('[data-bz="recargar"],[data-bz="avisos-recargar"]').forEach((b) => { if (!b.querySelector('.b3i')) { b.classList.add('b3-bz-act'); b.insertAdjacentHTML('afterbegin', SVG(I.renew)); } });
    const vac = [...pg.querySelectorAll('.sx-empty')].find((e) => /Sin consultas/.test(e.textContent));
    if (vac && !hecho(vac, 'v')) { vac.classList.add('b3-bz-vacio'); vac.insertAdjacentHTML('afterbegin', BANDEJA); const t = document.createElement('div'); t.className = 'b3-bz-vacio-tx'; [...vac.childNodes].filter((n) => n.nodeType === 1 && n.tagName !== 'svg').forEach((n) => t.appendChild(n)); vac.appendChild(t); }
    const tg = pg.querySelector('.sxo-tg-mini');
    if (tg && !hecho(tg, 't')) {
      tg.classList.add('b3-bz-tg'); tg.insertAdjacentHTML('afterbegin', `<span class="b3-bz-tg-ic" aria-hidden="true">${SVG(I3.avion)}</span>`);
      const b = tg.querySelector('b'); if (b && tg.classList.contains('ok')) b.insertAdjacentHTML('beforeend', SVG(I3.okc, 'ok'));
      const tx = document.createElement('span'); tx.className = 'b3-bz-tg-tx'; [...tg.querySelectorAll(':scope > b, :scope > small')].forEach((n) => tx.appendChild(n)); tg.appendChild(tx);
    }
    const av = pg.querySelector('.sxg-av-pg'); if (av && !hecho(av, 'a')) { av.classList.add('b3-bz-av'); av.querySelector('.sxg-card-head b')?.insertAdjacentHTML('afterbegin', `<span class="b3-bz-av-ic" aria-hidden="true">${SVG(I3.megafono)}</span>`); }
  }

  /* ---------- R218 · Mi perfil (PDF «Rediseño Mi perfil 3D») · solo presentación ---------- */
  const I4 = {
    user: '<circle cx="12" cy="8" r="3.8" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M4.5 20c.8-3.9 3.7-6.2 7.5-6.2s6.7 2.3 7.5 6.2" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/>',
    campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M19.5 5.5 21 4M20.5 9H22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    corona: '<path d="M3.5 8.5 8 12l4-6 4 6 4.5-3.5-2 10h-13Z" fill="currentColor"/><path d="M5.5 20.5h13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    bocina: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    camara: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="2.1"/>',
    ok: '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    mini: '<rect x="2" y="9" width="20" height="11" rx="2.5" fill="currentColor"/><rect x="5" y="5" width="5" height="5" rx="1.5" fill="currentColor"/><rect x="14" y="5" width="5" height="5" rx="1.5" fill="currentColor"/>',
  };
  /* studs dibujados (cilindro + tapa + brillo); color por --t / --td del contenedor */
  const studs = (n, cls = '') => { const w = 22, g = 14, W = n * w + (n - 1) * g; let r = ''; for (let i = 0; i < n; i++) { const x = i * (w + g); r += `<rect x="${x}" y="4" width="${w}" height="9" rx="3" class="sd"/><ellipse cx="${x + w / 2}" cy="4.5" rx="${w / 2}" ry="4" class="st"/><ellipse cx="${x + w / 2 - 3}" cy="3.6" rx="4.5" ry="1.4" class="sh"/>`; } return `<svg class="b3-st ${cls}" viewBox="0 0 ${W} 13" aria-hidden="true" focusable="false">${r}</svg>`; };
  /* escalón de bloques en la esquina (dos piezas) */
  const ESCALON = '<svg class="b3-pf-esc" viewBox="0 0 60 44" aria-hidden="true" focusable="false"><rect x="0" y="26" width="60" height="18" rx="3" class="sd"/><rect x="0" y="24" width="60" height="16" rx="3" class="st"/><rect x="28" y="8" width="32" height="20" rx="3" class="sd"/><rect x="28" y="6" width="32" height="17" rx="3" class="st"/><rect x="8" y="18" width="12" height="7" rx="2" class="sd"/><ellipse cx="14" cy="18.5" rx="6" ry="2.4" class="st"/><rect x="38" y="0" width="12" height="7" rx="2" class="sd"/><ellipse cx="44" cy="0.8" rx="6" ry="2.4" class="st"/></svg>';
  const PF_GRUPOS = { sxoGTelegram: ['blue', I3.avion], sxoGNotif: ['yel', I4.campana], sxoGNivel: ['vio', I4.corona], sxoGDatos: ['cyan', I4.user] };
  const ladrillo = (tono, ic, cls = '') => `<span class="b3-pf-ic t-${tono} ${cls}" aria-hidden="true">${studs(2)}${SVG(ic)}</span>`;
  function perfil(root) {
    const pg = root.querySelector('.sxo-perfil'); if (!pg) return;
    pg.classList.add('b3-perfil');
    const head = pg.querySelector(':scope > .sx-page-head');
    if (head && !hecho(head, 'h')) { head.classList.add('b3-pf-head'); head.insertAdjacentHTML('afterbegin', ladrillo('red', I4.user, 'grande')); head.insertAdjacentHTML('beforeend', `<span class="b3-pf-head-deco t-yel" aria-hidden="true">${studs(4)}</span>`); }
    const top = pg.querySelector('.sxo-perfil-top');
    if (top && !hecho(top, 't')) {
      top.classList.add('b3-pf-top'); top.insertAdjacentHTML('afterbegin', studs(8, 'fila'));
      top.insertAdjacentHTML('beforeend', `<span class="b3-pf-top-esc t-red">${ESCALON}</span>`);
      const cam = top.querySelector('.profile-photo-edit'); if (cam) cam.innerHTML = SVG(I4.camara);
    }
    pg.querySelectorAll('.sxo-grupo').forEach((d) => {
      const def = PF_GRUPOS[d.id]; if (!def) return;
      const s = d.querySelector(':scope > summary');
      if (s && !hecho(s, 'g')) {
        d.classList.add('b3-pf-card', 't-' + def[0]);
        s.insertAdjacentHTML('afterbegin', ladrillo(def[0], def[1]));
        const go = s.querySelector('.sxo-item-go'); if (go) { go.classList.add('b3-pf-go'); go.insertAdjacentHTML('beforeend', SVG(I.chev)); }
        d.insertAdjacentHTML('beforeend', `<span class="b3-pf-esq t-${def[0]}">${ESCALON}</span>`);
      }
    });
    const tg = pg.querySelector('#sxTgCard');
    if (tg) {
      tg.classList.add('b3-pf-tg');
      const pill = tg.querySelector('.sx-pill.ok'); if (pill && !pill.querySelector('.b3i')) pill.insertAdjacentHTML('afterbegin', SVG(I4.ok));
      tg.querySelectorAll('[data-tg="cambiar"],[data-tg="desvincular"],[data-tg="conectar"]').forEach((b) => { if (!b.querySelector('.b3i')) { b.classList.add('b3-pf-tgbtn', 'b3-pf-' + b.dataset.tg); b.insertAdjacentHTML('afterbegin', SVG(I4.mini, 'mini')); } });
    }
    const snd = pg.querySelector('.b3d-snd-card');
    if (snd && !hecho(snd, 's')) {
      snd.classList.add('b3-pf-card', 'b3-pf-snd', 't-green');
      snd.insertAdjacentHTML('afterbegin', ladrillo('green', I4.bocina));
      snd.insertAdjacentHTML('beforeend', `<span class="b3-pf-esq t-green">${ESCALON}</span>`);
    }
    const sal = pg.querySelector('.sxo-salir'); if (sal && !hecho(sal, 'i')) { sal.classList.add('b3-pf-salir'); sal.insertAdjacentHTML('afterbegin', SVG(I2.salir)); }
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
  /* R221 · Barra inferior (celular): íconos 3D del dueño (assets/nav/*.webp). Solo cambia la imagen del ícono;
     cada botón conserva su data-v, su onclick y su etiqueta. «Renovar» (socios sin compras) mantiene su ícono. */
  const NAV_IMG = { inicio: 'casa', clientes: 'clientes', compras: 'carrito', pedidos: 'carrito', precios: 'catalogo', mas: 'mas' };
  function navIconos() {
    const nav = document.getElementById('nav'); if (!nav || !nav.classList.contains('sxg-nav')) return;
    nav.classList.add('b3-nav3d');
    nav.querySelectorAll('.nav-btn[data-v]').forEach((b) => {
      const k = NAV_IMG[b.dataset.v], ic = b.querySelector('.nav-ico'); if (!k || !ic) return;
      const img = ic.querySelector('img.b3-nav-img');
      if (img && img.dataset.k === k) return;
      if (img) img.remove();
      ic.classList.add('b3-nav-ic'); ic.insertAdjacentHTML('afterbegin', `<img class="b3-nav-img" data-k="${k}" src="assets/nav/${k}.webp?v=r221" alt="" width="60" height="60" decoding="async" draggable="false">`);
    });
  }
  function decorar() {
    const root = document.getElementById('content') || document.body;
    try { navIconos(); } catch (_) {}
    try { if (typeof current !== 'undefined' && current === 'clientes') { ficha(root); clientes(root); } } catch (_) {}
    try { if (typeof current !== 'undefined' && current === 'compras') { compras(root); barra(); } } catch (_) {}
    try { if (typeof current !== 'undefined' && current === 'mas') mas(root); } catch (_) {}
    try { if (typeof current !== 'undefined' && current === 'buzon') buzon(root); } catch (_) {}
    try { if (typeof current !== 'undefined' && current === 'perfil') perfil(root); } catch (_) {}
  }
  let pend = false;
  const mo = new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; decorar(); }); });
  const arrancar = () => { mo.observe(document.body, { childList: true, subtree: true }); decorar(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  window.B3FichaCompras = { decorar };
})();
