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
function resetCompraDraft(){compraDraft={fields:{},monto:'',montoManual:false,comentario:''}}
function compraDraftVal(id,def=''){const v=compraDraft.fields?.[id];return v==null?def:String(v)}
function captureCompraDraft(){
  const host=document.getElementById('compraForm');if(!host)return;
  host.querySelectorAll('input[id^="buy_"],textarea[id^="buy_"]').forEach(el=>{
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
function compraTipoDesdeCatalogo(it,cat){
  const explicito=String(it?.entregaTipo||'').toLowerCase();
  if(['perfil','correo','acceso','serial','serial_key','detalle'].includes(explicito))return explicito;
  const t=norm([it.n,it.s,it.d,cat].filter(Boolean).join(' '));
  if(/netflix|disney|max|hbo|vix|viki|prime video|paramount|crunchyroll/.test(t))return 'perfil';
  if(/canva|gemini|office personal|microsoft 365|invitacion al correo|invitacion al gmail|gmail del cliente|al correo del cliente|a correo del cliente/.test(t))return 'correo';
  if(/mcafee|nod32|eset|antivirus|office 2021|office 2024|licencia permanente|serial de activacion|key/.test(t))return t.includes('key')?'serial_key':'serial';
  if(/oleada|iptv|liontv|latintv|latin tv|lion tv|spotify|deezer|correo y contrasena|correo y clave|se entrega correo y contrasena/.test(t))return 'acceso';
  if(/free fire|recarga|juegos/.test(t))return 'detalle';
  return 'detalle';
}
// ✅ NUEVO: para estas 6 plataformas, además del nombre/apellido del perfil,
// se pide en qué dispositivo lo va a usar el cliente (TV, celular, tablet o
// computadora) — así el equipo ya sabe para cuál armar el acceso.
function compraPideDispositivo(it,cat){
  const t=norm([it.n,it.s,cat].filter(Boolean).join(' '));
  return /disney|\bmax\b|\bhbo\b|\bvix\b|crunchyroll|prime video/.test(t);
}
function compraEsIptv(p){return /iptv|liontv|latintv|latin tv|lion tv/.test(norm([p.base,p.nombre,p.categoria].join(' ')))}
function compraAyudaDesdeTipo(p){
  const canal=String(p.canal||'manual');
  const flujo={bot_tg:' Flujo configurado: Bot TG / código.',inventario:' Flujo configurado: Inventario Sublichat.',invitacion:' Flujo configurado: invitación al correo.',iptv:' Flujo configurado: TV Digital / IPTV.'}[canal]||'';
  if(p.tipo==='perfil')return 'Pedir nombre y apellido del perfil.'+flujo;
  if(p.tipo==='correo')return 'Pedir solo el correo del cliente.'+flujo;
  if(p.tipo==='acceso')return 'Este servicio se entrega con acceso. El encargado hará la entrega.'+flujo;
  if(p.tipo==='serial_key')return 'Este producto se entrega con key / serial. El encargado hará la entrega.'+flujo;
  if(p.tipo==='serial')return 'Este producto se entrega con serial/licencia. El encargado hará la entrega.'+flujo;
  return 'Pedir el detalle necesario para procesar la compra.'+flujo;
}
function compraProductosCatalogo(){
  const out=[];
  (PRECIOS||[]).forEach((g,gi)=>{
    (g.items||[]).forEach((it,ii)=>{
      const nombre=(it.s?`${it.n} · ${it.s}`:it.n);
      const tipo=compraTipoDesdeCatalogo(it,g.cat);
      out.push({
        id:it.id?`cat_${compraSlug(it.id)}`:`cat_${gi}_${ii}_${compraSlug(nombre)}`,
        catalogId:it.id||'',
        emoji:compraEmoji(nombre,g.cat),
        nombre,
        base:it.n||'',
        sub:it.s||'',
        precio:it.p,
        precioTxt:it.p==null?'Por comisión':`Lps. ${it.p}`,
        tipo,
        pideDispositivo:tipo==='perfil'&&compraPideDispositivo(it,g.cat),
        ayuda:compraAyudaDesdeTipo({tipo,canal:it.entregaCanal||'manual'}),
        detalleCatalogo:it.d||'',
        entregaCanal:String(it.entregaCanal||'manual'),
        categoria:g.cat||'Catálogo',
        grupo:g.cat||'Catálogo'
      });
    });
  });
  return out;
}
function compraEnsureSel(){
  const arr=compraProductosCatalogo();
  const ids=new Set(arr.map(x=>x.id));
  compraSels=(compraSels||[]).filter(id=>ids.has(id));
}
function compraSeleccionados(){compraEnsureSel();const arr=compraProductosCatalogo();return compraSels.map(id=>arr.find(x=>x.id===id)).filter(Boolean)}
function compraProducto(){return compraSeleccionados()[0]||{id:'',emoji:'🛒',nombre:'Seleccione un producto',tipo:'detalle',ayuda:'Abra la lista y elija el servicio que necesita.',precio:null,precioTxt:'',categoria:'Catálogo',detalleCatalogo:''}}
function compraTipoTxt(t){return {perfil:'Pide nombre y apellido del perfil',acceso:'Se entrega acceso',correo:'Pide correo',serial:'Se entrega serial',serial_key:'Se entrega key / serial',detalle:'Pide detalle de compra'}[t]||'Compra'}
function compraMath(){
  const items=compraSeleccionados();
  const subtotal=items.reduce((a,p)=>a+(Number.isFinite(Number(p.precio))?Number(p.precio):0),0);
  const conPrecio=items.filter(p=>p.precio!=null).length;
  const descuento=Math.min(Math.max(conPrecio-1,0),4)*10;
  return {items,subtotal,conPrecio,descuento,total:Math.max(0,subtotal-descuento),hayComision:items.some(p=>p.precio==null)};
}
function compraResumenTxt(){
  const m=compraMath();
  if(!m.items.length)return 'Todavía no ha seleccionado ningún producto.';
  if(m.items.length<=1)return `${m.items.length} producto · ${m.items[0]?.precioTxt||''}`;
  return `${m.items.length} productos · Subtotal Lps. ${m.subtotal} · Descuento Lps. ${m.descuento} · Total Lps. ${m.total}${m.items.length>5?' · descuento máximo aplicado':''}${m.hayComision?' + comisión':''}`;
}
function setCompraProducto(id){captureCompraDraft();compraSels=[id];compraPickerOpen=false;renderCompraForm()}
function toggleCompraProducto(id){
  captureCompraDraft();compraEnsureSel();
  if(compraSels.includes(id)){
    compraSels=compraSels.filter(x=>x!==id);
  }else{
    compraSels.push(id);
  }
  renderCompraForm();
}
function toggleCompraPicker(){captureCompraDraft();compraPickerOpen=!compraPickerOpen;renderCompraForm()}
function setCompraDestino(d){compraDestino=d;document.querySelectorAll('.destino-seg button').forEach(b=>b.classList.toggle('on',b.dataset.dest===d))}
function buyFid(p,field){return `buy_${field}_${p.id}`}
// ✅ NUEVO: selector de dispositivo (TV/Celular/Tablet/Computadora) — solo
// para las 6 plataformas que lo piden (ver compraPideDispositivo).
function compraDispositivoHtml(p){
  const opciones=[['tv','📺 TV'],['celular','📱 Celular'],['tablet','📱 Tablet'],['computadora','💻 Computadora']],selected=compraDraftVal(buyFid(p,'dispositivo'));
  return `<div class="buy-dispositivo">
    <small class="buy-disp-label">¿En qué dispositivo va este perfil?</small>
    <div class="dispositivo-opts">${opciones.map(([v,l])=>`<button type="button" class="disp-opt ${selected===v?'on':''}" data-disp="${v}" onclick="setCompraDispositivo('${p.id}','${v}',this);return false">${l}</button>`).join('')}</div>
    <input type="hidden" id="${buyFid(p,'dispositivo')}" value="${escAttr(selected)}">
  </div>`;
}
function compraMarcaTvHtml(p){
  const opciones=[['samsung','Samsung'],['lg','LG'],['tcl','TCL'],['roku','Roku TV'],['otro','Otra']],selected=compraDraftVal(buyFid(p,'marcaTv')),otra=compraDraftVal(buyFid(p,'marcaTvOtra'));
  return `<div class="buy-dispositivo"><small class="buy-disp-label">¿En qué marca o sistema de TV usará IPTV?</small><div class="dispositivo-opts">${opciones.map(([v,l])=>`<button type="button" class="disp-opt ${selected===v?'on':''}" data-marca="${v}" onclick="setCompraMarcaTv('${p.id}','${v}',this);return false">📺 ${l}</button>`).join('')}</div><input type="hidden" id="${buyFid(p,'marcaTv')}" value="${escAttr(selected)}"><input class="comp-in" id="${buyFid(p,'marcaTvOtra')}" value="${escAttr(otra)}" placeholder="Especifique marca y modelo" style="display:${selected==='otro'?'block':'none'};margin-top:9px"></div>`;
}
function setCompraMarcaTv(pid,val,btn){const input=document.getElementById(`buy_marcaTv_${pid}`);if(input)input.value=val;btn?.parentElement?.querySelectorAll('.disp-opt').forEach(b=>b.classList.toggle('on',b.dataset.marca===val));const otro=document.getElementById(`buy_marcaTvOtra_${pid}`);if(otro)otro.style.display=val==='otro'?'block':'none'}
function setCompraDispositivo(pid,val){
  const input=document.getElementById(`buy_dispositivo_${pid}`); if(input)input.value=val;
  const wrap=input&&input.previousElementSibling; // .dispositivo-opts
  if(wrap)wrap.querySelectorAll('.disp-opt').forEach(b=>b.classList.toggle('on',b.dataset.disp===val));
}
function compraCampos(p){
  if(p.tipo==='perfil'){
    const base=`<div class="buy-grid2"><input class="comp-in" id="${buyFid(p,'perfilNombre')}" value="${escAttr(compraDraftVal(buyFid(p,'perfilNombre')))}" placeholder="Nombre del perfil"><input class="comp-in" id="${buyFid(p,'perfilApellido')}" value="${escAttr(compraDraftVal(buyFid(p,'perfilApellido')))}" placeholder="Apellido del perfil"></div>`;
    return p.pideDispositivo ? base+compraDispositivoHtml(p) : base;
  }
  // Gemini y Canva: invitación al correo + nombre del cliente.
  if(p.tipo==='correo')return `<input class="comp-in" id="${buyFid(p,'nombreCliente')}" value="${escAttr(compraDraftVal(buyFid(p,'nombreCliente')))}" placeholder="Nombre del cliente" style="margin-bottom:8px"><input class="comp-in" id="${buyFid(p,'correo')}" value="${escAttr(compraDraftVal(buyFid(p,'correo')))}" type="email" placeholder="Correo del cliente">`;
  if(p.tipo==='detalle')return `<input class="comp-in" id="${buyFid(p,'detalle')}" value="${escAttr(compraDraftVal(buyFid(p,'detalle')))}" placeholder="Detalle requerido: ID, número, plan o indicación del cliente">`;
  if(p.tipo==='acceso')return `${compraEsIptv(p)?compraMarcaTvHtml(p):''}<div class="buy-note"><b>Entrega:</b> este producto se entrega con acceso. Adjunte comprobante; use comentario si necesita dejar una indicación.</div>`;
  if(p.tipo==='serial_key')return `<div class="buy-note"><b>Entrega:</b> este producto se entrega con key / serial. El encargado lo entrega después de revisar el comprobante.</div>`;
  if(p.tipo==='serial')return `<div class="buy-note"><b>Entrega:</b> este producto se entrega con serial/licencia. El encargado lo entrega después de revisar el comprobante.</div>`;
  return '';
}
function compraOpcionesHtml(){
  const productos=compraProductosCatalogo();
  const grupos=[];
  productos.forEach(p=>{let item=grupos.find(x=>x.g===p.grupo);if(!item){item={g:p.grupo,items:[]};grupos.push(item)}item.items.push(p)});
  return grupos.map(gr=>`<div class="buy-group">${escHtml(gr.g)}</div>`+gr.items.map(x=>{
    const st=inventoryState(x), selected=compraSels.includes(x.id);
    return `<button class="buy-option ${selected?'on':''} ${!st.available?'is-out':''}" ${!st.available?'disabled':''} onclick="toggleCompraProducto('${x.id}');return false">
      <span class="bo-main"><span class="bo-emoji">${selected?'✅':x.emoji}</span><span><b>${escHtml(x.nombre)}</b><small>${escHtml(compraTipoTxt(x.tipo))}</small><em class="stock-badge ${st.key}">${escHtml(st.label)}</em></span></span>
      <span class="bo-price">${escHtml(x.precioTxt)}</span>
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
function compraDatosHtml(items){
  return items.map((p,i)=>`<div class="buy-product-box">
    <div class="buy-product-title"><span>${i+1}. ${p.emoji} ${p.nombre}</span><small>${p.precioTxt}</small></div>
    <div class="buy-product-help">${p.ayuda}</div>
    ${compraCampos(p)}
  </div>`).join('');
}
function vCompras(){
  if(socioSinCompras()){go('renovar');return}
  compraEnsureSel();if(!compraSels.length)compraPickerOpen=true;
  content.innerHTML=`<section class="operations-hero"><h2>Nueva compra</h2><p>Seleccione servicios, arme un combo y envíe el comprobante directamente al equipo.</p><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"></section><div id="compraForm"></div>`;
  renderCompraForm();
}
function renderCompraForm(){
  captureCompraDraft();
  const items=compraSeleccionados(), p=compraProducto(), m=compraMath();
  const el=document.getElementById('compraForm'); if(!el)return;
  const pickedNames=items.length?items.map(x=>`${x.emoji} ${x.nombre}`).join(' + '):'Toque aquí para elegir del catálogo';
  el.innerHTML=`
  ${misComprasHtml()}
  <button class="buy-picker-btn" onclick="toggleCompraPicker();return false">
    <span class="buy-picked"><span class="buy-emoji">🛒</span><span><span class="buy-name">${items.length>1?'Combo de '+items.length+' plataformas':p.nombre}</span><span class="buy-type">${pickedNames}</span></span></span>
    <span class="buy-arrow">${compraPickerOpen?'▲':'▼'}</span>
  </button>
  ${compraPickerOpen?`<div class="buy-list"><div class="buy-combo-tip">Seleccione las plataformas que necesite. Descuento automático: 2 = Lps. 10, 3 = Lps. 20, 4 = Lps. 30, 5 o más = Lps. 40 máximo.</div>${compraOpcionesHtml()}</div>`:''}
  <div class="card">
    <div class="card-h"><h2>Datos de la compra</h2><a onclick="go('precios')">Catálogo</a></div>
    <div class="buy-total-box">
      <b>${items.length>1?'Combo seleccionado':'Producto seleccionado'}</b>
      <span>${compraResumenTxt()}</span>
    </div>
    <div class="destino-seg"><button data-dest="sublicuentas" class="${compraDestino==='sublicuentas'?'on':''}" onclick="setCompraDestino('sublicuentas');return false">🟣 Sublicuentas</button><button data-dest="relojes" class="${compraDestino==='relojes'?'on':''}" onclick="setCompraDestino('relojes');return false">⌚ Relojes</button></div>
    ${compraDatosHtml(items)}
    <div class="buy-money-summary"><span>Total calculado</span><b>${money(m.total)}</b></div>
    <input class="comp-in" id="buyMonto" type="number" inputmode="decimal" placeholder="Monto realmente pagado a Sublicuentas" data-default-total="${m.total}" value="${escAttr(compraDraft.montoManual?compraDraft.monto:(m.total||''))}" oninput="markCompraMontoManual(this)">
    <div class="buy-monto-note ${compraDraft.montoManual?'warn':''}" id="buyMontoNote">${compraDraft.montoManual?'⚠️ Monto modificado manualmente':'Monto igual al total calculado'}</div>
    <textarea class="cobro-text" id="buyComentario" style="min-height:82px" placeholder="Comentario opcional: método de pago, urgencia o detalle del cliente…">${escHtml(compraDraft.comentario||'')}</textarea>
    <input type="file" id="buyFile" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" style="display:none" onchange="pickCompra(this)">
    <div class="comp-drop" id="buyDrop" onclick="document.getElementById('buyFile').click()">
      <div class="comp-ph" id="buyPh"><div class="ic">🖼️</div><span>Adjuntar comprobante desde archivos o galería</span><small style="display:block;margin-top:4px;color:#7890AA;font-weight:900">Seleccione la captura guardada, no cámara.</small></div>
      <img id="buyPrev" style="display:none" alt="">
    </div>
    <button class="act primary buy-submit" id="buyBtn" onclick="enviarCompra()" ${items.length?'':'disabled'}>${items.length?'Enviar compra':'Seleccione un producto'}</button>
    <div id="buyMsg" style="text-align:center;font-weight:900;font-size:13px;margin-top:10px;min-height:16px;font-family:var(--fn)"></div>
  </div>`;
  restoreCompraReceiptPreview();
}
async function pickCompra(input){
  const f=input.files&&input.files[0]; if(!f)return;
  const msg=document.getElementById('buyMsg'); msg.style.color='#6E8299'; msg.textContent='Procesando comprobante…';
  try{
    compraImg=await compressImage(f,1280,0.7);
    const prev=document.getElementById('buyPrev'), ph=document.getElementById('buyPh');
    prev.src=compraImg; prev.style.display='block'; ph.style.display='none'; msg.textContent='';
  }catch(e){ msg.style.color='#e54848'; msg.textContent='No pude leer la imagen del comprobante.'; }
}
async function enviarCompra(){
  const items=compraSeleccionados(), msg=document.getElementById('buyMsg'), m=compraMath();
  if(!items.length){compraPickerOpen=true;renderCompraForm();return}
  const val=id=>(document.getElementById(id)?.value||'').trim();
  const productos=[];
  for(const p of items){
    const perfilNombre=val(buyFid(p,'perfilNombre')), perfilApellido=val(buyFid(p,'perfilApellido')), correo=val(buyFid(p,'correo')), detalleServicio=val(buyFid(p,'detalle')), nombreCliente=val(buyFid(p,'nombreCliente')), dispositivo=val(buyFid(p,'dispositivo')), marcaTv=val(buyFid(p,'marcaTv')), marcaTvOtra=val(buyFid(p,'marcaTvOtra'));
    if(p.tipo==='perfil' && (!perfilNombre||!perfilApellido)){msg.style.color='#e54848';msg.textContent='Coloque nombre y apellido del perfil para '+p.nombre+'.';return}
    if(p.tipo==='perfil' && p.pideDispositivo && !dispositivo){msg.style.color='#e54848';msg.textContent='Elija en qué dispositivo va el perfil de '+p.nombre+'.';return}
    if(p.tipo==='correo' && !correo){msg.style.color='#e54848';msg.textContent='Coloque el correo para '+p.nombre+'.';return}
    if(p.tipo==='correo' && !nombreCliente){msg.style.color='#e54848';msg.textContent='Coloque el nombre del cliente para '+p.nombre+'.';return}
    if(p.tipo==='detalle' && !detalleServicio){msg.style.color='#e54848';msg.textContent='Coloque el detalle para '+p.nombre+'.';return}
    if(compraEsIptv(p) && !marcaTv){msg.style.color='#e54848';msg.textContent='Seleccione la marca o sistema del TV para '+p.nombre+'.';return}
    if(compraEsIptv(p) && marcaTv==='otro' && !marcaTvOtra){msg.style.color='#e54848';msg.textContent='Especifique la marca y modelo del TV.';return}
    productos.push({
      id:p.id, catalogId:p.catalogId, servicio:p.nombre, servicioBase:p.base, catalogCategory:p.categoria, catalogSub:p.sub, catalogDetalle:p.detalleCatalogo,
      precioCatalogo:p.precio, entregaTipo:p.tipo, entregaCanal:p.entregaCanal||'manual', perfilNombre, perfilApellido, correo, detalleServicio, nombreCliente, dispositivo, marcaTv:marcaTv==='otro'?marcaTvOtra:marcaTv
    });
  }
  if(!compraImg){msg.style.color='#e54848';msg.textContent='Adjunte el comprobante antes de enviar.';return}
  const montoReal=num(val('buyMonto')||m.total),montoModificado=Math.abs(montoReal-Number(m.total||0))>.001;
  let comentario=val('buyComentario');
  if(montoModificado){const nota=`Monto modificado manualmente: calculado ${money(m.total)} → pagado ${money(montoReal)}`;comentario=comentario?`${comentario} · ${nota}`:nota}
  const btn=document.getElementById('buyBtn'); btn.disabled=true; btn.textContent='Enviando…';
  try{
    const r=await API.call('/rev/compra',{method:'POST',body:JSON.stringify({
      destino:compraDestino,
      servicio:items.length>1?`Combo ${items.length} plataformas`:items[0].nombre,
      productos,
      comboCantidad:items.length,
      subtotalCatalogo:m.subtotal,
      descuentoCombo:m.descuento,
      totalCombo:m.total,
      monto:montoReal, montoCalculado:m.total, montoModificado,
      comentario, imagen:compraImg
    })});
    msg.style.color='#1aa15a'; msg.textContent='✅ Compra enviada a '+(r.destinoLabel||'Telegram')+'.';
    compraImg=''; compraSels=[]; compraPickerOpen=true;resetCompraDraft();
    loadMisCompras();
    setTimeout(()=>renderCompraForm(),900);
  }catch(e){
    msg.style.color='#e54848';
    const map={imagen_muy_grande:'La foto pesa mucho, probá otra.',falta_servicio:'Seleccione un servicio.',sin_permiso_comprar:'Su usuario no tiene permiso para registrar compras.'};
    msg.textContent=map[e&&e.error]||('No se pudo enviar la compra. '+((e&&e.detail)||(e&&e.error)||'Reintentá.'));
  }finally{btn.disabled=false;btn.textContent='Enviar compra'}
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
