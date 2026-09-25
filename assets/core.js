let rev=null, clientes=[], cobroTel='', current='inicio';
let isAdmin=false, adminToken=null, adminRevs=[], adminComps=[], adminCompras=[], impersonating=false;
let socioEpoch=0;
let metricasNegocio=null, inventario={}, misCompras=[];
let syncAt={clientes:0,avisos:0,precios:0,gamificacion:0,metricas:0,inventario:0,compras:0};
const DATA_TTL={clientes:15000,avisos:30000,precios:60000,gamificacion:60000,metricas:30000,inventario:20000,compras:20000};
const dataRequests={clientes:null,avisos:null,precios:null,gamificacion:null,metricas:null,inventario:null,compras:null};
const optionalUnavailable=new Set();
let syncBusyCount=0,lastResumeRefresh=0;

function syncTypesForView(v=current){
  const restricted=socioSinCompras();
  const map={
    inicio:['clientes','metricas','avisos'],
    clientes:['clientes'],
    renovar:['clientes'],
    precios:['precios','inventario','gamificacion'],
    compras:['compras','inventario','precios'],
    buzon:['avisos'],
    perfil:['gamificacion'],
    recompensas:['gamificacion'],
    aula:[]
  };
  return (map[v]||['clientes']).filter(t=>!(restricted&&['avisos','gamificacion','compras'].includes(t)));
}
function syncAgeText(ms){
  if(!ms)return 'Sin sincronizar';
  const sec=Math.max(0,Math.floor((Date.now()-ms)/1000));
  if(sec<5)return 'Actualizado ahora';
  if(sec<60)return `Actualizado hace ${sec} s`;
  const min=Math.floor(sec/60);return `Actualizado hace ${min} min`;
}
function updateSyncStatus(){
  const el=document.getElementById('syncStatus'),btn=document.getElementById('syncBtn');
  if(!el)return;
  if(syncBusyCount>0){el.textContent='Actualizando…';el.classList.add('busy');btn?.classList.add('spinning');return}
  el.classList.remove('busy');btn?.classList.remove('spinning');
  const times=syncTypesForView().map(t=>Number(syncAt[t]||0)).filter(Boolean);
  el.textContent=syncAgeText(times.length?Math.min(...times):0);
}
function setSyncBusy(delta){syncBusyCount=Math.max(0,syncBusyCount+delta);updateSyncStatus()}
function markSyncStale(types){(types||[]).forEach(t=>{syncAt[t]=0})}
function refreshCurrentData(force=false){
  if(!API.token||isAdmin&&!impersonating)return Promise.resolve([]);
  const types=syncTypesForView();if(force)markSyncStale(types);
  const jobs=[];
  const add=(t,fn)=>{if(types.includes(t)&&(force||!dataFresh(t)))jobs.push(fn())};
  add('clientes',loadClientes);add('avisos',loadAvisos);add('precios',loadPrecios);add('gamificacion',loadGamificacion);add('metricas',loadMetricas);add('inventario',loadInventario);add('compras',loadMisCompras);
  if(!jobs.length){updateSyncStatus();return Promise.resolve([])}
  return Promise.allSettled(jobs).finally(updateSyncStatus);
}
function smartRefreshAfterResume(){
  if(!API.token||document.visibilityState==='hidden')return;
  const now=Date.now();if(now-lastResumeRefresh<2500)return;lastResumeRefresh=now;
  refreshCurrentData(false);
}
setInterval(updateSyncStatus,10000);

/* API · timeout + reintento seguro para lecturas */
const API={
  base:CONFIG.apiBase.replace(/\/$/,''),
  token:st('get','rev_token'),
  setToken(t){this.token=t;st('set','rev_token',t)},
  clear(){this.token=null;st('del','rev_token');st('del','rev_data');purgeSensitiveCaches()},
  async call(path,opts={}){
    const method=String(opts.method||'GET').toUpperCase();
    const retries=method==='GET'?1:0;
    let lastErr=null;
    for(let attempt=0;attempt<=retries;attempt++){
      const ctl=typeof AbortController!=='undefined'?new AbortController():null;
      const timeoutMs=Number(opts.timeoutMs||20000);
      const timer=ctl?setTimeout(()=>ctl.abort(),timeoutMs):null;
      try{
        const {timeoutMs:_timeout,headers={},signal:_signal,...rest}=opts;
        const r=await fetch(this.base+path,{...rest,signal:ctl?.signal,headers:{
          'Content-Type':'application/json',
          ...(this.token?{Authorization:'Bearer '+this.token}:{}),...headers
        }});
        if(r.status===401){this.clear();throw{code:'auth',error:'auth'}}
        if(!r.ok){let e={};try{e=await r.json()}catch(_){};e.status=r.status;if(r.status>=500&&attempt<retries){lastErr=e;continue}throw e}
        const type=r.headers.get('content-type')||'';
        return type.includes('application/json')?r.json():r.text();
      }catch(e){
        if(e?.code==='auth'||e?.error==='auth')throw e;
        const normalized=e?.name==='AbortError'?{error:'timeout',detail:'La conexión tardó demasiado.'}:e?.error?e:{error:'network',detail:'No se pudo conectar con el servidor.'};
        lastErr=normalized;
        if(attempt>=retries)throw normalized;
        await new Promise(r=>setTimeout(r,450));
      }finally{if(timer)clearTimeout(timer)}
    }
    throw lastErr||{error:'network'};
  }
};
// Render puede dormir la API. La despertamos al abrir y la mantenemos activa
// mientras esta pestaña siga abierta; nunca bloqueamos la interfaz por el ping.
function pingPanelApi(){
  try{
    const ctl=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=ctl?setTimeout(()=>ctl.abort(),12000):null;
    return fetch(API.base+'/health',{cache:'no-store',...(ctl?{signal:ctl.signal}:{})})
      .catch(()=>null).finally(()=>{if(timer)clearTimeout(timer)});
  }catch(_){return Promise.resolve(null)}
}
pingPanelApi();
window.__subliApiKeepAlive=setInterval(pingPanelApi,8*60*1000);
function st(op,k,v){try{if(op==='get')return localStorage.getItem(k);if(op==='set')localStorage.setItem(k,v);if(op==='del')localStorage.removeItem(k)}catch(e){return null}}
function sst(op,k,v){try{if(op==='get')return sessionStorage.getItem(k);if(op==='set')sessionStorage.setItem(k,v);if(op==='del')sessionStorage.removeItem(k)}catch(e){return null}}
function purgeSensitiveCaches(){
  const prefixes=['socios_cache_','catalogo_personal_'];
  for(const store of [localStorage,sessionStorage]){
    try{for(let i=store.length-1;i>=0;i--){const k=store.key(i);if(prefixes.some(p=>k?.startsWith(p)))store.removeItem(k)}}catch(_){}
  }
}
// Borra cachés sensibles de versiones anteriores que podían quedar en localStorage.
(function migrateSensitiveCache(){
  try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&(k.startsWith('socios_cache_')||k.startsWith('catalogo_personal_')))localStorage.removeItem(k)}}catch(_){}
})();

/* helpers */
function pick(o,keys){for(const k of keys){if(o&&o[k]!=null&&o[k]!=='')return o[k]}return null}
function norm(s){return(s||'').toString().trim().toLowerCase()}
function catalogCategoryKey(value){
  return (value||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function mergeCatalogCategories(groups){
  if(!Array.isArray(groups))return [];
  const merged=[],byKey=new Map();
  for(const raw of groups){
    if(!raw||typeof raw!=='object')continue;
    const cat=String(raw.cat||raw.categoria||'Catálogo').trim()||'Catálogo';
    const key=catalogCategoryKey(cat)||cat.toLowerCase();
    let target=byKey.get(key);
    if(!target){
      target={...raw,cat,items:[]};
      merged.push(target);byKey.set(key,target);
    }else{
      const currentSub=String(target.sub||'').trim(), incomingSub=String(raw.sub||'').trim();
      if(!currentSub&&incomingSub)target.sub=incomingSub;
      else if(currentSub&&incomingSub&&catalogCategoryKey(currentSub)!==catalogCategoryKey(incomingSub))target.sub='';
    }
    const seen=new Set(target.items.map(it=>String(it?.id||'').trim()||`${norm(it?.n)}|${norm(it?.s)}`));
    for(const item of Array.isArray(raw.items)?raw.items:[]){
      const itemKey=String(item?.id||'').trim()||`${norm(item?.n)}|${norm(item?.s)}`;
      if(seen.has(itemKey))continue;
      target.items.push(item);seen.add(itemKey);
    }
  }
  return merged;
}
function escHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function escAttr(s){return escHtml(s)}
function normalizeHnPhone(raw){
  let d=String(raw||'').replace(/\D/g,'');
  if(!d)return '';
  if(d.startsWith('00504'))d=d.slice(5);
  if(d.startsWith('504')&&d.length>=11)d=d.slice(3);
  if(d.length>8)d=d.slice(-8);
  return d.length===8?'504'+d:'';
}
function waUrl(raw,text=''){const n=normalizeHnPhone(raw);return n?`https://wa.me/${n}${text?'?text='+encodeURIComponent(text):''}`:''}
function safeHttpUrl(raw){try{const u=new URL(String(raw||''));return ['http:','https:'].includes(u.protocol)?u.href:''}catch(_){return ''}}
function safeImageSrc(raw,fallback=ROBOT_IMG){const v=String(raw||'');if(/^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(v))return v;return safeHttpUrl(v)||fallback}
function partnerCaps(r=rev){return (r&&typeof (r.capabilities||r.permisos)==='object'?(r.capabilities||r.permisos):{})||{}}
function capBool(name,fallback){const c=partnerCaps();return typeof c[name]==='boolean'?c[name]:fallback}
function socioGeisell(r=rev){
  if(!r)return false;
  const n=norm(r.nombre_norm||r.nombre||r.usuario||r.id||'');
  return n==='geisell'||n==='geissel';
}
function socioSinCompras(r=rev){
  if(!r)return false;
  const c=partnerCaps(r);
  if(typeof c.comprar==='boolean')return !c.comprar;
  if(typeof c.canBuy==='boolean')return !c.canBuy;
  return r.sinCompras===true||r.soloCatalogo===true||socioGeisell(r);
}
function vistaGeisellPermitida(v){
  const c=partnerCaps();
  const map={inicio:'inicio',clientes:'clientes',precios:'catalogo',renovar:'renovar',compras:'comprar',aula:'aula',perfil:'perfil',recompensas:'recompensas',buzon:'buzon'};
  const key=map[v];
  if(key&&typeof c[key]==='boolean')return c[key];
  return socioSinCompras()?['clientes','precios','renovar'].includes(v):true;
}
function etiquetaMensajeRenovacion(){return rev?.etiquetaRenovacion||partnerCaps()?.etiquetaRenovacion||(socioGeisell()?'Mensaje de renovación':'Mensaje de cobro')}
function socioCacheId(){return norm(rev?.nombre_norm||rev?.nombre||'socio').replace(/[^a-z0-9]+/g,'_')||'socio'}
function socioCacheKey(tipo){return tipo==='precios'?'catalogo_personal_'+socioCacheId():`socios_cache_${tipo}_${socioCacheId()}`}
function readSocioCache(tipo){
  try{
    const c=JSON.parse(sst('get',socioCacheKey(tipo))||'null');
    return c&&c.data!=null?c:null;
  }catch(_){return null}
}
function writeSocioCache(tipo,data){
  const at=Date.now();syncAt[tipo]=at;
  try{sst('set',socioCacheKey(tipo),JSON.stringify({at,data}))}catch(_){}
  updateSyncStatus();
}
function dataFresh(tipo){return Date.now()-Number(syncAt[tipo]||0)<Number(DATA_TTL[tipo]||0)}
function runSocioRequest(tipo,runner){
  const epoch=socioEpoch,active=dataRequests[tipo];
  if(active&&active.epoch===epoch)return active.promise;
  const holder={epoch,promise:null};
  setSyncBusy(1);
  holder.promise=Promise.resolve().then(()=>runner(epoch)).finally(()=>{if(dataRequests[tipo]===holder)dataRequests[tipo]=null;setSyncBusy(-1)});
  dataRequests[tipo]=holder;
  return holder.promise;
}
function applyNavPermissions(){
  document.querySelectorAll('.nav-btn[data-v]').forEach(b=>b.classList.toggle('permission-hidden',!vistaGeisellPermitida(b.dataset.v)));
}
function applySocioMode(){
  const restricted=socioSinCompras();
  document.body.classList.toggle('geisell-mode',restricted);
  applyNavPermissions();
  document.querySelectorAll('[data-qv]').forEach(b=>b.classList.toggle('permission-hidden',!vistaGeisellPermitida(b.dataset.qv)));
  if(restricted)closePartnerQuick();
  return restricted;
}
function renderTop(){
  if(typeof greet!=='undefined'&&greet)greet.textContent='Hola, '+revName();
  try{applySocioAvatar()}catch(_){}
}
function firstAllowedView(){return ['inicio','clientes','renovar','precios','compras','aula','perfil','recompensas','buzon'].find(v=>vistaGeisellPermitida(v))||'precios'}
async function loadSocioSession(){
  if(!API.token||isAdmin&&!impersonating)return rev;
  try{
    const data=await API.call('/rev/me?_='+Date.now(),{cache:'no-store',timeoutMs:12000});
    if(!data||typeof data!=='object')return rev;
    rev={...(rev||{}),...data,capabilities:data.capabilities||data.permisos||rev?.capabilities||null,priceTier:data.priceTier||data.tarifaId||rev?.priceTier||null};
    st('set','rev_data',JSON.stringify(rev));
    applySocioMode();renderTop();
    if(current&&!vistaGeisellPermitida(current))go(firstAllowedView());
    return rev;
  }catch(e){return rev}
}
function prepareSocioData(){
  socioEpoch++;
  syncAt={clientes:0,avisos:0,precios:0,gamificacion:0,metricas:0,inventario:0,compras:0};
  clientes=[];avisos=[];metricasNegocio=null;inventario={};misCompras=[];
  gamificacion={perfil:null,ranking:[],insignias:[],catalogoActualizadoAt:0,recompensas:[],solicitudes:[]};
  PRECIOS=JSON.parse(JSON.stringify(esTarifaEspecial(rev)?PRECIOS_ESPECIALES:PRECIOS_BASE));
  const tipos=['clientes','avisos','precios','gamificacion','metricas','inventario','compras'];
  tipos.forEach(tipo=>{
    const c=readSocioCache(tipo);if(!c)return;
    syncAt[tipo]=Number(c.at||0);
    if(tipo==='clientes'&&Array.isArray(c.data))clientes=c.data;
    if(tipo==='avisos'&&Array.isArray(c.data))avisos=c.data;
    if(tipo==='precios'&&Array.isArray(c.data)&&c.data.length)PRECIOS=mergeCatalogCategories(c.data);
    if(tipo==='gamificacion'&&c.data&&typeof c.data==='object')gamificacion=c.data;
    if(tipo==='metricas'&&c.data&&typeof c.data==='object')metricasNegocio=c.data;
    if(tipo==='inventario'&&c.data&&typeof c.data==='object')inventario=c.data;
    if(tipo==='compras'&&Array.isArray(c.data))misCompras=c.data;
  });
}
function parseFecha(v){
  if(v==null)return null;
  if(typeof v==='object'){if(v.seconds)return new Date(v.seconds*1000);if(v._seconds)return new Date(v._seconds*1000);if(v.toDate)return v.toDate()}
  if(typeof v==='number')return new Date(v<1e12?v*1000:v);
  const s=v.toString().trim();
  let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if(m){let[,d,mo,y]=m;y=y.length===2?'20'+y:y;return new Date(+y,+mo-1,+d)}
  const d=new Date(s);return isNaN(d)?null:d;
}
function fmtFecha(d){return d?d.toLocaleDateString('es-HN',{day:'2-digit',month:'short',year:'numeric'}):'—'}
function dias(d){if(!d)return null;const h=new Date();h.setHours(0,0,0,0);return Math.round((d-h)/86400000)}
function estado(d){const n=dias(d);
  if(n===null)return{c:'mut',t:'Sin fecha',n:9999};
  if(n<0)return{c:'exp',t:`Corte hace ${Math.abs(n)}d`,n};
  if(n===0)return{c:'due',t:'Pago hoy',n};
  if(n<=Number(CONFIG.avisoDias??7))return{c:'soon',t:`En ${n}d`,n};
  return{c:'ok',t:`En ${n}d`,n};
}
function nombreCli(c){return c.nombrePerfil||c.nombre||c.nombre_norm||'Cliente'}
function revName(r=rev){
  if(!r)return 'socio';
  let raw=(r.nombreMostrar||gamificacion?.perfil?.nombreMostrar||r.nombre||r.nombre_norm||'').toString().trim();
  if(norm(raw)==='geissel')raw='Geisell';
  const user=(r.usuario||r.user||r.username||r.alias||'').toString().trim();
  const bad=['sublicuentas','sublichat','admin','administrador'];
  if(raw && !bad.includes(norm(raw)))return raw;
  if(user && !bad.includes(norm(user)))return user;
  return raw||user||'socio';
}
const enc=escAttr;

const MOTIVACION=[
  'Cada no te acerca a un sí. Seguí tocando puertas.',
  'La venta de hoy empieza con el primer mensaje bien enviado.',
  'Un cliente bien atendido se convierte en recomendación.',
  'No venda barato: venda confianza, rapidez y solución.',
  'Su disciplina cobra aunque usted todavía no vea el resultado.',
  'Hoy no se improvisa: hoy se ordena, se cobra y se renueva.',
  'El seguimiento vende más que la suerte.',
  'La constancia gana donde el talento se distrae.',
  'Cada renovación es una relación que usted cuidó.',
  'Primero orden, luego ventas; primero servicio, luego crecimiento.',
  'Una respuesta rápida vale más que una promoción gigante.',
  'El cliente vuelve donde le resuelven sin complicarlo.',
  'No persiga ventas: construya confianza y las ventas llegan.',
  'La diferencia está en cobrar a tiempo y atender con respeto.',
  'Hoy puede ser el día que un referido le abre diez puertas.',
  'El negocio crece cuando usted mide, corrige y vuelve a intentar.',
  'Vender es servir con estrategia.',
  'No compita solo por precio; compita por experiencia.',
  'Un mensaje claro evita reclamos y aumenta renovaciones.',
  'La marca se construye en cada chat.',
  'La mejor publicidad es un cliente satisfecho hablando por usted.',
  'No espere motivación: ejecute y la motivación aparece.',
  'El que organiza su cartera, domina sus ingresos.',
  'Hoy toca sembrar confianza para cosechar renovaciones.',
  'La rapidez vende, pero la claridad fideliza.',
  'No deje clientes fríos: un seguimiento amable reactiva ventas.',
  'El negocio no se detiene; se ajusta y avanza.',
  'La venta pequeña de hoy puede traer el cliente grande de mañana.',
  'Usted no solo vende cuentas: vende comodidad.',
  'Una cartera sana empieza con vencimientos bajo control.',
  'El buen vendedor no insiste: acompaña con inteligencia.',
  'La energía correcta en el mensaje cambia la respuesta del cliente.',
  'Donde otros abandonan, usted hace seguimiento.',
  'No subestime el poder de un buen “buenos días”.',
  'El cliente compra seguridad antes que precio.',
  'Hoy no es para quejarse; es para mover la cartera.',
  'Si cuida el detalle, cuida la ganancia.',
  'Menos excusas, más mensajes enviados.',
  'La confianza se gana cumpliendo lo prometido.',
  'Un negocio serio se nota desde el primer texto.',
  'La paciencia también es parte de la estrategia.',
  'Vender más empieza por atender mejor.',
  'Quien controla sus renovaciones controla su flujo.',
  'El mejor cierre es una solución simple.',
  'Haga que comprarle sea fácil, rápido y seguro.',
  'Hoy ordena su panel; mañana ordena sus ganancias.',
  'El seguimiento no molesta cuando aporta valor.',
  'La actitud abre la puerta, el servicio la mantiene abierta.',
  'No espere clientes perfectos; cree procesos claros.',
  'La constancia convierte contactos en cartera.',
  'Un cliente que entiende, paga con menos objeciones.',
  'La marca que responde rápido se queda en la mente.',
  'La venta se cierra mejor cuando el mensaje es directo.',
  'Revise, cobre, renueve: tres pasos para crecer.',
  'La excelencia diaria hace que el precio pese menos.',
  'El cliente no siempre recuerda el precio, pero sí cómo lo atendieron.',
  'Haga de cada renovación una oportunidad para vender más.',
  'El enfoque de hoy paga la tranquilidad de mañana.',
  'No venda por necesidad: venda con estrategia.',
  'El orden es el socio silencioso de todo vendedor.'
];
function motivacionDelDia(){
  const n=new Date();
  const y=n.getFullYear();
  const start=new Date(y,0,0);
  const day=Math.floor((n-start)/86400000);
  return MOTIVACION[(day+(y*17))%MOTIVACION.length];
}
function num(v){
  if(v==null||v==='')return 0;
  if(typeof v==='number')return Number.isFinite(v)?v:0;
  let s=v.toString().replace(/[^\d,.-]/g,'').trim();
  if(!s)return 0;
  const c=s.lastIndexOf(','), d=s.lastIndexOf('.');
  if(c>-1&&d>-1){s=c>d?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'')}
  else if(c>-1){const dec=s.length-c-1;s=dec===2?s.replace(',','.'):s.replace(/,/g,'')}
  else if(d>-1){const dec=s.length-d-1;if(dec!==2)s=s.replace(/\./g,'')}
  const n=parseFloat(s);return Number.isFinite(n)?n:0;
}
function precioServicio(s){return num(pick(s,CONFIG.campos.precio))}
function money(n){return 'Lps. '+Math.round(n||0).toLocaleString('es-HN')}
function esVigente(e){return e.n>=0&&e.n<9999}
function clienteTieneVigente(c){return (Array.isArray(c.servicios)?c.servicios:[]).some(s=>esVigente(estado(parseFecha(pick(s,CONFIG.campos.vencimiento)))))}
/* Vigente = tiene al menos un servicio en fecha. No vigente = todo lo demás (vencidos, sin fecha o sin servicio). */
function esClienteVigente(c){return clienteTieneVigente(c)}
function esClienteNoVigente(c){return !clienteTieneVigente(c)}
function estadoCliente(c){
  return esClienteVigente(c)?{c:'ok',t:'Vigente'}:{c:'exp',t:'Sin servicio vigente'};
}
function clientIdentity(c){return String(c?.id||c?.uid||normalizeHnPhone(c?.telefono||c?.telefono_norm||'')||norm(nombreCli(c))||'sin-id')}
function uniqueClientCount(rows){return new Set((rows||[]).map(r=>clientIdentity(r?.cliente||r)).filter(Boolean)).size}

function flat(){const out=[];
  clientes.forEach(c=>(Array.isArray(c.servicios)?c.servicios:[]).forEach((s,ix)=>{
    const f=parseFecha(pick(s,CONFIG.campos.vencimiento));
    const original=Number(s.servicioIndexOriginal??s._servicioIndexOriginal??ix);
    out.push({cliente:c,servicioIndex:Number.isInteger(original)?original:ix,compraId:String(s.compraId||''),nombre:pick(s,CONFIG.campos.servicio)||'Servicio',fecha:f,est:estado(f),precio:precioServicio(s)});
  }));
  return out.sort((a,b)=>a.est.n-b.est.n);
}

function actualizarFechaHora(){
  const el=document.getElementById('fechaHora');
  if(!el)return;
  const n=new Date();
  el.textContent=n.toLocaleDateString('es-HN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})+' · '+n.toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'});
}
setInterval(actualizarFechaHora,60000);

/* login */
/* Texto del botón de login (cambiá acá las 2 palabras si querés otra) */
const LOGIN_CTA={go:'Acceder', load:'Accediendo…'};
let pinModo=false;
function mostrarCampoPin(mostrar){
  pinModo=mostrar;
  fieldPin.classList.toggle('hide',!mostrar);
  loginFoot.textContent=mostrar
    ? 'Primera vez: poné el PIN que te dio el admin y elegí la clave que vas a usar de ahora en más.'
    : 'La primera vez, necesitás también el PIN de configuración que te dio el admin.';
  if(mostrar){ try{inPin.focus()}catch(_){} }
}
async function doLogin(){
  const usuario=inUser.value.trim(), password=inPass.value.trim(), pin=(inPin?.value||'').trim();
  loginErr.textContent='';
  if(!usuario||!password){loginErr.textContent='Escribí tu usuario y tu clave.';return}
  if(pinModo && !pin){loginErr.textContent='Poné también el PIN de configuración.';return}
  if(CONFIG.apiBase.includes('TU-BOT')){loginErr.textContent='Falta poner la URL de la API (CONFIG.apiBase).';return}
  loginBtn.disabled=true; loginBtn.textContent=LOGIN_CTA.load;
  const slowLoginTimer=setTimeout(()=>{if(loginBtn.disabled)loginBtn.textContent='Despertando servidor…'},3500);
  try{
    const body={usuario,password};
    if(pin) body.pin=pin;
    const res=await API.call('/rev/login',{method:'POST',body:JSON.stringify(body)});
    API.setToken(res.token);
    touchActivity();
    if(res.admin){
      isAdmin=true; adminToken=res.token;
      st('set','rev_admin','1'); st('del','rev_data');
      enterAdmin();
      return;
    }
    rev={nombre:res.nombre,nombre_norm:res.nombre_norm,usuario:res.usuario||usuario,soloCatalogo:res.soloCatalogo===true,sinCompras:res.sinCompras===true,capabilities:res.capabilities||res.permisos||null,priceTier:res.priceTier||res.tarifa||null,etiquetaRenovacion:res.etiquetaRenovacion||''};
    st('set','rev_data',JSON.stringify(rev)); st('del','rev_admin');
    enterApp();
  }catch(e){
    if(e.error==='pin_requerido'){
      mostrarCampoPin(true);
      loginErr.textContent='Es tu primera vez: escribí también el PIN de configuración.';
      return;
    }
    const map={
      credenciales:'Usuario o clave incorrectos.',
      inactivo:'Tu cuenta está inactiva.',
      faltan_datos:'Faltan datos.',
      pin_invalido:'El PIN de configuración no es correcto.',
      cuenta_no_configurada:'Tu cuenta todavía no tiene PIN de configuración. Pedile uno al admin (/resetpin).',
      demasiados_intentos:'Demasiados intentos. Probá de nuevo en unos minutos.',
    };
    loginErr.textContent=map[e.error]||(e.error==='timeout'?'El servidor tardó demasiado. Intentá de nuevo.':e.error==='network'?'Sin conexión con el servidor. Revisá internet e intentá de nuevo.':'No pude conectar. Revisá la URL de la API.');
  }finally{clearTimeout(slowLoginTimer);loginBtn.disabled=false;loginBtn.textContent=LOGIN_CTA.go}
}
function enterApp(){
  login.classList.add('hide');
  document.getElementById('app').classList.remove('hide');
  document.getElementById('nav').classList.remove('hide');
  prepareSocioData();
  const restricted=applySocioMode();
  renderTop();
  actualizarFechaHora();
  toggleImpBar();
  catalogCategoria='';compraSels=[];compraPickerOpen=false;if(typeof resetCompraDraft==='function')resetCompraDraft();
  go(vistaGeisellPermitida('inicio')?'inicio':firstAllowedView());
  loadSocioSession();
  // Inicio prioriza los datos que realmente usa. Catálogo, inventario y compras
  // se actualizan al entrar a esas vistas para no frenar la apertura del panel.
  loadClientes();
  loadMetricas();
  if(!restricted){loadAvisos();loadGamificacion()}
  clearInterval(window.__subliInboxTimer);
  window.__subliInboxTimer=setInterval(()=>{loadSocioSession();refreshCurrentData(false)},60000);
  updateSyncStatus();
}
/* Trae el catálogo real (lo administra Sublichat). Si falla, se queda
   con el PRECIOS de respaldo definido arriba — el socio nunca se queda
   sin ver precios, aunque estén desactualizados. */
async function loadPrecios(){
  return runSocioRequest('precios',async(epoch)=>{
    try{
      const data=await API.call('/rev/precios?_='+Date.now(),{cache:'no-store'});
      if(epoch!==socioEpoch)return false;
      if(Array.isArray(data)&&data.length){PRECIOS=mergeCatalogCategories(data);writeSocioCache('precios',PRECIOS)}
      return true;
    }catch(e){
      if(epoch!==socioEpoch)return false;
      if(!Array.isArray(PRECIOS)||!PRECIOS.length)PRECIOS=JSON.parse(JSON.stringify(esTarifaEspecial(rev)?PRECIOS_ESPECIALES:PRECIOS_BASE));
      return false;
    }
  });
}
function toggleImpBar(){
  const b=document.getElementById('impBar');
  if(impersonating){
    b.className='imp-bar';
    b.innerHTML=`<div class="lbl">👁 Viendo como <b>${escHtml(revName())}</b></div><button onclick="volverAdmin()">Volver</button>`;
  } else { b.className='hide'; b.innerHTML=''; }
}
function logout(){clearInterval(window.__subliInboxTimer);API.clear();st('del','rev_admin');st('del','rev_last');location.reload()}

/* ── ADMIN (modo dios, solo lectura) ── */
let admF='', admCompF='', admCompraF='', admMode='socios';
async function enterAdmin(){
  socioEpoch++;
  clearInterval(window.__subliInboxTimer);
  document.body.classList.remove('geisell-mode');
  impersonating=false;
  login.classList.add('hide');
  document.getElementById('app').classList.remove('hide');
  document.getElementById('nav').classList.add('hide');
  document.getElementById('impBar').className='hide';
  greet.textContent='Modo administrador';
  actualizarFechaHora();
  content.innerHTML='<div class="spin"></div>';
  try{
    const [revs,comps,compras]=await Promise.all([
      API.call('/rev/admin/revendedores',{headers:{Authorization:'Bearer '+adminToken}}),
      API.call('/rev/admin/comprobantes?limit=160',{headers:{Authorization:'Bearer '+adminToken}}).catch(()=>[]),
      API.call('/rev/admin/compras?limit=160',{headers:{Authorization:'Bearer '+adminToken}}).catch(()=>[])
    ]);
    adminRevs=revs; adminComps=comps; adminCompras=compras; renderAdmin();
  }
  catch(e){ if(e.code==='auth'){location.reload();return}
    content.innerHTML=`<div class="card"><div class="empty"><div class="ico">⚠️</div><b>No pude cargar el Panel Dios</b>Revisá la API.</div></div>`; }
}
function renderAdmin(){
  const totCli=adminRevs.reduce((a,r)=>a+(r.clientes||0),0);
  const totVenc=adminRevs.reduce((a,r)=>a+(r.vencidos||0),0);
  const activos=adminRevs.filter(r=>r.activo).length;
  const compsFoto=adminComps.filter(c=>c.imagenUrl).length;
  const comprasFoto=adminCompras.filter(c=>c.imagenUrl).length;
  content.innerHTML=`
  <div class="hero">
    <div class="hl">PANEL DIOS</div>
    <div class="hv">${adminRevs.length}</div>
    <div class="hs">${activos} socios activos · ${totCli} clientes · ${totVenc} cortes/vencidos · ${adminComps.length} comprobantes · ${adminCompras.length} compras</div>
  </div>
  <div class="adm-dash">
    <div class="adm-mini"><b>${totCli}</b><span>Clientes en red</span></div>
    <div class="adm-mini"><b>${totVenc}</b><span>Alertas de corte</span></div>
    <div class="adm-mini"><b>${compsFoto}</b><span>Fotos de renovación</span></div>
    <div class="adm-mini"><b>${adminCompras.length}</b><span>Compras nuevas</span></div>
  </div>
  <div class="adm-seg">
    <button class="${admMode==='socios'?'on':''}" onclick="setAdmMode('socios')">👁 Ver socio</button>
    <button class="${admMode==='comprobantes'?'on':''}" onclick="setAdmMode('comprobantes')">🧾 Comprobantes</button>
    <button class="${admMode==='compras'?'on':''}" onclick="setAdmMode('compras')">🛒 Compras</button>
    <button class="${admMode==='usuarios'?'on':''}" onclick="setAdmMode('usuarios')">👤 Usuarios</button>
  </div>
  ${admMode==='usuarios'?`<button class="copyall" onclick="copyAllUsers(this)">📋 Copiar lista (nombre + usuario)</button>`:''}
  <div class="search">
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
    ${admMode==='comprobantes'
      ? `<input id="admCompSearch" placeholder="Buscar comprobante por socio, cliente o servicio" value="${escAttr(admCompF)}" oninput="admCompF=this.value;renderAdmComps()">`
      : admMode==='compras'
        ? `<input id="admCompraSearch" placeholder="Buscar compra por socio, servicio, cliente o destino" value="${escAttr(admCompraF)}" oninput="admCompraF=this.value;renderAdmCompras()">`
        : `<input id="admSearch" placeholder="Buscar socio" value="${escAttr(admF)}" oninput="admF=this.value;renderAdmList()">`}
  </div>
  ${admMode==='comprobantes'?'<div id="admCompList"></div>':admMode==='compras'?'<div id="admCompraList"></div>':'<div id="admList"></div>'}`;
  if(admMode==='comprobantes')renderAdmComps(); else if(admMode==='compras')renderAdmCompras(); else renderAdmList();
}
function setAdmMode(m){admMode=m;renderAdmin()}
function renderAdmList(){
  const f=norm(admF);
  const list=adminRevs.filter(r=>!f||norm(r.nombre).includes(f)||norm(r.nombre_norm).includes(f));
  const el=document.getElementById('admList'); if(!el)return;
  if(!list.length){el.innerHTML=`<div class="card"><div class="empty"><div class="ico">🔍</div>Sin resultados.</div></div>`;return}
  el.innerHTML=(admMode==='usuarios'?list.map(usrCard):list.map(revCard)).join('');
}
function fmtTs(ts){try{return new Date(ts||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return '—'}}
function renderAdmComps(){
  const f=norm(admCompF);
  const list=adminComps.filter(c=>!f||norm(c.socio).includes(f)||norm(c.socio_norm).includes(f)||norm(c.cliente).includes(f)||norm(c.servicio).includes(f));
  const el=document.getElementById('admCompList'); if(!el)return;
  if(!list.length){el.innerHTML=`<div class="card"><div class="empty"><div class="ico">🧾</div><b>Sin comprobantes</b>No hay resultados con ese filtro.</div></div>`;return}
  el.innerHTML=list.map(compCard).join('');
}
function compCard(c){
  const safeImg=safeHttpUrl(c.imagenUrl);
  const img=safeImg?`<a class="adm-img" href="${escAttr(safeImg)}" target="_blank" rel="noopener noreferrer"><img src="${escAttr(safeImg)}" alt="comprobante"></a>`:`<div class="adm-img">🧾</div>`;
  const fecha=c.nuevaFecha?`<span class="adm-tag good">Nueva fecha ${escHtml(c.nuevaFecha)}</span>`:'';
  const monto=c.monto?`<span class="adm-tag money">${money(c.monto)}</span>`:'';
  return `<div class="adm-comp-card">
    ${img}
    <div>
      <div class="adm-comp-title">${escHtml(c.cliente||'Cliente sin nombre')}</div>
      <div class="adm-comp-meta">👤 ${escHtml(c.socio||'Socio')} · 📦 ${escHtml(c.servicio||'Servicio')}<br>🕒 ${fmtTs(c.ts)}${c.quien?` · 🔁 ${escHtml(c.quien)}`:''}</div>
      ${c.comentario?`<div class="adm-comp-meta">📝 ${escHtml(c.comentario)}</div>`:''}
      <div class="adm-comp-tags">${monto}${fecha}${safeImg?'<span class="adm-tag">Foto</span>':'<span class="adm-tag">Sin foto</span>'}${c.renovado?'<span class="adm-tag good">Renovado</span>':''}</div>
    </div>
  </div>`;
}

function renderAdmCompras(){
  const f=norm(admCompraF);
  const list=adminCompras.filter(c=>!f||norm(c.socio).includes(f)||norm(c.socio_norm).includes(f)||norm(c.cliente).includes(f)||norm(c.perfil).includes(f)||norm(c.servicio).includes(f)||norm(c.destinoLabel).includes(f));
  const el=document.getElementById('admCompraList'); if(!el)return;
  if(!list.length){el.innerHTML=`<div class="card"><div class="empty"><div class="ico">🛒</div><b>Sin compras</b>No hay resultados con ese filtro.</div></div>`;return}
  el.innerHTML=list.map(compraCard).join('');
}
function compraCard(c){
  const safeImg=safeHttpUrl(c.imagenUrl);
  const img=safeImg?`<a class="adm-img" href="${escAttr(safeImg)}" target="_blank" rel="noopener noreferrer"><img src="${escAttr(safeImg)}" alt="comprobante compra"></a>`:`<div class="adm-img">🛒</div>`;
  const monto=c.monto?`<span class="adm-tag money">${money(c.monto)}</span>`:'';
  const extra=[c.catalogCategory?`🗂️ ${escHtml(c.catalogCategory)}`:'',c.catalogSub?`📌 ${escHtml(c.catalogSub)}`:'',c.perfil?`👥 Perfil: ${escHtml(c.perfil)}`:'',c.correo?`✉️ ${escHtml(c.correo)}`:'',c.detalleServicio?`🧾 Detalle: ${escHtml(c.detalleServicio)}`:'',c.acceso?`🔐 ${escHtml(c.acceso)}`:'',c.serial?`🔑 ${escHtml(c.serial)}`:'',c.key?`🧩 ${escHtml(c.key)}`:''].filter(Boolean).join('<br>');
  return `<div class="adm-purchase-card">
    ${img}
    <div>
      <div class="adm-purchase-title">${escHtml(c.servicio||'Compra sin servicio')}</div>
      <div class="adm-purchase-meta">👤 ${escHtml(c.socio||'Socio')} · 📣 ${escHtml(c.destinoLabel||'Sublicuentas')}<br>🕒 ${fmtTs(c.ts)}${c.cliente?`<br>🙍 Cliente: ${escHtml(c.cliente)}`:''}</div>
      ${extra?`<div class="adm-purchase-meta">${extra}</div>`:''}
      ${c.comentario?`<div class="adm-purchase-meta">📝 ${escHtml(c.comentario)}</div>`:''}
      <div class="adm-comp-tags">${monto}<span class="adm-tag dest">${escHtml(c.destinoLabel||'Sublicuentas')}</span>${safeImg?'<span class="adm-tag">Foto</span>':'<span class="adm-tag">Sin foto</span>'}<span class="adm-tag pending">${escHtml(c.estado||'pendiente')}</span></div>
    </div>
  </div>`;
}

const PANEL_URL='https://sublicuentas.com';
function onboardMsg(nombre,user,pin){
  const pinLinea=pin?`🔐 PIN de configuración (solo la primera vez): ${pin}\n`:'';
  return `¡Hola ${nombre}! 👋 Ya podés entrar a tu panel de Sublicuentas:\n\n🔗 ${PANEL_URL}\n👤 Usuario: ${user}\n${pinLinea}🔑 Clave: la primera vez que entrés, además del PIN, escribí la clave que querés usar de ahora en más — esa queda guardada como la tuya.\n\nCualquier duda, escribime. 🤝`;
}
function adminSocioNombre(r){return ['geissel','geisell'].includes(norm(r?.nombre_norm||r?.nombre||''))?'Geisell':(r?.nombre||r?.id||'Socio')}
function adminSocioUsuario(r){return ['geissel','geisell'].includes(norm(r?.nombre_norm||''))?'geisell':(r?.nombre_norm||'')}
function usrCard(r){
  const nombre=adminSocioNombre(r),usuario=adminSocioUsuario(r),ini=(nombre[0]||'?').toUpperCase();
  return `<div class="usr-card">
    <div class="usr-top">
      <div class="rav ${r.activo?'':'off'}">${escHtml(ini)}</div>
      <div class="usr-nm">${escHtml(nombre)}${r.activo?'':' <span class="rev-off-tag">inactivo</span>'}</div>
    </div>
    <div class="usr-user"><span class="k">Usuario</span><span class="v">${escHtml(usuario)}</span></div>
    <div class="usr-btns">
      <button class="cp" onclick='copyUser(${enc(JSON.stringify(usuario))},this)'>Copiar usuario</button>
      <button class="wa" onclick='waOnboard(${enc(JSON.stringify(nombre))},${enc(JSON.stringify(usuario))})'>WhatsApp</button>
    </div>
  </div>`;
}
function copyUser(u,btn){navigator.clipboard?.writeText(u);const o=btn.textContent;btn.textContent='¡Copiado!';setTimeout(()=>btn.textContent=o,1200)}
function waOnboard(nombre,user){
  // El PIN lo generó el bot (comando /addvendedor o /resetpin) y solo se
  // muestra ahí una vez — este panel no lo guarda ni lo puede recuperar.
  const pin=(window.prompt(`PIN de configuración de ${nombre}\n\n(te lo dio el bot al correr /addvendedor o /resetpin — dejalo vacío si ya lo usó)`,'')||'').trim();
  window.open('https://wa.me/?text='+encodeURIComponent(onboardMsg(nombre,user,pin)),'_blank');
}
function copyAllUsers(btn){
  const t=adminRevs.map(r=>`${adminSocioNombre(r)}: ${adminSocioUsuario(r)}`).join('\n');
  navigator.clipboard?.writeText(t);
  const o=btn.textContent;btn.textContent='¡Copiado!';setTimeout(()=>btn.textContent=o,1300);
}
function revCard(r){
  const nombre=adminSocioNombre(r),usuario=adminSocioUsuario(r),ini=(nombre[0]||'?').toUpperCase();
  const parts=[`${r.clientes} ${r.clientes===1?'cliente':'clientes'}`];
  if(r.vencidos)parts.push(`<span class="x">${r.vencidos} vencidos</span>`);
  if(r.porVencer)parts.push(`<span class="w">${r.porVencer} por vencer</span>`);
  return `<div class="rev-card" onclick='verComo(${enc(JSON.stringify(r.id))},${enc(JSON.stringify(usuario))},${enc(JSON.stringify(nombre))})'>
    <div class="rav ${r.activo?'':'off'}">${escHtml(ini)}</div>
    <div class="ri"><div class="rn">${escHtml(nombre)}${r.activo?'':' <span class="rev-off-tag">inactivo</span>'}</div>
      <div class="rs">${parts.join('<span style="opacity:.4">·</span>')}</div></div>
    <div class="go"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></div>
  </div>`;
}
async function verComo(id,nombre_norm,nombre){
  try{
    const res=await API.call('/rev/admin/impersonate',{method:'POST',body:JSON.stringify({id,nombre_norm}),headers:{Authorization:'Bearer '+adminToken}});
    API.token=res.token;                 // token del socio solo en memoria
    rev={nombre:res.nombre,nombre_norm:res.nombre_norm,usuario:res.usuario||res.nombre_norm,soloCatalogo:res.soloCatalogo===true,sinCompras:res.sinCompras===true,capabilities:res.capabilities||res.permisos||null,priceTier:res.priceTier||res.tarifa||null,etiquetaRenovacion:res.etiquetaRenovacion||''};
    impersonating=true;
    enterApp();
  }catch(e){
    let msg;
    if(e&&e.code==='auth') msg='Sesión de admin vencida. Cerrá sesión y volvé a entrar.';
    else if(e&&e.error==='no_existe') msg='No se encontró a "'+nombre+'" en la base. El servidor (Render) probablemente NO está actualizado. Revisá server_api.js.';
    else if(e&&e.error==='no_admin') msg='Tu token no es de admin (no_admin).';
    else if(e&&e.error) msg='Error del servidor: '+e.error;
    else if(e instanceof TypeError) msg='El servidor no respondió (puede estar despertando). Esperá ~1 min y reintentá.';
    else msg='No pude entrar como '+nombre+(e&&e.message?(' — '+e.message):'');
    alert(msg);
  }
}
function volverAdmin(){
  API.token=adminToken;
  impersonating=false; rev=null;
  enterAdmin();
}

async function loadClientes(){
  return runSocioRequest('clientes',async(epoch)=>{
    try{
      const data=await API.call('/rev/clientes?_='+Date.now(),{cache:'no-store',timeoutMs:12000});
      if(epoch!==socioEpoch)return clientes;
      clientes=Array.isArray(data)?data:[];writeSocioCache('clientes',clientes);
      if(current==='inicio')vInicio();
      else if(current==='clientes')renderCli();
      else if(current==='renovar')renderRen();
      return clientes;
    }catch(e){
      if(e.code==='auth'){location.reload();return clientes}
      if(epoch===socioEpoch&&!clientes.length&&current==='inicio')content.innerHTML=`<div class="card"><div class="empty"><div class="ico">⚠️</div><b>No pude actualizar tus clientes</b>El catálogo y los últimos datos guardados siguen disponibles. Reintentaremos automáticamente.</div></div>`;
      return clientes;
    }
  });
}
let avisos=[],gamificacion={perfil:null,ranking:[],insignias:[],catalogoActualizadoAt:0};
async function loadGamificacion(){
  return runSocioRequest('gamificacion',async(epoch)=>{
    try{
      const data=await API.call('/rev/gamificacion?_='+Date.now(),{cache:'no-store'});
      if(epoch!==socioEpoch)return gamificacion;
      if(data&&typeof data==='object'){gamificacion=data;writeSocioCache('gamificacion',data);applySocioAvatar()}
      return gamificacion;
    }catch(e){return gamificacion}
  });
}
function applySocioAvatar(){const img=document.getElementById('brandLogo');if(img)img.src=safeImageSrc(gamificacion?.perfil?.avatar,ROBOT_IMG)}
async function loadAvisos(){
  return runSocioRequest('avisos',async(epoch)=>{
    try{
      const prevTs=maxAvisoTs();
      const data=await API.call('/rev/avisos?_='+Date.now(),{cache:'no-store',timeoutMs:12000});
      if(epoch!==socioEpoch)return avisos;
      avisos=Array.isArray(data)?data:[];writeSocioCache('avisos',avisos);
      if(prevTs>0&&typeof notifyPartnerAvisos==='function'){
        const nuevos=avisos.filter(a=>(a.ts||0)>prevTs);
        if(nuevos.length)notifyPartnerAvisos(nuevos);
      }
      if(current==='inicio')vInicio();
      else if(current==='buzon')vSugerencias();
    }catch(e){}
    if(epoch===socioEpoch)actualizarBadgeBuzon();
    return avisos;
  });
}

/* Datos opcionales de la API nueva. Si el backend aún no los expone, el panel sigue funcionando. */
async function loadMetricas(){
  if(optionalUnavailable.has('metricas'))return metricasNegocio;
  return runSocioRequest('metricas',async(epoch)=>{
    try{
      const data=await API.call('/rev/metricas?range=month&_='+Date.now(),{cache:'no-store',timeoutMs:12000});
      if(epoch!==socioEpoch)return metricasNegocio;
      if(data&&typeof data==='object'){metricasNegocio=data;writeSocioCache('metricas',data);if(current==='inicio')vInicio()}
    }catch(e){if(e?.status===404)optionalUnavailable.add('metricas')}
    return metricasNegocio;
  });
}
async function loadInventario(){
  if(optionalUnavailable.has('inventario'))return inventario;
  return runSocioRequest('inventario',async(epoch)=>{
    try{
      const data=await API.call('/rev/inventario?_='+Date.now(),{cache:'no-store',timeoutMs:12000});
      if(epoch!==socioEpoch)return inventario;
      if(data&&typeof data==='object'){inventario=data;writeSocioCache('inventario',data);if(current==='precios')vPrecios();if(current==='compras')renderCompraForm()}
    }catch(e){if(e?.status===404)optionalUnavailable.add('inventario')}
    return inventario;
  });
}
async function loadMisCompras(){
  if(optionalUnavailable.has('compras'))return misCompras;
  return runSocioRequest('compras',async(epoch)=>{
    try{
      const data=await API.call('/rev/compras/mias?limit=20&_='+Date.now(),{cache:'no-store',timeoutMs:12000});
      if(epoch!==socioEpoch)return misCompras;
      const rows=Array.isArray(data)?data:Array.isArray(data?.items)?data.items:[];
      misCompras=rows;writeSocioCache('compras',rows);if(current==='compras')renderCompraForm();
    }catch(e){if(e?.status===404)optionalUnavailable.add('compras')}
    return misCompras;
  });
}
function inventoryEntry(item){
  const keys=[item?.catalogId,item?.id,item?.nombre,item?.base].filter(Boolean).map(v=>norm(v));
  const source=Array.isArray(inventario)?inventario:Array.isArray(inventario?.items)?inventario.items:Object.entries(inventario||{}).map(([id,v])=>({id,...(typeof v==='object'&&!Array.isArray(v)?v:{estado:v})}));
  if(Array.isArray(source))return source.find(x=>keys.includes(norm(x.id||x.catalogId||x.nombre||x.servicio)))||null;
  return null;
}
function inventoryState(item){
  const x=inventoryEntry(item);if(!x)return {key:'unknown',label:'Consultar',available:true};
  const raw=norm(x.estado||x.status||x.disponibilidad||(x.stock===0?'agotado':'disponible'));
  if(['agotado','sin stock','out','unavailable'].includes(raw))return {key:'out',label:'Agotado',available:false};
  if(['bajo','poco','low','limitado'].includes(raw))return {key:'low',label:x.stock!=null?`Poco · ${x.stock}`:'Poco inventario',available:true};
  if(['consultar','unknown','sin_bodega'].includes(raw))return {key:'unknown',label:'Consultar',available:true};
  return {key:'ok',label:x.stock!=null?`Disponible · ${x.stock}`:'Disponible',available:true};
}
function orderStatusLabel(v){
  const s=norm(v||'pendiente');
  if(['entregado','completado','complete','done'].includes(s))return ['ok','Entregado'];
  if(['proceso','en proceso','processing'].includes(s))return ['work','En proceso'];
  if(['falta informacion','falta información','info','needs_info'].includes(s))return ['warn','Falta información'];
  if(['cancelado','cancelled'].includes(s))return ['out','Cancelado'];
  return ['pending','Pendiente'];
}

/* ── Buzón: control de leídos/no leídos ── */
function maxAvisoTs(){return avisos.reduce((m,a)=>Math.max(m,a.ts||0),0)}
function avisosNoLeidos(){const seen=+(st('get','buzon_seen')||0);return avisos.filter(a=>(a.ts||0)>seen).length}
function marcarBuzonLeido(){const m=maxAvisoTs();if(m)st('set','buzon_seen',String(m))}
function actualizarBadgeBuzon(){
  const el=document.getElementById('buzonBadge');if(!el)return;
  const n=current==='buzon'?0:avisosNoLeidos();
  if(n>0){el.textContent=n>9?'9+':n;el.classList.add('show')}
  else el.classList.remove('show');
}
function tiempoDesde(ts){
  const d=Date.now()-ts;
  const min=Math.floor(d/60000);
  if(min<1)return'recién';
  if(min<60)return min+'m';
  const h=Math.floor(min/60);
  if(h<24)return h+'h';
  return Math.floor(h/24)+'d';
}

/* nav */
const content=document.getElementById('content');
function go(v){
  const restricted=socioSinCompras();
  if(!vistaGeisellPermitida(v))v=restricted?'renovar':'inicio';
  current=v;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  window.scrollTo(0,0);
  const views={inicio:vInicio,compras:vCompras,clientes:vClientes,renovar:vRenovar,precios:vPrecios,buzon:vSugerencias,aula:vAula,perfil:vPerfil,recompensas:vRecompensas};
  (views[v]||vInicio)();
  if(['inicio','clientes','renovar'].includes(v)&&!dataFresh('clientes'))loadClientes();
  if(v==='inicio'&&!dataFresh('metricas'))loadMetricas();
  if(!restricted&&v==='inicio'&&!dataFresh('avisos'))loadAvisos();
  if(!restricted&&v==='compras'&&!dataFresh('compras'))loadMisCompras();
  if(['precios','compras'].includes(v)&&!dataFresh('inventario'))loadInventario();
  if(!restricted&&v==='buzon'&&!dataFresh('avisos'))loadAvisos();
  if(v==='precios'){
    const jobs=[];
    if(!dataFresh('precios'))jobs.push(loadPrecios());
    if(!restricted&&!dataFresh('gamificacion'))jobs.push(loadGamificacion());
    if(jobs.length)Promise.allSettled(jobs).then(()=>{if(current==='precios')vPrecios()});
  }
  actualizarBadgeBuzon();updateSyncStatus();
}
function openPartnerQuick(){if(!socioSinCompras())document.getElementById('partnerQuick')?.classList.add('show')}
function closePartnerQuick(){document.getElementById('partnerQuick')?.classList.remove('show')}
