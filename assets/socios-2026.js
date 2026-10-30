/* ========================================================================
   SUBLICUENTAS · PANEL DE SOCIOS · REDISEÑO 30/10/2026
   Brief: "Rediseño del panel de socios" (compras claras, clientes bien asignados y seguimiento).
   - UNA sola lógica para celular y computadora (el CSS cambia el acomodo, no la lógica).
   - Compra en 3 pasos + confirmación: Productos → Datos de clientes → Revisar y pagar → Confirmación.
   - Brief maestro 30/10/2026: UN cliente por pedido (un pedido, un cliente, un pago). Todos los servicios lo heredan;
     para otra persona: "Nueva compra para otro cliente" (otro pedido y otro comprobante).
   - Cada perfil/cuenta es un renglón con ID propio (dos perfiles HBO = "Perfil 1" y "Perfil 2", independientes).
   - Los datos que se piden salen del catálogo (entregaTipo/entregaCanal/pideDispositivo/datoRequerido).
   - Borrador en este dispositivo (sin claves ni comprobante); requestId estable para reintentos.
   - Sección Pedidos con lista filtrable y detalle. Inicio, Catálogo, Clientes y Renovaciones rediseñados.
   Se carga DESPUÉS de core/operations/catalog-aula/panel-web/messaging y reemplaza esas vistas.
   ======================================================================== */

/* ---------- utilidades ---------- */
const SX_MQ_DESK = window.matchMedia('(min-width: 900px)');
const sxEsc = (v) => escHtml(v == null ? '' : String(v));
const sxAttr = (v) => escAttr(v == null ? '' : String(v));
function sxNorm(v) { return String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
function sxId() { return 'r' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
function sxSplitNombre(full) { const p = String(full || '').trim().split(/\s+/); if (p.length <= 1) return { nombre: p[0] || '', apellido: '' }; if (p.length === 2) return { nombre: p[0], apellido: p[1] }; return { nombre: p.slice(0, p.length - 2).join(' '), apellido: p.slice(-2).join(' ') }; }
function sxNombreCompleto(c) { return `${String(c?.nombre || '').trim()} ${String(c?.apellido || '').trim()}`.trim(); }
function sxToast(t) { let el = document.getElementById('sxToast'); if (!el) { el = document.createElement('div'); el.id = 'sxToast'; el.className = 'sx-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); } el.textContent = t; el.classList.add('on'); clearTimeout(el._h); el._h = setTimeout(() => el.classList.remove('on'), 2200); }
function sxFecha(v) { const d = parseFecha(v); return d ? d.toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function sxFechaHora(v) { const d = parseFecha(v); return d ? d.toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }

/* ---------- catálogo → productos (misma regla que lib_compra_socios.js del servidor) ---------- */
function sxModalidad(it = {}, categoria = '') {
  const t = sxNorm(it.entregaTipo || it.entrega_tipo).replace(/\s+/g, '_'), canal = sxNorm(it.entregaCanal || it.entrega_canal);
  if (t === 'cuenta_completa' || t === 'cuenta') return { m: 'cuenta_completa', inferida: false };
  if (t === 'tv_digital' || t === 'iptv') return { m: 'tv_digital', inferida: false };
  if (t === 'perfil') return { m: 'perfil', inferida: false };
  if (t === 'correo' || t === 'invitacion') return { m: 'correo', inferida: false };
  if (t === 'serial' || t === 'serial_key' || t === 'licencia') return { m: 'licencia', inferida: false };
  if (t === 'detalle' || t === 'recarga') return { m: 'detalle', inferida: false };
  if (t === 'acceso') return { m: canal === 'iptv' ? 'tv_digital' : 'acceso', inferida: false };
  if (canal === 'iptv') return { m: 'tv_digital', inferida: false };
  if (canal === 'invitacion') return { m: 'correo', inferida: false };
  if (/(^| )cuentas? completas?( |$)/.test(sxNorm(categoria))) return { m: 'cuenta_completa', inferida: false };
  const txt = sxNorm([it.n, it.s, it.d, categoria].filter(Boolean).join(' '));
  let m = 'detalle';
  if (/iptv|liontv|latintv|latin tv|lion tv|icomplay|nanotech|evoutouch|oleada|tv digital/.test(txt)) m = 'tv_digital';
  else if (/netflix|disney|\bmax\b|hbo|vix|viki|prime video|paramount|crunchyroll/.test(txt)) m = 'perfil';
  else if (/canva|gemini|office personal|microsoft 365|invitacion|gmail del cliente|correo del cliente/.test(txt)) m = 'correo';
  else if (/mcafee|nod32|eset|antivirus|office 20(21|24)|licencia|serial|\bkey\b/.test(txt)) m = 'licencia';
  else if (/spotify|deezer|youtube|correo y contrasena|correo y clave/.test(txt)) m = 'acceso';
  return { m, inferida: true };
}
function sxPideDispositivo(it = {}, m) {
  const meta = sxNorm(it.pideDispositivo || it.pide_dispositivo);
  if (m === 'tv_digital') return true;
  if (meta === 'si' || meta === 'true') return true;
  if (meta === 'no' || meta === 'false') return false;
  return m === 'perfil';
}
const SX_MODALIDAD_TXT = { perfil: 'Perfil', correo: 'Invitación por correo', cuenta_completa: 'Cuenta completa', tv_digital: 'TV digital', licencia: 'Licencia / KEY', detalle: 'Recarga / detalle', acceso: 'Acceso entregado por el equipo' };
function sxModalidadTxt(p) {
  if (!p) return '';
  if (p.modalidad === 'perfil') return p.pideDispositivo ? 'Perfil · pide dispositivo' : 'Perfil';
  if (p.modalidad === 'detalle' && p.datoRequerido) return `Recarga / detalle · ${p.datoRequerido}`;
  return SX_MODALIDAD_TXT[p.modalidad] || 'Servicio';
}
let sxCacheProductos = { ref: null, list: [] };
function sxProductos() {
  if (sxCacheProductos.ref === PRECIOS && sxCacheProductos.inv === inventario) return sxCacheProductos.list;
  const out = [];
  (PRECIOS || []).forEach((g, gi) => (g.items || []).forEach((it, ii) => {
    const nombre = it.s ? `${it.n} · ${it.s}` : it.n;
    const { m, inferida } = sxModalidad(it, g.cat);
    out.push({
      pid: it.id ? `cat_${compraSlug(it.id)}` : `cat_${gi}_${ii}_${compraSlug(nombre)}`, catalogId: it.id || '',
      nombre, base: it.n || '', sub: it.s || '', precio: it.p == null ? null : Number(it.p), categoria: g.cat || 'Catálogo', catSub: g.sub || '',
      detalle: it.d || '', canal: it.entregaCanal || 'manual', modalidad: m, inferida, pideDispositivo: sxPideDispositivo(it, m),
      datoRequerido: String(it.datoRequerido || '').trim(), emoji: compraEmoji(nombre, g.cat),
      stock: sxStock(inventoryState({ catalogId: it.id || '', id: it.id || '', nombre: it.n, base: it.n })),
    });
  }));
  sxCacheProductos = { ref: PRECIOS, inv: inventario, list: out };
  return out;
}
// "Consultar" explica el proceso: la disponibilidad se confirma al revisar, sin prometer entrega inmediata.
function sxStock(st) { return st && st.key === 'unknown' ? { ...st, label: 'Disponibilidad se confirma al revisar' } : st; }
function sxProducto(pid) { return sxProductos().find((p) => p.pid === pid) || null; }
function sxCatalogoVivo() { return Number(syncAt?.precios || 0) > 0; }
const SX_CANTIDADES = [...Array.from({ length: 20 }, (_, i) => i + 1), 25, 30, 40, 50];

/* ---------- estado único de la compra ---------- */
function sxNuevo() { return { v: 2, paso: 1, renglones: [], principal: { id: '', nombre: '', apellido: '', telefono: '' }, destino: 'sublicuentas', bancoId: '', comentario: '', monto: '', requestId: '', requestFirma: '', incierto: false, avisoPrecio: '', recuperado: false, savedAt: 0 }; }
let SX = sxNuevo(), sxErr = {}, sxImg = '', sxImgInfo = null, sxEnviando = false, sxProgreso = 0, sxConfirmacion = null, sxBuscar = '', sxCat = 'todas', sxEnfocar = '', sxVerComp = false, sxMsg = { t: '', c: '' };
function sxBorradorKey() { return `socios_borrador_compra_${socioCacheId()}`; }
let sxSaveTimer = null;
function sxGuardar() {
  clearTimeout(sxSaveTimer);
  sxSaveTimer = setTimeout(() => {
    try {
      if (!SX.renglones.length && !sxNombreCompleto(SX.principal)) { localStorage.removeItem(sxBorradorKey()); return; }
      SX.savedAt = Date.now();
      localStorage.setItem(sxBorradorKey(), JSON.stringify({ ...SX, recuperado: false })); // sin comprobante ni claves
    } catch (_) {}
  }, 250);
}
function sxCargarBorrador() {
  try {
    const raw = JSON.parse(localStorage.getItem(sxBorradorKey()) || 'null');
    if (!raw || raw.v !== 2 || !Array.isArray(raw.renglones)) return false;
    if (Date.now() - Number(raw.savedAt || 0) > 7 * 86400000) { localStorage.removeItem(sxBorradorKey()); return false; }
    // Borradores de antes del 30/10/2026 con servicios "para otro cliente": se separan en otra compra
    // guardada para esa persona (nunca se pasan sus datos al cliente principal).
    const otros = raw.renglones.filter((r) => r.hereda === false);
    if (otros.length) {
      const porCliente = new Map();
      otros.forEach((r) => { const k = sxNorm(sxNombreCompleto(r.otro)) || 'sin_nombre'; if (!porCliente.has(k)) porCliente.set(k, { principal: { id: r.otro?.id || '', nombre: r.otro?.nombre || '', apellido: r.otro?.apellido || '', telefono: '' }, renglones: [] }); const x = { ...r }; delete x.hereda; delete x.otro; porCliente.get(k).renglones.push(x); });
      porCliente.forEach((g) => sxGuardarAparte({ ...sxNuevo(), principal: g.principal, renglones: g.renglones, destino: raw.destino || 'sublicuentas' }));
      raw.renglones = raw.renglones.filter((r) => r.hereda !== false);
    }
    raw.renglones.forEach((r) => { delete r.hereda; delete r.otro; });
    SX = { ...sxNuevo(), ...raw, recuperado: true, paso: Math.min(3, Math.max(1, Number(raw.paso) || 1)) };
    if (otros.length) SX.avisoPrecio = 'Su compra guardada tenía servicios para otra persona. Ahora cada cliente lleva su propio pedido: los separamos en “Compras guardadas”.';
    return true;
  } catch (_) { return false; }
}
/* Compras guardadas (otro cliente): "Nueva compra para otro cliente" guarda la actual aquí antes de empezar otra. */
function sxGuardadosKey() { return `socios_borrador_guardados_${socioCacheId()}`; }
function sxGuardados() { try { return (JSON.parse(localStorage.getItem(sxGuardadosKey()) || '[]') || []).filter((x) => x && Date.now() - Number(x.savedAt || 0) < 7 * 86400000); } catch (_) { return []; } }
function sxGuardarAparte(compra) {
  try { const l = sxGuardados(); l.unshift({ id: sxId(), principal: compra.principal, renglones: compra.renglones, destino: compra.destino, savedAt: Date.now() }); localStorage.setItem(sxGuardadosKey(), JSON.stringify(l.slice(0, 5))); } catch (_) {}
}
function sxQuitarGuardado(id) { try { localStorage.setItem(sxGuardadosKey(), JSON.stringify(sxGuardados().filter((x) => x.id !== id))); } catch (_) {} }
function sxAbrirGuardado(id) {
  const g = sxGuardados().find((x) => x.id === id); if (!g) return;
  if (SX.renglones.length || sxNombreCompleto(SX.principal)) { if (!confirm('Tiene una compra en preparación. ¿Guardarla aparte y abrir la otra?')) return; sxGuardarAparte(SX); }
  sxQuitarGuardado(id);
  SX = { ...sxNuevo(), principal: g.principal, renglones: g.renglones, destino: g.destino || 'sublicuentas', paso: g.renglones.length ? 2 : 1 };
  sxErr = {}; sxImg = ''; sxImgInfo = null; sxGuardar(); sxRender({ scroll: true });
}
function sxNuevaCompraOtroCliente() {
  const hay = SX.renglones.length || sxNombreCompleto(SX.principal);
  if (hay) {
    const ok = confirm(`Cada cliente lleva su propio pedido y pago.\n\n¿Guardar la compra de ${sxNombreCompleto(SX.principal) || 'este cliente'} para terminarla después y empezar una nueva?`);
    if (!ok) return;
    sxGuardarAparte(SX);
  }
  SX = sxNuevo(); sxErr = {}; sxImg = ''; sxImgInfo = null; sxMsg = { t: '', c: '' }; sxGuardar();
  if (current !== 'compras') go('compras'); else sxRender({ scroll: true });
  sxToast(hay ? 'Compra anterior guardada. Empiece la del otro cliente.' : 'Nueva compra.');
}
function sxGuardadosHtml() {
  const l = sxGuardados(); if (!l.length) return '';
  return `<section class="sx-card"><h2>Compras guardadas</h2><ul class="sx-list">${l.map((g) => `<li><div><b>${sxEsc(sxNombreCompleto(g.principal) || 'Sin cliente')}</b><small>${g.renglones.length} servicio(s) · guardada ${sxFechaHora(g.savedAt)}</small></div><button type="button" class="sx-btn sec sm" data-act="borrador-abrir" data-id="${sxAttr(g.id)}">Continuar</button><button type="button" class="sx-link danger" data-act="borrador-quitar" data-id="${sxAttr(g.id)}">Descartar</button></li>`).join('')}</ul></section>`;
}
function sxBorrarBorrador() { try { localStorage.removeItem(sxBorradorKey()); } catch (_) {} }
function sxTieneBorrador() { try { const r = JSON.parse(localStorage.getItem(sxBorradorKey()) || 'null'); return !!(r && r.v === 2 && r.renglones?.length && Date.now() - Number(r.savedAt || 0) < 7 * 86400000); } catch (_) { return false; } }

function sxRenglonNuevo(pid) { return { rid: sxId(), pid, cantidad: 1, otroPerfil: false, perfilNombre: '', perfilApellido: '', dispositivo: '', correo: '', marcaTv: '', marcaOtra: '', modeloTv: '', detalle: '', notas: '', notasAbiertas: false }; }
function sxAgregar(pid, { silencioso = false } = {}) {
  const p = sxProducto(pid); if (!p) return;
  if (!p.stock.available) { sxToast(`${p.nombre}: agotado por el momento.`); return; }
  if (p.modalidad === 'cuenta_completa') {
    const r = SX.renglones.find((x) => x.pid === pid);
    if (r) { const i = SX_CANTIDADES.indexOf(Number(r.cantidad)); r.cantidad = SX_CANTIDADES[Math.min(SX_CANTIDADES.length - 1, i + 1)]; }
    else SX.renglones.push(sxRenglonNuevo(pid));
  } else SX.renglones.push(sxRenglonNuevo(pid));
  if (!silencioso) sxToast(`✓ Agregado: ${p.nombre}`);
  sxGuardar();
}
function sxQuitarUno(pid) {
  const p = sxProducto(pid); const lista = SX.renglones.filter((x) => x.pid === pid); if (!lista.length) return;
  const ult = lista[lista.length - 1];
  if (p?.modalidad === 'cuenta_completa' && Number(ult.cantidad) > 1) { const i = SX_CANTIDADES.indexOf(Number(ult.cantidad)); ult.cantidad = SX_CANTIDADES[Math.max(0, i - 1)]; }
  else SX.renglones = SX.renglones.filter((x) => x.rid !== ult.rid);
  sxGuardar();
}
function sxUnidades(pid) { return SX.renglones.filter((x) => x.pid === pid).reduce((a, r) => a + (sxProducto(pid)?.modalidad === 'cuenta_completa' ? Number(r.cantidad) || 1 : 1), 0); }
function sxLineas() {
  return SX.renglones.map((r) => { const p = sxProducto(r.pid); return p ? { r, p, cantidad: p.modalidad === 'cuenta_completa' ? Number(r.cantidad) || 1 : 1 } : null; }).filter(Boolean);
}
function sxTotales() {
  const ls = sxLineas();
  const subtotal = ls.reduce((a, l) => a + (l.p.precio !== null ? l.p.precio * l.cantidad : 0), 0);
  const conPrecio = ls.reduce((a, l) => a + (l.p.precio !== null ? l.cantidad : 0), 0);
  const descuento = Math.min(Math.max(conPrecio - 1, 0), 4) * 10; // regla vigente: L10 por unidad adicional, máximo L40
  return { ls, unidades: ls.reduce((a, l) => a + l.cantidad, 0), subtotal, descuento, total: Math.max(0, subtotal - descuento), hayComision: ls.some((l) => l.p.precio === null) };
}
// Un solo cliente por pedido: todos los renglones son del cliente principal.
function sxDestinatario() { return SX.principal; }
function sxNombreDest() { return sxNombreCompleto(SX.principal) || 'el cliente'; }
function sxNombreCorto() { return String(SX.principal.nombre || '').trim().split(/\s+/)[0] || 'este cliente'; }
function sxNumeroUnidad(r) { const mismos = SX.renglones.filter((x) => x.pid === r.pid); return mismos.length > 1 ? mismos.indexOf(r) + 1 : 0; }
function sxEtiquetaUnidad(p, n) { return !n ? '' : p.modalidad === 'perfil' ? `Perfil ${n}` : p.modalidad === 'correo' ? `Acceso ${n}` : `Cuenta ${n}`; }
function sxTextoDuplicar(p) { const n = sxNombreCorto(); return p.modalidad === 'perfil' ? `＋ Agregar otro perfil para ${n}` : p.modalidad === 'correo' ? `＋ Agregar otro acceso para ${n}` : `＋ Agregar otra cuenta de este plan para ${n}`; }
// Datos personales de entrega de un renglón (no se arrastran de una persona a otra).
function sxLimpiarDatosPersonales(r) { Object.assign(r, { otroPerfil: false, perfilNombre: '', perfilApellido: '', dispositivo: '', correo: '', marcaTv: '', marcaOtra: '', modeloTv: '', detalle: '', notas: '', notasAbiertas: false }); }
function sxRenglonTieneDatos(r) { return !!(r.correo || r.dispositivo || r.notas || r.detalle || r.perfilNombre || r.marcaTv || r.modeloTv); }
// Cambiar de cliente antes de enviar: avisar y limpiar datos personales; los productos se conservan.
function sxCambiarCliente(nuevo) {
  const actual = sxNombreCompleto(SX.principal), conDatos = SX.renglones.some(sxRenglonTieneDatos);
  if (actual && conDatos && sxNorm(actual) !== sxNorm(sxNombreCompleto(nuevo)) && !confirm(`Va a cambiar el cliente de ${actual} a ${sxNombreCompleto(nuevo) || 'otro cliente'}. Se borrarán correos, dispositivos, notas y datos de entrega escritos para ${actual}; los productos se conservan. ¿Continuar?`)) return false;
  if (actual && sxNorm(actual) !== sxNorm(sxNombreCompleto(nuevo))) SX.renglones.forEach(sxLimpiarDatosPersonales);
  SX.principal = nuevo; return true;
}

/* ---------- validación (solo lo necesario para cada paso; nunca borra lo escrito) ---------- */
const SX_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
function sxValidarDatos() {
  const e = {};
  if (!String(SX.principal.nombre || '').trim()) e['p:nombre'] = 'Escriba el nombre del cliente principal.';
  if (!String(SX.principal.apellido || '').trim() && !SX.principal.id) e['p:apellido'] = 'Escriba el apellido del cliente principal.';
  for (const { r, p } of sxLineas()) {
    const k = (c) => `${r.rid}:${c}`;
    if (p.modalidad === 'perfil' && r.otroPerfil && !String(r.perfilNombre || '').trim()) e[k('perfilNombre')] = 'Escriba el nombre del perfil.';
    if (p.pideDispositivo && !r.dispositivo) e[k('dispositivo')] = 'Seleccione el dispositivo.';
    if (p.modalidad === 'tv_digital' && r.dispositivo === 'tv') {
      if (!r.marcaTv) e[k('marcaTv')] = 'Seleccione la marca o sistema del TV.';
      else if (r.marcaTv === 'otro' && !String(r.marcaOtra || '').trim()) e[k('marcaOtra')] = 'Escriba la marca y el modelo del TV.';
    }
    if (p.modalidad === 'correo' && !SX_EMAIL.test(String(r.correo || '').trim())) e[k('correo')] = 'Escriba un correo válido para la invitación.';
    if (p.modalidad === 'detalle' && !String(r.detalle || '').trim()) e[k('detalle')] = `Escriba: ${p.datoRequerido || 'el detalle requerido'}.`;
  }
  return e;
}
function sxValidarPago() {
  const e = {}, m = sxTotales();
  if (m.hayComision && !(num(SX.monto) > 0)) e['pago:monto'] = 'Escriba el monto realmente pagado.';
  if (!SX.bancoId) e['pago:banco'] = 'Elija dónde se hizo el pago.';
  if (!sxImg) e['pago:comprobante'] = 'Adjunte el comprobante del pago.';
  return e;
}
function sxRenglonCompleto(r) { const e = sxValidarDatos(); return !Object.keys(e).some((k) => k.startsWith(r.rid + ':')) && !e['p:nombre']; }

/* ---------- payload v2 ---------- */
function sxPayload() {
  const m = sxTotales();
  return {
    version: 2, destino: SX.destino,
    clientePrincipal: { clienteId: SX.principal.id || '', nombre: String(SX.principal.nombre || '').trim(), apellido: String(SX.principal.apellido || '').trim() },
    servicio: m.unidades > 1 ? `Combo ${m.unidades} unidades` : (m.ls[0]?.p.nombre || 'Compra'),
    productos: m.ls.map(({ r, p, cantidad }) => ({
      renglonId: r.rid, id: p.pid, catalogId: p.catalogId, servicio: p.nombre, servicioBase: p.base, catalogCategory: p.categoria, catalogSub: p.sub, catalogDetalle: p.detalle,
      precioCatalogo: p.precio, cantidad, entregaTipo: p.modalidad === 'cuenta_completa' ? 'cuenta_completa' : p.modalidad, entregaCanal: p.canal,
      destinatario: { tipo: 'principal' },
      otroPerfil: p.modalidad === 'perfil' && !!r.otroPerfil, perfilNombre: String(r.perfilNombre || '').trim(), perfilApellido: String(r.perfilApellido || '').trim(),
      dispositivo: p.pideDispositivo ? r.dispositivo : '', correo: p.modalidad === 'correo' ? String(r.correo || '').trim() : '',
      marcaTv: p.modalidad === 'tv_digital' && r.dispositivo === 'tv' ? r.marcaTv : '', marcaOtra: r.marcaTv === 'otro' ? String(r.marcaOtra || '').trim() : '', modeloTv: String(r.modeloTv || '').trim(),
      detalleServicio: p.modalidad === 'detalle' ? String(r.detalle || '').trim() : '', notas: String(r.notas || '').trim(),
    })),
    comboCantidad: m.unidades, subtotalCatalogo: m.subtotal, descuentoCombo: m.descuento, totalCombo: m.total, totalEsperado: m.hayComision ? null : m.total,
    monto: m.hayComision ? num(SX.monto) : m.total, montoCalculado: m.total, bancoId: SX.bancoId, comentario: String(SX.comentario || '').trim(),
  };
}
function sxFirma(payload) { const s = JSON.stringify(payload); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); }

/* ---------- envío con progreso (XHR para mostrar avance de carga del comprobante) ---------- */
function sxPost(path, body, onProg) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open('POST', API.base + path);
    x.setRequestHeader('Content-Type', 'application/json');
    if (API.token) x.setRequestHeader('Authorization', 'Bearer ' + API.token);
    x.timeout = 90000;
    if (x.upload && onProg) x.upload.onprogress = (e) => { if (e.lengthComputable) onProg(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => {
      let j = {}; try { j = JSON.parse(x.responseText || '{}'); } catch (_) {}
      if (x.status === 401) { reject({ code: 'auth', error: 'auth' }); return; }
      if (x.status >= 200 && x.status < 300) resolve(j); else reject({ ...j, status: x.status });
    };
    x.onerror = () => reject({ error: 'network' });
    x.ontimeout = () => reject({ error: 'timeout' });
    x.send(JSON.stringify(body));
  });
}

/* ======================================================================
   COMPRAS
   ====================================================================== */
function vCompras() {
  if (socioSinCompras()) { go('renovar'); return; }
  if (!SX.renglones.length && !sxConfirmacion) sxCargarBorrador();
  if (!sxCatalogoVivo()) loadPrecios();
  if (!dataFresh('inventario')) loadInventario();
  sxRender({ scroll: false });
}
// Llamadas externas (llega inventario/catálogo): no repintar si el socio está escribiendo.
function renderCompraForm() {
  if (current !== 'compras') return;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#sxCompra') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { sxPintarResumen(); return; }
  sxRender({ scroll: false });
}
function enviarCompra() { return sxEnviar(); }
function buyFromCatalog(ix) {
  if (socioSinCompras()) return;
  const g = PRECIOS[Number(catalogCategoria)], it = g?.items?.[ix]; if (!it) return;
  const p = sxProductos().find((x) => x.catalogId && x.catalogId === it.id) || sxProductos().find((x) => x.nombre === (it.s ? `${it.n} · ${it.s}` : it.n));
  if (p) { sxAgregar(p.pid); SX.paso = 1; go('compras'); }
}

const SX_PASOS = [[1, 'Productos'], [2, 'Datos de clientes'], [3, 'Revisar y pagar']];
function sxIrPaso(n) {
  if (n >= 2 && !SX.renglones.length) { sxToast('Agregue al menos un producto.'); return; }
  if (n >= 3) {
    sxErr = sxValidarDatos();
    if (Object.keys(sxErr).length) { SX.paso = 2; sxMsg = { t: 'Faltan datos: revise los campos marcados.', c: 'err' }; sxRender({ scroll: false }); sxEnfocarError(); return; }
  }
  SX.paso = n; sxErr = {}; sxMsg = { t: '', c: '' }; sxGuardar();
  sxRender({ scroll: true });
}
function sxRender({ scroll = false } = {}) {
  if (current !== 'compras') return;
  const y = window.scrollY;
  if (sxConfirmacion) { content.innerHTML = sxConfirmacionHtml(); sxBindConfirmacion(); if (scroll) sxScrollTitulo(); return; }
  const m = sxTotales();
  if (!m.ls.length && SX.paso > 1) SX.paso = 1;
  content.innerHTML = `<div class="sx-page sx-compra" id="sxCompra">
    <header class="sx-page-head"><div><small>Panel de socios</small><h1>Nueva compra</h1></div></header>
    <ol class="sx-steps" aria-label="Pasos de la compra">${SX_PASOS.map(([n, t]) => `<li class="${SX.paso === n ? 'on' : SX.paso > n ? 'done' : ''}"><button type="button" data-act="paso" data-n="${n}" ${n > SX.paso && !(n === 2 && m.ls.length) ? 'disabled' : ''} aria-current="${SX.paso === n ? 'step' : 'false'}"><b>${n}</b><span>${t}</span></button></li>`).join('')}</ol>
    ${SX.recuperado ? `<div class="sx-banner info" role="status"><span>Recuperamos su compra sin terminar${SX.paso === 3 ? '. El comprobante no se guarda: vuelva a adjuntarlo.' : '.'}</span><button type="button" class="sx-link" data-act="descartar">Descartar</button></div>` : ''}
    ${!sxCatalogoVivo() ? `<div class="sx-banner warn" role="status"><span>Validando precios y disponibilidad con el servidor…</span><button type="button" class="sx-link" data-act="recargar-catalogo">Reintentar</button></div>` : ''}
    ${SX.avisoPrecio ? `<div class="sx-banner warn" role="alert"><span>${sxEsc(SX.avisoPrecio)}</span></div>` : ''}
    <div class="sx-layout">
      <main class="sx-main" id="sxMain">${SX.paso === 1 ? sxPaso1Html() : SX.paso === 2 ? sxPaso2Html() : sxPaso3Html()}</main>
      <aside class="sx-summary" id="sxSummary" aria-label="Resumen del pedido">${sxResumenHtml()}</aside>
    </div>
  </div>
  <div class="sx-bottom-bar" id="sxBottomBar">${sxBarraHtml()}</div>`;
  document.body.classList.add('sx-con-barra');
  sxBind();
  if (SX.paso === 3) sxPintarBancos();
  if (scroll) sxScrollTitulo(); else window.scrollTo(0, y);
  if (sxEnfocar) { const el = document.getElementById(sxEnfocar); sxEnfocar = ''; if (el) { el.scrollIntoView({ block: 'center' }); try { el.focus({ preventScroll: true }); } catch (_) {} } }
}
function sxScrollTitulo() {
  const t = document.getElementById('sxPasoTitulo') || document.getElementById('sxConfTitulo');
  if (!t) return;
  t.scrollIntoView({ block: 'start' });
  try { t.focus({ preventScroll: true }); } catch (_) {}
}

/* --- Paso 1 · Productos --- */
function sxListaProductosHtml() {
  const q = sxNorm(sxBuscar), cat = sxCat;
  const list = sxProductos().filter((p) => (cat === 'todas' || p.categoria === cat) && (!q || sxNorm(`${p.nombre} ${p.categoria} ${p.catSub}`).includes(q)));
  if (!list.length) return `<div class="sx-empty"><b>Sin productos</b><p>Pruebe otra búsqueda o categoría.</p></div>`;
  return list.map((p) => {
    const n = sxUnidades(p.pid), st = p.stock;
    return `<article class="sx-prod ${n ? 'sel' : ''} ${!st.available ? 'out' : ''}" data-pid="${sxAttr(p.pid)}">
      <span class="sx-prod-ic" aria-hidden="true">${p.emoji}</span>
      <div class="sx-prod-main"><h3>${sxEsc(p.base || p.nombre)}</h3><p>${sxEsc([p.sub, sxModalidadTxt(p)].filter(Boolean).join(' · '))}</p><span class="sx-stock ${st.key}">${sxEsc(st.label)}</span></div>
      <div class="sx-prod-side"><strong>${p.precio === null ? 'Importe por confirmar' : money(p.precio)}</strong>
        ${n ? `<div class="sx-qty" role="group" aria-label="Cantidad de ${sxAttr(p.nombre)}"><button type="button" data-act="menos" data-pid="${sxAttr(p.pid)}" aria-label="Quitar uno">−</button><output aria-live="polite">${n}</output><button type="button" data-act="mas" data-pid="${sxAttr(p.pid)}" aria-label="Agregar otro" ${!st.available ? 'disabled' : ''}>+</button></div>`
          : `<button type="button" class="sx-btn sec sm" data-act="agregar" data-pid="${sxAttr(p.pid)}" ${!st.available ? 'disabled' : ''}>${st.available ? 'Agregar' : 'Agotado'}</button>`}
      </div></article>`;
  }).join('');
}
function sxPaso1Html() {
  const cats = ['todas', ...new Set(sxProductos().map((p) => p.categoria))];
  return `<section class="sx-card sx-step-card"><h2 id="sxPasoTitulo" tabindex="-1">1. Elija los productos</h2>
    <p class="sx-help">Agregue uno o varios servicios. Para dos perfiles del mismo plan, toque “+”: cada uno tendrá sus propios datos.</p>
    <div class="sx-tools"><label class="sx-field sx-search"><span>Buscar producto</span><input id="sxBuscar" type="search" value="${sxAttr(sxBuscar)}" placeholder="Netflix, Canva, IPTV…" autocomplete="off"></label>
      <label class="sx-field"><span>Categoría</span><select id="sxCat">${cats.map((c) => `<option value="${sxAttr(c)}" ${sxCat === c ? 'selected' : ''}>${c === 'todas' ? 'Todas las categorías' : sxEsc(c)}</option>`).join('')}</select></label></div>
    <p class="sx-help">Descuento automático: L10 por cada unidad adicional con precio, hasta L40.</p>
    <div class="sx-prod-list" id="sxProdList">${sxListaProductosHtml()}</div></section>${sxGuardadosHtml()}`;
}

/* --- Paso 2 · Datos de clientes --- */
function sxSugerenciasClientes(q, excluirId = '') {
  const t = sxNorm(q), dig = String(q || '').replace(/\D/g, '');
  if (t.length < 2 && dig.length < 4) return [];
  return (clientes || []).filter((c) => String(c.id) !== excluirId && (sxNorm(nombreCli(c)).includes(t) || (dig.length >= 4 && String(c.telefono || c.telefono_norm || '').replace(/\D/g, '').includes(dig)))).slice(0, 6);
}
function sxSelectorClienteHtml(scope, sel, buscar) {
  // scope: siempre 'p' (un solo cliente por pedido)
  const pref = 'p';
  const errN = sxErr['p:nombre'], errA = sxErr['p:apellido'];
  if (sel.id) {
    return `<div class="sx-client-chosen"><span class="sx-avatar" aria-hidden="true">${sxEsc((sel.nombre || '?')[0].toUpperCase())}</span><div><b>${sxEsc(sxNombreCompleto(sel))}</b><small>Cliente guardado${sel.telefono ? ' · ' + sxEsc(sel.telefono) : ''}</small></div><button type="button" class="sx-link" data-act="cliente-cambiar" data-scope="${sxAttr(scope)}">Cambiar</button></div>`;
  }
  const sug = sxSugerenciasClientes(buscar || '');
  const fid = (c) => `sx_${scope}_${c}`.replace(/[^a-z0-9_]/gi, '_');
  const dup = !sel.id && sxNombreCompleto(sel) ? (clientes || []).find((c) => sxNorm(nombreCli(c)) === sxNorm(sxNombreCompleto(sel))) : null;
  return `<div class="sx-client-pick">
    <label class="sx-field"><span>Buscar en mis clientes</span><input id="${fid('buscar')}" data-sx="buscar-cliente" data-scope="${sxAttr(scope)}" type="search" value="${sxAttr(buscar || '')}" placeholder="Nombre o teléfono" autocomplete="off" aria-controls="${fid('sug')}"></label>
    ${sug.length ? `<ul class="sx-sug" id="${fid('sug')}" role="listbox">${sug.map((c) => `<li><button type="button" role="option" data-act="cliente-elegir" data-scope="${sxAttr(scope)}" data-id="${sxAttr(c.id)}"><b>${sxEsc(nombreCli(c))}</b><small>${sxEsc(c.telefono || c.telefono_norm || 'Sin teléfono')} · ${(c.servicios || []).length} servicio(s)</small></button></li>`).join('')}</ul>` : ''}
    <p class="sx-or">o escriba un cliente nuevo</p>
    <div class="sx-grid2">
      <label class="sx-field ${errN ? 'err' : ''}"><span>Nombre <i aria-hidden="true">*</i><em class="sr">obligatorio</em></span><input id="${fid('nombre')}" data-sx="${pref}-nombre" data-scope="${sxAttr(scope)}" value="${sxAttr(sel.nombre || '')}" autocomplete="off" aria-invalid="${errN ? 'true' : 'false'}" ${errN ? `aria-describedby="${fid('nombre')}_e"` : ''}>${errN ? `<small class="sx-err" id="${fid('nombre')}_e">${sxEsc(errN)}</small>` : ''}</label>
      <label class="sx-field ${errA ? 'err' : ''}"><span>Apellido <i aria-hidden="true">*</i><em class="sr">obligatorio</em></span><input id="${fid('apellido')}" data-sx="${pref}-apellido" data-scope="${sxAttr(scope)}" value="${sxAttr(sel.apellido || '')}" autocomplete="off" aria-invalid="${errA ? 'true' : 'false'}" ${errA ? `aria-describedby="${fid('apellido')}_e"` : ''}>${errA ? `<small class="sx-err" id="${fid('apellido')}_e">${sxEsc(errA)}</small>` : ''}</label>
    </div>
    ${dup ? `<div class="sx-banner info sm"><span>Ya tiene un cliente llamado <b>${sxEsc(nombreCli(dup))}</b>.</span><button type="button" class="sx-link" data-act="cliente-elegir" data-scope="${sxAttr(scope)}" data-id="${sxAttr(dup.id)}">Usar ese cliente</button></div>` : ''}
  </div>`;
}
let sxBuscarCliente = {};
function sxCampo(r, campo, label, { type = 'text', ph = '', req = true, val, help = '', inputmode = '' } = {}) {
  const id = `sx_${r.rid}_${campo}`, e = sxErr[`${r.rid}:${campo}`];
  return `<label class="sx-field ${e ? 'err' : ''}"><span>${sxEsc(label)}${req ? ' <i aria-hidden="true">*</i><em class="sr">obligatorio</em>' : ''}</span>${help ? `<small class="sx-hint">${sxEsc(help)}</small>` : ''}<input id="${id}" type="${type}" ${inputmode ? `inputmode="${inputmode}"` : ''} data-sx="r" data-rid="${sxAttr(r.rid)}" data-campo="${campo}" value="${sxAttr(val ?? r[campo] ?? '')}" placeholder="${sxAttr(ph)}" autocomplete="off" aria-invalid="${e ? 'true' : 'false'}" ${e ? `aria-describedby="${id}_e"` : ''}>${e ? `<small class="sx-err" id="${id}_e">${sxEsc(e)}</small>` : ''}</label>`;
}
function sxOpciones(r, campo, label, opciones, { help = '' } = {}) {
  const id = `sx_${r.rid}_${campo}`, e = sxErr[`${r.rid}:${campo}`];
  return `<fieldset class="sx-field sx-opts ${e ? 'err' : ''}" id="${id}" tabindex="-1" ${e ? `aria-describedby="${id}_e"` : ''}><legend>${sxEsc(label)} <i aria-hidden="true">*</i><em class="sr">obligatorio</em></legend>${help ? `<small class="sx-hint">${sxEsc(help)}</small>` : ''}
    <div class="sx-chips">${opciones.map(([v, l]) => `<button type="button" class="sx-chip ${r[campo] === v ? 'on' : ''}" aria-pressed="${r[campo] === v}" data-act="opcion" data-rid="${sxAttr(r.rid)}" data-campo="${campo}" data-v="${sxAttr(v)}">${sxEsc(l)}</button>`).join('')}</div>${e ? `<small class="sx-err" id="${id}_e">${sxEsc(e)}</small>` : ''}</fieldset>`;
}
const SX_DISPOSITIVOS = [['tv', 'TV'], ['celular', 'Celular'], ['tablet', 'Tableta'], ['computadora', 'Computadora']];
const SX_MARCAS = [['samsung', 'Samsung'], ['lg', 'LG'], ['tcl', 'TCL'], ['roku', 'Roku TV'], ['android_tv', 'Android / Google TV'], ['fire_tv', 'Fire TV'], ['otro', 'Otra']];
function sxCamposRenglon(r, p) {
  const partes = [];
  if (p.modalidad === 'cuenta_completa') {
    const id = `sx_${r.rid}_cantidad`;
    partes.push(`<label class="sx-field"><span>Cantidad de cuentas completas</span><select id="${id}" data-sx="r" data-rid="${sxAttr(r.rid)}" data-campo="cantidad">${SX_CANTIDADES.map((n) => `<option value="${n}" ${Number(r.cantidad) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label><p class="sx-help">Se entrega una cuenta completa con correo por unidad. No pide perfil ni dispositivo.</p>`);
  }
  if (p.modalidad === 'perfil') {
    partes.push(`<label class="sx-check"><input type="checkbox" data-sx="otroPerfil" data-rid="${sxAttr(r.rid)}" ${r.otroPerfil ? 'checked' : ''}> Usar otro nombre de perfil</label>`);
    if (r.otroPerfil) partes.push(`<div class="sx-grid2">${sxCampo(r, 'perfilNombre', 'Nombre del perfil')}${sxCampo(r, 'perfilApellido', 'Apellido del perfil', { req: false })}</div>`);
  }
  if (p.pideDispositivo) partes.push(sxOpciones(r, 'dispositivo', p.modalidad === 'tv_digital' ? '¿Dónde lo va a ver?' : 'Dispositivo', SX_DISPOSITIVOS, { help: p.modalidad === 'perfil' ? 'Un perfil es para un dispositivo.' : '' }));
  if (p.modalidad === 'tv_digital' && r.dispositivo === 'tv') {
    partes.push(sxOpciones(r, 'marcaTv', 'Marca o sistema del TV', SX_MARCAS));
    if (r.marcaTv === 'otro') partes.push(sxCampo(r, 'marcaOtra', 'Marca y modelo del TV', { ph: 'Ej. Hisense 55A6' }));
    else partes.push(sxCampo(r, 'modeloTv', 'Modelo (opcional)', { req: false, ph: 'Si lo sabe' }));
  }
  if (p.modalidad === 'correo') {
    partes.push(sxCampo(r, 'correo', 'Correo para recibir la invitación', { type: 'email', ph: 'cliente@correo.com', inputmode: 'email' }));
    const otros = sxLineas().filter((l) => l.r.rid !== r.rid && l.p.modalidad === 'correo' && l.r.correo !== r.correo);
    if (otros.length && SX_EMAIL.test(String(r.correo || ''))) partes.push(`<button type="button" class="sx-link" data-act="correo-compartir" data-rid="${sxAttr(r.rid)}">Usar este correo en los otros servicios compatibles (${otros.length})</button>`);
  }
  if (p.modalidad === 'detalle') partes.push(sxCampo(r, 'detalle', p.datoRequerido || 'Detalle requerido', { ph: p.datoRequerido ? '' : 'Usuario, ID, teléfono o indicación' }));
  if (p.modalidad === 'licencia') partes.push(`<p class="sx-help">Se entrega la licencia o KEY después de revisar el pago. No se piden contraseñas.</p>`);
  if (p.modalidad === 'acceso') partes.push(`<p class="sx-help">El equipo entrega el acceso después de revisar el pago.</p>`);
  return partes.join('');
}
function sxRenglonHtml(r, idx) {
  const p = sxProducto(r.pid); if (!p) return '';
  const unidad = sxNumeroUnidad(r), completo = sxRenglonCompleto(r);
  const cant = p.modalidad === 'cuenta_completa' ? `${r.cantidad} cuenta(s)` : p.modalidad === 'perfil' ? '1 perfil' : p.modalidad === 'correo' ? '1 acceso' : '1 cuenta';
  return `<article class="sx-card sx-renglon ${completo ? 'ok' : ''}" id="sxr_${sxAttr(r.rid)}" aria-labelledby="sxr_${sxAttr(r.rid)}_t">
    <header class="sx-renglon-head"><span class="sx-prod-ic" aria-hidden="true">${p.emoji}</span><div><h3 id="sxr_${sxAttr(r.rid)}_t">${sxEsc(p.nombre)}${unidad ? ` · ${sxEtiquetaUnidad(p, unidad)}` : ''}</h3>
      <small>Asignado a <b>${sxEsc(sxNombreDest(r))}</b> · ${sxEsc(cant)} · ${sxEsc(sxModalidadTxt(p))}</small></div>
      <span class="sx-renglon-price">${p.precio === null ? 'Por confirmar' : money(p.precio * (p.modalidad === 'cuenta_completa' ? Number(r.cantidad) || 1 : 1))}</span>
      <span class="sx-state ${completo ? 'ok' : 'pend'}">${completo ? 'Completo' : 'Faltan datos'}</span></header>
    <div class="sx-renglon-body">${sxCamposRenglon(r, p)}
      ${r.notasAbiertas || r.notas ? `<label class="sx-field"><span>Notas de este servicio (opcional)</span><textarea data-sx="r" data-rid="${sxAttr(r.rid)}" data-campo="notas" rows="2" maxlength="300" placeholder="Algo que el equipo deba saber para este servicio">${sxEsc(r.notas)}</textarea></label>` : ''}
      <div class="sx-row-actions">${p.modalidad !== 'cuenta_completa' ? `<button type="button" class="sx-link" data-act="duplicar" data-rid="${sxAttr(r.rid)}">${sxEsc(sxTextoDuplicar(p))}</button>` : ''}${!r.notasAbiertas && !r.notas ? `<button type="button" class="sx-link" data-act="notas" data-rid="${sxAttr(r.rid)}">Agregar nota</button>` : ''}<button type="button" class="sx-link danger" data-act="quitar" data-rid="${sxAttr(r.rid)}">Quitar</button></div>
    </div></article>`;
}
function sxPaso2Html() {
  return `<section class="sx-card sx-step-card sx-principal"><h2 id="sxPasoTitulo" tabindex="-1">2. Cliente principal del pedido</h2>
      <p class="sx-help">Escríbalo una sola vez: todos los servicios de este pedido son para esta persona. ¿Es para otra persona? Haga otro pedido con su propio pago.</p>
      ${sxSelectorClienteHtml('p', SX.principal, sxBuscarCliente.p || '')}</section>
    ${SX.renglones.map(sxRenglonHtml).join('')}
    ${sxMsg.t ? `<div class="sx-msg ${sxMsg.c}" role="alert">${sxEsc(sxMsg.t)}</div>` : ''}
    <div class="sx-nav-actions"><button type="button" class="sx-link" data-act="paso" data-n="1">← Volver a productos</button><button type="button" class="sx-link" data-act="otro-servicio">＋ Agregar otro servicio para ${sxEsc(sxNombreCorto())}</button><button type="button" class="sx-link" data-act="otro-cliente">Nueva compra para otro cliente</button></div>`;
}

/* --- Paso 3 · Revisar y pagar --- */
let sxMetodos = null;
async function sxPintarBancos() {
  const box = document.getElementById('sxBancos'); if (!box) return;
  if (!sxMetodos) { const ms = await cargarMetodosPago(); sxMetodos = Array.isArray(ms) && ms.length ? ms : null; }
  const host = document.getElementById('sxBancos'); if (!host) return;
  const ms = sxMetodos || [];
  if (!ms.length) { host.innerHTML = `<p class="sx-err">No se pudieron cargar los métodos de pago. <button type="button" class="sx-link" data-act="recargar-bancos">Reintentar</button></p>`; return; }
  const sel = ms.find((m) => m.id === SX.bancoId);
  host.innerHTML = `<div class="sx-chips" role="radiogroup" aria-label="Método de pago">${ms.map((m) => `<button type="button" role="radio" aria-checked="${SX.bancoId === m.id}" class="sx-chip ${SX.bancoId === m.id ? 'on' : ''}" data-act="banco" data-id="${sxAttr(m.id)}">${sxEsc(m.nombre)}</button>`).join('')}</div>
    ${sel && (sel.cuenta || sel.titular) ? `<div class="sx-pay-info"><b>${sxEsc(sel.nombre)}</b>${sel.cuenta ? `<span>Cuenta: <strong>${sxEsc(sel.cuenta)}</strong> <button type="button" class="sx-link" data-act="copiar" data-txt="${sxAttr(sel.cuenta)}">Copiar</button></span>` : ''}${sel.titular ? `<span>A nombre de: ${sxEsc(sel.titular)}</span>` : ''}${sel.nota ? `<span>${sxEsc(sel.nota)}</span>` : ''}</div>` : ''}`;
}
function sxPaso3Html() {
  const m = sxTotales(), e = sxErr;
  const filas = m.ls.map(({ r, p, cantidad }) => {
    const datos = [p.pideDispositivo && r.dispositivo ? (SX_DISPOSITIVOS.find((x) => x[0] === r.dispositivo) || [])[1] : '', p.modalidad === 'correo' ? r.correo : '', p.modalidad === 'detalle' ? `${p.datoRequerido || 'Detalle'}: ${r.detalle}` : '', r.otroPerfil && r.perfilNombre ? `Perfil: ${sxNombreCompleto({ nombre: r.perfilNombre, apellido: r.perfilApellido })}` : '', r.notas ? `Nota: ${r.notas}` : ''].filter(Boolean).join(' · ');
    const u = sxNumeroUnidad(r);
    return `<li><div><b>${sxEsc(p.nombre)}${u ? ` · ${sxEtiquetaUnidad(p, u)}` : ''}${cantidad > 1 ? ` × ${cantidad}` : ''}</b><small>${datos ? sxEsc(datos) : 'Sin datos adicionales'}</small></div><span>${p.precio === null ? 'Por confirmar' : money(p.precio * cantidad)}</span></li>`;
  }).join('');
  return `<section class="sx-card sx-step-card"><h2 id="sxPasoTitulo" tabindex="-1">3. Revise el pedido</h2>
      <p class="sx-help">Cliente del pedido: <b>${sxEsc(sxNombreCompleto(SX.principal))}</b>. Un pago y un comprobante para este cliente. <button type="button" class="sx-link" data-act="paso" data-n="2">Editar datos</button></p>
      <ul class="sx-review">${filas}</ul>
      <dl class="sx-totals"><div><dt>Subtotal</dt><dd>${money(m.subtotal)}</dd></div><div><dt>Descuento</dt><dd>−${money(m.descuento)}</dd></div><div class="total"><dt>Total</dt><dd>${money(m.total)}${m.hayComision ? ' + importe por confirmar' : ''}</dd></div></dl>
    </section>
    <section class="sx-card sx-step-card"><h2>Pago</h2>
      <fieldset class="sx-field ${e['pago:banco'] ? 'err' : ''}" id="sx_pago_banco" tabindex="-1"><legend>¿Dónde hizo el pago? <i aria-hidden="true">*</i><em class="sr">obligatorio</em></legend><div id="sxBancos"><p class="sx-help">Cargando métodos…</p></div>${e['pago:banco'] ? `<small class="sx-err">${sxEsc(e['pago:banco'])}</small>` : ''}</fieldset>
      ${m.hayComision ? `<label class="sx-field ${e['pago:monto'] ? 'err' : ''}"><span>Monto realmente pagado <i aria-hidden="true">*</i></span><small class="sx-hint">Hay productos por comisión: escriba lo que pagó. El equipo confirma el importe.</small><input id="sx_pago_monto" type="number" inputmode="decimal" min="0" data-sx="monto" value="${sxAttr(SX.monto)}">${e['pago:monto'] ? `<small class="sx-err">${sxEsc(e['pago:monto'])}</small>` : ''}</label>` : `<p class="sx-help">El total lo calcula y confirma el sistema con su catálogo de socio.</p>`}
      <div class="sx-field ${e['pago:comprobante'] ? 'err' : ''}" id="sx_pago_comprobante" tabindex="-1"><span class="sx-label">Comprobante del pago <i aria-hidden="true">*</i><em class="sr">obligatorio</em></span>
        <input type="file" id="sxFile" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden>
        ${sxImg ? `<div class="sx-receipt"><img src="${sxImg}" alt="Comprobante adjunto" class="${sxVerComp ? 'big' : ''}"><div><b>${sxEsc(sxImgInfo?.name || 'Comprobante')}</b><small>${sxImgInfo ? `${Math.round(sxImgInfo.kb)} KB listo para enviar` : ''}</small><div class="sx-row-actions"><button type="button" class="sx-link" data-act="comp-ver">${sxVerComp ? 'Ver pequeño' : 'Ver'}</button><button type="button" class="sx-link" data-act="comp-elegir">Sustituir</button><button type="button" class="sx-link danger" data-act="comp-quitar">Quitar</button></div></div></div>`
          : `<button type="button" class="sx-drop" data-act="comp-elegir"><b>Adjuntar comprobante</b><small>JPG, PNG o WEBP desde archivos o galería. Se comprime manteniendo legibles monto, fecha y referencia (máx. 7 MB).</small></button>`}
        ${e['pago:comprobante'] ? `<small class="sx-err">${sxEsc(e['pago:comprobante'])}</small>` : ''}</div>
      <label class="sx-field"><span>Comentario general del pedido (opcional)</span><textarea data-sx="comentario" rows="3" maxlength="600" placeholder="Indicación para todo el pedido">${sxEsc(SX.comentario)}</textarea></label>
      <fieldset class="sx-field"><legend>Enviar a</legend><div class="sx-chips">${[['sublicuentas', 'Sublicuentas'], ['relojes', 'Relojes']].map(([v, l]) => `<button type="button" class="sx-chip ${SX.destino === v ? 'on' : ''}" aria-pressed="${SX.destino === v}" data-act="destino" data-v="${v}">${l}</button>`).join('')}</div></fieldset>
      ${sxMsg.t ? `<div class="sx-msg ${sxMsg.c}" role="alert">${sxEsc(sxMsg.t)}</div>` : ''}
    </section>
    <div class="sx-nav-actions"><button type="button" class="sx-link" data-act="paso" data-n="2">← Volver a datos de clientes</button></div>`;
}

/* --- Resumen (computadora: lateral · celular: barra inferior con espacio propio) --- */
function sxAccionPrincipal() {
  const m = sxTotales();
  if (SX.paso === 1) return `<button type="button" class="sx-btn pri full" data-act="paso" data-n="2" ${m.ls.length ? '' : 'disabled'}>Continuar</button>`;
  if (SX.paso === 2) return `<button type="button" class="sx-btn pri full" data-act="paso" data-n="3">Continuar al pago</button>`;
  return `<button type="button" class="sx-btn pri full" id="sxEnviarBtn" data-act="enviar" ${sxEnviando ? 'disabled aria-busy="true"' : ''}>${sxEnviando ? (sxProgreso && sxProgreso < 100 ? `Subiendo comprobante… ${sxProgreso}%` : 'Enviando pedido…') : 'Enviar pedido para revisión'}</button>`;
}
function sxResumenHtml() {
  const m = sxTotales();
  const items = m.ls.map(({ r, p, cantidad }) => { const u = sxNumeroUnidad(r); return `<li><span>${sxEsc(p.base || p.nombre)}${u ? ` · ${sxEtiquetaUnidad(p, u)}` : ''}${cantidad > 1 ? ` × ${cantidad}` : ''}</span><b>${p.precio === null ? '—' : money(p.precio * cantidad)}</b></li>`; }).join('');
  return `<h2>Su pedido</h2>${sxNombreCompleto(SX.principal) ? `<p class="sx-help">Para <b>${sxEsc(sxNombreCompleto(SX.principal))}</b></p>` : ''}${m.ls.length ? `<ul class="sx-sum-list">${items}</ul>` : '<p class="sx-help">Todavía no ha agregado productos.</p>'}
    <dl class="sx-totals"><div><dt>Subtotal</dt><dd>${money(m.subtotal)}</dd></div><div><dt>Descuento</dt><dd>−${money(m.descuento)}</dd></div><div class="total"><dt>Total</dt><dd>${money(m.total)}${m.hayComision ? ' +' : ''}</dd></div></dl>
    ${sxAccionPrincipal()}`;
}
function sxBarraHtml() {
  const m = sxTotales();
  return `<span><b>${m.unidades} servicio${m.unidades === 1 ? '' : 's'}</b> · Total ${money(m.total)}${m.hayComision ? ' +' : ''}</span>${sxAccionPrincipal()}`;
}
function sxPintarResumen() {
  const a = document.getElementById('sxSummary'); if (a) a.innerHTML = sxResumenHtml();
  const b = document.getElementById('sxBottomBar'); if (b) b.innerHTML = sxBarraHtml();
}
function sxPintarRenglonEstado(rid) {
  const r = SX.renglones.find((x) => x.rid === rid), card = document.getElementById('sxr_' + rid); if (!r || !card) return;
  const ok = sxRenglonCompleto(r), st = card.querySelector('.sx-state');
  card.classList.toggle('ok', ok); if (st) { st.className = `sx-state ${ok ? 'ok' : 'pend'}`; st.textContent = ok ? 'Completo' : 'Faltan datos'; }
  const small = card.querySelector('.sx-renglon-head small b'); if (small) small.textContent = sxNombreDest(r);
}
function sxLimpiarError(key, inputEl) {
  if (!sxErr[key]) return; delete sxErr[key];
  const f = inputEl?.closest('.sx-field'); if (f) { f.classList.remove('err'); f.querySelector('.sx-err')?.remove(); }
  inputEl?.setAttribute('aria-invalid', 'false');
}
function sxEnfocarError() {
  const orden = Object.keys(sxErr);
  if (!orden.length) return;
  const k = orden[0];
  let id = '';
  if (k === 'p:nombre') id = 'sx_p_nombre'; else if (k === 'p:apellido') id = 'sx_p_apellido';
  else if (k.startsWith('pago:')) id = { 'pago:banco': 'sx_pago_banco', 'pago:monto': 'sx_pago_monto', 'pago:comprobante': 'sx_pago_comprobante' }[k];
  else { const [rid, campo] = k.split(':'); id = campo === 'otroNombre' ? `sx_${rid}_nombre` : campo === 'otroApellido' ? `sx_${rid}_apellido` : `sx_${rid}_${campo}`; }
  const el = document.getElementById(id.replace(/[^a-z0-9_]/gi, '_')) || document.getElementById(id);
  if (el) { el.scrollIntoView({ block: 'center' }); try { el.focus({ preventScroll: true }); } catch (_) {} }
}

/* --- eventos (delegados en la vista; los textos se guardan al escribir sin repintar) --- */
function sxBind() {
  const root = document.getElementById('sxCompra'), bar = document.getElementById('sxBottomBar');
  [root, bar].forEach((el) => el && el.addEventListener('click', sxOnClick));
  if (!root) return;
  root.addEventListener('input', sxOnInput);
  root.addEventListener('change', sxOnChange);
  root.querySelector('#sxFile')?.addEventListener('change', (ev) => sxElegirComprobante(ev.target));
}
function sxOnInput(ev) {
  const el = ev.target, k = el.dataset.sx; if (!k) return;
  if (el.id === 'sxBuscar') { sxBuscar = el.value; const l = document.getElementById('sxProdList'); if (l) l.innerHTML = sxListaProductosHtml(); return; }
  if (k === 'buscar-cliente') {
    const scope = el.dataset.scope; sxBuscarCliente[scope] = el.value;
    const ul = el.closest('.sx-client-pick'); const sug = sxSugerenciasClientes(el.value);
    let list = ul.querySelector('.sx-sug');
    const html = sug.map((c) => `<li><button type="button" role="option" data-act="cliente-elegir" data-scope="${sxAttr(scope)}" data-id="${sxAttr(c.id)}"><b>${sxEsc(nombreCli(c))}</b><small>${sxEsc(c.telefono || c.telefono_norm || 'Sin teléfono')} · ${(c.servicios || []).length} servicio(s)</small></button></li>`).join('');
    if (!sug.length) list?.remove();
    else { if (!list) { list = document.createElement('ul'); list.className = 'sx-sug'; list.setAttribute('role', 'listbox'); el.closest('.sx-field').after(list); } list.innerHTML = html; }
    return;
  }
  if (k === 'p-nombre' || k === 'p-apellido') {
    SX.principal[k === 'p-nombre' ? 'nombre' : 'apellido'] = el.value; SX.principal.id = '';
    sxLimpiarError(k === 'p-nombre' ? 'p:nombre' : 'p:apellido', el);
    SX.renglones.forEach((r) => sxPintarRenglonEstado(r.rid));
    sxPintarResumen(); sxGuardar(); return;
  }
  if (k === 'r') {
    const r = SX.renglones.find((x) => x.rid === el.dataset.rid); if (!r) return;
    const campo = el.dataset.campo; r[campo] = campo === 'cantidad' ? Number(el.value) || 1 : el.value;
    sxLimpiarError(`${r.rid}:${campo}`, el); sxPintarRenglonEstado(r.rid);
    if (campo === 'cantidad') { sxPintarResumen(); const pr = el.closest('.sx-renglon')?.querySelector('.sx-renglon-price'); const p = sxProducto(r.pid); if (pr && p && p.precio !== null) pr.textContent = money(p.precio * r.cantidad); }
    sxGuardar(); return;
  }
  if (k === 'monto') { SX.monto = el.value; sxLimpiarError('pago:monto', el); sxGuardar(); return; }
  if (k === 'comentario') { SX.comentario = el.value; sxGuardar(); }
}
function sxOnChange(ev) {
  const el = ev.target, k = el.dataset.sx;
  if (el.id === 'sxCat') { sxCat = el.value; const l = document.getElementById('sxProdList'); if (l) l.innerHTML = sxListaProductosHtml(); return; }
  if (k === 'otroPerfil') { const r = SX.renglones.find((x) => x.rid === el.dataset.rid); if (!r) return; r.otroPerfil = el.checked; if (r.otroPerfil) sxEnfocar = `sx_${r.rid}_perfilNombre`; else { delete sxErr[`${r.rid}:perfilNombre`]; } sxGuardar(); sxRender(); return; }
  if (k === 'r' && el.tagName === 'SELECT') sxOnInput(ev);
}
async function sxOnClick(ev) {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, rid = b.dataset.rid, r = rid ? SX.renglones.find((x) => x.rid === rid) : null;
  if (act === 'paso') { sxIrPaso(Number(b.dataset.n)); return; }
  if (act === 'agregar' || act === 'mas') {
    sxAgregar(b.dataset.pid, { silencioso: act === 'mas' });
    const card = b.closest('.sx-prod'); if (card) { const tmp = document.createElement('div'); tmp.innerHTML = sxListaProductosHtml(); const nuevo = [...tmp.children].find((x) => x.dataset.pid === b.dataset.pid); if (nuevo) { card.replaceWith(nuevo); nuevo.querySelector('[data-act="mas"]')?.focus({ preventScroll: true }); } }
    sxPintarResumen(); return;
  }
  if (act === 'menos') { sxQuitarUno(b.dataset.pid); const card = b.closest('.sx-prod'); if (card) { const tmp = document.createElement('div'); tmp.innerHTML = sxListaProductosHtml(); const nuevo = [...tmp.children].find((x) => x.dataset.pid === b.dataset.pid); if (nuevo) { card.replaceWith(nuevo); (nuevo.querySelector('[data-act="menos"]') || nuevo.querySelector('[data-act="agregar"]'))?.focus({ preventScroll: true }); } } sxPintarResumen(); return; }
  if (act === 'descartar') { if (!confirm('¿Descartar la compra guardada en este dispositivo?')) return; SX = sxNuevo(); sxErr = {}; sxImg = ''; sxImgInfo = null; sxBorrarBorrador(); sxRender({ scroll: true }); return; }
  if (act === 'recargar-catalogo') { await loadPrecios(); sxRender(); return; }
  if (act === 'recargar-bancos') { sxMetodos = null; metodosPagoCache = null; sxPintarBancos(); return; }
  if (act === 'opcion' && r) {
    r[b.dataset.campo] = b.dataset.v;
    if (b.dataset.campo === 'dispositivo' && b.dataset.v !== 'tv') { r.marcaTv = ''; r.marcaOtra = ''; }
    sxLimpiarError(`${r.rid}:${b.dataset.campo}`, null); sxGuardar();
    const y = window.scrollY; sxRender(); window.scrollTo(0, y);
    document.querySelector(`[data-act="opcion"][data-rid="${CSS.escape(r.rid)}"][data-campo="${b.dataset.campo}"][data-v="${CSS.escape(b.dataset.v)}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (act === 'cliente-elegir') {
    const c = (clientes || []).find((x) => String(x.id) === String(b.dataset.id)); if (!c) return;
    const n = sxSplitNombre(nombreCli(c)), sel = { id: String(c.id), nombre: n.nombre, apellido: n.apellido, telefono: c.telefono || c.telefono_norm || '' };
    if (!sxCambiarCliente(sel)) return;
    delete sxErr['p:nombre']; delete sxErr['p:apellido']; sxBuscarCliente.p = '';
    sxGuardar(); sxRender(); return;
  }
  if (act === 'cliente-cambiar') {
    if (!sxCambiarCliente({ id: '', nombre: '', apellido: '', telefono: '' })) return;
    sxEnfocar = 'sx_p_buscar'; sxGuardar(); sxRender(); return;
  }
  if (act === 'otro-servicio') { SX.paso = 1; sxErr = {}; sxGuardar(); sxRender({ scroll: true }); sxToast(`Elija otro servicio para ${sxNombreCorto()}.`); return; }
  if (act === 'otro-cliente') { sxNuevaCompraOtroCliente(); return; }
  if (act === 'borrador-abrir') { sxAbrirGuardado(b.dataset.id); return; }
  if (act === 'borrador-quitar') { sxQuitarGuardado(b.dataset.id); sxRender(); return; }
  if (act === 'duplicar' && r) { const nuevo = sxRenglonNuevo(r.pid); SX.renglones.splice(SX.renglones.indexOf(r) + 1, 0, nuevo); sxEnfocar = `sxr_${nuevo.rid}`; sxGuardar(); sxRender(); const card = document.getElementById('sxr_' + nuevo.rid); card?.scrollIntoView({ block: 'center' }); const p = sxProducto(r.pid); sxToast(`Se agregó ${sxEtiquetaUnidad(p, sxNumeroUnidad(nuevo)).toLowerCase()} para ${sxNombreCorto()} con sus propios datos.`); return; }
  if (act === 'notas' && r) { r.notasAbiertas = true; sxGuardar(); sxRender(); document.querySelector(`#sxr_${CSS.escape(r.rid)} textarea`)?.focus(); return; }
  if (act === 'quitar' && r) {
    const p = sxProducto(r.pid);
    if (sxRenglonTieneDatos(r) && !confirm(`¿Quitar ${p?.nombre || 'este servicio'} del pedido? Se pierden los datos escritos en ese servicio.`)) return;
    SX.renglones = SX.renglones.filter((x) => x.rid !== r.rid); Object.keys(sxErr).filter((x) => x.startsWith(r.rid + ':')).forEach((x) => delete sxErr[x]); sxGuardar(); sxRender(); return;
  }
  if (act === 'correo-compartir' && r) { const otros = sxLineas().filter((l) => l.r.rid !== r.rid && l.p.modalidad === 'correo'); otros.forEach((l) => { l.r.correo = r.correo; delete sxErr[`${l.r.rid}:correo`]; }); sxGuardar(); sxRender(); sxToast(`Correo usado en ${otros.length} servicio(s) más.`); return; }
  if (act === 'banco') { SX.bancoId = b.dataset.id; delete sxErr['pago:banco']; document.querySelector('#sx_pago_banco')?.classList.remove('err'); document.querySelector('#sx_pago_banco .sx-err')?.remove(); sxGuardar(); sxPintarBancos(); return; }
  if (act === 'copiar') { navigator.clipboard?.writeText(b.dataset.txt || ''); sxToast('Copiado.'); return; }
  if (act === 'destino') { SX.destino = b.dataset.v; sxGuardar(); document.querySelectorAll('[data-act="destino"]').forEach((x) => { x.classList.toggle('on', x.dataset.v === SX.destino); x.setAttribute('aria-pressed', String(x.dataset.v === SX.destino)); }); return; }
  if (act === 'comp-elegir') { document.getElementById('sxFile')?.click(); return; }
  if (act === 'comp-quitar') { sxImg = ''; sxImgInfo = null; sxVerComp = false; sxRender(); return; }
  if (act === 'comp-ver') { sxVerComp = !sxVerComp; sxRender(); return; }
  if (act === 'enviar') { sxEnviar(); }
}
async function sxElegirComprobante(input) {
  const f = input.files && input.files[0]; if (!f) return;
  if (!/^image\/(jpeg|png|webp)$/.test(f.type) && !/\.(jpe?g|png|webp)$/i.test(f.name || '')) { sxErr['pago:comprobante'] = 'Use una imagen JPG, PNG o WEBP.'; sxRender(); return; }
  try {
    // 1600 px y calidad .82: los números del comprobante siguen legibles.
    let data = await compressImage(f, 1600, 0.82);
    if (data.length > 6.5 * 1024 * 1024 * 1.37) data = await compressImage(f, 1280, 0.72);
    sxImg = data; sxImgInfo = { name: f.name || 'comprobante', kb: (data.length * 0.75) / 1024 };
    delete sxErr['pago:comprobante']; sxRender();
  } catch (_) { sxErr['pago:comprobante'] = 'No se pudo leer la imagen. Pruebe con otra captura.'; sxRender(); }
  finally { input.value = ''; }
}

/* --- enviar: una sola vez, reintento seguro, total confirmado por el servidor --- */
async function sxEnviar() {
  if (sxEnviando) return;
  sxErr = { ...sxValidarDatos() };
  if (Object.keys(sxErr).length) { SX.paso = 2; sxMsg = { t: 'Faltan datos de clientes: revise los campos marcados.', c: 'err' }; sxRender(); sxEnfocarError(); return; }
  sxErr = sxValidarPago();
  if (Object.keys(sxErr).length) { sxMsg = { t: 'Complete el pago para enviar.', c: 'err' }; sxRender(); sxEnfocarError(); return; }
  if (!sxCatalogoVivo()) { await loadPrecios(); if (!sxCatalogoVivo()) { sxMsg = { t: 'No se pudo validar el catálogo con el servidor. Revise su conexión y reintente.', c: 'err' }; sxRender(); return; } }
  const payload = sxPayload(), firma = sxFirma(payload);
  // Contenido cambiado después de un intento con resultado incierto: primero averiguar si ya llegó.
  if (SX.requestId && SX.requestFirma && SX.requestFirma !== firma) {
    if (SX.incierto) {
      const st = await API.call('/rev/compra/estado?requestId=' + encodeURIComponent(SX.requestId), { cache: 'no-store' }).catch(() => null);
      if (st?.existe) { sxExito(st.pedido, true); return; }
      if (!st) { sxMsg = { t: 'Sin conexión: no podemos confirmar si el intento anterior llegó. Reintente cuando tenga internet.', c: 'err' }; sxRender(); return; }
    }
    SX.requestId = '';
  }
  SX.requestId = SX.requestId || nuevoOpId(); SX.requestFirma = firma; SX.incierto = false; sxGuardar();
  sxEnviando = true; sxProgreso = 0; sxMsg = { t: '', c: '' }; sxPintarResumen();
  try {
    const r = await sxPost('/rev/compra', { ...payload, requestId: SX.requestId, imagen: sxImg }, (pct) => { sxProgreso = pct; sxPintarResumen(); });
    sxExito(r, r.duplicate === true);
  } catch (e) {
    sxEnviando = false; sxProgreso = 0;
    if (e.code === 'auth') { location.reload(); return; }
    if (e.error === 'network' || e.error === 'timeout' || (e.status >= 500 && e.status !== 503)) {
      SX.incierto = true; sxGuardar();
      const st = await API.call('/rev/compra/estado?requestId=' + encodeURIComponent(SX.requestId), { cache: 'no-store' }).catch(() => null);
      if (st?.existe) { sxExito(st.pedido, true); return; }
      sxMsg = { t: 'No recibimos confirmación del servidor. Sus datos siguen aquí: toque Enviar de nuevo (no se duplicará).', c: 'err' }; sxRender(); return;
    }
    if (e.error === 'precio_cambio') {
      const antes = sxTotales().total;
      markSyncStale(['precios']); await loadPrecios(); sxCacheProductos.ref = null;
      SX.avisoPrecio = `El catálogo cambió: el total pasó de ${money(antes)} a ${money(e.totalCombo)}. Revise el pedido y vuelva a enviarlo.`;
      SX.requestId = ''; sxRender({ scroll: true }); return;
    }
    if (e.error === 'datos_incompletos' && Array.isArray(e.errores)) {
      sxErr = {}; e.errores.forEach((x) => { const k = x.renglonId === 'principal' || x.campo === 'destinatario' ? 'p:nombre' : `${x.renglonId}:${x.campo}`; sxErr[k] = x.mensaje; });
      SX.paso = 2; sxMsg = { t: 'El servidor encontró datos incompletos: revise los campos marcados.', c: 'err' }; sxRender(); sxEnfocarError(); return;
    }
    const map = { cliente_unico: 'Un pedido es para un solo cliente. Haga otro pedido para la otra persona.', sin_stock: e.detail || 'Uno de los productos ya no tiene disponibilidad. Quítelo o cambie la cantidad.', falta_banco: 'Elija dónde hizo el pago.', imagen_muy_grande: 'La imagen supera 7 MB. Use otra captura.', cliente_ajeno: 'Uno de los clientes elegidos no pertenece a su cartera. Elíjalo de nuevo.', producto_fuera_catalogo: 'Un producto ya no está en su catálogo. Quítelo y vuelva a agregarlo.', catalogo_no_configurado: 'Su tarifa todavía no está configurada. Avise a Sublicuentas.', sin_permiso_comprar: 'Su usuario no tiene permiso para registrar compras.', destino_invalido: 'Elija Sublicuentas o Relojes.' };
    if (['producto_fuera_catalogo', 'sin_stock', 'cliente_ajeno'].includes(e.error)) SX.requestId = '';
    sxMsg = { t: map[e.error] || `No se pudo enviar el pedido. ${e.detail || e.error || 'Reintente.'}`, c: 'err' }; sxRender();
  }
}
function sxExito(r, duplicado) {
  const m = sxTotales();
  sxConfirmacion = { id: r.id, ref: r.ref || String(r.id || '').slice(-6).toUpperCase(), duplicado, destinoLabel: r.destinoLabel || '', total: Number(r.totalCombo ?? m.total), descuento: Number(r.descuentoCombo ?? m.descuento), estado: r.estado || 'pendiente', principal: sxNombreCompleto(SX.principal), lineas: m.ls.map(({ r: rr, p, cantidad }) => ({ nombre: p.nombre + (sxNumeroUnidad(rr) ? ` · ${sxEtiquetaUnidad(p, sxNumeroUnidad(rr))}` : ''), cantidad, precio: p.precio })), comprobante: r.comprobante !== false };
  SX = sxNuevo(); sxErr = {}; sxImg = ''; sxImgInfo = null; sxEnviando = false; sxProgreso = 0; sxMsg = { t: '', c: '' }; sxBorrarBorrador();
  markSyncStale(['compras', 'inventario', 'metricas']);
  Promise.allSettled([loadMisCompras(), loadInventario(), loadMetricas()]);
  sxRender({ scroll: true });
}
function sxConfirmacionHtml() {
  const c = sxConfirmacion, [cls, label] = sxEstadoPedido(c.estado);
  return `<div class="sx-page sx-compra"><section class="sx-card sx-confirm" aria-labelledby="sxConfTitulo">
    <span class="sx-confirm-ic" aria-hidden="true">✓</span>
    <h1 id="sxConfTitulo" tabindex="-1">Pedido #${sxEsc(c.ref)} ${c.duplicado ? 'ya estaba registrado' : 'recibido'}</h1>
    <p>${c.duplicado ? 'Este pedido ya había llegado antes: no se creó otro.' : `El servidor confirmó el registro${c.destinoLabel ? ` y avisó a ${sxEsc(c.destinoLabel.replace(/^[^\p{L}]+/u, ''))}` : ''}.`} Estado: <span class="sx-pill ${cls}">${label}</span></p>
    <p class="sx-help">“Recibido” no significa pago verificado: el equipo revisa el comprobante y después entrega. Lo verá cambiar en Pedidos.</p>
    <p class="sx-help">Cliente: <b>${sxEsc(c.principal)}</b></p>
    <ul class="sx-review">${c.lineas.map((l) => `<li><div><b>${sxEsc(l.nombre)}${l.cantidad > 1 ? ` × ${l.cantidad}` : ''}</b></div><span>${l.precio === null ? 'Por confirmar' : money(l.precio * l.cantidad)}</span></li>`).join('')}</ul>
    <dl class="sx-totals"><div><dt>Descuento</dt><dd>−${money(c.descuento)}</dd></div><div class="total"><dt>Total</dt><dd>${money(c.total)}</dd></div></dl>
    <div class="sx-confirm-actions"><button type="button" class="sx-btn pri" data-act="ver-pedido">Ver pedido</button><button type="button" class="sx-btn sec" data-act="nueva-compra">Nueva compra</button></div>
    <p class="sx-help">¿Otro cliente? Use “Nueva compra”: cada cliente lleva su propio pedido y comprobante.</p>
  </section></div>`;
}
function sxBindConfirmacion() {
  document.body.classList.remove('sx-con-barra');
  content.querySelector('.sx-confirm')?.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'ver-pedido') { const id = sxConfirmacion.id; sxConfirmacion = null; sxPedidoAbierto = id; go('pedidos'); }
    if (b.dataset.act === 'nueva-compra') { sxConfirmacion = null; SX = sxNuevo(); sxRender({ scroll: true }); }
  });
}

/* ======================================================================
   PEDIDOS
   ====================================================================== */
let sxPedidoAbierto = '', sxPedFiltro = 'todos', sxPedBuscar = '', sxConsultas = null, sxConsultaMsg = { id: '', t: '', c: '' }, sxPedTab = 'pedidos', sxConsultaOp = '';
function sxEstadoPedido(v) {
  const s = sxNorm(v || 'pendiente');
  if (['entregado', 'completado'].includes(s)) return ['ok', 'Entregado'];
  if (['en proceso', 'proceso'].includes(s)) return ['work', 'En preparación'];
  if (['falta informacion'].includes(s)) return ['warn', 'Falta información'];
  if (['cancelado'].includes(s)) return ['off', 'Cancelado'];
  return ['info', 'Recibido'];
}
const SX_FILTROS_PED = [['todos', 'Todos'], ['info', 'Recibidos'], ['work', 'En preparación'], ['warn', 'Falta información'], ['ok', 'Entregados'], ['off', 'Cancelados']];
function sxPedidoCliente(o) { return o.clientePrincipal ? sxNombreCompleto(o.clientePrincipal) : (o.productos?.[0]?.clienteNombre || ''); }
function sxPedTabsHtml() {
  const n = typeof sxNovedades === 'object' && sxNovedades ? (sxNovedades.entregas || []).length : 0;
  return `<div class="sx-tabs" role="tablist" aria-label="Pedidos y entregas"><button type="button" role="tab" class="sx-tab ${sxPedTab === 'pedidos' ? 'on' : ''}" aria-selected="${sxPedTab === 'pedidos'}" data-act="pedtab" data-v="pedidos">Mis pedidos</button><button type="button" role="tab" class="sx-tab ${sxPedTab === 'entregas' ? 'on' : ''}" aria-selected="${sxPedTab === 'entregas'}" data-act="pedtab" data-v="entregas">Mis entregas${n ? ` <span class="sx-dot">${n}</span>` : ''}</button></div>`;
}
function sxEstadoEntrega(o) {
  const e = o.entregaResumen;
  if (!e || sxEstadoPedido(o.estado)[0] === 'off') return null;
  if (e.estado === 'parcial') return ['work', e.texto];
  if (e.estado === 'entregado') return ['ok', 'Entregado al socio'];
  return null;
}
function vPedidos() {
  if (socioSinCompras()) { go('renovar'); return; }
  document.body.classList.remove('sx-con-barra');
  if (sxPedTab === 'entregas' && !sxPedidoAbierto && typeof sxEntregasVista === 'function') { sxEntregasVista(); return; }
  const o = sxPedidoAbierto ? (misCompras || []).find((x) => x.id === sxPedidoAbierto) : null;
  if (sxPedidoAbierto && o) { content.innerHTML = sxPedidoDetalleHtml(o); sxBindPedidos(); if (sxConsultas === null) sxCargarConsultas(); return; }
  const lista = (misCompras || []).filter((x) => {
    const [cls] = sxEstadoPedido(x.estado), q = sxNorm(sxPedBuscar);
    return (sxPedFiltro === 'todos' || cls === sxPedFiltro) && (!q || sxNorm([x.ref, x.servicio, sxPedidoCliente(x), ...(x.productos || []).map((p) => `${p.servicio} ${p.clienteNombre}`)].join(' ')).includes(q));
  });
  const cuenta = (k) => (misCompras || []).filter((x) => sxEstadoPedido(x.estado)[0] === k).length;
  content.innerHTML = `<div class="sx-page"><header class="sx-page-head"><div><small>Seguimiento</small><h1>Pedidos</h1></div><div class="sx-head-actions"><button type="button" class="sx-btn pri" data-act="nueva">Nueva compra</button></div></header>
    ${sxPedTabsHtml()}
    <div class="sx-tools"><label class="sx-field sx-search"><span>Buscar pedido</span><input id="sxPedBuscar" type="search" value="${sxAttr(sxPedBuscar)}" placeholder="Número, cliente o servicio"></label></div>
    <div class="sx-filter" role="group" aria-label="Filtrar por estado">${SX_FILTROS_PED.map(([k, l]) => `<button type="button" class="sx-chip ${sxPedFiltro === k ? 'on' : ''}" aria-pressed="${sxPedFiltro === k}" data-act="filtro" data-v="${k}">${l}${k !== 'todos' && cuenta(k) ? ` · ${cuenta(k)}` : ''}</button>`).join('')}</div>
    ${!syncAt.compras && !(misCompras || []).length ? '<div class="sx-card"><p class="sx-help">Cargando pedidos…</p></div>' : lista.length ? `<ul class="sx-orders">${lista.map((x) => { const [cls, label] = sxEstadoEntrega(x) || sxEstadoPedido(x.estado); return `<li><button type="button" class="sx-order" data-act="abrir" data-id="${sxAttr(x.id)}"><span class="sx-order-ref">#${sxEsc(x.ref || String(x.id).slice(-6).toUpperCase())}</span><div><b>${sxEsc(sxPedidoCliente(x) || x.servicio)}</b><small>${sxEsc((x.productos || []).map((p) => p.servicioBase || p.servicio).join(' + ') || x.servicio)} · ${sxFechaHora(x.createdAt)}</small>${x.detalleEstado && cls === 'warn' ? `<small class="sx-warn-txt">${sxEsc(x.detalleEstado)}</small>` : ''}</div><span class="sx-order-total">${money(x.totalCombo || x.monto)}</span><span class="sx-pill ${cls}">${label}</span></button></li>`; }).join('')}</ul>` : `<div class="sx-card sx-empty"><b>Sin pedidos en este filtro</b><p>Cuando envíe una compra aparecerá aquí con su estado.</p></div>`}
  </div>`;
  sxBindPedidos();
}
const SX_RENGLON_EST = { publicada: ['ok', 'Entregado'], revocada: ['off', 'Acceso revocado'], pendiente: ['info', 'Pendiente'] };
function sxPedidoDetalleHtml(o) {
  const [cls0] = sxEstadoPedido(o.estado);
  const [cls, label] = sxEstadoEntrega(o) || sxEstadoPedido(o.estado);
  const ren = o.entregaResumen?.renglones || {};
  const pago = o.pagoEnRevision ? `Pago en revisión por el equipo · ${money(o.monto || o.totalCombo)}` : cls0 === 'off' ? 'Pedido cancelado' : cls0 === 'ok' ? `Pagado ${money(o.monto || o.totalCombo)}${o.banco ? ' · ' + o.banco : ''}` : `${o.comprobante ? 'Comprobante enviado' : 'Sin comprobante'}${o.banco ? ' · ' + o.banco : ''} · ${money(o.monto || o.totalCombo)} · pendiente de verificación por el equipo`;
  const consultas = (sxConsultas || []).filter((c) => c.pedidoId === o.id);
  const mixto = !!o.historicoAnterior;
  return `<div class="sx-page"><button type="button" class="sx-link" data-act="volver">← Pedidos</button>
    <header class="sx-page-head"><div><small>Pedido</small><h1 id="sxPedTitulo" tabindex="-1">#${sxEsc(o.ref || String(o.id).slice(-6).toUpperCase())}</h1><p class="sx-help">${sxFechaHora(o.createdAt)} · ${sxEsc(rev?.nombreMostrar || revName())} → ${sxEsc((o.destinoLabel || 'Sublicuentas').replace(/^[^\p{L}]+/u, ''))}</p></div><span class="sx-pill ${cls} lg">${label}</span></header>
    ${o.detalleEstado ? `<div class="sx-banner ${cls === 'warn' ? 'warn' : 'info'}" role="status"><span>${cls === 'warn' ? '<b>Falta información:</b> ' : ''}${sxEsc(o.detalleEstado)}</span></div>` : ''}
    ${mixto ? '<div class="sx-banner info" role="note"><span><b>Histórico anterior:</b> este pedido es de antes de la regla “un cliente por pedido” y se conserva tal como se registró.</span></div>' : ''}
    <div class="sx-detail-grid">
      <section class="sx-card"><h2>Servicios</h2><p class="sx-help">Cliente: <b>${sxEsc(sxPedidoCliente(o) || '—')}</b></p>
        <ul class="sx-review">${(o.productos || []).map((p) => { const er = ren[p.renglonId] || { estado: 'pendiente' }; const [ec, el] = cls0 === 'off' ? ['off', 'Cancelado'] : (SX_RENGLON_EST[er.estado] || SX_RENGLON_EST.pendiente); return `<li><div><b>${sxEsc(p.servicio)}${(p.cantidad || 1) > 1 ? ` × ${p.cantidad}` : ''}</b><small>${mixto ? `Para ${sxEsc(p.clienteNombre || p.perfil || '—')}` : ''}${[p.otroPerfil && p.perfil ? `Perfil: ${p.perfil}` : '', p.dispositivo, p.marcaTv, p.correo, p.detalleServicio ? `${p.datoRequerido || 'Detalle'}: ${p.detalleServicio}` : '', p.notas ? `Nota: ${p.notas}` : ''].filter(Boolean).map((x, i) => (i || mixto ? ' · ' : '') + sxEsc(x)).join('')}</small><span class="sx-line-state"><span class="sx-pill ${ec}">${el}</span>${er.entregaId ? `<button type="button" class="sx-link" data-act="ver-entrega" data-id="${sxAttr(er.entregaId)}">Ver entrega</button>` : ''}</span></div><span>${p.precioCatalogo === null ? 'Por confirmar' : money(Number(p.precioCatalogo) * (p.cantidad || 1))}</span></li>`; }).join('') || `<li><div><b>${sxEsc(o.servicio)}</b></div></li>`}</ul>
        <dl class="sx-totals"><div><dt>Subtotal</dt><dd>${money(o.subtotalCatalogo)}</dd></div><div><dt>Descuento</dt><dd>−${money(o.descuentoCombo)}</dd></div><div class="total"><dt>Total</dt><dd>${money(o.totalCombo || o.monto)}</dd></div></dl>
        <p class="sx-help">Cada servicio muestra su propia entrega. Un servicio pendiente no aparece como entregado porque otro ya se entregó.</p></section>
      <section class="sx-card"><h2>Pago</h2><p>${sxEsc(pago)}</p>${o.comentario ? `<p class="sx-help">Comentario: ${sxEsc(o.comentario)}</p>` : ''}
        <h2>Historial</h2><ol class="sx-timeline">${(o.estadoHistorial || []).map((h) => `<li><b>${sxEstadoPedido(h.estado)[1]}</b><small>${sxFechaHora(h.at)}${h.detalle ? ' · ' + sxEsc(h.detalle) : ''}</small></li>`).join('') || '<li><b>Recibido</b></li>'}</ol></section>
      <section class="sx-card"><h2>${cls === 'warn' ? 'Enviar la información que falta' : 'Consultar sobre este pedido'}</h2>
        <label class="sx-field"><span>Mensaje para ${sxEsc((o.destinoLabel || 'Sublicuentas').replace(/^[^\p{L}]+/u, ''))}</span><textarea id="sxConsulta" rows="3" maxlength="1000" placeholder="${cls === 'warn' ? 'Escriba aquí el dato o la corrección que le pidieron' : 'Su consulta sobre este pedido'}"></textarea></label>
        <button type="button" class="sx-btn ${cls === 'warn' ? 'pri' : 'sec'}" data-act="consultar" data-id="${sxAttr(o.id)}">${cls === 'warn' ? 'Enviar información' : 'Enviar consulta'}</button><div id="sxConsultaMsg" class="sx-msg ${sxConsultaMsg.id === o.id ? sxConsultaMsg.c : ''}" role="status">${sxConsultaMsg.id === o.id ? sxEsc(sxConsultaMsg.t) : ''}</div>
        ${consultas.length ? `<h3>Consultas de este pedido</h3><ul class="sx-consultas">${consultas.map((c) => `<li><p><b>${c.numero ? '#' + sxEsc(c.numero) + ' · ' : ''}${sxEsc(c.asunto || 'Consulta')}</b> <span class="sx-pill ${c.estado === 'resuelta' ? 'ok' : c.estado === 'esperando_socio' ? 'warn' : 'info'}">${sxEsc(c.estadoLabel || c.estado)}</span></p>${(c.mensajes || []).slice(-3).map((m) => `<p class="${m.autor === 'equipo' ? 'sx-resp' : ''}"><b>${m.autor === 'equipo' ? 'Equipo' : 'Usted'}:</b> ${sxEsc(m.texto)}</p>`).join('')}${c.legacy ? '' : `<button type="button" class="sx-link" data-act="abrir-hilo" data-id="${sxAttr(c.id)}">Abrir conversación</button>`}</li>`).join('')}</ul>` : ''}</section>
    </div>
    <div class="sx-nav-actions"><button type="button" class="sx-btn sec" data-act="recomprar" data-id="${sxAttr(o.id)}">Volver a comprar</button></div>
  </div>`;
}
async function sxCargarConsultas() {
  try { const d = await API.call('/rev/consultas?_=' + Date.now(), { cache: 'no-store', timeoutMs: 12000 }); sxConsultas = Array.isArray(d) ? d : (d?.items || []); }
  catch (_) { sxConsultas = []; }
  if (current === 'pedidos' && sxPedidoAbierto) vPedidos();
}
function sxBindPedidos() {
  content.querySelector('#sxPedBuscar')?.addEventListener('input', (ev) => { sxPedBuscar = ev.target.value; const pos = ev.target.selectionStart; vPedidos(); const i = document.getElementById('sxPedBuscar'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (_) {} } });
}
async function sxOnClickPedidos(ev) {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'pedtab') { sxPedTab = b.dataset.v; sxPedidoAbierto = ''; vPedidos(); return; }
  if (act === 'ver-entrega') { if (typeof sxAbrirEntrega === 'function') sxAbrirEntrega(b.dataset.id); return; }
  if (act === 'abrir-hilo') { if (typeof sxAbrirHilo === 'function') sxAbrirHilo(b.dataset.id); return; }
  if (typeof sxEntregasClick === 'function' && sxEntregasClick(ev, b)) return;
  if (act === 'filtro') { sxPedFiltro = b.dataset.v; vPedidos(); return; }
  if (act === 'abrir') { sxPedidoAbierto = b.dataset.id; sxConsultas = null; vPedidos(); window.scrollTo(0, 0); document.getElementById('sxPedTitulo')?.focus({ preventScroll: true }); return; }
  if (act === 'volver') { sxPedidoAbierto = ''; vPedidos(); return; }
  if (act === 'nueva') { go('compras'); return; }
  if (act === 'recomprar') { sxRecomprar(b.dataset.id); return; }
  if (act === 'consultar') {
    const ta = document.getElementById('sxConsulta'), msg = document.getElementById('sxConsultaMsg'), txt = (ta?.value || '').trim();
    if (!txt) { msg.className = 'sx-msg err'; msg.textContent = 'Escriba el mensaje primero.'; ta?.focus(); return; }
    b.disabled = true; b.textContent = 'Enviando…';
    try {
      sxConsultaOp = sxConsultaOp || nuevoOpId();
      await API.call('/rev/consultas', { method: 'POST', body: JSON.stringify({ texto: txt, pedidoId: b.dataset.id, opId: sxConsultaOp }) });
      sxConsultaOp = '';
      sxConsultaMsg = { id: b.dataset.id, t: '✅ Enviado. La respuesta aparecerá aquí y en su buzón.', c: 'ok' }; ta.value = '';
      msg.className = 'sx-msg ok'; msg.textContent = sxConsultaMsg.t;
      sxConsultas = null; sxCargarConsultas();
    } catch (e) { msg.className = 'sx-msg err'; msg.textContent = e?.error === 'pedido_ajeno' ? 'Ese pedido no es suyo.' : 'No se pudo enviar. Revise su conexión e intente de nuevo.'; b.disabled = false; b.textContent = 'Reintentar'; }
  }
}
async function sxRecomprar(id) {
  const o = (misCompras || []).find((x) => x.id === id); if (!o) return;
  if (SX.renglones.length && !confirm('Ya tiene una compra en preparación. ¿Reemplazarla con este pedido?')) return;
  if (!sxCatalogoVivo()) { sxToast('Revisando precios y disponibilidad de hoy…'); await loadPrecios(); }
  if (!sxCatalogoVivo()) { sxToast('No se pudo validar el catálogo. Revise su conexión.'); return; }
  if (!dataFresh('inventario')) await loadInventario();
  SX = sxNuevo(); sxErr = {}; sxImg = ''; sxImgInfo = null;
  const cp = o.clientePrincipal || {}; SX.principal = { id: cp.clienteId || '', nombre: cp.nombre || '', apellido: cp.apellido || '', telefono: '' };
  if (SX.principal.id && !(clientes || []).some((c) => String(c.id) === SX.principal.id)) SX.principal.id = '';
  const faltan = [];
  const dispKey = (txt) => { const t = sxNorm(txt); return t.includes('tv') ? 'tv' : t.includes('celular') ? 'celular' : t.includes('tablet') ? 'tablet' : t.includes('computadora') ? 'computadora' : ''; };
  for (const p of o.productos || []) {
    const prod = sxProductos().find((x) => (p.catalogId && x.catalogId === p.catalogId) || x.nombre === p.servicio);
    if (!prod || !prod.stock.available) { faltan.push(p.servicio); continue; }
    const r = sxRenglonNuevo(prod.pid);
    r.cantidad = prod.modalidad === 'cuenta_completa' ? Number(p.cantidad) || 1 : 1;
    if (p.destinatario?.tipo === 'otro') { faltan.push(`${p.servicio} (era para ${sxNombreCompleto(p.destinatario) || 'otro cliente'}: haga otro pedido)`); continue; }
    r.dispositivo = dispKey(p.dispositivo); r.correo = p.correo || ''; r.detalle = p.detalleServicio || ''; r.notas = p.notas || '';
    if (p.otroPerfil && p.perfil) { r.otroPerfil = true; const n = sxSplitNombre(p.perfil); r.perfilNombre = n.nombre; r.perfilApellido = n.apellido; }
    SX.renglones.push(r);
  }
  if (!SX.principal.nombre && o.productos?.[0]?.clienteNombre) Object.assign(SX.principal, sxSplitNombre(o.productos[0].clienteNombre));
  SX.paso = SX.renglones.length ? 2 : 1;
  SX.avisoPrecio = `Se copiaron los servicios y clientes del pedido #${o.ref || ''} con los precios de hoy. Revise los datos y adjunte un comprobante nuevo.${faltan.length ? ` No disponibles: ${faltan.join(', ')}.` : ''}`;
  sxGuardar(); sxPedidoAbierto = ''; go('compras');
}

/* ======================================================================
   INICIO · tareas primero
   ====================================================================== */
function vInicio() {
  document.body.classList.remove('sx-con-barra');
  const restricted = socioSinCompras();
  const fs = flat(), vencidos = fs.filter((s) => s.est.n < 0), semana = fs.filter((s) => s.est.n >= 0 && s.est.n <= 7), vigentes = fs.filter((s) => esVigente(s.est));
  const pedidos = restricted ? [] : (misCompras || []);
  const faltaInfo = pedidos.filter((x) => sxEstadoPedido(x.estado)[0] === 'warn'), enCurso = pedidos.filter((x) => ['info', 'work'].includes(sxEstadoPedido(x.estado)[0]));
  const proximas = groupRenewServices(fs.filter((s) => s.est.n <= 7 && s.est.n < 9999)).slice(0, 6);
  const m = metricasNegocio && typeof metricasNegocio === 'object' ? metricasNegocio : {};
  const tarea = (cls, titulo, detalle, accion, label) => `<li class="sx-task ${cls}"><div><b>${titulo}</b><small>${detalle}</small></div><button type="button" class="sx-btn sec sm" data-go="${accion}">${label}</button></li>`;
  const tareas = [
    !restricted && sxTieneBorrador() ? tarea('info', 'Tiene una compra sin terminar', 'Se guardó en este dispositivo.', 'compras', 'Continuar') : '',
    ...(!restricted ? sxGuardados().slice(0, 2).map((g) => tarea('info', `Compra guardada para ${sxEsc(sxNombreCompleto(g.principal) || 'otro cliente')}`, `${g.renglones.length} servicio(s) sin enviar.`, 'compras', 'Ver')) : []),
    ...faltaInfo.slice(0, 3).map((x) => tarea('warn', `Pedido #${sxEsc(x.ref)}: falta información`, sxEsc(x.detalleEstado || 'Revise qué dato pide el equipo.'), `pedido:${x.id}`, 'Completar')),
    enCurso.length ? tarea('info', `${enCurso.length} pedido${enCurso.length === 1 ? '' : 's'} en curso`, 'Recibidos o en preparación por el equipo.', 'pedidos', 'Ver') : '',
    vencidos.length ? tarea('warn', `${uniqueClientCount(vencidos)} cliente${uniqueClientCount(vencidos) === 1 ? '' : 's'} con servicio vencido`, `${vencidos.length} servicio(s) · ${money(vencidos.reduce((a, s) => a + (s.precio || 0), 0))} por cobrar`, 'renovar:vencidos', 'Renovar') : '',
    semana.length ? tarea('', `${semana.length} renovación${semana.length === 1 ? '' : 'es'} en los próximos 7 días`, money(semana.reduce((a, s) => a + (s.precio || 0), 0)), 'renovar:porvencer', 'Ver') : '',
  ].filter(Boolean);
  content.innerHTML = `<div class="sx-page sx-home">
    <header class="sx-page-head"><div><small>Panel de socios</small><h1>Hola, ${sxEsc(revName())}</h1></div>
      <div class="sx-head-actions">${restricted ? '' : '<button type="button" class="sx-btn pri" data-go="compras">Nueva compra</button>'}<button type="button" class="sx-btn sec" data-go="renovar">Renovar</button></div></header>
    <section class="sx-card"><h2>Pendientes de hoy</h2>${tareas.length ? `<ul class="sx-tasks">${tareas.join('')}</ul>` : '<p class="sx-help">No tiene tareas pendientes. ✅</p>'}</section>
    <div class="sx-kpis">
      <div class="sx-kpi"><small>Cartera vigente</small><b>${money(vigentes.reduce((a, s) => a + (s.precio || 0), 0))}</b><span>${clientes.filter(clienteTieneVigente).length} clientes vigentes</span></div>
      <div class="sx-kpi"><small>Vencen en 7 días</small><b>${semana.length}</b><span>servicios</span></div>
      ${Number.isFinite(Number(m.operadoMes ?? m.costoMes)) ? `<div class="sx-kpi"><small>Pagado a Sublicuentas este mes</small><b>${money(m.operadoMes ?? m.costoMes)}</b><span>${Number(m.comprasMes || 0)} compras · ${Number(m.renovacionesMes || 0)} renovaciones</span></div>` : ''}
    </div>
    <div class="sx-two">
      <section class="sx-card"><div class="sx-card-head"><h2>Próximas renovaciones</h2><button type="button" class="sx-link" data-go="renovar">Ver todas</button></div>
        ${proximas.length ? `<ul class="sx-list">${proximas.map((g) => `<li><div><b>${sxEsc(nombreCli(g.cliente))}</b><small>${g.servicios.map((x) => sxEsc(x.nombre)).join(' · ')}</small></div><span class="sx-pill ${g.est.c === 'exp' || g.est.c === 'due' ? 'warn' : 'info'}">${sxEsc(g.est.t)}</span></li>`).join('')}</ul>` : '<p class="sx-help">Sin renovaciones en los próximos 7 días.</p>'}</section>
      <section class="sx-card"><div class="sx-card-head"><h2>Avisos del equipo</h2><button type="button" class="sx-link" data-go="buzon">Buzón</button></div>
        ${(avisos || []).length ? `<ul class="sx-list">${[...avisos].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 3).map((a) => `<li><div><b>${sxEsc(String(a.texto || '').slice(0, 110))}${String(a.texto || '').length > 110 ? '…' : ''}</b><small>${sxEsc(a.autor || 'Sublicuentas')} · hace ${tiempoDesde(a.ts || 0)}</small></div></li>`).join('')}</ul>` : '<p class="sx-help">Sin avisos nuevos.</p>'}</section>
    </div>
    <p class="sx-motiva">${sxEsc(motivacionDelDia())}</p>
  </div>`;
  content.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    const g = b.dataset.go;
    if (g.startsWith('pedido:')) { sxPedidoAbierto = g.slice(7); go('pedidos'); return; }
    if (g.startsWith('renovar:')) { renF = g.slice(8); go('renovar'); return; }
    go(g);
  }));
  if (!restricted && !dataFresh('compras')) loadMisCompras();
}

/* ======================================================================
   CATÁLOGO · alimenta el mismo carrito de Compras
   ====================================================================== */
let sxCatBuscar = '', sxCatSel = 'todas';
function vPrecios() {
  document.body.classList.remove('sx-con-barra');
  const restricted = socioSinCompras();
  const prods = sxProductos(), cats = ['todas', ...new Set(prods.map((p) => p.categoria))];
  const q = sxNorm(sxCatBuscar), lista = prods.filter((p) => (sxCatSel === 'todas' || p.categoria === sxCatSel) && (!q || sxNorm(`${p.nombre} ${p.categoria} ${p.detalle}`).includes(q)));
  const m = sxTotales();
  const catMs = Number(syncAt.precios || 0);
  content.innerHTML = `<div class="sx-page"><header class="sx-page-head"><div><small>Su precio de socio</small><h1>Catálogo</h1><p class="sx-help">${catMs ? `Actualizado ${new Date(catMs).toLocaleString('es-HN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Validando con el servidor…'}</p></div>
    ${!restricted && m.ls.length ? `<div class="sx-head-actions"><button type="button" class="sx-btn pri" data-cat-act="ir">Ir a la compra (${m.unidades}) · ${money(m.total)}</button></div>` : ''}</header>
    <div class="sx-tools"><label class="sx-field sx-search"><span>Buscar</span><input id="sxCatBuscar" type="search" value="${sxAttr(sxCatBuscar)}" placeholder="Producto o categoría"></label></div>
    <div class="sx-filter" role="group" aria-label="Categorías">${cats.map((c) => `<button type="button" class="sx-chip ${sxCatSel === c ? 'on' : ''}" aria-pressed="${sxCatSel === c}" data-cat-act="cat" data-v="${sxAttr(c)}">${c === 'todas' ? 'Todas' : sxEsc(c)}</button>`).join('')}</div>
    ${!prods.length ? `<div class="sx-card"><p class="sx-help">${sxCatalogoVivo() ? 'No hay productos en su catálogo.' : 'Cargando su catálogo…'}</p></div>` : `<div class="sx-cat-grid">${lista.map((p) => {
      const lineas = String(p.detalle || '').split(/\n+/).map((x) => x.trim()).filter(Boolean).slice(0, 5), n = sxUnidades(p.pid);
      const copy = `${p.nombre} · ${p.precio === null ? 'Por comisión' : 'L' + p.precio}`;
      return `<article class="sx-card sx-cat-item ${!p.stock.available ? 'out' : ''}"><header><span class="sx-prod-ic" aria-hidden="true">${p.emoji}</span><div><h3>${sxEsc(p.base)}</h3><p>${sxEsc(p.sub || p.catSub || p.categoria)}</p></div><strong>${p.precio === null ? 'Por comisión' : money(p.precio)}</strong></header>
        <div class="sx-tags"><span>${sxEsc(sxModalidadTxt(p))}</span><span class="sx-stock ${p.stock.key}">${sxEsc(p.stock.label)}</span></div>
        ${lineas.length ? `<ul class="sx-conds">${lineas.map((l) => `<li>${sxEsc(l)}</li>`).join('')}</ul>` : ''}
        <div class="sx-row-actions">${restricted ? '' : `<button type="button" class="sx-btn ${n ? 'sec' : 'pri'} sm" data-cat-act="agregar" data-pid="${sxAttr(p.pid)}" ${!p.stock.available ? 'disabled' : ''}>${!p.stock.available ? 'Agotado' : n ? `Agregar otro (${n} en el pedido)` : 'Agregar al pedido'}</button>`}<button type="button" class="sx-link" data-cat-act="copiar" data-txt="${sxAttr(copy)}">Copiar precio</button></div></article>`;
    }).join('') || '<div class="sx-card sx-empty"><b>Sin resultados</b></div>'}</div>`}
    ${typeof politicasHTML === 'function' ? `<div class="sx-politicas">${politicasHTML()}</div>` : ''}
  </div>`;
  content.querySelector('#sxCatBuscar')?.addEventListener('input', (ev) => { sxCatBuscar = ev.target.value; const pos = ev.target.selectionStart; vPrecios(); const i = document.getElementById('sxCatBuscar'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (_) {} } });
  content.querySelectorAll('[data-cat-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.catAct;
    if (a === 'cat') { sxCatSel = b.dataset.v; vPrecios(); return; }
    if (a === 'ir') { SX.paso = 1; go('compras'); return; }
    if (a === 'copiar') { navigator.clipboard?.writeText(b.dataset.txt || ''); sxToast('Precio copiado.'); return; }
    if (a === 'agregar') { const y = window.scrollY; sxAgregar(b.dataset.pid); vPrecios(); window.scrollTo(0, y); document.querySelector(`[data-cat-act="agregar"][data-pid="${CSS.escape(b.dataset.pid)}"]`)?.focus({ preventScroll: true }); }
  }));
}
// Un solo cargador de catálogo para celular y computadora.
loadPrecios = function () {
  return runSocioRequest('precios', async (epoch) => {
    try {
      const data = await API.call('/rev/precios?_=' + Date.now(), { cache: 'no-store', timeoutMs: 15000 });
      if (epoch !== socioEpoch) return false;
      if (!Array.isArray(data) || !data.length) throw { error: 'catalogo_vacio' };
      PRECIOS = mergeCatalogCategories(data); writeSocioCache('precios', PRECIOS);
      if (typeof webCatalogVerified !== 'undefined') webCatalogVerified = true;
      if (current === 'precios') vPrecios(); else if (current === 'compras') renderCompraForm();
      return true;
    } catch (e) {
      if (epoch !== socioEpoch) return false;
      if (current === 'precios') vPrecios(); else if (current === 'compras') renderCompraForm();
      return false;
    }
  });
};

/* ======================================================================
   CLIENTES · ficha con servicios, vencimientos y pedidos
   ====================================================================== */
let sxCliAbierto = '';
function vClientes() { document.body.classList.remove('sx-con-barra'); sxClientesPintar(); }
function renderCli() { if (current === 'clientes') sxClientesPintar(true); }
function sxClientesPintar(soloLista = false) {
  const f = sxNorm(cliF), dig = String(cliF || '').replace(/\D/g, '');
  const filtros = [['todos', 'Todos'], ['vigentes', 'Vigentes'], ['novigentes', 'Sin servicio vigente'], ['vencidos', 'Con vencidos']];
  const list = (clientes || []).filter((c) => {
    if (cliEstado === 'vigentes' && !esClienteVigente(c)) return false;
    if (cliEstado === 'novigentes' && !esClienteNoVigente(c)) return false;
    if (cliEstado === 'vencidos' && !(c.servicios || []).some((s) => estado(parseFecha(pick(s, CONFIG.campos.vencimiento))).n < 0)) return false;
    return !f || sxNorm(nombreCli(c)).includes(f) || (dig.length >= 3 && String(c.telefono || c.telefono_norm || '').replace(/\D/g, '').includes(dig));
  }).sort((a, b) => nombreCli(a).localeCompare(nombreCli(b), 'es', { numeric: true, sensitivity: 'base' }));
  const listaHtml = list.length ? `<ul class="sx-clients">${list.map(sxClienteHtml).join('')}</ul>` : `<div class="sx-card sx-empty"><b>Sin resultados</b><p>Pruebe otro nombre, teléfono o filtro.</p></div>`;
  if (soloLista && document.getElementById('sxCliLista')) { document.getElementById('sxCliLista').innerHTML = listaHtml; return; }
  content.innerHTML = `<div class="sx-page"><header class="sx-page-head"><div><small>Su cartera</small><h1>Clientes</h1><p class="sx-help">${(clientes || []).length} clientes · ${clientes.filter(esClienteVigente).length} vigentes</p></div></header>
    <div class="sx-tools"><label class="sx-field sx-search"><span>Buscar cliente</span><input id="cliSearch" type="search" value="${sxAttr(cliF || '')}" placeholder="Nombre o teléfono"></label></div>
    <div class="sx-filter" role="group" aria-label="Filtrar clientes">${filtros.map(([k, l]) => `<button type="button" class="sx-chip ${cliEstado === k ? 'on' : ''}" aria-pressed="${cliEstado === k}" data-cli-filtro="${k}">${l}</button>`).join('')}</div>
    <div id="sxCliLista">${listaHtml}</div></div>`;
  content.querySelector('#cliSearch')?.addEventListener('input', (ev) => { cliF = ev.target.value; sxClientesPintar(true); });
  content.querySelectorAll('[data-cli-filtro]').forEach((b) => b.addEventListener('click', () => { cliEstado = b.dataset.cliFiltro; sxClientesPintar(); }));
}
function sxPedidosDeCliente(c) {
  const id = String(c.id), nom = sxNorm(nombreCli(c));
  return (misCompras || []).filter((o) => o.clientePrincipal?.clienteId === id || sxNorm(sxPedidoCliente(o)) === nom);
}
function sxClienteHtml(c) {
  const svcs = Array.isArray(c.servicios) ? c.servicios : [], ec = estadoCliente(c), abierto = sxCliAbierto === String(c.id), tel = c.telefono || c.telefono_norm || '';
  const peor = svcs.map((s) => estado(parseFecha(pick(s, CONFIG.campos.vencimiento)))).reduce((a, b) => (b.n < a.n ? b : a), { n: 9999, c: 'mut', t: '' });
  const pedidos = abierto ? sxPedidosDeCliente(c) : [];
  return `<li class="sx-card sx-client ${abierto ? 'open' : ''}"><button type="button" class="sx-client-head" data-cli="abrir" data-id="${sxAttr(c.id)}" aria-expanded="${abierto}">
      <span class="sx-avatar" aria-hidden="true">${sxEsc((nombreCli(c)[0] || '?').toUpperCase())}</span><div><b>${sxEsc(nombreCli(c))}</b><small>${sxEsc(tel || 'Sin teléfono')} · ${svcs.length} servicio${svcs.length === 1 ? '' : 's'}</small></div>
      <span class="sx-pill ${ec.c === 'ok' ? (peor.n <= 7 ? 'warn' : 'ok') : 'off'}">${ec.c === 'ok' ? (peor.n < 0 ? 'Con vencidos' : peor.n <= 7 ? 'Vence pronto' : 'Vigente') : 'Sin servicio vigente'}</span></button>
    ${abierto ? `<div class="sx-client-body">
      <h3>Servicios</h3><ul class="sx-list">${svcs.map((s, ix) => { const nm = pick(s, CONFIG.campos.servicio) || 'Servicio', f = parseFecha(pick(s, CONFIG.campos.vencimiento)), e = estado(f), orig = Number(s?.servicioIndexOriginal ?? s?._servicioIndexOriginal ?? ix); return `<li><div><b>${sxEsc(nm)}</b><small>${f ? 'Vence ' + sxEsc(fmtFecha(f)) : 'Sin fecha'}</small></div><span class="sx-pill ${e.c === 'ok' ? 'ok' : e.c === 'soon' ? 'warn' : e.c === 'mut' ? 'off' : 'warn'}">${sxEsc(e.t)}</span><button type="button" class="sx-btn sec sm" data-cli="renovar" data-id="${sxAttr(c.id)}" data-nm="${sxAttr(nm)}" data-ix="${Number.isInteger(orig) ? orig : ix}">Renovar</button></li>`; }).join('') || '<li><small>Sin servicios.</small></li>'}</ul>
      <h3>Pedidos</h3>${pedidos.length ? `<ul class="sx-list">${pedidos.slice(0, 5).map((o) => { const [cls, label] = sxEstadoPedido(o.estado); return `<li><div><b>#${sxEsc(o.ref)} · ${sxEsc((o.productos || []).map((p) => p.servicioBase || p.servicio).join(' + ') || o.servicio)}</b><small>${sxFechaHora(o.createdAt)}</small></div><span class="sx-pill ${cls}">${label}</span><button type="button" class="sx-link" data-cli="pedido" data-id="${sxAttr(o.id)}">Ver</button></li>`; }).join('')}</ul>` : '<p class="sx-help">Sin pedidos recientes para este cliente.</p>'}
      <div class="sx-row-actions"><button type="button" class="sx-btn pri sm" data-cli="cobro" data-id="${sxAttr(c.id)}">${sxEsc(etiquetaMensajeRenovacion())}</button>${waUrl(tel) ? `<a class="sx-btn sec sm" href="${sxAttr(waUrl(tel))}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}${socioSinCompras() ? '' : `<button type="button" class="sx-btn sec sm" data-cli="comprar" data-id="${sxAttr(c.id)}">Nueva compra para este cliente</button>`}</div>
    </div>` : ''}</li>`;
}
function sxOnClickClientes(ev) {
  const b = ev.target.closest('[data-cli]'); if (!b || current !== 'clientes') return;
  const c = (clientes || []).find((x) => String(x.id) === String(b.dataset.id));
  const a = b.dataset.cli;
  if (a === 'abrir') { sxCliAbierto = sxCliAbierto === b.dataset.id ? '' : b.dataset.id; sxClientesPintar(true); if (sxCliAbierto && !dataFresh('compras')) loadMisCompras().then(() => { if (current === 'clientes') sxClientesPintar(true); }); return; }
  if (a === 'renovar') { openComprobante(b.dataset.id, b.dataset.nm, Number(b.dataset.ix)); return; }
  if (a === 'cobro') { openCobro(b.dataset.id, ''); return; }
  if (a === 'pedido') { sxPedidoAbierto = b.dataset.id; go('pedidos'); return; }
  if (a === 'comprar' && c) {
    const n = sxSplitNombre(nombreCli(c)), nuevo = { id: String(c.id), nombre: n.nombre, apellido: n.apellido, telefono: c.telefono || '' };
    if (SX.renglones.length && sxNombreCompleto(SX.principal) && sxNorm(sxNombreCompleto(SX.principal)) !== sxNorm(sxNombreCompleto(nuevo))) {
      if (!confirm(`Su compra en preparación es para ${sxNombreCompleto(SX.principal)}. ¿Guardarla y empezar una nueva para ${sxNombreCompleto(nuevo)}?`)) return;
      sxGuardarAparte(SX); SX = sxNuevo();
    }
    SX.principal = nuevo; sxGuardar(); go('compras');
  }
}

/* ======================================================================
   RENOVACIONES · cliente, servicio, vencimiento; período y nueva fecha en el modal
   ====================================================================== */
let sxRenBuscar = '';
function vRenovar() { document.body.classList.remove('sx-con-barra'); sxRenPintar(); }
function renderRen() { if (current === 'renovar') sxRenPintar(true); }
function sxRenPintar(soloLista = false) {
  let fs = flat().filter((s) => s.est.n < 9999);
  const cnt = { vencidos: fs.filter((s) => s.est.n < 0).length, hoy: fs.filter((s) => s.est.n === 0).length, porvencer: fs.filter((s) => s.est.n >= 0 && s.est.n <= 7).length };
  if (renF === 'vencidos') fs = fs.filter((s) => s.est.n < 0); else if (renF === 'hoy') fs = fs.filter((s) => s.est.n === 0); else if (renF === 'porvencer') fs = fs.filter((s) => s.est.n >= 0 && s.est.n <= 7);
  const q = sxNorm(sxRenBuscar), dig = sxRenBuscar.replace(/\D/g, '');
  if (q) fs = fs.filter((s) => sxNorm(nombreCli(s.cliente)).includes(q) || sxNorm(s.nombre).includes(q) || (dig.length >= 3 && String(s.cliente.telefono || '').replace(/\D/g, '').includes(dig)));
  renewGroups = groupRenewServices(fs);
  const listaHtml = renewGroups.length ? `<ul class="sx-renews">${renewGroups.map((g, i) => `<li class="sx-card sx-renew"><div class="sx-renew-head"><span class="sx-avatar" aria-hidden="true">${sxEsc((nombreCli(g.cliente)[0] || '?').toUpperCase())}</span><div><b>${sxEsc(nombreCli(g.cliente))}</b><small>${g.fecha ? 'Vence ' + sxEsc(fmtFecha(g.fecha)) : 'Sin fecha'} · ${sxEsc(g.cliente.telefono || 'Sin teléfono')}</small></div><span class="sx-pill ${g.est.n < 0 || g.est.n === 0 ? 'warn' : g.est.n <= 7 ? 'info' : 'ok'}">${sxEsc(g.est.t)}</span></div>
      <div class="sx-tags">${g.servicios.map((s) => `<span>${sxEsc(s.nombre)}${s.precio ? ' · ' + money(s.precio) : ''}</span>`).join('')}</div>
      <div class="sx-row-actions"><button type="button" class="sx-btn pri sm" data-ren="renovar" data-i="${i}">${g.servicios.length > 1 ? 'Elegir qué renovar' : 'Renovar'}</button><button type="button" class="sx-btn sec sm" data-ren="cobro" data-i="${i}">${sxEsc(etiquetaMensajeRenovacion())}</button></div></li>`).join('')}</ul>` : `<div class="sx-card sx-empty"><b>Todo en orden</b><p>No hay renovaciones en este filtro.</p></div>`;
  if (soloLista && document.getElementById('sxRenLista')) { document.getElementById('sxRenLista').innerHTML = listaHtml; return; }
  content.innerHTML = `<div class="sx-page"><header class="sx-page-head"><div><small>Control de vencimientos</small><h1>Renovaciones</h1><p class="sx-help">Al renovar elige el período y ve la nueva fecha antes de confirmar.</p></div></header>
    <div class="sx-tools"><label class="sx-field sx-search"><span>Buscar</span><input id="sxRenBuscar" type="search" value="${sxAttr(sxRenBuscar)}" placeholder="Cliente, servicio o teléfono"></label></div>
    <div class="sx-filter" role="group" aria-label="Filtrar renovaciones">${[['todos', 'Todos'], ['vencidos', `Vencidos · ${cnt.vencidos}`], ['hoy', `Hoy · ${cnt.hoy}`], ['porvencer', `Próximos 7 días · ${cnt.porvencer}`]].map(([k, l]) => `<button type="button" class="sx-chip ${renF === k ? 'on' : ''}" aria-pressed="${renF === k}" data-ren="filtro" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="sxRenLista">${listaHtml}</div></div>`;
  content.querySelector('#sxRenBuscar')?.addEventListener('input', (ev) => { sxRenBuscar = ev.target.value; sxRenPintar(true); });
}
function sxOnClickRen(ev) {
  const b = ev.target.closest('[data-ren]'); if (!b || current !== 'renovar') return;
  if (b.dataset.ren === 'filtro') { renF = b.dataset.v; sxRenPintar(); return; }
  if (b.dataset.ren === 'renovar') openRenewGroup(Number(b.dataset.i));
  if (b.dataset.ren === 'cobro') openCobroRenewGroup(Number(b.dataset.i));
}

/* ======================================================================
   NAVEGACIÓN · computadora: menú lateral · celular: barra compacta + "Más"
   ====================================================================== */
const SX_NAV = [
  { v: 'inicio', l: 'Inicio', i: '⌂' }, { v: 'precios', l: 'Catálogo', i: '▤' }, { v: 'compras', l: 'Compras', i: '🛒' }, { v: 'pedidos', l: 'Pedidos', i: '📦' },
  { v: 'clientes', l: 'Clientes', i: '👥' }, { v: 'renovar', l: 'Renovaciones', i: '↻' }, { v: 'buzon', l: 'Soporte y buzón', i: '✉' },
];
const SX_NAV2 = [{ v: 'aula', l: 'Subli Aula', i: '✦' }, { v: 'recompensas', l: 'Recompensas', i: '🎁' }, { v: 'perfil', l: 'Perfil', i: '👤' }];
function renderUnifiedSidebar() {
  const nav = document.getElementById('nav'); if (!nav) return;
  const btn = (it) => `<button type="button" class="nav-btn ${current === it.v ? 'on' : ''}" data-v="${it.v}" onclick="go('${it.v}')" ${current === it.v ? 'aria-current="page"' : ''}><span class="nav-ico" aria-hidden="true">${it.i}</span><span>${it.l}</span>${it.v === 'buzon' ? '<span class="nav-badge" id="buzonBadge"></span>' : ''}</button>`;
  if (SX_MQ_DESK.matches) {
    nav.innerHTML = `<div class="sx-side-brand"><img src="${ROBOT_IMG}" alt="" width="36" height="36"><div><b>Sublicuentas</b><span>Panel de socios</span></div></div><div class="sx-side-menu">${SX_NAV.map(btn).join('')}</div><div class="sx-side-menu sec">${SX_NAV2.map(btn).join('')}</div>`;
  } else {
    const movil = [SX_NAV[0], SX_NAV[2], SX_NAV[3], SX_NAV[4]];
    nav.innerHTML = `${movil.map(btn).join('')}<button type="button" class="nav-btn" onclick="openPartnerQuick()" aria-label="Más secciones"><span class="nav-ico" aria-hidden="true">☰</span><span>Más</span></button>`;
  }
  try { applyNavPermissions(); actualizarBadgeBuzon(); } catch (_) {}
}
// "Más" en celular: el resto de secciones (sin repetir las de la barra).
(function sxMasSheet() {
  const grid = document.querySelector('#partnerQuick .quick-sheet-grid'); if (!grid) return;
  grid.innerHTML = [['precios', 'Catálogo'], ['renovar', 'Renovaciones'], ['buzon', 'Soporte y buzón'], ['aula', 'Subli Aula'], ['recompensas', 'Recompensas'], ['perfil', 'Mi perfil']].map(([v, l]) => `<button type="button" data-qv="${v}" onclick="closePartnerQuick();go('${v}')">${l}</button>`).join('');
  const h = document.querySelector('#partnerQuick h3'); if (h) h.textContent = 'Más secciones';
})();
openPartnerQuick = function () { document.getElementById('partnerQuick')?.classList.add('show'); };
const sxGoBase = go;
go = function (v) {
  if (v === 'pedidos') {
    if (!vistaGeisellPermitida('compras')) { sxGoBase('renovar'); return; }
    current = 'pedidos';
    window.scrollTo(0, 0);
    vPedidos();
    if (!dataFresh('compras')) loadMisCompras();
    renderUnifiedSidebar(); updateSyncStatus(); actualizarBadgeBuzon();
    return;
  }
  if (v !== 'compras') document.body.classList.remove('sx-con-barra');
  sxGoBase(v);
  renderUnifiedSidebar();
};
SX_MQ_DESK.addEventListener?.('change', () => { renderUnifiedSidebar(); });
renderUnifiedSidebar();

// Un solo receptor de clics por vista (no se acumulan al volver a entrar).
content.addEventListener('click', (ev) => {
  if (current === 'pedidos') sxOnClickPedidos(ev);
  else if (current === 'clientes') sxOnClickClientes(ev);
  else if (current === 'renovar') sxOnClickRen(ev);
});

// La sesión guardada se abre (messaging.js) antes de que cargue este archivo: repintar con las vistas nuevas.
(function sxRepintarAlCargar() {
  const app = document.getElementById('app');
  if (API.token && app && !app.classList.contains('hide') && !(isAdmin && !impersonating)) go(current || 'inicio');
})();
