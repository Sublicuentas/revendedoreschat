/* =====================================================================================================
   R220 · Campanilla 3D de avisos (PDF «Campanilla de avisos · ícono 3D + indicador inteligente», 24/11/2026).
   · Botón 3D igual al de sonido (blanco, borde verde, sombra). Punto rojo SOLO si hay algo sin leer:
       avisos del equipo no leídos por ESTE socio (servidor: /rev/avisos → leido) + respuestas del equipo
       sin leer en sus consultas (servidor: /rev/novedades → noLeidas). Sin número permanente.
   · La lectura se guarda en el servidor por socio y por aviso (POST /rev/avisos/leido). Antes se guardaba
     solo en este teléfono («buzon_seen») y entrar al Buzón marcaba TODO como leído: eso se quita.
   · Tocar la campanilla abre Buzón → Avisos del equipo (o Mis consultas si lo pendiente es una respuesta).
     NO marca nada como leído. Un aviso queda leído al abrirlo o con «Marcar como leído».
   · Sin conexión: lo que el socio sí leyó queda en cola y se envía al volver la conexión; nunca se
     muestra «todo leído» por no poder consultar.
   · Administración viendo como socio («Ver socio»): ve el estado del socio pero NO le marca nada como leído.
   · Migración: lo que este teléfono ya había visto con la marca anterior se registra en el servidor una vez.
   No cambia permisos, publicación ni historial de avisos.
   ===================================================================================================== */
(function () {
  'use strict';
  const ICONO = '<svg class="b3-campana-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 16.2V11a6 6 0 0 1 12 0v5.2l1.6 1.8H4.4Z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M12 3.2v1.6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><path d="M9.8 20.2a2.3 2.3 0 0 0 4.4 0" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>';
  // Variables globales del panel (scripts clásicos): se leen por nombre, sin eval.
  const G = {
    rev: () => (typeof rev !== 'undefined' ? rev : null), API: () => (typeof API !== 'undefined' ? API : null),
    isAdmin: () => (typeof isAdmin !== 'undefined' ? isAdmin : false), impersonating: () => (typeof impersonating !== 'undefined' ? impersonating : false),
    avisos: () => (typeof avisos !== 'undefined' ? avisos : []), sxgAv: () => (typeof sxgAv !== 'undefined' ? sxgAv : null),
    sxNovedades: () => (typeof sxNovedades !== 'undefined' ? sxNovedades : null), sxBz: () => (typeof sxBz !== 'undefined' ? sxBz : null),
    current: () => (typeof current !== 'undefined' ? current : ''), loadAvisos: () => (typeof loadAvisos !== 'undefined' ? loadAvisos : null),
  };
  const g = (n) => { try { return G[n](); } catch (_) { return undefined; } };
  const socio = () => { const r = g('rev'); return String((r && (r.nombre_norm || r.id || r.usuario)) || ''); };
  const modoSocio = () => { const A = g('API'); return !!(A && A.token) && !(g('isAdmin') && !g('impersonating')) && !!socio(); };
  const puedeGuardar = () => modoSocio() && !g('impersonating');
  const clave = (k) => `sx_av_${k}_${socio()}`;
  const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(clave(k)) || 'null') ?? def; } catch (_) { return def; } };
  const escribir = (k, v) => { try { localStorage.setItem(clave(k), JSON.stringify(v)); } catch (_) {} };
  const sesion = new Map(); // socio → ids leídos en esta sesión (incluye «Ver socio», que no se guarda)
  const vistosSesion = () => { const s = socio(); if (!sesion.has(s)) sesion.set(s, new Set()); return sesion.get(s); };
  const pendientes = () => (puedeGuardar() ? leer('pend', []) : []);
  const idDe = (a) => String((a && a.id) || '');
  function esLeido(a) { const id = idDe(a); return !id || !!a.leido || vistosSesion().has(id) || pendientes().includes(id); }
  function todosLosAvisos() {
    const out = [...(g('avisos') || [])];
    try { const c = g('sxgAv'); if (c && c.cache) Object.values(c.cache).forEach((l) => Array.isArray(l) && out.push(...l)); } catch (_) {}
    return out;
  }
  function ponerLeidoLocal(id) { todosLosAvisos().forEach((a) => { if (idDe(a) === id) a.leido = true; }); }

  /* conteo real: avisos sin leer (los mismos que el servidor manda a este socio) */
  window.avisosNoLeidos = function () { if (!modoSocio()) return 0; const vistos = new Set(); return (g('avisos') || []).filter((a) => { const id = idDe(a); if (!id || vistos.has(id)) return false; vistos.add(id); return !esLeido(a); }).length; };
  try { avisosNoLeidos = window.avisosNoLeidos; } catch (_) {} // función global del panel: se reemplaza por la versión con lectura del servidor
  // Entrar al Buzón ya no marca todo como leído.
  window.marcarBuzonLeido = function () {}; try { marcarBuzonLeido = window.marcarBuzonLeido; } catch (_) {}

  function consultasNoLeidas() { const n = g('sxNovedades'); return ((n && n.consultas) || []).reduce((a, c) => a + (Number(c.noLeidas) || 0), 0); }
  function pintar() {
    const b = document.querySelector('#topbarActions .partner-inbox-btn'); if (!b) return;
    if (!b.classList.contains('b3-campana')) { b.classList.add('b3-campana'); b.querySelectorAll('svg').forEach((s) => s.remove()); b.insertAdjacentHTML('afterbegin', ICONO + '<span class="b3-campana-dot" aria-hidden="true"></span>'); }
    else if (!b.querySelector('.b3-campana-ic')) b.insertAdjacentHTML('afterbegin', ICONO);
    if (!b.querySelector('.b3-campana-dot')) b.insertAdjacentHTML('beforeend', '<span class="b3-campana-dot" aria-hidden="true"></span>');
    const nAv = window.avisosNoLeidos(), nCo = modoSocio() ? consultasNoLeidas() : 0, n = nAv + nCo;
    const antes = b.classList.contains('con-aviso');
    b.classList.toggle('con-aviso', n > 0); if (n > 0 && !antes) { b.classList.remove('b3-pop'); void b.offsetWidth; b.classList.add('b3-pop'); }
    b.dataset.noLeidos = String(n); b.dataset.avisos = String(nAv); b.dataset.consultas = String(nCo);
    b.setAttribute('aria-label', n > 0 ? `Avisos y buzón: hay ${n === 1 ? 'algo' : n + ' cosas'} sin leer` : 'Avisos y buzón: nada pendiente');
    b.title = n > 0 ? 'Tiene avisos sin leer' : 'Avisos y buzón';
    decorarLista();
  }

  async function enviarPendientes() {
    if (enviando || !puedeGuardar() || navigator.onLine === false) return; enviando = true;
    try {
      for (const id of pendientes()) {
        try { await g('API').call('/rev/avisos/leido', { method: 'POST', body: JSON.stringify({ id }), timeoutMs: 12000 }); escribir('pend', pendientes().filter((x) => x !== id)); ponerLeidoLocal(id); }
        catch (e) { if (e && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 429) escribir('pend', pendientes().filter((x) => x !== id)); else break; }
      }
    } finally { enviando = false; }
  }
  let enviando = false;
  function marcarLeido(id) {
    id = String(id || ''); if (!id || !modoSocio()) return;
    const a = todosLosAvisos().find((x) => idDe(x) === id); if (a && a.leido) return;
    vistosSesion().add(id);
    if (puedeGuardar()) { escribir('pend', [...new Set([...pendientes(), id])].slice(-100)); enviarPendientes(); }
    pintar();
  }
  window.SxCampana = { marcarLeido, pintar, consultar: () => consultar(), esLeido };

  // Migración única por socio y teléfono: lo que la marca anterior ya daba por visto se registra en el servidor.
  function migrar() {
    if (!puedeGuardar() || leer('mig', false)) return;
    const visto = Number(localStorage.getItem('buzon_seen') || 0);
    const ids = visto > 0 ? (g('avisos') || []).filter((a) => !a.leido && (a.ts || 0) <= visto).map(idDe).filter(Boolean) : [];
    if (ids.length) escribir('pend', [...new Set([...pendientes(), ...ids])]);
    escribir('mig', true);
  }

  let consultando = false;
  async function consultar() {
    if (consultando || !modoSocio() || document.hidden) return; consultando = true;
    try {
      const d = await g('API').call('/rev/avisos?_=' + Date.now(), { cache: 'no-store', timeoutMs: 12000 });
      if (!Array.isArray(d) || !modoSocio()) return;
      const antes = new Set((g('avisos') || []).map(idDe)), hayNuevos = d.some((a) => !antes.has(idDe(a)));
      const mapa = new Map(d.map((a) => [idDe(a), a]));
      todosLosAvisos().forEach((a) => { const s = mapa.get(idDe(a)); if (s && s.leido) a.leido = true; });
      if (hayNuevos && typeof g('loadAvisos') === 'function') await g('loadAvisos')(); // aviso nuevo: mismo camino de siempre (lista + notificación)
      migrar(); enviarPendientes();
    } catch (_) { /* sin conexión: se conserva el último estado conocido */ }
    finally { consultando = false; pintar(); }
  }

  /* lista de Avisos del equipo: marca «Nuevo» y botón «Marcar como leído»; abrir un aviso lo marca leído */
  function decorarLista() {
    if (g('current') !== 'buzon') return;
    document.querySelectorAll('#content .sxg-av-full > li').forEach((li) => {
      const btn = li.querySelector('[data-sxg="av-abrir"]'); if (!btn) return;
      const id = btn.dataset.id, a = todosLosAvisos().find((x) => idDe(x) === id) || { id }, nuevo = modoSocio() && !esLeido(a);
      li.classList.toggle('b3-av-nuevo', nuevo);
      let et = btn.querySelector('.b3-av-et'); if (nuevo && !et) btn.querySelector('span b')?.insertAdjacentHTML('beforebegin', '<span class="b3-av-et">Nuevo</span>'); if (!nuevo && et) et.remove();
      let mk = li.querySelector('.b3-av-marcar'); if (nuevo && !mk) li.insertAdjacentHTML('beforeend', `<button type="button" class="b3-av-marcar" data-av-leido="${id.replace(/"/g, '&quot;')}">Marcar como leído</button>`); if (!nuevo && mk) mk.remove();
    });
  }
  document.addEventListener('click', (ev) => {
    const mk = ev.target.closest && ev.target.closest('[data-av-leido]'); if (mk) { ev.preventDefault(); ev.stopPropagation(); marcarLeido(mk.dataset.avLeido); return; }
    const ab = ev.target.closest && ev.target.closest('[data-sxg="av-abrir"]');
    if (ab) { const c = g('sxgAv'); if (!c || c.abierto !== ab.dataset.id) marcarLeido(ab.dataset.id); return; } // solo al ABRIR el aviso
    const bell = ev.target.closest && ev.target.closest('#topbarActions .partner-inbox-btn');
    if (bell) { // abre el centro de avisos; no marca nada
      const bz = g('sxBz'); if (bz && typeof bz === 'object') { const nAv = window.avisosNoLeidos(), nCo = consultasNoLeidas(); bz.abierto = ''; bz.nueva = null; if (nAv > 0) bz.tab = 'avisos'; else if (nCo > 0) bz.tab = 'consultas'; }
    }
  }, true);

  // Repintar con cada cambio de datos que ya existe (avisos, novedades, cambio de vista).
  function envolver() {
    try { if (typeof actualizarBadgeBuzon === 'function' && !actualizarBadgeBuzon.__b3c) { const f = actualizarBadgeBuzon; actualizarBadgeBuzon = function () { const r = f.apply(this, arguments); try { pintar(); } catch (_) {} return r; }; actualizarBadgeBuzon.__b3c = true; } } catch (_) {}
    try { if (typeof sxPintarCampana === 'function' && !sxPintarCampana.__b3c) { const f = sxPintarCampana; sxPintarCampana = function () { const r = f.apply(this, arguments); try { pintar(); } catch (_) {} return r; }; sxPintarCampana.__b3c = true; } } catch (_) {}
    try { if (typeof vSugerencias === 'function' && !vSugerencias.__b3c) { const f = vSugerencias; vSugerencias = function () { const r = f.apply(this, arguments); try { pintar(); } catch (_) {} return r; }; vSugerencias.__b3c = true; } } catch (_) {}
  }
  function arrancar() {
    envolver();
    let pend = false; new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; const b = document.querySelector('#topbarActions .partner-inbox-btn'); if (b && (!b.querySelector('.b3-campana-ic') || !b.querySelector('.b3-campana-dot'))) pintar(); if (g('current') === 'buzon') decorarLista(); }); }).observe(document.body, { childList: true, subtree: true });
    setInterval(consultar, 45000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) consultar(); });
    window.addEventListener('focus', consultar); window.addEventListener('online', () => { enviarPendientes(); consultar(); });
    pintar(); setTimeout(consultar, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
