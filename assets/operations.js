/* INICIO */
function openRenewFilter(f){renF=f;go('renovar')}
function vInicio(){
  const fs=flat();
  const hoy=fs.filter(s=>s.est.n===0);
  const semana=fs.filter(s=>s.est.n>=0&&s.est.n<=7);
  const vencidos=fs.filter(s=>s.est.n<0);
  const clientesVencidos=uniqueClientCount(vencidos);
  const ok=fs.filter(s=>s.est.c==='ok').length;
  const vigentes=fs.filter(s=>esVigente(s.est));
  const cliVigentes=clientes.filter(clienteTieneVigente).length;
  const carteraVigente=vigentes.reduce((a,s)=>a+(s.precio||0),0);
  const carteraHoy=hoy.reduce((a,s)=>a+(s.precio||0),0);
  const carteraVencida=vencidos.reduce((a,s)=>a+(s.precio||0),0);
  const carteraSemana=semana.reduce((a,s)=>a+(s.precio||0),0);
  const activaPct=clientes.length?Math.round((cliVigentes/clientes.length)*100):0;
  const prox=fs.filter(s=>s.est.n<9999).slice(0,4);
  const tituloHoy=hoy.length?`${hoy.length} ${hoy.length===1?'servicio vence':'servicios vencen'} hoy`:'Hoy no tiene vencimientos';
  const detalleHoy=`${hoy.length} hoy · ${semana.length} esta semana · ${vencidos.length} servicios vencidos · ${money(carteraHoy)}`;
  const m=metricasNegocio&&typeof metricasNegocio==='object'?metricasNegocio:{};
  const operadoMes=Number(m.operadoMes??m.costoMes??NaN);
  const operacionesMes=Number(m.operacionesMes??NaN);
  const comprasMes=Number(m.comprasMes??NaN);
  const renovacionesMes=Number(m.renovacionesMes??NaN);
  const pendientes=Number(m.pedidosPendientes??NaN);
  const hasOpsMetrics=[operadoMes,operacionesMes,comprasMes,renovacionesMes,pendientes].some(Number.isFinite);
  const metricCards=hasOpsMetrics?[
    ['Pagado a Sublicuentas',Number.isFinite(operadoMes)?money(operadoMes):'—','Compras y renovaciones registradas este mes'],
    ['Operaciones del mes',Number.isFinite(operacionesMes)?String(operacionesMes):'—',`${Number.isFinite(comprasMes)?comprasMes:0} compras · ${Number.isFinite(renovacionesMes)?renovacionesMes:0} renovaciones`],
    ['Pedidos pendientes',Number.isFinite(pendientes)?String(pendientes):'—','Solicitudes que todavía no han sido entregadas']
  ]:[
    ['Por recuperar',money(carteraVencida),`${vencidos.length} servicios vencidos`],
    ['Cartera activa',`${activaPct}%`,`${cliVigentes} de ${clientes.length||0} clientes`],
    ['Próximos 7 días',money(carteraSemana),`${semana.length} servicios por cobrar`]
  ];
  content.innerHTML=`
  <section class="partner-hero">
    <div class="partner-copy">
      <div class="partner-kicker">Panel de socios</div>
      <h2>Hola, ${escHtml(revName())} 👋</h2>
      <p>Venda, renueve y controle su negocio desde un solo lugar.</p>
      <button class="partner-main-action" onclick="openPartnerQuick()">＋ Nueva operación</button>
    </div>
    <img class="partner-mascot" src="${ROBOT_IMG}" alt="Mascota Sublicuentas" decoding="async">
  </section>
  ${avisos.length?`<div class="aviso-card"><div class="ah">📣 AVISOS</div>${avisos.slice(0,3).map(a=>`<div class="aviso-item"><div class="at">${escHtml(a.texto)}</div><div class="am">${escHtml(a.autor||'Sublicuentas')} · hace ${tiempoDesde(a.ts)}</div></div>`).join('')}</div>`:''}
  ${clientesVencidos?`<div class="cut-alert"><b>🚨 ${clientesVencidos} cliente${clientesVencidos===1?'':'s'} con pago vencido</b><span>${vencidos.length} servicio${vencidos.length===1?'':'s'} vencido${vencidos.length===1?'':'s'} · ${money(carteraVencida)} por recuperar. Puede cobrar o registrar la renovación desde Renovaciones.</span></div>`:''}
  <div class="today-card">
    <div class="bell">🔔</div>
    <div class="txt"><h2>${tituloHoy}</h2><p>${detalleHoy}</p></div>
    <button class="see" onclick="openRenewFilter('todos')">Ver</button>
  </div>

  <div class="wallet-card">
    <div class="hl">CARTERA VIGENTE</div>
    <div class="hv">${money(carteraVigente)}</div>
    <div class="hs">${cliVigentes} clientes vigentes · ${vigentes.length} servicios activos</div>
  </div>

  <div class="business-grid">${metricCards.map(x=>`<div class="business-card"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]}</span></div>`).join('')}</div>
  <div class="business-actions">
    <button onclick="openRenewFilter('vencidos')">🚨 Cobrar vencidos</button>
    <button onclick="openRenewFilter('porvencer')">⏰ Ver próximos</button>
  </div>

  <div class="grid3">
    <div class="stat"><div class="si3 exp">⛔</div><div class="sv">${vencidos.length}</div><div class="sl">Serv. vencidos</div></div>
    <div class="stat"><div class="si3 warn">⏰</div><div class="sv">${semana.length}</div><div class="sl">Serv. semana</div></div>
    <div class="stat"><div class="si3 good">✅</div><div class="sv">${ok}</div><div class="sl">Serv. al día</div></div>
  </div>

  <div class="motiva-card"><div class="spark">✨</div><p>${motivacionDelDia()}</p></div>

  <div class="card">
    <div class="card-h"><h2>Próximas renovaciones</h2><a onclick="go('renovar')">Ver todas</a></div>
    ${prox.length?`<div class="renew">${prox.map(renRow).join('')}</div>`:
      `<div class="empty" style="padding:24px"><div class="ico">📭</div>Sin fechas registradas.</div>`}
  </div>`;
}
async function vPerfil(){
  content.innerHTML='<div class="spin"></div>';await loadGamificacion();if(current!=='perfil')return;
  const me=gamificacion.perfil||{ventas:0,score:0,nivel:'Sin nivel',racha:0,cursos:0,avatar:''};
  const avatar=safeImageSrc(me.avatar,ROBOT_IMG),nombre=me.nombreMostrar||revName(),nivel=me.nivel||'Sin nivel';
  const insignias=(gamificacion.insignias||[]).map(b=>`<div class="sales-badge ${b.activa?'on':''}" title="${escAttr(b.detalle||'')}"><i>${escHtml(b.icon||'🏅')}</i><b>${escHtml(b.nombre||'Insignia')}</b></div>`).join('');
  content.innerHTML=`<div class="scr-title">Mi perfil</div><div class="profile-layout"><section class="profile-hero"><div class="profile-photo-wrap"><img class="profile-photo" src="${escAttr(avatar)}" alt="Foto de ${escAttr(nombre)}"><button class="profile-photo-edit" onclick="document.getElementById('socioPhoto').click()">📷</button><input id="socioPhoto" type="file" accept="image/*" hidden onchange="saveSocioPhoto(this)"></div><h2>${escHtml(nombre)}</h2><button class="ask-copy" onclick="toggleEditSocio()">✏️ Editar perfil</button><div id="editSocioBox" style="display:none;margin-top:12px"><input class="comp-in" id="socioNombre" maxlength="45" value="${escAttr(nombre)}" placeholder="Nombre visible"><button class="act primary" style="margin-top:8px" onclick="saveSocioProfile()">Guardar cambios</button></div><p>Progreso personal del socio</p><div class="profile-level">${nivel==='Inmortal'?'👑':nivel==='Leyenda'?'🏆':nivel==='Diamante'?'💎':'⭐'} ${escHtml(nivel)}</div><div class="level-track"><div class="level-chip ${nivel==='Diamante'?'on':''}">💎 Diamante<br>1–9 ventas</div><div class="level-chip ${nivel==='Leyenda'?'on':''}">🏆 Leyenda<br>10–25 ventas</div><div class="level-chip ${nivel==='Inmortal'?'on':''}">👑 Inmortal<br>26+ ventas</div></div></section><div><div class="profile-stats"><div class="profile-stat"><b>${Number(me.ventas||0)}</b><span>Ventas</span></div><div class="profile-stat"><b>${Number(me.score||0)}</b><span>Score</span></div><div class="profile-stat"><b>${Number(me.racha||0)}🔥</b><span>Racha renovaciones</span></div></div><div class="card"><div class="card-h"><h2>Insignias</h2><span>${Number(me.cursos||0)} cursos</span></div><div class="badge-grid">${insignias}</div></div><button class="reward-open" onclick="go('recompensas')">🎁 Ver recompensas de mi nivel <span>›</span></button>${typeof Notification!=='undefined'?`<button class="reward-open" onclick="enablePartnerNotifications()">🔔 ${Notification.permission==='granted'?'Notificaciones activadas':'Activar notificaciones'} <span>›</span></button>`:''}</div></div>`;
}
async function saveSocioPhoto(input){
  const f=input.files?.[0];if(!f)return;
  const editBtn=document.querySelector('.profile-photo-edit');
  const oldTxt=editBtn?.textContent||'📷';if(editBtn){editBtn.disabled=true;editBtn.textContent='⏳';}
  try{
    let avatarData=await compressImage(f,420,.72);
    if(avatarData.length>700000)avatarData=await compressImage(f,320,.66);
    if(avatarData.length>740000)throw {error:'foto_invalida'};
    const j=await API.call('/rev/perfil',{method:'POST',body:JSON.stringify({avatarData})});
    gamificacion.perfil=gamificacion.perfil||{};
    gamificacion.perfil.avatar=j?.avatar||avatarData;
    writeSocioCache('gamificacion',gamificacion);applySocioAvatar();
    if(typeof dataRequests==='object')dataRequests.gamificacion=null;
    if(typeof syncAt==='object')syncAt.gamificacion=0;
    await loadGamificacion();
    if(current==='perfil')await vPerfil();
  }catch(e){
    alert(e?.error==='foto_invalida'?'La foto no es válida o pesa demasiado.':'No se pudo guardar la foto. Revise su conexión e intente nuevamente.');
  }finally{if(editBtn){editBtn.disabled=false;editBtn.textContent=oldTxt;}if(input)input.value='';}
}
function toggleEditSocio(){const el=document.getElementById('editSocioBox');if(el)el.style.display=el.style.display==='none'?'block':'none'}
async function saveSocioProfile(){
  const nombreMostrar=(document.getElementById('socioNombre')?.value||'').trim();if(nombreMostrar.length<2)return alert('Escriba un nombre válido.');
  try{
    const j=await API.call('/rev/perfil',{method:'POST',body:JSON.stringify({nombreMostrar})});
    rev.nombreMostrar=j?.nombreMostrar||nombreMostrar;
    gamificacion.perfil=gamificacion.perfil||{};gamificacion.perfil.nombreMostrar=rev.nombreMostrar;
    writeSocioCache('gamificacion',gamificacion);
    if(typeof dataRequests==='object')dataRequests.gamificacion=null;
    if(typeof syncAt==='object')syncAt.gamificacion=0;
    await loadGamificacion();renderTop();if(current==='perfil')await vPerfil();
  }catch(e){alert('No se pudo actualizar el perfil.');}
}
async function vRecompensas(){
  content.innerHTML='<div class="spin"></div>';await loadGamificacion();if(current!=='recompensas')return;
  const me=gamificacion.perfil||{nivel:'Sin nivel',ventas:0},opts=gamificacion.recompensas||[],claims=gamificacion.solicitudes||[];
  const next=me.ventas<1?1:me.ventas<10?10:me.ventas<26?26:26,progress=me.ventas>=26?100:Math.min(100,Math.round((me.ventas/next)*100));
  const options=opts.map((o,i)=>`<button data-reward-id="${escAttr(o.id||'')}" onclick="claimReward(this.dataset.rewardId,this)"><i>${['🎬','✨','🎁'][i%3]}</i><b>${escHtml(o.nombre||'Recompensa')}</b><span>Seleccionar</span></button>`).join('');
  const solicitudes=claims.map(c=>`<div class="reward-claim"><span>🎁</span><div><b>${escHtml(c.recompensa||'Recompensa')}</b><small>${escHtml(c.nivel||'')}</small></div><em>${escHtml(c.estado||'pendiente')}</em></div>`).join('');
  content.innerHTML=`<section class="reward-hero"><img src="${ROBOT_IMG}"><div><small>CLUB DE SOCIOS</small><h2>Recompensas</h2><p>${escHtml(me.nivel||'Sin nivel')} · ${Number(me.ventas||0)} ventas</p></div></section><div class="reward-progress"><div><b>Progreso del nivel</b><span>${me.ventas>=26?'Nivel máximo':`${Number(me.ventas||0)} de ${next} ventas`}</span></div><div class="goalbar"><i style="width:${progress}%"></i></div></div>${opts.length?`<div class="phase-heading"><h2>Escoja una recompensa</h2><span>Una por nivel</span></div><div class="reward-options">${options}</div>`:`<div class="card"><div class="empty"><div class="ico">🔒</div><b>Aún sin recompensa</b>Complete su primera venta para alcanzar Diamante.</div></div>`}${claims.length?`<div class="card" style="margin-top:16px"><div class="card-h"><h2>Mis solicitudes</h2></div>${solicitudes}</div>`:''}`;
}
async function claimReward(id,btn){if(!confirm('¿Solicitar esta recompensa? Solo puede escoger una por nivel.'))return;const old=btn.innerHTML;btn.disabled=true;btn.innerHTML='<b>Solicitando…</b>';try{await API.call('/rev/recompensa',{method:'POST',body:JSON.stringify({recompensaId:id})});await loadGamificacion();vRecompensas()}catch(e){btn.disabled=false;btn.innerHTML=old;alert(e?.error==='nivel_ya_reclamado'?'Ya solicitó la recompensa de este nivel.':'No se pudo solicitar la recompensa.')}}
function renRow(s){
  const ini=(nombreCli(s.cliente)[0]||'?').toUpperCase();
  return `<div class="renew-item">
    <div class="av">${escHtml(ini)}</div>
    <div class="meta"><div class="nm">${escHtml(nombreCli(s.cliente))}</div><div class="pl">${escHtml(s.nombre)}</div></div>
    <span class="pill ${s.est.c}">${escHtml(s.est.t)}</span>
  </div>`;
}


/* COMPRAS NUEVAS · conectadas al catálogo + combos */
let compraSels=[], compraDestino='sublicuentas', compraImg='', compraPickerOpen=false;
let compraDraft={fields:{},monto:'',montoManual:false,comentario:''};
let catalogCategoria='';
function resetCompraDraft(){compraDraft={fields:{},monto:'',montoManual:false,comentario:'',bancoId:'',requestId:''}}
function setCompraBanco(id){compraDraft.bancoId=id;if(id)compraLimpiarErr('buyBancos');const b=document.querySelector('#buyBancos .pago-bancos-list');if(b)cargarMetodosPago().then(ms=>{b.innerHTML=bancosChipsHtml(ms,compraDraft.bancoId,'setCompraBanco')});}
function compraDraftVal(id,def=''){const v=compraDraft.fields?.[id];return v==null?def:String(v)}
function captureCompraDraft(){
  const host=document.getElementById('compraForm');if(!host)return;
  // Oct-2026: antes el selector solo tomaba ids "buy_…" y se perdían Notas (buyComentario) y Monto (buyMonto) al repintar.
  host.querySelectorAll('input[id^="buy_"],textarea[id^="buy_"],select[id^="buy_"],#buyComentario,#buyMonto').forEach(el=>{
    if(el.type==='file')return;
    if(el.id==='buyMonto'){compraDraft.monto=el.value;const base=Number(el.dataset.defaultTotal||0),actual=Number(el.value||0);compraDraft.montoManual=Number.isFinite(actual)&&Math.abs(actual-base)>.001;return}
    if(el.id==='buyComentario'){compraDraft.comentario=el.value;return}
    compraDraft.fields[el.id]=el.value;
  });
}
function markCompraMontoManual(el){const base=Number(el?.dataset?.defaultTotal||0),actual=Number(el?.value||0);compraDraft.monto=el?.value||'';compraDraft.montoManual=Number.isFinite(actual)&&Math.abs(actual-base)>.001;const note=document.getElementById('buyMontoNote');if(note){note.textContent=compraDraft.montoManual?'⚠️ Monto modificado manualmente':'Monto igual al total calculado';note.classList.toggle('warn',compraDraft.montoManual)}}
function restoreCompraReceiptPreview(){
  if(!compraImg)return;const prev=document.getElementById('buyPrev'),ph=document.getElementById('buyPh');if(prev){prev.src=compraImg;prev.style.display='block'}if(ph)ph.style.display='none';
}

function compraSlug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'producto'}
function compraEmoji(nombre,cat){
  const t=norm((nombre||'')+' '+(cat||''));
  if(t.includes('netflix'))return '🍿';
  if(t.includes('disney'))return '🏰';
  if(t.includes('max')||t.includes('hbo'))return '🎬';
  if(t.includes('vix'))return '📺';
  if(t.includes('viki'))return '🌸';
  if(t.includes('prime'))return '📦';
  if(t.includes('paramount'))return '⛰️';
  if(t.includes('crunchyroll'))return '🍥';
  if(t.includes('oleada'))return '🌊';
  if(t.includes('iptv')||t.includes('latintv')||t.includes('liontv')||t.includes('latin tv')||t.includes('lion tv'))return '📡';
  if(t.includes('spotify'))return '🎵';
  if(t.includes('deezer'))return '🎧';
  if(t.includes('canva'))return '🎨';
  if(t.includes('gemini'))return '🤖';
  if(t.includes('mcafee')||t.includes('antivirus'))return '🛡️';
  if(t.includes('office')||t.includes('microsoft'))return '💼';
  if(t.includes('free fire'))return '🎮';
  return '🛒';
}
/* ===================================================================
   Oct-2026 · COMPRA: un solo flujo para móvil y web
   Productos → Datos de entrega → Pago → Notas → Comprobante → Resumen → Enviar
   - El carrito siempre visible (web: columna derecha fija · móvil: barra inferior).
   - Agregar/quitar productos NO mueve la pantalla al inicio ni borra lo escrito.
   - Perfil pide nombre, apellido y dispositivo por defecto (pideDispositivo:false lo apaga).
   - Banco y comprobante obligatorios en TODA compra (también por comisión).
   - Validación con mensaje debajo de cada campo y foco en el primero que falte.
   =================================================================== */
let compraErrores={};   // id de campo → mensaje
let compraScrollA='';   // a dónde llevar la vista después de pintar: 'datos' | 'resumen' | ''

function compraBool(v){
  if(v===true||v===false)return v;
  const s=norm(String(v??''));
  if(['true','si','sí','1','yes'].includes(s))return true;
  if(['false','no','0'].includes(s))return false;
  return null;
}
// Prioridad: 1) metadata del catálogo (entregaTipo / entregaCanal) · 2) reglas por categoría · 3) nombre (solo catálogos viejos).
function compraTipoDesdeCatalogo(it,cat){
  const explicit=norm(it?.entregaTipo||it?.entrega_tipo||'').replace(/\s+/g,'_');
  if(explicit==='cuenta_completa'||explicit==='cuenta')return 'cuenta_completa';
  if(['perfil','correo','acceso','serial','serial_key','detalle'].includes(explicit))return explicit;
  if(explicit==='invitacion')return 'correo';
  const canal=norm(it?.entregaCanal||it?.entrega_canal||'');
  if(canal==='invitacion')return 'correo';
  if(canal==='iptv')return 'acceso';
  if(/(^| )cuentas? completas?( |$)/.test(norm(cat||'')))return 'cuenta_completa';
  const t=norm([it?.n,it?.s,it?.d,cat].filter(Boolean).join(' '));
  if(/iptv|liontv|latintv|latin tv|lion tv|icomplay|nanotech|evoutouch|oleada/.test(t))return 'acceso';
  if(/netflix|disney|\bmax\b|hbo|vix|viki|prime video|paramount|crunchyroll/.test(t))return 'perfil';
  if(/canva|gemini|office personal|microsoft 365|invitacion al correo|invitacion al gmail|gmail del cliente|al correo del cliente|a correo del cliente/.test(t))return 'correo';
  if(/mcafee|nod32|eset|antivirus|office 2021|office 2024|licencia permanente|serial de activacion|key/.test(t))return t.includes('key')?'serial_key':'serial';
  if(/spotify|deezer|correo y contrasena|correo y clave|se entrega correo y contrasena/.test(t))return 'acceso';
  return 'detalle';
}
// Perfil → SIEMPRE pide dispositivo, salvo que el catálogo diga pideDispositivo:false.
// Antes dependía de una lista vieja de nombres y los productos nuevos (p. ej. HBO Max Platino) perdían el campo.
function compraPideDispositivo(it,cat,tipo){
  const meta=compraBool(it?.pideDispositivo??it?.pide_dispositivo);
  if(meta!==null)return meta;
  return (tipo||compraTipoDesdeCatalogo(it,cat))==='perfil';
}
function compraEsIptv(p){return p?.entregaCanal==='iptv'||/iptv|liontv|latintv|latin tv|lion tv|icomplay|nanotech|evoutouch/.test(norm([p?.base,p?.nombre,p?.categoria].join(' ')))}
function compraAyudaDesdeTipo(p){
  const canal=String(p.canal||'manual');
  const flujo={bot_tg:' Flujo configurado: Bot TG / código.',inventario:' Flujo configurado: Inventario Sublichat.',invitacion:' Flujo configurado: invitación al correo.',iptv:' Flujo configurado: TV Digital / IPTV.'}[canal]||'';
  if(p.tipo==='cuenta_completa')return 'Seleccione la cantidad. La cuenta completa se entrega con correo; no pide perfil ni dispositivo.'+flujo;
  if(p.tipo==='perfil')return (p.pideDispositivo?'Nombre, apellido y dispositivo del perfil.':'Nombre y apellido del perfil.')+flujo;
  if(p.tipo==='correo')return 'Nombre del cliente y correo para la invitación.'+flujo;
  if(p.tipo==='acceso')return 'Se entrega con acceso. El encargado hará la entrega.'+flujo;
  if(p.tipo==='serial_key')return 'Se entrega con key / serial. El encargado hará la entrega.'+flujo;
  if(p.tipo==='serial')return 'Se entrega con serial/licencia. El encargado hará la entrega.'+flujo;
  return 'Escriba el detalle necesario para procesar la compra.'+flujo;
}
function compraProductosCatalogo(){
  const out=[];
  (PRECIOS||[]).forEach((g,gi)=>{
    (g.items||[]).forEach((it,ii)=>{
      const nombre=(it.s?`${it.n} · ${it.s}`:it.n);
      const tipo=compraTipoDesdeCatalogo(it,g.cat);
      const pideDispositivo=tipo==='perfil'&&compraPideDispositivo(it,g.cat,tipo);
      const entregaCanal=it.entregaCanal||it.entrega_canal||'manual';
      out.push({
        id:it.id?`cat_${compraSlug(it.id)}`:`cat_${gi}_${ii}_${compraSlug(nombre)}`,
        catalogId:it.id||'', emoji:compraEmoji(nombre,g.cat), nombre, base:it.n||'', sub:it.s||'',
        precio:it.p, precioTxt:it.p==null?'Por comisión':`L${it.p}`,
        tipo, pideDispositivo, ayuda:compraAyudaDesdeTipo({tipo,canal:entregaCanal,pideDispositivo}),
        detalleCatalogo:it.d||'', entregaCanal, categoria:g.cat||'Catálogo', grupo:g.cat||'Catálogo'
      });
    });
  });
  return out;
}
function compraEnsureSel(){
  const ids=new Set(compraProductosCatalogo().map(x=>x.id));
  compraSels=(compraSels||[]).filter(id=>ids.has(id));
}
function compraSeleccionados(){compraEnsureSel();const arr=compraProductosCatalogo();return compraSels.map(id=>arr.find(x=>x.id===id)).filter(Boolean)}
function compraProducto(){return compraSeleccionados()[0]||{id:'',emoji:'🛒',nombre:'Seleccione un producto',tipo:'detalle',ayuda:'Abra la lista y elija el servicio que necesita.',precio:null,precioTxt:'',categoria:'Catálogo',detalleCatalogo:''}}
function compraTipoTxt(t,p){if(t==='perfil'&&p&&!p.pideDispositivo)return 'Perfil · nombre y apellido';return {cuenta_completa:'Cuenta completa · seleccione cantidad',perfil:'Perfil · nombre, apellido y dispositivo',acceso:'Se entrega acceso',correo:'Pide nombre y correo',serial:'Se entrega serial',serial_key:'Se entrega key / serial',detalle:'Pide detalle de compra'}[t]||'Compra'}
function compraCantidad(p){
  if(!p||p.tipo!=='cuenta_completa')return 1;
  const n=Math.floor(Number(compraDraftVal(buyFid(p,'cantidad'),'1'))||1);
  return Math.min(50,Math.max(1,n));
}
function setCompraCantidad(pid,val){
  captureCompraDraft();
  compraDraft.fields[`buy_cantidad_${pid}`]=String(Math.min(50,Math.max(1,Math.floor(Number(val)||1))));
  renderCompraForm();
}
function compraCantidadHtml(p){
  const actual=compraCantidad(p),opciones=[...Array.from({length:20},(_,i)=>i+1),25,30,40,50];
  return `<label class="buy-field"><span>Cantidad de cuentas completas</span><select class="comp-in" id="${buyFid(p,'cantidad')}" onchange="setCompraCantidad('${p.id}',this.value)">${opciones.map(n=>`<option value="${n}" ${actual===n?'selected':''}>${n}</option>`).join('')}</select></label><div class="buy-note"><b>Entrega:</b> una cuenta completa con correo por cada unidad. No se pide perfil, dispositivo ni datos de instalación.</div>`;
}
function compraMath(){
  const items=compraSeleccionados();
  const unidades=items.reduce((a,p)=>a+compraCantidad(p),0);
  const subtotal=items.reduce((a,p)=>a+(Number.isFinite(Number(p.precio))&&p.precio!=null?Number(p.precio)*compraCantidad(p):0),0);
  const conPrecio=items.reduce((a,p)=>a+(p.precio!=null?compraCantidad(p):0),0);
  const descuento=Math.min(Math.max(conPrecio-1,0),4)*10;
  return {items,unidades,subtotal,conPrecio,descuento,total:Math.max(0,subtotal-descuento),hayComision:items.some(p=>p.precio==null)};
}
function compraResumenTxt(){
  const m=compraMath();
  if(!m.items.length)return 'Todavía no ha seleccionado ningún producto.';
  if(m.unidades===1)return `1 producto · ${m.items[0]?.precioTxt||''}`;
  return `${m.unidades} unidades · Subtotal ${money(m.subtotal)} · Descuento ${money(m.descuento)} · Total ${money(m.total)}${m.hayComision?' + comisión':''}`;
}
// Pintar sin perder la posición: guarda el scroll, pinta y lo devuelve (o lleva al bloque pedido, nunca al inicio).
function compraPintar(fn){
  const y=window.scrollY;
  fn();
  const destino=compraScrollA; compraScrollA='';
  if(destino){
    const el=document.getElementById(destino==='resumen'?'buySecResumen':destino==='datos'?'buySecDatos':destino);
    if(el){el.scrollIntoView({behavior:'smooth',block:'start'});return}
  }
  window.scrollTo(0,y);
}
function compraAviso(texto){
  let t=document.getElementById('buyToast');
  if(!t){t=document.createElement('div');t.id='buyToast';t.className='buy-toast';document.body.appendChild(t)}
  t.textContent=texto;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),1600);
}
function setCompraProducto(id){captureCompraDraft();if(!compraSels.includes(id))compraSels.push(id);compraPickerOpen=false;renderCompraForm()}
function toggleCompraProducto(id){
  captureCompraDraft();compraEnsureSel();
  const p=compraProductosCatalogo().find(x=>x.id===id);
  if(compraSels.includes(id)){compraSels=compraSels.filter(x=>x!==id);compraAviso(`Quitado: ${p?.nombre||'producto'}`)}
  else{compraSels.push(id);compraAviso(`✓ Agregado al carrito: ${p?.nombre||'producto'}`)}
  renderCompraForm();
}
function quitarCompraProducto(id){captureCompraDraft();compraSels=compraSels.filter(x=>x!==id);renderCompraForm()}
function toggleCompraPicker(){captureCompraDraft();compraPickerOpen=!compraPickerOpen;renderCompraForm()}
function setCompraDestino(d){compraDestino=d;document.querySelectorAll('.destino-seg button').forEach(b=>b.classList.toggle('on',b.dataset.dest===d))}
function buyFid(p,field){return `buy_${field}_${p.id}`}
function compraLimpiarErr(id){if(!compraErrores[id])return;delete compraErrores[id];document.getElementById('err_'+id)?.remove();document.getElementById('fld_'+id)?.classList.remove('has-err');const box=document.getElementById(id);if(box&&!/^(INPUT|TEXTAREA|SELECT)$/.test(box.tagName))box.classList.remove('has-err');if(id==='buyFile')document.getElementById('buyDrop')?.classList.remove('has-err')}
function compraErrHtml(id){return compraErrores[id]?`<small class="buy-err" id="err_${id}">${escHtml(compraErrores[id])}</small>`:''}
function compraCampo(p,field,label,ph,{type='text',req=true}={}){
  const id=buyFid(p,field);
  return `<label class="buy-field ${compraErrores[id]?'has-err':''}" id="fld_${id}"><span>${escHtml(label)}${req?' <i>*</i>':''}</span><input class="comp-in" id="${id}" type="${type}" value="${escAttr(compraDraftVal(id))}" placeholder="${escAttr(ph)}" oninput="compraLimpiarErr('${id}')">${compraErrHtml(id)}</label>`;
}
function compraDispositivoHtml(p){
  const id=buyFid(p,'dispositivo'),selected=compraDraftVal(id);
  const opciones=[['tv','📺 TV'],['celular','📱 Celular'],['tablet','📱 Tableta'],['computadora','💻 Computadora']];
  return `<div class="buy-field ${compraErrores[id]?'has-err':''}" id="fld_${id}"><span>Dispositivo <i>*</i></span><small class="buy-hint">Seleccione dónde utilizará este perfil.</small>
    <div class="dispositivo-opts">${opciones.map(([v,l])=>`<button type="button" class="disp-opt ${selected===v?'on':''}" data-disp="${v}" onclick="setCompraDispositivo('${p.id}','${v}');return false">${l}</button>`).join('')}</div>
    <input type="hidden" id="${id}" value="${escAttr(selected)}">${compraErrHtml(id)}</div>`;
}
function setCompraDispositivo(pid,val){
  const id=`buy_dispositivo_${pid}`,input=document.getElementById(id);
  if(input)input.value=val;
  compraDraft.fields[id]=val;
  document.getElementById('fld_'+id)?.querySelectorAll('.disp-opt').forEach(b=>b.classList.toggle('on',b.dataset.disp===val));
  compraLimpiarErr(id);
}
function compraMarcaTvHtml(p){
  const id=buyFid(p,'marcaTv'),idO=buyFid(p,'marcaTvOtra'),selected=compraDraftVal(id),otra=compraDraftVal(idO);
  const opciones=[['samsung','Samsung'],['lg','LG'],['tcl','TCL'],['roku','Roku TV'],['otro','Otra']];
  return `<div class="buy-field ${compraErrores[id]||compraErrores[idO]?'has-err':''}" id="fld_${id}"><span>Marca o sistema del TV <i>*</i></span>
    <div class="dispositivo-opts">${opciones.map(([v,l])=>`<button type="button" class="disp-opt ${selected===v?'on':''}" data-marca="${v}" onclick="setCompraMarcaTv('${p.id}','${v}');return false">📺 ${l}</button>`).join('')}</div>
    <input type="hidden" id="${id}" value="${escAttr(selected)}"><input class="comp-in" id="${idO}" value="${escAttr(otra)}" placeholder="Especifique marca y modelo" oninput="compraLimpiarErr('${idO}')" style="display:${selected==='otro'?'block':'none'};margin-top:9px">${compraErrHtml(id)}${compraErrHtml(idO)}</div>`;
}
function setCompraMarcaTv(pid,val){
  const id=`buy_marcaTv_${pid}`,input=document.getElementById(id);if(input)input.value=val;compraDraft.fields[id]=val;
  document.getElementById('fld_'+id)?.querySelectorAll('.disp-opt').forEach(b=>b.classList.toggle('on',b.dataset.marca===val));
  const otro=document.getElementById(`buy_marcaTvOtra_${pid}`);if(otro)otro.style.display=val==='otro'?'block':'none';
  compraLimpiarErr(id);
}
// Reglas por tipo de entrega (cada producto con SUS campos; banco, notas, comprobante y total son generales).
function compraCampos(p){
  if(p.tipo==='cuenta_completa')return compraCantidadHtml(p);
  if(p.tipo==='perfil')return `<div class="buy-grid2">${compraCampo(p,'perfilNombre','Nombre','Nombre del perfil')}${compraCampo(p,'perfilApellido','Apellido','Apellido del perfil')}</div>${p.pideDispositivo?compraDispositivoHtml(p):''}`;
  if(p.tipo==='correo')return `${compraCampo(p,'nombreCliente','Nombre del cliente','Nombre del cliente')}${compraCampo(p,'correo','Correo del cliente','correo@ejemplo.com',{type:'email'})}`;
  if(p.tipo==='detalle')return compraCampo(p,'detalle','Detalle requerido','ID, teléfono, usuario, plan o indicación del cliente');
  if(p.tipo==='acceso')return compraEsIptv(p)?compraMarcaTvHtml(p):`<div class="buy-note"><b>Entrega:</b> se entrega con acceso. Use Notas si necesita dejar una indicación.</div>`;
  if(p.tipo==='serial_key')return `<div class="buy-note"><b>Entrega:</b> key / serial. El encargado lo entrega después de revisar el comprobante.</div>`;
  if(p.tipo==='serial')return `<div class="buy-note"><b>Entrega:</b> serial/licencia. El encargado lo entrega después de revisar el comprobante.</div>`;
  return '';
}
function compraOpcionesHtml(){
  const grupos=[];
  compraProductosCatalogo().forEach(p=>{let item=grupos.find(x=>x.g===p.grupo);if(!item){item={g:p.grupo,items:[]};grupos.push(item)}item.items.push(p)});
  return grupos.map(gr=>`<div class="buy-group">${escHtml(gr.g)}</div>`+gr.items.map(x=>{
    const st=inventoryState(x), selected=compraSels.includes(x.id);
    return `<button class="buy-option ${selected?'on':''} ${!st.available?'is-out':''}" ${!st.available?'disabled':''} onclick="toggleCompraProducto('${x.id}');return false">
      <span class="bo-main"><span class="bo-emoji">${selected?'✅':x.emoji}</span><span><b>${escHtml(x.nombre)}</b><small>${escHtml(compraTipoTxt(x.tipo,x))}</small><em class="stock-badge ${st.key}">${escHtml(st.label)}</em></span></span>
      <span class="bo-price">${escHtml(x.precioTxt)}<i class="bo-act">${selected?'Quitar':'Agregar'}</i></span>
    </button>`;
  }).join('')).join('');
}
function misComprasHtml(){
  if(!misCompras.length)return '';
  const rows=misCompras.slice(0,4).map(o=>{
    const [cls,label]=orderStatusLabel(o.estado||o.status);
    const nombre=o.servicio||o.producto||o.descripcion||o.nombre||'Compra';
    const fecha=parseFecha(o.ts||o.createdAt||o.fecha||o.creadoEn);
    const detalle=o.detalleEstado||o.mensaje||o.destinoLabel||o.destino||'';
    const costo=Number(o.monto??o.costo??NaN);
    const financiero=Number.isFinite(costo)&&costo>0?`Pagado a Sublicuentas ${money(costo)}`:'';
    return `<div class="order-row"><div><b>${escHtml(nombre)}</b><small>${fecha?fmtFecha(fecha):'Pedido reciente'}${detalle?' · '+escHtml(detalle):''}${financiero?' · '+escHtml(financiero):''}</small></div><span class="order-status ${cls}">${label}</span></div>`;
  }).join('');
  return `<div class="order-panel"><div class="order-panel-head"><b>Mis pedidos recientes</b><span>Seguimiento</span></div>${rows}</div>`;
}
// Carrito: nombre · variante · cantidad · precio · eliminar · subtotal · descuento · total.
function compraCarritoItemsHtml(items){
  return items.map(p=>{const n=compraCantidad(p);return `<div class="buy-cart-row"><span class="buy-cart-ic">${p.emoji}</span><div><b>${escHtml(p.base||p.nombre)}</b><small>${escHtml([p.sub,p.tipo==='perfil'?'Perfil':p.tipo==='cuenta_completa'?'Cuenta completa':'',n>1?`× ${n}`:''].filter(Boolean).join(' · '))}</small></div><em>${escHtml(p.precio==null?'Por comisión':money(Number(p.precio)*n))}</em><button type="button" class="buy-cart-del" onclick="quitarCompraProducto('${p.id}');return false" aria-label="Eliminar ${escAttr(p.nombre)}">Eliminar</button></div>`}).join('');
}
function compraTotalesHtml(m){
  return `<dl class="buy-totals"><div><dt>Subtotal</dt><dd>${money(m.subtotal)}</dd></div><div class="discount"><dt>Descuento</dt><dd>-${money(m.descuento)}</dd></div><div class="total"><dt>TOTAL</dt><dd>${money(m.total)}${m.hayComision?' + comisión':''}</dd></div></dl>`;
}
// Secciones del checkout en el orden obligatorio (después de Productos).
function compraSeccionesHtml(items,m){
  const datos=items.map((p,i)=>{const campos=compraCampos(p);return `<div class="buy-product-box" id="buybox_${p.id}">
    <div class="buy-product-title"><span>${i+1}. ${p.emoji} ${escHtml(p.nombre)}</span><small>${escHtml(p.precioTxt)}</small></div>
    <div class="buy-product-help">${escHtml(p.ayuda)}</div>${campos||'<div class="buy-note">No requiere datos adicionales.</div>'}</div>`}).join('');
  const montoId='buyMonto',bancoId='buyBancos',fileId='buyFile';
  return `
  <section class="buy-sec" id="buySecDatos"><h3><b>2</b> Datos de entrega</h3>${datos||'<div class="buy-note">Agregue un producto para ver sus datos.</div>'}</section>
  <section class="buy-sec" id="buySecPago"><h3><b>3</b> Pago</h3>
    <div class="buy-money-summary"><span>Total calculado</span><b>${money(m.total)}${m.hayComision?' + comisión':''}</b></div>
    ${m.hayComision?`<label class="buy-field ${compraErrores[montoId]?'has-err':''}" id="fld_${montoId}"><span>Monto realmente pagado <i>*</i></span><input class="comp-in" id="buyMonto" type="number" inputmode="decimal" min="0" placeholder="Monto que pagó a Sublicuentas" data-default-total="${m.total}" value="${escAttr(compraDraft.montoManual?compraDraft.monto:(compraDraft.monto||m.total||''))}" oninput="markCompraMontoManual(this);compraLimpiarErr('buyMonto')">${compraErrHtml(montoId)}</label>
    <div class="buy-monto-note ${compraDraft.montoManual?'warn':''}" id="buyMontoNote">${compraDraft.montoManual?'⚠️ Monto modificado manualmente':'Incluye productos por comisión: escriba lo que realmente pagó.'}</div>`:`<div class="buy-monto-note" id="buyMontoNote">🔒 Total automático (precio mayorista de su catálogo). El sistema lo confirma al enviar.</div>`}
    <div class="pago-bancos buy-field ${compraErrores[bancoId]?'has-err':''}" id="buyBancos"><span>¿Dónde se hizo el pago? <i>*</i></span><div class="pago-bancos-list">Cargando métodos…</div>${compraErrHtml(bancoId)}</div>
  </section>
  <section class="buy-sec" id="buySecNotas"><h3><b>4</b> Notas</h3>
    <textarea class="cobro-text" id="buyComentario" placeholder="Indicación adicional, urgencia o detalle para procesar la compra...">${escHtml(compraDraft.comentario||'')}</textarea>
  </section>
  <section class="buy-sec" id="buySecComprobante"><h3><b>5</b> Comprobante <i>*</i></h3>
    <input type="file" id="buyFile" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" style="display:none" onchange="pickCompra(this)">
    <div class="comp-drop ${compraErrores[fileId]?'has-err':''}" id="buyDrop" onclick="document.getElementById('buyFile').click()">
      <div class="comp-ph" id="buyPh"><div class="ic">🖼️</div><span>Adjuntar comprobante desde archivos o galería</span><small>JPG, PNG o WEBP. Seleccione la captura guardada.</small></div>
      <img id="buyPrev" style="display:none" alt="Comprobante">
    </div>${compraErrores[fileId]?`<small class="buy-err" id="err_${fileId}">${escHtml(compraErrores[fileId])}</small>`:''}
  </section>
  <section class="buy-sec" id="buySecResumen"><h3><b>6</b> Resumen</h3>
    <div class="buy-cart-items">${compraCarritoItemsHtml(items)}</div>${compraTotalesHtml(m)}
    <div class="buy-field"><span>Enviar a</span><div class="destino-seg"><button data-dest="sublicuentas" class="${compraDestino==='sublicuentas'?'on':''}" onclick="setCompraDestino('sublicuentas');return false">Sublicuentas</button><button data-dest="relojes" class="${compraDestino==='relojes'?'on':''}" onclick="setCompraDestino('relojes');return false">Relojes</button></div></div>
    <button class="act primary buy-submit" id="buyBtn" onclick="enviarCompra()" ${items.length?'':'disabled'}>${items.length?'Enviar compra':'Seleccione un producto'}</button>
    <div id="buyMsg" class="web-form-msg"></div>
  </section>`;
}
function compraDespuesDePintar(){
  restoreCompraReceiptPreview();
  setCompraBanco(compraDraft.bancoId||''); // bancos activos (obligatorio en toda compra)
}
function vCompras(){
  if(socioSinCompras()){go('renovar');return}
  compraEnsureSel();if(!compraSels.length)compraPickerOpen=true;
  content.innerHTML=`<section class="operations-hero"><h2>Nueva compra</h2><p>Seleccione servicios, arme un combo y envíe el comprobante directamente al equipo.</p><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"></section><div id="compraForm"></div>`;
  renderCompraForm();
}
// Móvil: una sola columna + barra inferior "Carrito (n) L… [Ver compra]".
function renderCompraForm(){
  captureCompraDraft();
  const items=compraSeleccionados(), m=compraMath();
  const el=document.getElementById('compraForm'); if(!el)return;
  compraPintar(()=>{
    el.innerHTML=`
    ${misComprasHtml()}
    <section class="buy-sec" id="buySecProductos"><h3><b>1</b> Productos</h3>
      <button class="buy-picker-btn" onclick="toggleCompraPicker();return false">
        <span class="buy-picked"><span class="buy-emoji">🛒</span><span><span class="buy-name">${items.length?`${m.unidades} en el carrito`:'Agregar productos'}</span><span class="buy-type">${items.length?escHtml(items.map(x=>x.nombre).join(' + ')):'Toque aquí para elegir del catálogo'}</span></span></span>
        <span class="buy-arrow">${compraPickerOpen?'▲':'▼'}</span>
      </button>
      ${compraPickerOpen?`<div class="buy-list"><div class="buy-combo-tip">Puede agregar varios productos. Descuento automático por unidades con precio: 2 = L10, 3 = L20, 4 = L30, 5 o más = L40 máximo.</div>${compraOpcionesHtml()}</div>`:''}
      ${items.length?`<div class="buy-cart-items">${compraCarritoItemsHtml(items)}</div>`:''}
    </section>
    ${items.length?compraSeccionesHtml(items,m):''}
    ${items.length?`<div class="buy-bar"><span>🛒 Carrito (${m.unidades}) <b>${money(m.total)}${m.hayComision?' +':''}</b></span><button type="button" onclick="compraScrollA='resumen';compraPintar(()=>{});return false">Ver compra</button></div>`:''}`;
    if(items.length)compraDespuesDePintar();
  });
}
async function pickCompra(input){
  const f=input.files&&input.files[0]; if(!f)return;
  if(!/^image\/(jpeg|png|webp)$/.test(f.type)&&!/\.(jpe?g|png|webp)$/i.test(f.name||'')){compraErrores.buyFile='Use una imagen JPG, PNG o WEBP.';captureCompraDraft();renderCompraForm();return}
  const msg=document.getElementById('buyMsg'); if(msg){msg.className='web-form-msg';msg.textContent='Procesando comprobante…'}
  try{
    compraImg=await compressImage(f,1280,0.7);
    restoreCompraReceiptPreview();compraLimpiarErr('buyFile');document.getElementById('buyDrop')?.classList.remove('has-err');
    if(msg)msg.textContent='';
  }catch(e){ if(msg){msg.className='web-form-msg error';msg.textContent='No se pudo leer la imagen del comprobante.'} }
}
function compraValidar(items,m){
  const e={},v=id=>String(compraDraftVal(id)).trim();
  for(const p of items){
    if(p.tipo==='perfil'){
      if(!v(buyFid(p,'perfilNombre')))e[buyFid(p,'perfilNombre')]='Escriba el nombre del perfil.';
      if(!v(buyFid(p,'perfilApellido')))e[buyFid(p,'perfilApellido')]='Escriba el apellido del perfil.';
      if(p.pideDispositivo&&!v(buyFid(p,'dispositivo')))e[buyFid(p,'dispositivo')]='Seleccione un dispositivo.';
    }
    if(p.tipo==='correo'){
      if(!v(buyFid(p,'nombreCliente')))e[buyFid(p,'nombreCliente')]='Escriba el nombre del cliente.';
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v(buyFid(p,'correo'))))e[buyFid(p,'correo')]='Escriba un correo válido.';
    }
    if(p.tipo==='detalle'&&!v(buyFid(p,'detalle')))e[buyFid(p,'detalle')]='Escriba el detalle para procesar la compra.';
    if(p.tipo==='acceso'&&compraEsIptv(p)){
      const marca=v(buyFid(p,'marcaTv'));
      if(!marca)e[buyFid(p,'marcaTv')]='Seleccione la marca o sistema del TV.';
      else if(marca==='otro'&&!v(buyFid(p,'marcaTvOtra')))e[buyFid(p,'marcaTvOtra')]='Especifique la marca y el modelo del TV.';
    }
  }
  if(m.hayComision&&!(num(compraDraft.monto)>0))e.buyMonto='Escriba el monto realmente pagado.';
  if(!compraDraft.bancoId)e.buyBancos='Elija dónde se hizo el pago.';
  if(!compraImg)e.buyFile='Adjunte el comprobante antes de enviar.';
  return e;
}
function compraPayloadProductos(items){
  const v=id=>String(compraDraftVal(id)).trim();
  return items.map(p=>{const marcaTv=v(buyFid(p,'marcaTv'));return {
    id:p.id, catalogId:p.catalogId, servicio:p.nombre, servicioBase:p.base, catalogCategory:p.categoria, catalogSub:p.sub, catalogDetalle:p.detalleCatalogo,
    precioCatalogo:p.precio, cantidad:compraCantidad(p), entregaTipo:p.tipo, entregaCanal:p.entregaCanal||'manual',
    perfilNombre:v(buyFid(p,'perfilNombre')), perfilApellido:v(buyFid(p,'perfilApellido')), correo:v(buyFid(p,'correo')),
    detalleServicio:v(buyFid(p,'detalle')), nombreCliente:v(buyFid(p,'nombreCliente')), dispositivo:v(buyFid(p,'dispositivo')),
    marcaTv:marcaTv==='otro'?v(buyFid(p,'marcaTvOtra')):marcaTv
  }});
}
function compraEnfocarError(){
  const first=document.querySelector('#compraForm .has-err');
  if(!first)return;
  first.scrollIntoView({behavior:'smooth',block:'center'});
  const focusable=first.matches('input,textarea,select,button')?first:first.querySelector('input:not([type=hidden]),textarea,select,button');
  setTimeout(()=>{try{focusable?.focus({preventScroll:true})}catch(_){}} ,250);
}
async function enviarCompra(){
  captureCompraDraft();
  const items=compraSeleccionados(), m=compraMath();
  if(!items.length){compraPickerOpen=true;renderCompraForm();return}
  if(typeof webCatalogOperational==='function'&&typeof webDesktopMode==='function'&&webDesktopMode()&&!webCatalogOperational()){const msg=document.getElementById('buyMsg');if(msg){msg.textContent='Actualice el catálogo antes de enviar.';msg.className='web-form-msg error'}return}
  compraErrores=compraValidar(items,m);
  if(Object.keys(compraErrores).length){
    renderCompraForm();
    const msg=document.getElementById('buyMsg');if(msg){msg.textContent='Faltan datos: revise los campos marcados.';msg.className='web-form-msg error'}
    compraEnfocarError();return;
  }
  const productos=compraPayloadProductos(items);
  compraDraft.requestId=compraDraft.requestId||nuevoOpId(); // doble toque / reintento = una sola compra
  const montoReal=m.hayComision?num(compraDraft.monto||m.total):Number(m.total||0),montoModificado=m.hayComision&&Math.abs(montoReal-Number(m.total||0))>.001;
  let comentario=String(compraDraft.comentario||'').trim();
  if(montoModificado){const nota=`Monto modificado manualmente: calculado ${money(m.total)} → pagado ${money(montoReal)}`;comentario=comentario?`${comentario} · ${nota}`:nota}
  const btn=document.getElementById('buyBtn'),msg=document.getElementById('buyMsg');
  if(btn){btn.disabled=true;btn.textContent='Enviando…'}
  try{
    const r=await API.call('/rev/compra',{method:'POST',body:JSON.stringify({
      requestId:compraDraft.requestId, destino:compraDestino,
      servicio:m.unidades>1?`Combo ${m.unidades} unidades`:items[0].nombre,
      productos, comboCantidad:m.unidades, subtotalCatalogo:m.subtotal, descuentoCombo:m.descuento, totalCombo:m.total,
      monto:montoReal, montoCalculado:m.total, montoModificado, bancoId:compraDraft.bancoId||'',
      comentario, imagen:compraImg
    })});
    if(msg){msg.textContent=r.duplicate?'✅ La compra ya estaba registrada. No se duplicó.':`✅ Compra enviada a ${r.destinoLabel||'equipo'}.`;msg.className='web-form-msg ok'}
    compraImg='';compraSels=[];compraPickerOpen=true;compraErrores={};resetCompraDraft();
    if(typeof webCompraStep!=='undefined')webCompraStep=1;
    if(typeof markSyncStale==='function')markSyncStale(['compras','inventario','metricas']);
    await Promise.allSettled([loadMisCompras(),typeof loadInventario==='function'?loadInventario():null,typeof loadMetricas==='function'?loadMetricas():null]);
    setTimeout(()=>{if(current==='compras')vCompras()},900);
  }catch(e){
    const map={falta_banco:'Elija dónde se hizo el pago.',falta_operation_id:'Actualice el panel (recargue la página).',imagen_muy_grande:'La foto pesa mucho, pruebe otra.',falta_servicio:'Seleccione un servicio.',sin_permiso_comprar:'Su usuario no tiene permiso para registrar compras.'};
    if(msg){msg.textContent=map[e&&e.error]||('No se pudo enviar la compra. '+((e&&e.detail)||(e&&e.error)||'Reintente.'));msg.className='web-form-msg error'}
  }finally{if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='Enviar compra'}}
}


/* BUZÓN — mensajes del equipo (entrada) + sugerencias (salida) */
function vSugerencias(){
  marcarBuzonLeido();
  const msgs=[...avisos].sort((a,b)=>(b.ts||0)-(a.ts||0));
  content.innerHTML=`
  <div class="scr-title">📬 Buzón</div>

  <div class="card">
    <div class="card-h"><h2>📥 Mensajes del equipo</h2><a onclick="loadAvisos()">Actualizar</a></div>
    <p class="buzon-int">Avisos y respuestas de Sublicuentas para vos.</p>
    <div id="buzonMsgs">${msgs.length
      ? `<div class="buzon-list">${msgs.map(a=>`
          <div class="buzon-msg">
            <div class="bm-ic">📣</div>
            <div class="bm-body"><div class="bm-txt">${escHtml(a.texto)}</div><div class="bm-meta">${escHtml(a.autor||'Sublicuentas')} · hace ${tiempoDesde(a.ts)}</div></div>
          </div>`).join('')}</div>`
      : `<div class="empty" style="padding:22px"><div class="ico">📭</div>Sin mensajes por ahora. Acá verás los avisos y respuestas del equipo.</div>`}</div>
  </div>

  <div class="card">
    <div class="card-h"><h2>💬 Enviar sugerencia</h2><a onclick="go('inicio')">Inicio</a></div>
    <p style="font-family:var(--fn);font-weight:700;color:var(--muted);font-size:13.5px;margin-bottom:10px;line-height:1.4">Elegí a quién le escribís y mandá tu mensaje. Le llega directo por Telegram.</p>
    <div class="sug-dest" id="sugDest">
      <button class="on" data-d="sublicuentas" onclick="setSugDestino('sublicuentas',this)">🟣 Sublicuentas</button>
      <button data-d="relojes" onclick="setSugDestino('relojes',this)">⌚ Relojes</button>
    </div>
    <textarea id="sugTxt" rows="4" placeholder="Tu sugerencia o comentario..." style="width:100%;border-radius:16px;border:2px solid #eee;padding:12px;font-family:var(--fn);font-size:15px;resize:vertical;box-sizing:border-box"></textarea>
    <button id="sugBtn" onclick="enviarSugerencia()" style="margin-top:10px;width:100%;background:var(--accent);color:#fff;border:none;border-radius:18px;padding:13px;font-family:var(--ff);font-weight:700;font-size:16px;box-shadow:0 6px 0 var(--accent-d)">Enviar</button>
    <div id="sugMsg" style="margin-top:10px;font-family:var(--fn);font-weight:700;font-size:13.5px"></div>
  </div>`;
}
let sugDestino='sublicuentas';
function setSugDestino(d,btn){sugDestino=d;document.querySelectorAll('#sugDest button').forEach(b=>b.classList.toggle('on',b===btn))}
async function enviarSugerencia(){
  const txt=document.getElementById('sugTxt').value.trim();
  const msgEl=document.getElementById('sugMsg');
  if(!txt){msgEl.textContent='Escribí algo primero.';msgEl.style.color='#e54848';return}
  const btn=document.getElementById('sugBtn');
  btn.disabled=true; btn.textContent='Enviando…';
  try{
    await API.call('/rev/sugerencia',{method:'POST',body:JSON.stringify({texto:txt,destino:sugDestino})});
    document.getElementById('sugTxt').value='';
    msgEl.textContent='✅ Enviado a '+(sugDestino==='relojes'?'Relojes':'Sublicuentas')+'. ¡Gracias!';
    msgEl.style.color='#1aa15a';
  }catch(e){
    msgEl.textContent='No pude enviarlo. Intentá de nuevo.';
    msgEl.style.color='#e54848';
  }finally{ btn.disabled=false; btn.textContent='Enviar'; }
}

/* CLIENTES */
let cliF='';
let cliEstado='todos';
function vClientes(){
  const geisell=socioGeisell();
  const fs=flat();
  const semana=fs.filter(s=>s.est.n>=0&&s.est.n<=7);
  const mes=fs.filter(s=>s.est.n>=0&&s.est.n<=30);
  const vencidos=fs.filter(s=>s.est.n<0);
  const vigentes=fs.filter(s=>esVigente(s.est));
  const cliVig=clientes.filter(esClienteVigente).length;
  const cliNoVig=clientes.filter(esClienteNoVigente).length;
  const montoSemana=semana.reduce((a,s)=>a+(s.precio||0),0);
  const montoMes=mes.reduce((a,s)=>a+(s.precio||0),0);
  const montoVencido=vencidos.reduce((a,s)=>a+(s.precio||0),0);
  const cartera=vigentes.reduce((a,s)=>a+(s.precio||0),0);
  const max=Math.max(montoMes,montoSemana,montoVencido,cartera,1);
  content.innerHTML=`
  <section class="operations-hero clients"><h2>Clientes</h2><p>${geisell?'Consulte sus clientes y prepare mensajes de renovación en segundos.':'Consulte su cartera, encuentre cualquier cliente y envíe cobros en segundos.'}</p><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"></section>
  <div class="finance-card">
    <div class="finance-head"><h2>${geisell?'Resumen de renovaciones':'Resumen de cobros'}</h2><span>${fs.length} servicios</span></div>
    <div class="finance-grid">
      <div class="finance-mini good"><b>${cliVig}</b><span>👤 Clientes vigentes · en fecha</span></div>
      <div class="finance-mini exp"><b>${cliNoVig}</b><span>🚫 Sin servicio vigente</span></div>
      <div class="finance-mini"><b>${semana.length}</b><span>${geisell?'Renuevan':'Cobrar'} esta semana · ${money(montoSemana)}</span></div>
      <div class="finance-mini"><b>${vencidos.length}</b><span>Vencidos · ${money(montoVencido)}</span></div>
    </div>
    <div class="bar-row"><div class="lab"><span>Semana</span><b>${money(montoSemana)}</b></div><div class="bar"><i style="width:${Math.max(4,Math.round((montoSemana/max)*100))}%"></i></div></div>
    <div class="bar-row"><div class="lab"><span>Mes</span><b>${money(montoMes)}</b></div><div class="bar"><i style="width:${Math.max(4,Math.round((montoMes/max)*100))}%"></i></div></div>
    <div class="bar-row"><div class="lab"><span>Cartera vigente</span><b>${money(cartera)}</b></div><div class="bar"><i style="width:${Math.max(4,Math.round((cartera/max)*100))}%"></i></div></div>
  </div>
  <div class="seg" id="cliSeg" style="margin:0 0 12px">
    ${[['todos','Todos',clientes.length],['vigentes','Vigentes',cliVig],['novigentes','Sin servicio vigente',cliNoVig]].map(([k,l,n])=>
      `<button class="${cliEstado===k?'on':''}" onclick="cliEstado='${k}';renderCli()">${l} · ${n}</button>`).join('')}
  </div>
  <div class="search">
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
    <input id="cliSearch" placeholder="Buscar cliente o teléfono" oninput="cliF=this.value;renderCli()">
  </div>
  <div id="cliList"></div>`;
  renderCli();
}
function renderCli(){
  document.querySelectorAll('#cliSeg button').forEach(b=>{
    const k=b.textContent.startsWith('Todos')?'todos':b.textContent.startsWith('Vigentes')?'vigentes':'novigentes';
    b.classList.toggle('on',k===cliEstado);
  });
  const f=norm(cliF);
  const list=clientes.filter(c=>{
    if(cliEstado==='vigentes'&&!esClienteVigente(c))return false;
    if(cliEstado==='novigentes'&&!esClienteNoVigente(c))return false;
    return !f||norm(nombreCli(c)).includes(f)||(c.telefono||'').includes(f);
  })
    .sort((a,b)=>norm(nombreCli(a)).localeCompare(norm(nombreCli(b))));
  const el=document.getElementById('cliList');if(!el)return;
  el.innerHTML=list.length?list.map(cliCard).join(''):`<div class="card"><div class="empty"><div class="ico">🔍</div>Sin resultados.</div></div>`;
}
function cliCard(c){
  const svcs=Array.isArray(c.servicios)?c.servicios:[];
  const peor=svcs.map(s=>estado(parseFecha(pick(s,CONFIG.campos.vencimiento)))).reduce((a,b)=>b.n<a.n?b:a,{n:9999,c:'mut'});
  const ec=estadoCliente(c);
  return `<div class="cli-card">
    <div class="cli-top">
      <div><div class="cli-name">${escHtml(nombreCli(c))} <span class="pill ${ec.c}" style="font-size:10.5px;padding:2px 9px;vertical-align:middle">${ec.t}</span></div><div class="cli-tel">${escHtml(c.telefono||'sin teléfono')}</div></div>
      <span class="pill ${peor.c}">${svcs.length} ${svcs.length===1?'servicio':'servicios'}</span>
    </div>
    ${svcs.length?`<div class="svc-list">${svcs.map((s,ix)=>svcRow(s,c.id,ix)).join('')}</div>`:''}
    <div class="cli-actions"><button class="act primary" onclick='openCobro("${c.id}","")'>${etiquetaMensajeRenovacion()}</button>${waBtn(c)}</div>
  </div>`;
}
function svcRow(s,cid,ix){
  const nm=pick(s,CONFIG.campos.servicio)||'Servicio';
  const f=parseFecha(pick(s,CONFIG.campos.vencimiento)),e=estado(f);
  const mt=[f?`Vence ${fmtFecha(f)}`:null,e.n<0?'⚠️ corte pendiente':null].filter(Boolean).join(' · ');
  return `<div class="svc">
    <div style="display:flex;align-items:center;gap:11px;min-width:0">
      <span class="dot-s ${e.c}"></span>
      <div style="min-width:0"><div class="nm">${escHtml(nm)}</div>${mt?`<div class="mt">${escHtml(mt)}</div>`:''}</div>
    </div>
    <div class="svc-right"><span class="pill ${e.c}">${e.t}</span><button class="svc-mini" onclick='openComprobante("${cid}","${enc(nm)}",${ix});event.stopPropagation()'>Renovar</button></div>
  </div>`;
}
function waBtn(c){const u=waUrl(c.telefono||c.telefono_norm||'');
  return u?`<a class="act ghost" href="${escAttr(u)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`:''}

/* RENOVAR */
let renF='todos',renewGroups=[];
function renewDateKey(d){if(!d)return 'sin-fecha';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function groupRenewServices(rows){
  const map=new Map();
  (rows||[]).forEach(s=>{
    const key=`${s.cliente.id}::${renewDateKey(s.fecha)}`;
    if(!map.has(key))map.set(key,{key,cliente:s.cliente,fecha:s.fecha,est:s.est,servicios:[]});
    map.get(key).servicios.push(s);
  });
  return [...map.values()].sort((a,b)=>(a.est?.n??9999)-(b.est?.n??9999)||nombreCli(a.cliente).localeCompare(nombreCli(b.cliente),'es'));
}
function vRenovar(){
  const corte=groupRenewServices(flat().filter(s=>s.est.n<0));
  content.innerHTML=`
  <section class="operations-hero renew"><h2>Renovaciones</h2><p>Una sola tarjeta por cliente y fecha. Si tiene varias cuentas, usted elige cuáles renovar.</p><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"></section>
  ${corte.length?`<div class="cut-alert"><b>🚨 ${corte.length} cliente${corte.length===1?'':'s'} con renovación vencida</b><span>Las cuentas del mismo cliente y la misma fecha aparecen unificadas para evitar renovarlas una por una.</span></div>`:''}
  <div class="seg">
    ${[['todos','Todos'],['vencidos','Corte/Vencidos'],['porvencer','Por vencer']].map(([k,l])=>
      `<button class="${renF===k?'on':''}" onclick="renF='${k}';renderRen()">${l}</button>`).join('')}
  </div>
  <div id="renList"></div>`;
  renderRen();
}
function openRenewGroup(index){
  const g=renewGroups[Number(index)];if(!g||!g.servicios?.length)return;
  const ids=g.servicios.map(s=>Number(s.servicioIndex));
  openComprobanteGrupo(g.cliente.id,ids);
}
function openCobroRenewGroup(index){
  const g=renewGroups[Number(index)];if(!g||!g.servicios?.length)return;
  openCobroGrupo(g.cliente.id,g.servicios.map(s=>Number(s.servicioIndex)));
}
function renderRen(){
  document.querySelectorAll('.seg button').forEach(b=>{
    const k=b.textContent==='Todos'?'todos':b.textContent.startsWith('Corte')?'vencidos':'porvencer';
    b.classList.toggle('on',k===renF);
  });
  let fs=flat().filter(s=>s.est.n<9999);
  if(renF==='vencidos')fs=fs.filter(s=>s.est.c==='exp'||s.est.c==='due');
  if(renF==='porvencer')fs=fs.filter(s=>s.est.c==='soon');
  renewGroups=groupRenewServices(fs);
  const host=document.getElementById('renList');if(!host)return;
  host.innerHTML=renewGroups.length?renewGroups.map((g,i)=>{
    const names=g.servicios.map(s=>s.nombre);
    const chips=names.map(n=>`<span class="renew-svc-chip">${escHtml(n)}</span>`).join('');
    const count=g.servicios.length;
    return `<div class="cli-card renew-group-card">
      <div class="cli-top">
        <div><div class="cli-name">${escHtml(nombreCli(g.cliente))}</div><div class="cli-tel">${count>1?`${count} servicios · `:''}${g.fecha?`Renueva ${escHtml(fmtFecha(g.fecha))}`:'Sin fecha'}</div></div>
        <span class="pill ${g.est.c}">${g.est.t}</span>
      </div>
      <div class="renew-svc-list">${chips}</div>
      <div class="cli-actions">
        <button class="act primary" onclick="openCobroRenewGroup(${i})">${etiquetaMensajeRenovacion()}</button>
        <button class="act ghost" style="flex:none;min-width:${count>1?'148':'105'}px;padding:12px 10px" onclick="openRenewGroup(${i})">${count>1?'🔄 Elegir qué renovar':'🔄 Renovar'}</button>
      </div>
    </div>`;
  }).join(''):`<div class="card"><div class="empty"><div class="ico">✅</div><b>Todo en orden</b>No hay nada en este filtro.</div></div>`;
}
