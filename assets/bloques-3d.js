/* =====================================================================================================
   R202 · PANEL DE SOCIOS · BLOQUES 3D · sonido opcional y control ON/OFF
   - Sonido APAGADO por defecto. Se guarda por dispositivo y por usuario (localStorage).
   - Efectos ORIGINALES generados en el navegador (Web Audio, ondas simples de 8 bits): no hay archivos de
     audio ni melodías de ningún videojuego. Si el navegador no tiene audio, el Panel sigue igual.
   - Solo suena después de un toque real; nunca al cargar datos, nunca en bucle.
   - No toca datos, compras, permisos ni la API: solo escucha clics y el resultado de las peticiones.
   ===================================================================================================== */
(function () {
  'use strict';
  const CLAVE = 'b3d_sonido';
  const usuarioActual = () => { try { return (typeof rev !== 'undefined' && rev && rev.nombre_norm) || (typeof isAdmin !== 'undefined' && isAdmin ? 'admin' : ''); } catch (_) { return ''; } };
  const claveUsuario = () => CLAVE + (usuarioActual() ? ':' + usuarioActual() : '');
  function encendido() { try { const v = localStorage.getItem(claveUsuario()); return v == null ? localStorage.getItem(CLAVE) === '1' : v === '1'; } catch (_) { return false; } }
  function guardar(on) { try { localStorage.setItem(claveUsuario(), on ? '1' : '0'); localStorage.setItem(CLAVE, on ? '1' : '0'); } catch (_) { /* sin almacenamiento: solo esta sesión */ } }

  let ctx = null, gesto = false, ultimo = 0;
  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ctx = new AC(); } catch (_) { ctx = null; }
    return ctx;
  }
  // Tonos propios: [frecuencia Hz, duración ms, forma]
  const SFX = {
    click: [[660, 45, 'square'], [880, 30, 'square']],                        // ~75 ms
    nav: [[523, 50, 'triangle'], [784, 60, 'triangle']],                       // ~110 ms
    exito: [[523, 60, 'square'], [659, 60, 'square'], [988, 110, 'square']],  // ~230 ms ascendente
    error: [[392, 90, 'triangle'], [294, 120, 'triangle']],                    // ~210 ms descendente suave
    logro: [[523, 80, 'square'], [659, 80, 'square'], [784, 80, 'square'], [1047, 220, 'triangle']], // ~460 ms
  };
  function sonar(nombre) {
    if (!encendido() || !gesto || document.hidden) return;
    const ahora = performance.now(); if (ahora - ultimo < 70) return; ultimo = ahora; // nunca se encadenan
    const a = audio(); if (!a) return;
    try {
      if (a.state === 'suspended') a.resume();
      let t = a.currentTime + 0.005;
      for (const [f, ms, forma] of SFX[nombre] || []) {
        const o = a.createOscillator(), g = a.createGain(); const d = ms / 1000;
        o.type = forma; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.008); g.gain.setValueAtTime(0.07, t + d * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.01); t += d;
      }
    } catch (_) { /* el audio nunca debe romper el panel */ }
  }

  const ICONO_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
  const ICONO_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="x" d="M16.5 9l5 6M21.5 9l-5 6"/></svg>';
  function pintarControles() {
    const on = encendido();
    document.querySelectorAll('.b3d-snd').forEach((b) => { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Sonido encendido. Tocar para apagar' : 'Sonido apagado. Tocar para encender'); b.title = on ? 'Sonido: encendido' : 'Sonido: apagado'; b.innerHTML = on ? ICONO_ON : ICONO_OFF; });
    document.querySelectorAll('.b3d-switch').forEach((s) => s.setAttribute('aria-checked', String(on)));
    document.querySelectorAll('[data-b3d-estado]').forEach((e) => { e.textContent = on ? 'Encendido' : 'Apagado'; });
  }
  function alternar() { gesto = true; const on = !encendido(); guardar(on); pintarControles(); if (on) sonar('exito'); }

  function ponerBotonCabecera() {
    const host = document.getElementById('topbarActions'); if (!host || host.querySelector('.b3d-snd')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'icon-btn b3d-snd';
    b.addEventListener('click', (e) => { e.stopPropagation(); alternar(); });
    host.insertBefore(b, host.firstChild); pintarControles();
  }
  function ponerTarjetaPerfil() {
    if (typeof current === 'undefined' || current !== 'perfil') return;
    const page = document.querySelector('#content .sxo-perfil, #content .sx-page'); if (!page || page.querySelector('.b3d-snd-card')) return;
    const card = document.createElement('section'); card.className = 'sx-card b3d-snd-card';
    card.innerHTML = '<div><b id="b3dSndT">Sonidos del panel</b><small>Efectos cortos al navegar, agregar al pedido o terminar una compra. Estado: <span data-b3d-estado></span>.</small></div><button type="button" class="b3d-switch" role="switch" aria-labelledby="b3dSndT"></button>';
    card.querySelector('.b3d-switch').addEventListener('click', alternar);
    const ref = page.querySelector('.sxo-list') || page.querySelector('.sx-card');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(card, ref.nextSibling); else page.appendChild(card);
    pintarControles();
  }

  // Clics: sonido según el tipo de bloque (solo con gesto real)
  document.addEventListener('pointerdown', () => { gesto = true; }, { capture: true, passive: true });
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('button, a, [role=button]'); if (!el || el.closest('.b3d-snd, .b3d-switch')) return;
    if (el.closest('#nav') || el.matches('[data-go], [data-sxg-go], .sxg-nb')) sonar('nav');
    else if (/agregar/i.test(el.textContent || '')) sonar('exito');
    else sonar('click');
  }, true);

  // Resultado de las peticiones que el socio hizo: compra/comprobante/consulta registrados → logro / éxito; rechazo → error.
  function envolverApi() {
    if (typeof API === 'undefined' || !API || API.__b3d) return false;
    const original = API.call.bind(API);
    API.call = async function (ruta, opts) {
      const metodo = String((opts && opts.method) || 'GET').toUpperCase();
      try {
        const r = await original(ruta, opts);
        if (metodo === 'POST' && gesto) { if (/^\/rev\/compra(\?|$)/.test(String(ruta))) sonar('logro'); else if (/comprobante|consulta|sugerencia|recompensa/.test(String(ruta))) sonar('exito'); }
        return r;
      } catch (err) { if (metodo === 'POST' && gesto && !/login/.test(String(ruta))) sonar('error'); throw err; }
    };
    API.__b3d = true; return true;
  }

  // Al cambiar de sección se vuelven a poner los controles (las vistas se redibujan completas).
  function envolverGo() {
    if (typeof go !== 'function' || go.__b3d) return false;
    const original = go;
    window.go = function (v) { const r = original.apply(this, arguments); setTimeout(() => { ponerBotonCabecera(); ponerTarjetaPerfil(); }, 0); return r; };
    window.go.__b3d = true; return true;
  }
  const obs = new MutationObserver(() => { ponerBotonCabecera(); ponerTarjetaPerfil(); });
  function iniciar() {
    envolverApi(); envolverGo(); ponerBotonCabecera();
    const content = document.getElementById('content'); if (content) obs.observe(content, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.addEventListener('load', iniciar);
  window.SubliSonido = { encendido, alternar, sonar, _sfx: SFX }; // para pruebas
})();
