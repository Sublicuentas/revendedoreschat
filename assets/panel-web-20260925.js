/* ========================================================================
   SUBLICUENTAS · PANEL DE SOCIOS WEB DESKTOP
   Implementación visual 25/09/2026
   - UI nueva, lógica existente.
   - No toca APK/Capacitor.
   - Reutiliza globals/endpoints del panel actual.
   ======================================================================== */

/* IMPORTANTE: este archivo implementa SOLO el rediseño WEB DE ESCRITORIO.
   En móvil/tablet (<900px) se conserva intacta la interfaz responsive original
   de app.css + core/operations/catalog-aula/messaging. */
const PANEL_WEB_DESKTOP = window.matchMedia('(min-width: 900px)').matches;
if (PANEL_WEB_DESKTOP) {

/* ---------- Navegación única ---------- */
const WEB_NAV_ITEMS = [
  {v:'inicio',label:'Inicio',tone:'blue',icon:'home'},
  {v:'clientes',label:'Clientes',tone:'purple',icon:'users'},
  {v:'precios',label:'Catálogo',tone:'orange',icon:'catalog'},
  {v:'compras',label:'Compras',tone:'cyan',icon:'cart'},
  {v:'renovar',label:'Renovación',tone:'blue',icon:'renew'},
  {v:'aula',label:'Subli Aula',tone:'amber',icon:'spark'},
  {v:'recompensas',label:'Recompensas',tone:'red',icon:'gift'},
  {v:'buzon',label:'Buzón',tone:'cyan',icon:'mail'},
  {v:'perfil',label:'Perfil',tone:'green',icon:'user'}
];
function webIcon(name){
  const paths={
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6"/><path d="M14 15c3.4-.5 5.8 1.4 6.5 4.5"/>',
    catalog:'<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    cart:'<path d="M3 5h2l2.1 9.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L20 8H6"/><circle cx="10" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    renew:'<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.3 8.4A7 7 0 0 1 18.8 7L20 12"/><path d="M17.7 15.6A7 7 0 0 1 5.2 17L4 12"/>',
    spark:'<path d="m12 3 1.2 3.2L16 7.5l-2.8 1.3L12 12l-1.2-3.2L8 7.5l2.8-1.3L12 3Z"/><path d="m6 13 .8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8L6 13Z"/><path d="m18 12 .7 1.8 1.8.7-1.8.7L18 17l-.7-1.8-1.8-.7 1.8-.7L18 12Z"/>',
    gift:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M3 9h18v4H3z"/><path d="M12 9H8.5a2.5 2.5 0 1 1 2.2-3.7L12 9Zm0 0h3.5a2.5 2.5 0 1 0-2.2-3.7L12 9Z"/>',
    mail:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="m5 7 7 6 7-6"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-4.4 3-6.5 7-6.5s6.4 2.1 7 6.5"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.catalog}</svg>`;
}
function renderUnifiedSidebar(){
  const nav=document.getElementById('nav');if(!nav)return;
  nav.innerHTML=`<div class="web-side-brand" onclick="go('inicio')" role="button" tabindex="0"><img src="${ROBOT_IMG}" alt="Sublicuentas"><div><b>SUBLICUENTAS</b><span>PANEL DE SOCIOS</span></div></div><div class="web-side-menu">${WEB_NAV_ITEMS.map(it=>`<button class="nav-btn ${current===it.v?'on':''}" data-v="${it.v}" onclick="go('${it.v}')"><span class="nav-ico web-nav-${it.tone}">${webIcon(it.icon)}</span><span>${it.label}</span>${it.v==='buzon'?'<span class="nav-badge" id="buzonBadge"></span>':''}</button>`).join('')}</div><div class="web-side-foot"><span>Conectado a Sublichat</span><i></i></div>`;
  try{applyNavPermissions();actualizarBadgeBuzon()}catch(_){ }
}
renderUnifiedSidebar();

/* Eliminar barra de impersonación sin perder el regreso a Administración. */
toggleImpBar = function(){
  const b=document.getElementById('impBar');if(b){b.className='hide';b.innerHTML='';}
  const top=document.querySelector('.topbar');if(!top)return;
  let back=document.getElementById('webAdminReturn');
  if(impersonating){
    if(!back){back=document.createElement('button');back.id='webAdminReturn';back.className='web-admin-return';back.onclick=volverAdmin;top.insertBefore(back,document.getElementById('syncBtn'));}
    back.textContent='← Administración';
  }else back?.remove();
};
renderTop = function(){
  if(typeof greet!=='undefined'&&greet)greet.textContent='Hola, '+revName();
  try{applySocioAvatar()}catch(_){ }
  renderUnifiedSidebar();
};

/* ---------- Helpers UI ---------- */
function webSkeleton(rows=4){return `<div class="web-skeleton">${Array.from({length:rows},(_,i)=>`<div class="web-sk-row"><i></i><span style="width:${58+(i%3)*12}%"></span></div>`).join('')}</div>`}
function webInitials(n){return String(n||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function webPageHero(type,title,subtitle,opts={}){
  return `<section class="web-page-hero web-hero-${type}"><div class="web-hero-copy">${opts.kicker?`<small>${escHtml(opts.kicker)}</small>`:''}<h2>${escHtml(title)}</h2><p>${escHtml(subtitle)}</p>${opts.action?`<button class="web-primary" onclick="${opts.action}">${opts.actionLabel||'Continuar'}</button>`:''}</div>${opts.mascot===false?'':`<img src="${ROBOT_IMG}" alt="Mascota Sublicuentas">`}</section>`;
}
function webKpi(icon,label,value,sub,tone='blue',onclick=''){
  return `<${onclick?'button':'div'} class="web-kpi web-kpi-${tone}" ${onclick?`onclick="${onclick}"`:''}><span class="web-kpi-icon">${icon}</span><div><small>${escHtml(label)}</small><b>${escHtml(String(value))}</b><em>${escHtml(sub||'')}</em></div></${onclick?'button':'div'}>`;
}
function webEmpty(icon,title,txt,action='',label=''){
  return `<div class="web-empty"><span>${icon}</span><b>${escHtml(title)}</b><p>${escHtml(txt)}</p>${action?`<button class="web-secondary" onclick="${action}">${escHtml(label||'Continuar')}</button>`:''}</div>`;
}
function webTsMs(v){if(!v)return 0;if(typeof v==='number')return v;if(v.toMillis)return v.toMillis();if(v._seconds||v.seconds)return Number(v._seconds||v.seconds)*1000;const n=new Date(v).getTime();return Number.isFinite(n)?n:0}
function webDateTime(v){const ms=webTsMs(v);return ms?new Date(ms).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}
function webStatusIcon(a){const t=norm(a?.tipo||'');if(/pedido|entreg/.test(t))return'📦';if(/promo/.test(t))return'🔥';if(/respuesta/.test(t))return'💬';if(/actual/.test(t))return'🔄';return'🔔'}
function webServiceState(s){return estado(parseFecha(pick(s,CONFIG.campos.vencimiento)))}
function webClientTemporal(c,filter){const es=(c.servicios||[]).map(webServiceState);if(filter==='vencidos')return es.some(e=>e.n<0);if(filter==='semana')return es.some(e=>e.n>=0&&e.n<=7);if(filter==='aldia')return es.some(e=>e.n>7&&e.n<9999);return true}

/* ---------- Catálogo verificado ---------- */
let webCatalogVerified=false, webCatalogError='';
loadPrecios = function(){
  return runSocioRequest('precios',async(epoch)=>{
    try{
      const data=await API.call('/rev/precios?_='+Date.now(),{cache:'no-store',timeoutMs:12000});
      if(epoch!==socioEpoch)return false;
      if(!Array.isArray(data)||!data.length)throw {error:'catalogo_vacio'};
      PRECIOS=mergeCatalogCategories(data);writeSocioCache('precios',PRECIOS);webCatalogVerified=true;webCatalogError='';
      if(current==='compras')vCompras();
      return true;
    }catch(e){
      if(epoch!==socioEpoch)return false;
      webCatalogVerified=false;webCatalogError=e?.error||'network';
      if(!syncAt.precios)PRECIOS=[];
      if(current==='precios')vPrecios();else if(current==='compras')vCompras();
      return false;
    }
  });
};
function webCatalogTrusted(){return webCatalogVerified||Number(syncAt.precios||0)>0}
function webCatalogOperational(){return webCatalogVerified}
copyCatalogPrice = function(btn){if(!webCatalogOperational())return alert('El catálogo todavía no está validado en vivo. Actualice antes de copiar un precio.');const txt=btn?.dataset?.copy||'';navigator.clipboard?.writeText(txt)};
buyFromCatalog = function(ix){
  if(socioSinCompras())return;if(!webCatalogOperational())return alert('Valide el catálogo en vivo antes de iniciar una compra.');
  const g=PRECIOS[Number(catalogCategoria)],it=g?.items?.[ix];if(!it)return;
  const nombre=it.s?`${it.n} · ${it.s}`:it.n,found=compraProductosCatalogo().find(p=>p.nombre===nombre);
  if(found){const st=inventoryState(found);if(!st.available)return alert('Este producto aparece agotado por el momento.');compraSels=[found.id];compraPickerOpen=false;webCompraStep=2;go('compras')}
};

/* ---------- Inicio ---------- */
vInicio = function(){
  const fs=flat(),vigentes=fs.filter(s=>esVigente(s.est)),vencidos=fs.filter(s=>s.est.n<0),semana=fs.filter(s=>s.est.n>=0&&s.est.n<=7),aldia=fs.filter(s=>s.est.n>7&&s.est.n<9999);
  const cliVigentes=clientes.filter(clienteTieneVigente).length,cartera=vigentes.reduce((a,s)=>a+(s.precio||0),0);
  const prox=groupRenewServices(fs.filter(s=>s.est.n>=0&&s.est.n<=30)).slice(0,5);
  const latest=[...avisos].sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,4);
  content.innerHTML=`
    ${webPageHero('home',`Hola, ${revName()} 👋`,'Venda, renueve y controle su negocio desde un solo lugar.',{kicker:'PANEL DE SOCIOS',action:socioSinCompras()?"go('renovar')":"go('compras')",actionLabel:socioSinCompras()?'Ver renovaciones':'＋ Nueva operación'})}
    <div class="web-kpi-grid web-kpi-four">
      ${webKpi('💼','Cartera vigente',money(cartera),`${cliVigentes} clientes vigentes`,'blue')}
      ${webKpi('⛔','Servicios vencidos',vencidos.length,`${uniqueClientCount(vencidos)} clientes`,'red',"openRenewFilter('vencidos')")}
      ${webKpi('⏰','Vencen esta semana',semana.length,`${money(semana.reduce((a,s)=>a+(s.precio||0),0))}`,'amber',"openRenewFilter('porvencer')")}
      ${webKpi('✅','Servicios al día',aldia.length,`${vigentes.length} servicios activos`,'green')}
    </div>
    <div class="web-motivation"><span>✨</span><b>${escHtml(motivacionDelDia())}</b></div>
    <div class="web-home-cols">
      <section class="web-panel-card"><header><div><small>BUZÓN</small><h3>Avisos recientes</h3></div><button onclick="go('buzon')">Ver todos</button></header>${latest.length?`<div class="web-feed">${latest.map(a=>`<button class="web-feed-row" onclick="go('buzon')"><span>${webStatusIcon(a)}</span><div><b>${escHtml(String(a.texto||'').slice(0,84))}${String(a.texto||'').length>84?'…':''}</b><small>${escHtml(a.autor||'Sublicuentas')} · hace ${tiempoDesde(a.ts||0)}</small></div><i>›</i></button>`).join('')}</div>`:webEmpty('📭','Sin avisos nuevos','Cuando el equipo publique una novedad aparecerá aquí.',"go('buzon')",'Abrir buzón')}</section>
      <section class="web-panel-card"><header><div><small>RENOVACIÓN</small><h3>Próximas renovaciones</h3></div><button onclick="go('renovar')">Ver todas</button></header>${prox.length?`<div class="web-feed">${prox.map((g,i)=>`<button class="web-feed-row" onclick="openRenewFilter('porvencer')"><span class="web-avatar-mini">${escHtml(webInitials(nombreCli(g.cliente)))}</span><div><b>${escHtml(nombreCli(g.cliente))}</b><small>${g.servicios.map(x=>x.nombre).slice(0,2).map(escHtml).join(' · ')}${g.servicios.length>2?' · +'+(g.servicios.length-2):''}</small></div><em class="pill ${g.est.c}">${escHtml(g.est.t)}</em></button>`).join('')}</div>`:webEmpty('✅','Sin renovaciones próximas','No hay servicios registrados para los próximos 30 días.')}</section>
    </div>`;
};

/* ---------- Clientes ---------- */
let webCliTemporal='todos';
vClientes = function(){
  const fs=flat(),semana=fs.filter(s=>s.est.n>=0&&s.est.n<=7),vencidos=fs.filter(s=>s.est.n<0),vigentes=fs.filter(s=>esVigente(s.est));
  const cliVig=clientes.filter(esClienteVigente).length,cliNoVig=clientes.filter(esClienteNoVigente).length;
  const cartera=vigentes.reduce((a,s)=>a+(s.precio||0),0),montoSemana=semana.reduce((a,s)=>a+(s.precio||0),0),montoVencido=vencidos.reduce((a,s)=>a+(s.precio||0),0);
  content.innerHTML=`
    ${webPageHero('clients','Clientes',socioGeisell()?'Consulte sus clientes y prepare mensajes de renovación en segundos.':'Consulte su cartera, encuentre cualquier cliente y envíe cobros en segundos.',{kicker:'CARTERA DE CLIENTES'})}
    <section class="web-summary-card"><header><h3>${socioGeisell()?'Resumen de renovaciones':'Resumen de cobros'}</h3><span>${fs.length} servicios</span></header><div class="web-summary-grid five">
      ${webKpi('👥','Vigentes',cliVig,'Clientes activos','green')}
      ${webKpi('🚫','Sin servicio vigente',cliNoVig,'Sin cuenta activa','gray')}
      ${webKpi('📅',socioGeisell()?'Renuevan esta semana':'Cobrar esta semana',semana.length,money(montoSemana),'cyan')}
      ${webKpi('⚠️','Vencidos',vencidos.length,money(montoVencido),'red')}
      ${webKpi('💼','Cartera vigente',money(cartera),`${vigentes.length} servicios`,'blue')}
    </div></section>
    <div class="web-toolbar clients-toolbar"><div class="web-segment" id="cliSeg">${[['todos','Todos',clientes.length],['vigentes','Vigentes',cliVig],['novigentes','Sin servicio vigente',cliNoVig]].map(([k,l,n])=>`<button class="${cliEstado===k?'on':''}" onclick="cliEstado='${k}';renderCli()">${l} <span>${n}</span></button>`).join('')}</div><div class="web-search"><span>⌕</span><input id="cliSearch" value="${escAttr(cliF||'')}" placeholder="Buscar cliente o teléfono" oninput="cliF=this.value;renderCli()"></div><select class="web-select" onchange="webCliTemporal=this.value;renderCli()"><option value="todos" ${webCliTemporal==='todos'?'selected':''}>Todos los estados</option><option value="vencidos" ${webCliTemporal==='vencidos'?'selected':''}>Con vencidos</option><option value="semana" ${webCliTemporal==='semana'?'selected':''}>Vencen en 7 días</option><option value="aldia" ${webCliTemporal==='aldia'?'selected':''}>Al día</option></select></div>
    <div id="cliList" class="web-client-list"></div>`;
  renderCli();
};
renderCli = function(){
  const f=norm(cliF);
  const list=clientes.filter(c=>{
    if(cliEstado==='vigentes'&&!esClienteVigente(c))return false;
    if(cliEstado==='novigentes'&&!esClienteNoVigente(c))return false;
    if(!webClientTemporal(c,webCliTemporal))return false;
    return !f||norm(nombreCli(c)).includes(f)||String(c.telefono||c.telefono_norm||'').includes(f);
  }).sort((a,b)=>norm(nombreCli(a)).localeCompare(norm(nombreCli(b))));
  const el=document.getElementById('cliList');if(!el)return;
  el.innerHTML=list.length?list.map(cliCard).join(''):webEmpty('🔎','Sin resultados','Pruebe otro nombre, teléfono o filtro.');
};
cliCard = function(c){
  const svcs=Array.isArray(c.servicios)?c.servicios:[],ec=estadoCliente(c),tel=c.telefono||c.telefono_norm||'';
  return `<article class="web-client-card" data-client-id="${escAttr(c.id||'')}"><div class="web-client-main"><span class="web-client-avatar">${escHtml(webInitials(nombreCli(c)))}</span><div><h3>${escHtml(nombreCli(c))}</h3><small>${escHtml(tel||'Sin teléfono')} · ${svcs.length} ${svcs.length===1?'servicio':'servicios'}</small></div><span class="web-client-state ${ec.c}">${escHtml(ec.t)}</span></div>${svcs.length?`<div class="web-services">${svcs.map((s,ix)=>svcRow(s,c.id,ix)).join('')}</div>`:''}<div class="web-client-actions"><button class="web-danger-soft" onclick='openCobro("${c.id}","")'>📣 ${escHtml(etiquetaMensajeRenovacion())}</button>${waBtn(c)}</div></article>`;
};
svcRow = function(s,cid,ix){
  const nm=pick(s,CONFIG.campos.servicio)||'Servicio',f=parseFecha(pick(s,CONFIG.campos.vencimiento)),e=estado(f);
  const original=Number(s?.servicioIndexOriginal??s?._servicioIndexOriginal??ix),safeIx=Number.isInteger(original)?original:ix;
  return `<div class="web-service-row"><div><span class="dot-s ${e.c}"></span><div><b>${escHtml(nm)}</b><small>${f?`Vence ${escHtml(fmtFecha(f))}`:'Sin fecha de vencimiento'}</small></div></div><span class="pill ${e.c}">${escHtml(e.t)}</span><button onclick='openComprobante("${cid}","${enc(nm)}",${safeIx});event.stopPropagation()'>Renovar</button></div>`;
};

/* ---------- Catálogo ---------- */
function webCatalogTone(i){return ['purple','green','orange','blue','pink','slate','violet'][i%7]}
function webDeliveryMeta(it={}){const c=String(it.entregaCanal||'manual').toLowerCase();return ({bot_tg:['🤖','Bot / código'],inventario:['⚡','Inventario Sublichat'],invitacion:['✉️','Invitación'],iptv:['📡','TV Digital / IPTV'],manual:['🧑‍💻','Entrega por equipo']})[c]||['🧑‍💻','Entrega por equipo']}
function webDetailLines(it){
  const raw=String(it?.d||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const iconize=x=>{/^[\p{Extended_Pictographic}]/u.test(x)?null:null;let icon='ℹ️';const n=norm(x);if(/perfil/.test(n))icon='👤';else if(/disposit/.test(n))icon='📱';else if(/codigo|pin/.test(n))icon='🔐';else if(/garanti/.test(n))icon='🛡️';else if(/correo/.test(n))icon='📧';else if(/usuario|clave|contrasena/.test(n))icon='🔑';else if(/prueba/.test(n))icon='🎁';else if(/android|web|tv/.test(n))icon='📺';else if(/serial|licencia|key/.test(n))icon='🔑';return /^[^\p{L}\p{N}]/u.test(x)?x:`${icon} ${x}`};
  const meta=webDeliveryMeta(it);const out=raw.map(iconize);if(it?.entregaCanal&&it.entregaCanal!=='manual')out.push(`${meta[0]} ${meta[1]}`);return [...new Set(out)];
}
vPrecios = function(){
  const restricted=socioSinCompras(),trusted=webCatalogTrusted();
  if(!trusted){content.innerHTML=`${webPageHero('catalog','Catálogo','Aplicaciones, servicios y herramientas al precio mayorista.',{kicker:'CATÁLOGO DE SOCIOS'})}<section class="web-panel-card">${webCatalogError?webEmpty('⚠️','No pude validar el catálogo','No se mostrarán precios de respaldo. Reintente para consultar la fuente real.',"loadPrecios()",'Reintentar'):webSkeleton(6)}</section>`;return;}
  const me=gamificacion.perfil||{ventas:0,nivel:'Sin nivel'},ventas=Number(me.ventas||0),nivel=me.nivel||'Sin nivel';
  const catMs=Number(gamificacion.catalogoActualizadoAt||syncAt.precios||0),catTxt=catMs?new Date(catMs).toLocaleString('es-HN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'ahora';
  const warning=!webCatalogOperational()?`<div class="web-stale-warning">⚠️ Está viendo la última copia validada de esta sesión. Actualice para habilitar compra y copiar precio.</div>`:'';
  if(catalogCategoria!==''&&PRECIOS[Number(catalogCategoria)]){
    const ix=Number(catalogCategoria),g=PRECIOS[ix],ico=catalogIcon(g.cat,ix);
    const apps=(g.items||[]).map((it,i)=>{const invItem={catalogId:it.id||'',id:it.id||'',nombre:it.n,base:it.n},stock=inventoryState(invItem),copy=String(`${it.n}${it.s?' · '+it.s:''} · ${it.p==null?'Por comisión':'Lps. '+it.p}`),lines=webDetailLines(it),meta=webDeliveryMeta(it),can=webCatalogOperational();return `<article class="web-product-card ${!stock.available?'is-out':''}"><div class="web-product-head"><span class="web-product-logo tone-${webCatalogTone(i)}">${compraEmoji(it.n,g.cat)}</span><div><h3>${escHtml(it.n)}</h3><p>${escHtml(it.s||g.sub||'Servicio disponible')}</p><span class="stock-badge ${stock.key}">${escHtml(stock.label)}</span></div><strong>${it.p==null?'Por comisión':'Lps. '+Number(it.p).toLocaleString('es-HN')}</strong></div><div class="web-product-facts">${lines.slice(0,6).map(x=>`<span>${escHtml(x)}</span>`).join('')}</div><div class="web-product-meta"><span>${meta[0]} ${escHtml(meta[1])}</span>${it.entregaTipo?`<span>📋 ${escHtml(compraTipoTxt(it.entregaTipo))}</span>`:''}</div><div class="web-product-actions">${restricted?'':`<button class="web-primary" ${!can||!stock.available?'disabled':''} onclick="buyFromCatalog(${i})">${stock.available?'🛒 Nueva compra':'⛔ Agotado'}</button>`}<button class="web-secondary" ${!can?'disabled':''} data-copy="${escAttr(copy)}" onclick="copyCatalogPrice(this)">📋 Copiar precio</button></div></article>`}).join('');
    content.innerHTML=`<div class="web-detail-top"><button class="web-back" onclick="closeCatalogCategory()">← Categorías</button><div><small>CATÁLOGO</small><h2>${escHtml(g.cat)}</h2><p>${escHtml(g.sub||`${g.items.length} productos disponibles`)}</p></div><span class="web-cat-bigicon">${ico}</span></div>${warning}<div class="web-catalog-date">● Catálogo actualizado · ${catTxt}</div><div class="web-products-grid">${apps}</div>`;return;
  }
  const categorias=PRECIOS.map((g,i)=>`<button class="web-category tone-${webCatalogTone(i)}" onclick="openCatalogCategory(${i})"><span>${catalogIcon(g.cat,i)}</span><div><b>${escHtml(g.cat)}</b><small>${g.items.length} producto${g.items.length===1?'':'s'}${g.sub?' · '+escHtml(g.sub):''}</small></div><i>›</i></button>`).join('');
  const next=ventas<1?1:ventas<10?10:ventas<26?26:26,progress=ventas>=26?100:Math.min(100,Math.round((ventas/next)*100));
  content.innerHTML=`<div class="web-catalog-landing"><section class="web-catalog-hero"><div><small>CATÁLOGO MAYORISTA</small><h2>Todo lo que necesita para hacer crecer su negocio</h2><p>Aplicaciones, servicios y herramientas al precio mayorista.</p></div><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"></section>${restricted?'':`<aside class="web-level-mini"><span>🎁</span><small>NIVEL DE SOCIO</small><h3>${escHtml(nivel)}</h3><p>${ventas} ventas registradas</p><div class="web-progress"><i style="width:${progress}%"></i></div><button onclick="go('recompensas')">Mis recompensas →</button></aside>`}</div>${warning}<div class="web-catalog-date">● Catálogo actualizado · ${catTxt}</div><div class="web-section-title"><div><small>EXPLORAR</small><h3>Categorías</h3></div><span>${PRECIOS.length} secciones</span></div><div class="web-category-grid">${categorias}</div>${politicasHTML()}`;
};

/* ---------- Compras: 3 pasos ---------- */
let webCompraStep=1,webCompraSearch='',webCompraCat='todas',webCompraRequestId='';
function webPurchaseRequestId(){if(!webCompraRequestId)webCompraRequestId=(globalThis.crypto?.randomUUID?.()||`web-${Date.now()}-${Math.random().toString(36).slice(2,10)}`);return webCompraRequestId}
function webSetCompraStep(step){captureCompraDraft();if(step>1&&!compraSeleccionados().length)return;webCompraStep=Math.max(1,Math.min(3,step));renderCompraForm();window.scrollTo({top:0,behavior:'smooth'})}
function webCompraList(){const q=norm(webCompraSearch),cat=norm(webCompraCat);return compraProductosCatalogo().filter(p=>(cat==='todas'||norm(p.categoria)===cat)&&(!q||norm(`${p.nombre} ${p.categoria}`).includes(q)))}
function webCompraCart(items,m){return `<aside class="web-cart"><header><span>🛍️</span><div><small>RESUMEN DE COMPRA</small><h3>${items.length?`${items.length} producto${items.length===1?'':'s'}`:'Su carrito está vacío'}</h3></div></header>${items.length?`<div class="web-cart-items">${items.map(p=>`<div><span>${p.emoji}</span><b>${escHtml(p.nombre)}</b><em>${escHtml(p.precioTxt)}</em></div>`).join('')}</div>`:`<div class="web-cart-empty">Seleccione uno o más productos del catálogo para continuar.</div>`}<dl><div><dt>Subtotal</dt><dd>${money(m.subtotal)}</dd></div><div class="discount"><dt>Descuento</dt><dd>-${money(m.descuento)}</dd></div><div class="total"><dt>Total</dt><dd>${money(m.total)}</dd></div></dl>${webCompraStep===1?`<button class="web-primary full" ${items.length?'':'disabled'} onclick="webSetCompraStep(2)">Continuar compra →</button>`:''}</aside>`}
vCompras = function(){
  if(socioSinCompras()){go('renovar');return}
  if(!webCatalogTrusted()){content.innerHTML=`${webPageHero('buy','Compras','Seleccione servicios, complete los datos y envíe el comprobante.',{kicker:'NUEVA COMPRA'})}<section class="web-panel-card">${webCatalogError?webEmpty('⚠️','No pude validar el catálogo','Las compras quedan bloqueadas hasta consultar precios y disponibilidad reales.',"loadPrecios()",'Reintentar'):webSkeleton(6)}</section>`;return}
  content.innerHTML=`${webPageHero('buy','Compras','Seleccione servicios, arme un combo y envíe el comprobante directamente al equipo.',{kicker:'COMPRA SERVICIOS Y ACTIVE AL INSTANTE'})}<div class="web-stepper"><div class="${webCompraStep>=1?'on':''}"><b>1</b><span>Seleccione productos</span></div><i></i><div class="${webCompraStep>=2?'on':''}"><b>2</b><span>Complete los datos</span></div><i></i><div class="${webCompraStep>=3?'on':''}"><b>3</b><span>Envíe el comprobante</span></div></div><div id="compraForm"></div>`;renderCompraForm();
};
renderCompraForm = function(){
  captureCompraDraft();const items=compraSeleccionados(),m=compraMath(),host=document.getElementById('compraForm');if(!host)return;
  if(!webCatalogOperational()){host.innerHTML=`<div class="web-stale-warning">⚠️ Para registrar una compra debe validar el catálogo en vivo. <button onclick="loadPrecios()">Actualizar ahora</button></div>${webCompraCart(items,m)}`;return}
  if(webCompraStep===1){
    const cats=['todas',...new Set(compraProductosCatalogo().map(p=>p.categoria))],list=webCompraList();
    host.innerHTML=`${misComprasHtml()}<div class="web-buy-layout"><section class="web-buy-products"><div class="web-buy-tools"><div class="web-search"><span>⌕</span><input placeholder="Buscar producto…" value="${escAttr(webCompraSearch)}" oninput="webCompraSearch=this.value;renderCompraForm()"></div><select class="web-select" onchange="webCompraCat=this.value;renderCompraForm()">${cats.map(c=>`<option value="${escAttr(c)}" ${webCompraCat===c?'selected':''}>${c==='todas'?'Todas las categorías':escHtml(c)}</option>`).join('')}</select></div><div class="web-buy-grid">${list.length?list.map(p=>{const st=inventoryState(p),sel=compraSels.includes(p.id);return `<button class="web-buy-product ${sel?'selected':''} ${!st.available?'disabled':''}" ${!st.available?'disabled':''} onclick="toggleCompraProducto('${p.id}');return false"><span class="web-buy-appicon">${sel?'✓':p.emoji}</span><div><b>${escHtml(p.nombre)}</b><small>${escHtml(p.categoria)}</small><em class="stock-badge ${st.key}">${escHtml(st.label)}</em></div><strong>${escHtml(p.precioTxt)}</strong><i>${sel?'Quitar':'Agregar'}</i></button>`}).join(''):webEmpty('🔎','Sin productos','Pruebe otra búsqueda o categoría.')}</div></section>${webCompraCart(items,m)}</div>`;
  }else if(webCompraStep===2){
    host.innerHTML=`<div class="web-buy-layout"><section class="web-panel-card web-buy-data"><header><div><small>PASO 2</small><h3>Datos de la compra</h3></div><button class="web-secondary" onclick="webSetCompraStep(1)">← Productos</button></header><div class="web-destination"><b>¿Quién procesa la operación?</b><div class="destino-seg"><button data-dest="sublicuentas" class="${compraDestino==='sublicuentas'?'on':''}" onclick="setCompraDestino('sublicuentas');return false">Sublicuentas</button><button data-dest="relojes" class="${compraDestino==='relojes'?'on':''}" onclick="setCompraDestino('relojes');return false">Relojes</button></div></div>${compraDatosHtml(items)}<div class="web-pay-box"><div class="buy-money-summary"><span>Total calculado</span><b>${money(m.total)}</b></div><label>Monto realmente pagado</label><input class="comp-in" id="buyMonto" type="number" inputmode="decimal" data-default-total="${m.total}" value="${escAttr(compraDraft.montoManual?compraDraft.monto:(m.total||''))}" oninput="markCompraMontoManual(this)"><div class="buy-monto-note ${compraDraft.montoManual?'warn':''}" id="buyMontoNote">${compraDraft.montoManual?'⚠️ Monto modificado manualmente':'Monto igual al total calculado'}</div><label>Comentario opcional</label><textarea class="cobro-text" id="buyComentario" placeholder="Método de pago, urgencia o detalle del cliente…">${escHtml(compraDraft.comentario||'')}</textarea></div><div class="web-form-actions"><button class="web-secondary" onclick="webSetCompraStep(1)">Volver</button><button class="web-primary" onclick="webSetCompraStep(3)">Continuar al comprobante →</button></div></section>${webCompraCart(items,m)}</div>`;
  }else{
    host.innerHTML=`<div class="web-buy-layout"><section class="web-panel-card web-buy-final"><header><div><small>PASO 3</small><h3>Envíe el comprobante</h3></div><button class="web-secondary" onclick="webSetCompraStep(2)">← Datos</button></header><div class="web-final-summary">${items.map(p=>`<div><span>${p.emoji}</span><b>${escHtml(p.nombre)}</b><em>${escHtml(p.precioTxt)}</em></div>`).join('')}</div><input type="file" id="buyFile" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" style="display:none" onchange="pickCompra(this)"><div class="comp-drop" id="buyDrop" onclick="document.getElementById('buyFile').click()"><div class="comp-ph" id="buyPh"><div class="ic">🖼️</div><span>Adjuntar comprobante desde archivos o galería</span><small>Seleccione una captura guardada; no se obliga cámara.</small></div><img id="buyPrev" style="display:none" alt="Comprobante"></div><div class="web-form-actions"><button class="web-secondary" onclick="webSetCompraStep(2)">Volver</button><button class="web-primary" id="buyBtn" onclick="enviarCompra()">Enviar compra</button></div><div id="buyMsg" class="web-form-msg"></div></section>${webCompraCart(items,m)}</div>`;restoreCompraReceiptPreview();
  }
};
function webBuyVal(id){const el=document.getElementById(id);if(el)return String(el.value||'').trim();return String(compraDraft.fields?.[id]??'').trim()}
enviarCompra = async function(){
  captureCompraDraft();const items=compraSeleccionados(),msg=document.getElementById('buyMsg'),m=compraMath();if(!items.length){webCompraStep=1;renderCompraForm();return}if(!webCatalogOperational()){if(msg){msg.textContent='Actualice el catálogo antes de enviar.';msg.className='web-form-msg error'}return}
  const productos=[];for(const p of items){const perfilNombre=webBuyVal(buyFid(p,'perfilNombre')),perfilApellido=webBuyVal(buyFid(p,'perfilApellido')),correo=webBuyVal(buyFid(p,'correo')),detalleServicio=webBuyVal(buyFid(p,'detalle')),nombreCliente=webBuyVal(buyFid(p,'nombreCliente')),dispositivo=webBuyVal(buyFid(p,'dispositivo')),marcaTv=webBuyVal(buyFid(p,'marcaTv')),marcaTvOtra=webBuyVal(buyFid(p,'marcaTvOtra'));
    if(p.tipo==='perfil'&&(!perfilNombre||!perfilApellido)){webCompraStep=2;renderCompraForm();alert('Coloque nombre y apellido del perfil para '+p.nombre+'.');return}if(p.tipo==='perfil'&&p.pideDispositivo&&!dispositivo){webCompraStep=2;renderCompraForm();alert('Elija el dispositivo para '+p.nombre+'.');return}if(p.tipo==='correo'&&!correo){webCompraStep=2;renderCompraForm();alert('Coloque el correo para '+p.nombre+'.');return}if(p.tipo==='correo'&&!nombreCliente){webCompraStep=2;renderCompraForm();alert('Coloque el nombre del cliente para '+p.nombre+'.');return}if(p.tipo==='detalle'&&!detalleServicio){webCompraStep=2;renderCompraForm();alert('Coloque el detalle para '+p.nombre+'.');return}if(compraEsIptv(p)&&!marcaTv){webCompraStep=2;renderCompraForm();alert('Seleccione la marca o sistema del TV para '+p.nombre+'.');return}if(compraEsIptv(p)&&marcaTv==='otro'&&!marcaTvOtra){webCompraStep=2;renderCompraForm();alert('Especifique la marca y modelo del TV.');return}
    productos.push({id:p.id,catalogId:p.catalogId,servicio:p.nombre,servicioBase:p.base,catalogCategory:p.categoria,catalogSub:p.sub,catalogDetalle:p.detalleCatalogo,precioCatalogo:p.precio,entregaTipo:p.tipo,entregaCanal:p.entregaCanal||'manual',perfilNombre,perfilApellido,correo,detalleServicio,nombreCliente,dispositivo,marcaTv:marcaTv==='otro'?marcaTvOtra:marcaTv});}
  if(!compraImg){if(msg){msg.textContent='Adjunte el comprobante antes de enviar.';msg.className='web-form-msg error'}return}
  const montoReal=num(compraDraft.monto||m.total),montoModificado=Math.abs(montoReal-Number(m.total||0))>.001;let comentario=String(compraDraft.comentario||'').trim();if(montoModificado){const nota=`Monto modificado manualmente: calculado ${money(m.total)} → pagado ${money(montoReal)}`;comentario=comentario?`${comentario} · ${nota}`:nota}
  const btn=document.getElementById('buyBtn');if(btn){btn.disabled=true;btn.textContent='Enviando…'}
  try{const r=await API.call('/rev/compra',{method:'POST',body:JSON.stringify({requestId:webPurchaseRequestId(),destino:compraDestino,servicio:items.length>1?`Combo ${items.length} plataformas`:items[0].nombre,productos,comboCantidad:items.length,subtotalCatalogo:m.subtotal,descuentoCombo:m.descuento,totalCombo:m.total,monto:montoReal,montoCalculado:m.total,montoModificado,comentario,imagen:compraImg})});if(msg){msg.textContent=(r.duplicate?'✅ La compra ya estaba registrada. ':'✅ Compra enviada a ')+(r.duplicate?'No se duplicó.':(r.destinoLabel||'equipo')+'.');msg.className='web-form-msg ok'}compraImg='';compraSels=[];compraPickerOpen=true;resetCompraDraft();webCompraRequestId='';webCompraStep=1;markSyncStale(['compras','inventario','metricas']);await Promise.allSettled([loadMisCompras(),loadInventario(),loadMetricas()]);setTimeout(()=>{if(current==='compras')vCompras()},850)}catch(e){if(msg){msg.textContent='No se pudo enviar la compra. '+((e&&e.detail)||(e&&e.error)||'Reintente.');msg.className='web-form-msg error'}}finally{if(btn){btn.disabled=false;btn.textContent='Enviar compra'}}
};

/* ---------- Renovación ---------- */
let webRenSearch='',webRenDate='';
vRenovar = function(){
  const fs=flat().filter(s=>s.est.n<9999),expired=fs.filter(s=>s.est.n<0),today=fs.filter(s=>s.est.n===0),week=fs.filter(s=>s.est.n>=0&&s.est.n<=7),recover=uniqueClientCount(expired);
  content.innerHTML=`${webPageHero('renew','Renovación','Una sola tarjeta por cliente y fecha. Si tiene varias cuentas, usted elige cuáles renovar.',{kicker:'CONTROL DE RENOVACIONES'})}<div class="web-kpi-grid web-kpi-four">${webKpi('⚠️','Vencidas',expired.length,`${uniqueClientCount(expired)} clientes`,'red',"renF='vencidos';renderRen()")}${webKpi('📅','Pago hoy',today.length,`${uniqueClientCount(today)} clientes`,'pink',"renF='hoy';renderRen()")}${webKpi('⏰','Próximos 7 días',week.length,`${uniqueClientCount(week)} clientes`,'amber',"renF='porvencer';renderRen()")}${webKpi('↻','Por recuperar',recover,'Clientes con vencidos','blue',"renF='vencidos';renderRen()")}</div><div class="web-toolbar renew-toolbar"><div class="web-segment">${[['todos','Todos'],['vencidos','Vencidos'],['hoy','Pago hoy'],['porvencer','Por vencer']].map(([k,l])=>`<button class="${renF===k?'on':''}" onclick="renF='${k}';renderRen()">${l}</button>`).join('')}</div><div class="web-search"><span>⌕</span><input value="${escAttr(webRenSearch)}" placeholder="Buscar cliente o teléfono" oninput="webRenSearch=this.value;renderRen()"></div><input class="web-date" type="date" value="${escAttr(webRenDate)}" onchange="webRenDate=this.value;renderRen()"></div><div id="renList" class="web-renew-grid"></div>`;renderRen();
};
function webViewClient(id){const c=clientes.find(x=>String(x.id)===String(id));cliEstado='todos';webCliTemporal='todos';cliF=c?nombreCli(c):'';go('clientes');setTimeout(()=>document.querySelector(`[data-client-id="${CSS.escape(String(id))}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),80)}
renderRen = function(){
  let fs=flat().filter(s=>s.est.n<9999);if(renF==='vencidos')fs=fs.filter(s=>s.est.n<0);if(renF==='hoy')fs=fs.filter(s=>s.est.n===0);if(renF==='porvencer')fs=fs.filter(s=>s.est.n>=0&&s.est.n<=7);
  const q=norm(webRenSearch);if(q)fs=fs.filter(s=>norm(nombreCli(s.cliente)).includes(q)||String(s.cliente.telefono||s.cliente.telefono_norm||'').includes(q));if(webRenDate)fs=fs.filter(s=>renewDateKey(s.fecha)===webRenDate);
  renewGroups=groupRenewServices(fs);const host=document.getElementById('renList');if(!host)return;
  host.innerHTML=renewGroups.length?renewGroups.map((g,i)=>`<article class="web-renew-card"><div class="web-renew-top"><span class="web-client-avatar">${escHtml(webInitials(nombreCli(g.cliente)))}</span><div><h3>${escHtml(nombreCli(g.cliente))}</h3><small>${escHtml(g.cliente.telefono||g.cliente.telefono_norm||'Sin teléfono')} · ${g.fecha?`Renueva ${escHtml(fmtFecha(g.fecha))}`:'Sin fecha'}</small></div><span class="pill ${g.est.c}">${escHtml(g.est.t)}</span></div><div class="web-renew-services">${g.servicios.map(s=>`<span>${escHtml(s.nombre)}</span>`).join('')}</div><div class="web-renew-actions"><button class="web-danger-soft" onclick="openCobroRenewGroup(${i})">📣 ${escHtml(etiquetaMensajeRenovacion())}</button><button class="web-secondary" onclick="openRenewGroup(${i})">🔄 ${g.servicios.length>1?'Elegir qué renovar':'Renovar'}</button><button class="web-link" onclick="webViewClient('${escAttr(g.cliente.id)}')">Ver ficha →</button></div></article>`).join(''):webEmpty('✅','Todo en orden','No hay renovaciones que coincidan con este filtro.');
};

/* ---------- Aula ---------- */
function webCourseCard(id,icon,title,text,done){return `<article class="web-course ${done?'done':''}"><span>${icon}</span><div><h3>${escHtml(title)}</h3><p>${escHtml(text)}</p><button ${done?'disabled':''} onclick="completarCurso('${id}',this)">${done?'✓ Completado':'Marcar completado'}</button></div></article>`}
vAula = async function(){
  if(CONFIG.academiaUrl){content.innerHTML=`<div class="scr-title">Subli Aula</div><div class="aula-wrap"><iframe src="${escAttr(CONFIG.academiaUrl)}" allow="fullscreen"></iframe></div>`;return}
  if(!gamificacion?.perfil){content.innerHTML=webSkeleton(7);await loadGamificacion();if(current!=='aula')return}
  const plantillas=askPlantillas(),me=gamificacion.perfil||{},done=new Set(Array.isArray(me.cursosCompletados)?me.cursosCompletados:[]);
  content.innerHTML=`${webPageHero('aula','Subli Aula','Aprenda, complete cursos, gane score e impulse sus ventas con ayuda de Subli IA.',{kicker:'CENTRO DE CRECIMIENTO'})}<section class="web-ai-box"><header><span>✨</span><div><small>ASISTENTE IA</small><h3>¿Qué mensaje necesita?</h3></div></header><p>Escriba qué necesita: cobrar, vender, responder una falla, cerrar una venta o preparar una bienvenida.</p><textarea id="aiPrompt" placeholder="Ej.: mensaje breve para cobrar una renovación, trato de usted"></textarea><div class="chip-row"><button onclick="aiQuick('Mensaje amable para cobrar una renovación, trato de usted, corto')">💰 Cobro</button><button onclick="aiQuick('Mensaje para cerrar una venta de IPTV ya mismo, trato de usted')">🔥 Cierre</button><button onclick="aiQuick('Respuesta para una falla técnica pidiendo captura y dispositivo')">🛠️ Falla</button><button onclick="aiQuick('Mensaje de bienvenida para un cliente nuevo con reglas de uso')">🤝 Bienvenida</button><button onclick="aiQuick('Mensaje para ofrecer un combo de plataformas y que pague mejor')">🎁 Combo</button></div><button class="web-primary" onclick="aiGenerar(event)">Generar mensaje →</button><div class="ai-result" id="aiResult" style="display:none"><textarea id="aiOut" readonly></textarea><div class="cobro-actions"><button class="web-secondary" onclick="aiOtra(event)">🎲 Otra</button><button class="web-primary" onclick="aiCopy(event)">Copiar</button></div></div></section><div class="web-section-title"><div><small>ASK SUBLICUENTAS</small><h3>Respuestas listas para vender y atender</h3></div></div><div class="web-ask-grid">${plantillas.map((p,ix)=>`<article><span>${p.i}</span><div><h3>${escHtml(p.t)}</h3><p id="askp_${ix}">${escHtml(p.m)}</p><div><button onclick='copyAskId("askp_${ix}",event)'>Copiar</button><button onclick='iaVarianteId("askp_${ix}",event)'>✨ IA</button></div></div></article>`).join('')}</div><div class="web-section-title"><div><small>ENTRENAMIENTO</small><h3>Centro de entrenamiento</h3></div><span>${Number(me.cursos||done.size||0)} completados</span></div><div class="web-course-grid">${webCourseCard('atencion','💬','Atención al cliente','Responda corto, claro y siempre de usted. Confirme el dispositivo antes de vender IPTV.',done.has('atencion'))}${webCourseCard('renovaciones','🔔','Renovaciones','Cobre antes del vencimiento y adapte el tono según la urgencia.',done.has('renovaciones'))}${webCourseCard('instalaciones','📲','Instalaciones','Pida marca/modelo, guíe por pasos y solicite captura cuando aparezca un error.',done.has('instalaciones'))}${webCourseCard('entregas','🧾','Reglas de entrega','Respete dispositivos, perfil, PIN y condiciones definidas en la ficha del producto.',done.has('entregas'))}</div>`;
};

/* ---------- Recompensas ---------- */
function webRewardVisual(name){const n=norm(name);if(/descuento/.test(n))return['🎟️','Descuento especial'];if(/gemini/.test(n))return['✨','Gemini Pro'];if(/netflix/.test(n))return['N','Netflix'];if(/hbo|max/.test(n))return['🎬','Streaming'];if(/disney/.test(n))return['🏰','Disney'];if(/canva/.test(n))return['🎨','Canva'];if(/prime/.test(n))return['▶️','Prime Video'];if(/duolingo/.test(n))return['🦉','Duolingo'];if(/crunchy/.test(n))return['🍥','Crunchyroll'];return['🎁','Recompensa']}
vRecompensas = async function(){
  content.innerHTML=webSkeleton(6);await loadGamificacion();if(current!=='recompensas')return;
  const me=gamificacion.perfil||{nivel:'Sin nivel',ventas:0},opts=gamificacion.recompensas||[],claims=[...(gamificacion.solicitudes||[])].sort((a,b)=>webTsMs(b.createdAt)-webTsMs(a.createdAt));
  const next=me.ventas<1?1:me.ventas<10?10:me.ventas<26?26:26,progress=me.ventas>=26?100:Math.min(100,Math.round((me.ventas/next)*100));
  content.innerHTML=`<section class="web-reward-hero"><div><small>CLUB DE SOCIOS</small><h2>Recompensas</h2><p>Nivel ${escHtml(me.nivel||'Sin nivel')} · ${Number(me.ventas||0)} ventas registradas</p></div><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"><span class="web-gift-art">🎁</span></section><section class="web-panel-card web-reward-progress"><header><div><small>PROGRESO DEL NIVEL</small><h3>${me.ventas>=26?'Nivel máximo alcanzado':`${Number(me.ventas||0)} de ${next} ventas`}</h3></div><b>${progress}%</b></header><div class="web-progress"><i style="width:${progress}%"></i></div></section><div class="web-section-title"><div><small>BENEFICIOS</small><h3>Escoja una recompensa</h3></div><span>Una por nivel</span></div>${opts.length?`<div class="web-reward-grid">${opts.map(o=>{const [ic,sub]=webRewardVisual(o.nombre);return `<article><span class="web-reward-icon">${ic}</span><div><small>${escHtml(sub)}</small><h3>${escHtml(o.nombre||'Recompensa')}</h3><p>Disponible para su nivel actual, sujeto a disponibilidad y validación del equipo.</p></div><button data-reward-id="${escAttr(o.id||'')}" onclick="claimReward(this.dataset.rewardId,this)">Seleccionar →</button></article>`}).join('')}</div>`:webEmpty('🔒','Aún sin recompensa','Complete su primera venta para alcanzar Diamante.')}<section class="web-panel-card web-claims"><header><div><small>HISTORIAL</small><h3>Mis solicitudes</h3></div></header>${claims.length?claims.map(c=>`<div class="web-claim-row"><span>${webRewardVisual(c.recompensa)[0]}</span><div><b>${escHtml(c.recompensa||'Recompensa')}</b><small>${escHtml(c.nivel||'')} · ${webDateTime(c.createdAt)}</small></div><em class="status-${norm(c.estado||'pendiente')}">${escHtml(c.estado||'pendiente')}</em></div>`).join(''):webEmpty('📭','Sin solicitudes','Cuando solicite una recompensa aparecerá aquí con su estado real.')}</section>`;
};

/* ---------- Buzón ---------- */
let webBuzonHistoryOpen=false,webBuzonFocus='',webSugerencias=[],webSugLoading=false,webSugLoaded=false;
function webBuzonKey(){return `buzon_read_ids_${socioCacheId()}`}
function webReadIds(){try{const local=JSON.parse(st('get',webBuzonKey())||'[]');const server=(avisos||[]).filter(a=>a?.leido).map((a,i)=>webMsgId(a,i));return new Set([...(Array.isArray(local)?local:[]),...server])}catch(_){return new Set((avisos||[]).filter(a=>a?.leido).map((a,i)=>webMsgId(a,i)))}}
function webSaveReadIds(set){try{st('set',webBuzonKey(),JSON.stringify([...set].slice(-120)))}catch(_){}}
function webMsgId(a,i=0){return String(a?.id||`${a?.ts||0}_${i}`)}
avisosNoLeidos = function(){const read=webReadIds();return avisos.filter((a,i)=>!read.has(webMsgId(a,i))).length};
marcarBuzonLeido = function(){/* lectura individual en webOpenBuzonMessage */};
function webOpenBuzonMessage(id){const sid=String(id),read=webReadIds();read.add(sid);webSaveReadIds(read);const a=(avisos||[]).find((x,i)=>webMsgId(x,i)===sid);if(a)a.leido=true;API.call('/rev/avisos/leido',{method:'POST',body:JSON.stringify({id:sid}),timeoutMs:10000}).catch(()=>{});webBuzonHistoryOpen=true;webBuzonFocus=sid;actualizarBadgeBuzon();vSugerencias();setTimeout(()=>document.querySelector(`[data-msg-id="${CSS.escape(sid)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),60)}
function webToggleHistory(){webBuzonHistoryOpen=!webBuzonHistoryOpen;vSugerencias()}
async function loadWebSugerencias(){if(webSugLoading)return;webSugLoading=true;try{const d=await API.call('/rev/sugerencias/mias?_='+Date.now(),{cache:'no-store',timeoutMs:12000});webSugerencias=Array.isArray(d)?d:(d?.items||[]);webSugLoaded=true;if(current==='buzon'){const draft=document.getElementById('sugTxt')?.value||'';if(!draft)vSugerencias();}}catch(_){webSugLoaded=true}finally{webSugLoading=false}}
function webBuzonRow(a,id,read=false){return `<button class="web-message-row ${read?'read':''} ${webBuzonFocus===id?'focus':''}" data-msg-id="${escAttr(id)}" onclick="webOpenBuzonMessage('${escAttr(id)}')"><span>${webStatusIcon(a)}</span><div><b>${escHtml(a.texto||'Mensaje')}</b><small>${escHtml(a.autor||'Sublicuentas')} · hace ${tiempoDesde(a.ts||0)}</small></div><i>${read?'✓':'●'}</i></button>`}
vSugerencias = function(){
  if(!webSugLoaded&&!webSugLoading)loadWebSugerencias();const read=webReadIds(),sorted=[...avisos].sort((a,b)=>(b.ts||0)-(a.ts||0)),newRows=[],oldRows=[];sorted.forEach((a,i)=>{const id=webMsgId(a,i);(read.has(id)?oldRows:newRows).push({a,id})});
  content.innerHTML=`${webPageHero('inbox','Buzón','Avisos y respuestas del equipo de Sublicuentas.',{kicker:'COMUNICACIÓN'})}<section class="web-suggestion"><div class="web-suggestion-art">💌</div><div class="web-suggestion-form"><header><small>ENVIAR SUGERENCIA</small><h3>Escríbale al equipo</h3><p>Elija el destinatario y envíe su mensaje mediante la integración existente.</p></header><div class="sug-dest" id="sugDest"><button class="${sugDestino==='sublicuentas'?'on':''}" data-d="sublicuentas" onclick="setSugDestino('sublicuentas',this)">Sublicuentas</button><button class="${sugDestino==='relojes'?'on':''}" data-d="relojes" onclick="setSugDestino('relojes',this)">Relojes</button></div><textarea id="sugTxt" maxlength="1000" placeholder="Escriba su sugerencia o comentario…"></textarea><div class="web-suggestion-bottom"><small><span id="sugCount">0</span>/1000</small><button class="web-primary" id="sugBtn" onclick="enviarSugerencia()">Enviar mensaje →</button></div><div id="sugMsg" class="web-form-msg"></div></div></section><section class="web-panel-card web-inbox"><header><div><small>NUEVOS / RESPUESTAS</small><h3>Mis mensajes</h3></div><button onclick="loadAvisos();loadWebSugerencias()">Actualizar</button></header>${newRows.length?`<div class="web-message-list">${newRows.map(x=>webBuzonRow(x.a,x.id,false)).join('')}</div>`:webEmpty('✅','Está al día','No tiene mensajes nuevos por leer.')} ${webSugerencias.length?`<div class="web-sent-block"><h4>Mis sugerencias enviadas</h4>${webSugerencias.slice(0,6).map(s=>`<div class="web-sent-row"><span>💬</span><div><b>${escHtml(s.texto||'Sugerencia')}</b><small>${escHtml(s.destinoLabel||s.destino||'Sublicuentas')} · ${webDateTime(s.createdAt||s.ts)}</small>${s.respuesta?`<p><strong>Respuesta:</strong> ${escHtml(s.respuesta)}</p>`:''}</div><em>${escHtml(s.estado||'enviada')}</em></div>`).join('')}</div>`:''}</section><section class="web-panel-card web-history"><button class="web-history-toggle" onclick="webToggleHistory()"><div><small>HISTORIAL</small><h3>Historial leído <span>${oldRows.length}</span></h3></div><i>${webBuzonHistoryOpen?'⌃':'⌄'}</i></button>${webBuzonHistoryOpen?`<div class="web-message-list history">${oldRows.length?oldRows.map(x=>webBuzonRow(x.a,x.id,true)).join(''):webEmpty('📭','Historial vacío','Los mensajes leídos aparecerán aquí.')}</div>`:''}</section>`;
  const ta=document.getElementById('sugTxt');if(ta)ta.addEventListener('input',()=>{const c=document.getElementById('sugCount');if(c)c.textContent=String(ta.value.length)});
};
const webBaseEnviarSugerencia=enviarSugerencia;
enviarSugerencia = async function(){await webBaseEnviarSugerencia();if(document.getElementById('sugTxt')?.value===''){webSugLoaded=false;loadWebSugerencias()}};

/* ---------- Perfil ---------- */
vPerfil = async function(){
  content.innerHTML=webSkeleton(6);await loadGamificacion();if(current!=='perfil')return;
  const me=gamificacion.perfil||{ventas:0,score:0,nivel:'Sin nivel',racha:0,cursos:0,avatar:''},avatar=safeImageSrc(me.avatar,ROBOT_IMG),nombre=me.nombreMostrar||revName(),nivel=me.nivel||'Sin nivel';
  const insignias=(gamificacion.insignias||[]).map(b=>`<div class="web-badge ${b.activa?'on':''}" title="${escAttr(b.detalle||'')}"><span>${escHtml(b.icon||'🏅')}</span><b>${escHtml(b.nombre||'Insignia')}</b></div>`).join('');
  content.innerHTML=`${webPageHero('profile','Mi perfil','Gestione su información, revise sus logros y personalice su cuenta.',{kicker:'CUENTA DE SOCIO',mascot:false})}<div class="web-profile-layout"><aside class="web-profile-card"><div class="profile-photo-wrap"><img class="profile-photo" src="${escAttr(avatar)}" alt="Foto de ${escAttr(nombre)}"><button class="profile-photo-edit" onclick="document.getElementById('socioPhoto').click()">📷</button><input id="socioPhoto" type="file" accept="image/*" hidden onchange="saveSocioPhoto(this)"></div><h2>${escHtml(nombre)}</h2><span class="web-level-pill">${nivel==='Inmortal'?'👑':nivel==='Leyenda'?'🏆':nivel==='Diamante'?'💎':'⭐'} ${escHtml(nivel)}</span><button class="web-secondary full" onclick="toggleEditSocio()">✏️ Editar perfil</button><div id="editSocioBox" class="web-profile-edit" style="display:none"><input class="comp-in" id="socioNombre" maxlength="45" value="${escAttr(nombre)}" placeholder="Nombre visible"><button class="web-primary full" onclick="saveSocioProfile()">Guardar cambios</button></div><div class="web-levels"><span class="${nivel==='Diamante'?'on':''}">💎<b>Diamante</b><small>1–9 ventas</small></span><span class="${nivel==='Leyenda'?'on':''}">🏆<b>Leyenda</b><small>10–25 ventas</small></span><span class="${nivel==='Inmortal'?'on':''}">👑<b>Inmortal</b><small>26+ ventas</small></span></div></aside><main><div class="web-profile-stats">${webKpi('🛒','Ventas',Number(me.ventas||0),'Registradas','purple')}${webKpi('🏆','Score',Number(me.score||0),'Puntos','pink')}${webKpi('🔥','Racha',Number(me.racha||0),'Renovaciones','amber')}</div><section class="web-panel-card"><header><div><small>LOGROS</small><h3>Insignias</h3></div><span>${Number(me.cursos||0)} cursos</span></header><div class="web-badge-grid">${insignias||webEmpty('🏅','Sin insignias','Sus logros aparecerán aquí.')}</div></section><div class="web-account-links"><button onclick="go('recompensas')"><span>🎁</span><div><b>Ver recompensas</b><small>Beneficios disponibles para su nivel</small></div><i>›</i></button>${typeof Notification!=='undefined'?`<button onclick="enablePartnerNotifications()"><span>🔔</span><div><b>${Notification.permission==='granted'?'Notificaciones activadas':'Activar notificaciones'}</b><small>Reciba avisos importantes del panel</small></div><i>›</i></button>`:''}<button onclick="toggleEditSocio()"><span>👤</span><div><b>Información personal</b><small>Nombre visible y foto de perfil</small></div><i>›</i></button><button class="logout" onclick="logout()"><span>↪</span><div><b>Cerrar sesión</b><small>Salir de esta cuenta</small></div><i>›</i></button></div></main></div>`;
};

/* ---------- Ajustes finales de navegación/actualización ---------- */
const webBaseGo=go;
go = function(v){webBaseGo(v);renderUnifiedSidebar();if(v==='buzon')setTimeout(actualizarBadgeBuzon,0)};
const webBaseRefreshPostRenew=refreshClientesPostRenew;
refreshClientesPostRenew = async function(){await webBaseRefreshPostRenew();markSyncStale(['clientes','metricas']);await Promise.allSettled([loadClientes(),loadMetricas()]);if(current==='inicio')vInicio();};

} // fin PANEL_WEB_DESKTOP
