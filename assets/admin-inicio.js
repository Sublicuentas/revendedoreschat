/* =====================================================================================================
   R210 · El Inicio del administrador es SIEMPRE el Panel Dios (PDF «Corrección inicio admin y sonido», 24/11/2026).
   Causa encontrada: con sesión de administrador, el arranque llama go('inicio') y varios cargadores del socio
   (loadClientes, loadMetricas, loadAvisos, loadMisCompras en core.js / socios-orden.js / socios-guia.js) terminan
   con «if (current === 'inicio') vInicio()», que pinta el inicio de SOCIO («Hola, Sublicuentas») encima del Panel Dios.
   Corrección: una sola regla, tomada de la sesión que autorizó el servidor (isAdmin + adminToken vienen de
   /rev/login → res.admin). Mientras sea administrador y NO esté en «Ver socio» (impersonating), Inicio = Panel Dios.
   No usa nombres ni textos para decidir permisos. No cambia datos, permisos ni el módulo de administración.
   «Ver socio» sigue siendo explícito y reversible con «Volver al Panel Dios» (volverAdmin en core.js).
   Se carga AL FINAL del index.html. Para volver atrás: quitar este archivo.
   ===================================================================================================== */
(function () {
  'use strict';
  const esAdminDios = () => { try { return isAdmin === true && !!adminToken && impersonating !== true; } catch (_) { return false; } };
  let cargando = false;
  function panelDios() {
    try { current = 'inicio'; } catch (_) {}
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('on', b.dataset.v === 'inicio'));
    const hay = (typeof adminRevs !== 'undefined' && Array.isArray(adminRevs) && adminRevs.length);
    if (hay && typeof renderAdmin === 'function') { if (!/PANEL DIOS/.test(document.getElementById('content')?.textContent || '')) renderAdmin(); return; }
    if (document.querySelector('#content > .spin')) return; // ya está cargando el Panel Dios
    if (!cargando && typeof enterAdmin === 'function') { cargando = true; Promise.resolve(enterAdmin()).finally(() => { cargando = false; }); }
  }
  // enterAdmin marca la carga (evita pedir dos veces lo mismo mientras responde la API)
  if (typeof enterAdmin === 'function') {
    const base = enterAdmin;
    enterAdmin = async function () { cargando = true; try { return await base.apply(this, arguments); } finally { cargando = false; } };
  }
  // Toda pintura del inicio de socio pasa por aquí. Si es administrador, se muestra el Panel Dios.
  const envolver = (fn) => function () { if (esAdminDios()) return panelDios(); return fn.apply(this, arguments); };
  if (typeof vInicio === 'function') vInicio = envolver(vInicio);
  try { if (typeof sxoVInicio === 'function') sxoVInicio = envolver(sxoVInicio); } catch (_) {}
  try { if (typeof sxgVInicio === 'function') sxgVInicio = envolver(sxgVInicio); } catch (_) {}
  // Botón «Inicio» y cualquier go('inicio'): Panel Dios sin disparar las cargas del inicio de socio.
  if (typeof go === 'function') {
    const goBase = go;
    go = function (v) { if (v === 'inicio' && esAdminDios()) { window.scrollTo(0, 0); return panelDios(); } return goBase.apply(this, arguments); };
  }
  window.SubliAdminInicio = { esAdminDios, panelDios };
})();
