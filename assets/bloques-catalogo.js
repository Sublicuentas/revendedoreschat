/* =====================================================================================================
   R209 · Catálogo en bloques 3D (PDF «Catálogo 3D · iconos», 24/11/2026).
   Solo PRESENTACIÓN sobre lo que ya pinta sxVPreciosNuevo/sxoVPrecios y politicasHTML():
   · íconos SVG propios en bloque (sin emojis como ícono principal y sin logotipos de marcas),
   · chips de categoría con ícono por familia, buscador con lupa, etiquetas de stock con ícono + texto,
   · «Ver condiciones» y «Políticas y términos» como acordeones accesibles con teclado.
   No cambia precios, nombres, stock, textos, políticas, carrito ni permisos: el texto se muestra tal cual,
   solo se separa el emoji del inicio de cada línea para alinearlo. Para volver atrás: quitar este archivo
   y bloques-catalogo.css del index.html.
   ===================================================================================================== */
(function () {
  'use strict';
  if (!document.documentElement.classList.contains('b3d')) return;
  const SVG = (inner, cls = '') => `<svg class="b3i ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const st = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const I = {
    cubo: `<path d="M12 2.8 20 7v10l-8 4.2L4 17V7Z" ${st}/><path d="M4 7l8 4.2L20 7M12 11.2V21" ${st}/>`,
    lupa: `<circle cx="11" cy="11" r="6.5" ${st}/><path d="m16 16 4.5 4.5" ${st}/>`,
    todas: `<rect x="4" y="4" width="7" height="7" rx="1.6" ${st}/><rect x="13" y="4" width="7" height="7" rx="1.6" ${st}/><rect x="4" y="13" width="7" height="7" rx="1.6" ${st}/><rect x="13" y="13" width="7" height="7" rx="1.6" ${st}/>`,
    stream: `<rect x="3" y="5" width="18" height="13" rx="2.5" ${st}/><path d="M10 9.2v5.6l4.8-2.8Z" fill="currentColor"/><path d="M8 21h8" ${st}/>`,
    tv: `<rect x="3" y="7" width="18" height="12" rx="2.5" ${st}/><path d="m8 3 4 4 4-4" ${st}/>`,
    musica: `<path d="M9 18V6l10-2v12" ${st}/><circle cx="6.5" cy="18" r="2.5" ${st}/><circle cx="16.5" cy="16" r="2.5" ${st}/>`,
    herramienta: `<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z" ${st}/>`,
    ia: `<rect x="5" y="8" width="14" height="11" rx="3" ${st}/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5" ${st}/>`,
    juego: `<rect x="3" y="8" width="18" height="10" rx="4" ${st}/><path d="M7.5 13h3M9 11.5v3M15.5 12.5h.01M17.5 14h.01" ${st}/>`,
    estrella: `<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z" ${st}/>`,
    ok: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    no: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
    alerta: '<path d="M12 3 22 20H2Z" fill="currentColor"/><path d="M12 9v5M12 17h.01" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
    copiar: `<rect x="8" y="8" width="12" height="12" rx="2.2" ${st}/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" ${st}/>`,
    chev: `<path d="m6 9 6 6 6-6" ${st} stroke-width="2.6"/>`,
    doc: `<path d="M7 3h7l4 4v14H7Z" ${st}/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6" ${st}/>`,
    flechas: `<path d="M4 9h13l-3-3M20 15H7l3 3" ${st}/>`,
    candado: `<rect x="5" y="10.5" width="14" height="10" rx="2.2" ${st}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${st}/>`,
    carrito: `<path d="M3 4h2.3l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.4" ${st}/><circle cx="9.5" cy="19.5" r="1.4" fill="currentColor"/><circle cx="17" cy="19.5" r="1.4" fill="currentColor"/>`,
  };
  const EMO = /^\s*((?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[0-9#*]️?⃣)(?:️|‍(?:\p{Extended_Pictographic}))*)\s*/u;
  const sinEmoji = (t) => String(t || '').replace(EMO, '').trim();
  const familia = (c) => {
    const t = String(c || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (c === 'todas') return ['todas', 'blue'];
    if (/stream|pelicula|serie/.test(t)) return ['stream', 'red'];
    if (/tv|iptv|television|digital/.test(t)) return ['tv', 'blue'];
    if (/music|musica|audio/.test(t)) return ['musica', 'green'];
    if (/\bia\b|inteligencia|gemini|chat|gpt/.test(t)) return ['ia', 'purple'];
    if (/herramient|productiv|office|diseno|canva/.test(t)) return ['herramienta', 'sky'];
    if (/juego|gamer|recarga|free ?fire/.test(t)) return ['juego', 'amber'];
    return ['estrella', 'amber'];
  };
  const tono = (n) => { try { return typeof sxgColorSvc === 'function' ? sxgColorSvc(n) : 'slate'; } catch (_) { return 'slate'; } };
  const hecho = (el, k) => { if (!el || el.dataset['b3' + k]) return true; el.dataset['b3' + k] = '1'; return false; };
  const pieza = (x, y, w, col, dark) => `<rect x="${x}" y="${y + 8}" width="${w}" height="26" rx="4" fill="${dark}"/><rect x="${x}" y="${y + 6}" width="${w}" height="22" rx="4" fill="${col}"/>`
    + [1, 2].map((i) => { const cx = x + (w / 3) * i; return `<rect x="${cx - 7}" y="${y}" width="14" height="9" rx="2.5" fill="${dark}"/><rect x="${cx - 7}" y="${y - 1}" width="14" height="7" rx="2.5" fill="${col}"/>`; }).join('');
  const DECO = `<svg class="b3-deco" viewBox="0 0 150 84" aria-hidden="true" focusable="false">${pieza(10, 44, 50, '#F8BA15', '#C68F00')}${pieza(44, 14, 58, '#148DE1', '#0C68AA')}${pieza(90, 44, 54, '#DE1F25', '#A9141A')}</svg>`;

  function lineasConIcono(ul) {
    ul.classList.add('b3-conds');
    ul.querySelectorAll(':scope > li').forEach((li) => {
      if (hecho(li, 'l')) return;
      const txt = li.textContent, m = txt.match(EMO);
      li.innerHTML = m ? `<span class="b3-li-emo" aria-hidden="true">${m[1]}</span><span>${txt.slice(m[0].length).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`
        : `<span class="b3-li-emo b3-li-pt" aria-hidden="true"></span><span>${li.innerHTML}</span>`;
    });
  }
  function catalogo(page) {
    page.classList.add('b3-cat');
    const head = page.querySelector(':scope > .sx-page-head');
    if (head && !hecho(head, 'h')) {
      const tx = head.querySelector('h1')?.parentElement;
      if (tx && tx !== head) { tx.classList.add('b3-head-tx'); tx.insertAdjacentHTML('beforebegin', `<span class="b3-head-ic" aria-hidden="true">${SVG(I.cubo)}</span>`); }
      head.insertAdjacentHTML('beforeend', DECO);
    }
    const bus = page.querySelector('.sx-search'); if (bus && !hecho(bus, 'i')) { bus.classList.add('b3-buscar'); bus.querySelector('input')?.insertAdjacentHTML('beforebegin', SVG(I.lupa, 'lupa')); }
    page.querySelectorAll('.sx-filter .sx-chip').forEach((b) => {
      if (hecho(b, 'c')) return;
      const v = b.dataset.v || 'todas', [ic, col] = familia(v === 'todas' ? 'todas' : v);
      const label = v === 'todas' ? b.textContent : sinEmoji(b.textContent);
      b.innerHTML = `<span class="b3-chip-ic b3-${col}" aria-hidden="true">${SVG(I[ic])}</span><span>${label.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
    });
    const fil = page.querySelector('.sx-filter'); if (fil && !hecho(fil, 'f')) { fil.classList.add('b3-filtros'); fil.setAttribute('tabindex', '-1'); const on = fil.querySelector('.sx-chip.on'); if (on && on.offsetLeft > fil.clientWidth - 40) fil.scrollLeft = on.offsetLeft - 16; }
    page.querySelectorAll('.sx-cat-item').forEach((card) => {
      if (hecho(card, 'k')) return;
      card.classList.add('b3-card');
      const ic = card.querySelector('.sx-prod-ic'), nm = card.querySelector('h3')?.textContent || '';
      if (ic) { ic.textContent = (nm.trim()[0] || '?').toUpperCase(); ic.classList.add('b3-ladrillo', 'b3-' + tono(nm)); }
      const s = card.querySelector('.sx-stock');
      if (s) { const k = /\bout\b/.test(s.className) ? 'no' : /\blow\b/.test(s.className) ? 'alerta' : /unknown/.test(s.className) ? '' : 'ok'; if (k) s.insertAdjacentHTML('afterbegin', SVG(I[k])); }
      card.querySelectorAll('.sx-conds').forEach(lineasConIcono);
      const d = card.querySelector('details.sxo-conds'); if (d) { const sm = d.querySelector('summary'); if (sm && !sm.querySelector('.chev')) sm.insertAdjacentHTML('beforeend', SVG(I.chev, 'chev')); }
      const ag = card.querySelector('[data-cat-act="agregar"]'); if (ag) ag.classList.add('b3-agregar');
      const cp = card.querySelector('[data-cat-act="copiar"]'); if (cp && !cp.querySelector('svg')) { cp.classList.add('b3-copiar'); cp.insertAdjacentHTML('afterbegin', SVG(I.copiar)); }
    });
    const ir = page.querySelector('[data-cat-act="ir"]'); if (ir && !ir.querySelector('svg')) ir.insertAdjacentHTML('afterbegin', SVG(I.carrito));
    politicas(page);
  }
  function politicas(page) {
    const box = page.querySelector('.sx-politicas > .card'); if (!box || hecho(box, 'p')) return;
    box.classList.add('b3-pol');
    const t = box.firstElementChild; if (t) { t.className = 'b3-pol-t'; t.removeAttribute('style'); t.innerHTML = `<span class="b3-pol-big" aria-hidden="true">${SVG(I.doc)}</span><span>${sinEmoji(t.textContent)}</span>`; }
    const p = box.querySelector(':scope > p'); if (p) { p.removeAttribute('style'); p.className = 'b3-pol-sub'; }
    const ICS = [['doc', 'blue'], ['flechas', 'amber'], ['candado', 'green']];
    box.querySelectorAll('.pol-item').forEach((it, i) => {
      const h = it.querySelector('.pol-head'); if (!h) return;
      const titulo = sinEmoji(h.firstChild && h.firstChild.nodeType === 3 ? h.firstChild.textContent : h.textContent.replace('▾', ''));
      const [ic, col] = ICS[i] || ['doc', 'blue'];
      h.innerHTML = `<span class="b3-chip-ic b3-${col}" aria-hidden="true">${SVG(I[ic])}</span><span class="b3-pol-nm">${titulo}</span>${SVG(I.chev, 'chev')}`;
      const id = 'b3pol' + i, body = it.querySelector('.pol-body'); if (body) { body.id = id; body.setAttribute('role', 'region'); }
      it.setAttribute('role', 'button'); it.setAttribute('tabindex', '0'); it.setAttribute('aria-controls', id); it.setAttribute('aria-expanded', String(it.classList.contains('open')));
      it.addEventListener('click', () => setTimeout(() => it.setAttribute('aria-expanded', String(it.classList.contains('open'))), 0));
      it.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (typeof togglePol === 'function') togglePol(it); it.setAttribute('aria-expanded', String(it.classList.contains('open'))); } });
    });
  }
  function decorar() {
    try { if (typeof current !== 'undefined' && current === 'precios') { const page = document.querySelector('#content > .sx-page'); if (page) catalogo(page); } } catch (_) {}
  }
  let pend = false;
  const mo = new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; decorar(); }); });
  const arrancar = () => { mo.observe(document.body, { childList: true, subtree: true }); decorar(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  window.B3Catalogo = { decorar, familia };
})();
