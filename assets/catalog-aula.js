/* PRECIOS */
/* Catálogo de precios: este array es el RESPALDO por si el fetch al
   servidor falla (offline, API caída, etc.). Cuando enterApp() consigue
   cargar /rev/precios, reemplaza este contenido con el catálogo real que
   se administra ahora desde Sublichat (pestaña Revendedores → Precios) —
   así ya no hace falta editar código para cambiar un precio. */
const PRECIOS_BASE=[
  {cat:'📺 Streaming',sub:'Plan mensual',items:[
    {n:'Netflix',p:110,d:'👤 Perfil personal: correo y contraseña\n📺 Reproduce en 1 dispositivo a la vez\n🔐 Más perfiles: sin clave, acceso por código\n🏠 A los 20 días puede pedir código hogar'},
    {n:'Disney+ Premium',p:80,d:'🔢 Acceso por código\n👤 PIN de perfil\n📱 1 dispositivo'},
    {n:'Disney+ Standar',p:50,d:'🔢 Acceso por código\n👤 PIN de perfil\n📱 1 dispositivo'},
    {n:'Max',p:60,d:'📺 En TV: acceso por código\n📱 En celular: se da clave\n👤 PIN de perfil · 1 dispositivo'},
    {n:'Vix',p:30,d:'📧 Se entrega correo y contraseña\n📱 1 dispositivo'},
    {n:'Viki Rakuten',p:60,d:'📧 Se entrega correo y contraseña\n📱 1 dispositivo'},
    {n:'Prime Video',p:60,d:'🔢 Acceso por código\n👤 PIN de perfil · 1 dispositivo'},
    {n:'Paramount+',p:60,d:'📧 Se entrega correo y contraseña\n📱 1 dispositivo'},
    {n:'Crunchyroll',p:60,d:'👤 PIN de perfil\n📱 1 dispositivo'},
    {n:'Oleada',s:'1 dispositivo',p:70,d:'▶️ Reproduce en 1 a la vez\n🤖 Solo dispositivos Android / Web'},
    {n:'Oleada',s:'3 dispositivos',p:130,d:'▶️ Reproduce en 1 a la vez\n🤖 Solo dispositivos Android / Web'},
    {n:'IPTV',s:'1 pantalla',p:80,d:'📲 Funciona en cualquier dispositivo\n🎁 Prueba gratis de 3 horas'},
    {n:'IPTV',s:'2 pantallas',p:110,d:'📲 Funciona en cualquier dispositivo\n🎁 Prueba gratis de 3 horas'},
    {n:'IPTV',s:'3 pantallas',p:140,d:'📲 Funciona en cualquier dispositivo\n🎁 Prueba gratis de 3 horas'},
  ]},
  {cat:'🎶 Música',sub:'Plan mensual',items:[
    {n:'Spotify Premium',p:80,d:'📧 Se entrega correo y contraseña'},
    {n:'Deezer Premium',p:50,d:'📧 Se entrega correo y contraseña'},
  ]},
  {cat:'💻 Productividad',items:[
    {n:'Canva Edu Pro',s:'1 mes',p:20,d:'✉️ Invitación al correo del cliente\n⚠️ Debe estar registrado en Canva'},
    {n:'Microsoft 365',s:'1 año · correo y clave · 5 disp · 100 GB',p:200,d:'📧 Se entrega correo y contraseña\n💻 5 dispositivos\n☁️ 100 GB en Drive'},
    {n:'Microsoft 365',s:'1 año · a correo del cliente · 1 TB',p:350,d:'📧 Al correo del cliente\n🗓️ Vigencia 1 año\n💻 Nivel 5 dispositivos\n☁️ 1 TB en Drive'},
    {n:'Office 2021 Pro Plus',s:'Windows · licencia permanente',p:200,d:'🪟 Solo para Windows\n🔑 Serial de activación\n♾️ Licencia permanente'},
    {n:'Office 2024 Pro Plus',s:'Windows · licencia permanente',p:250,d:'🪟 Solo para Windows\n🔑 Serial de activación\n♾️ Licencia permanente'},
    {n:'Antivirus McAfee',s:'1 año · 1 dispositivo',p:150,d:'🛡️ Protección 1 dispositivo\n🔑 Se entrega key / serial\n🗓️ Vigencia 1 año'},
    {n:'Antivirus McAfee',s:'1 año · 3 dispositivos',p:350,d:'🛡️ Protección 3 dispositivos\n🔑 Se entrega serial\n🗓️ Vigencia 1 año'},
  ]},
  {cat:'🤖 Inteligencia Artificial',items:[
    {n:'Gemini Pro',s:'1 mes',p:100,d:'✉️ Invitación al Gmail del cliente'},
  ]},
  {cat:'🎮 Recargas de juegos',items:[
    {n:'Free Fire',s:'Por comisión',p:null,d:'💬 Consultar precios con su asesor'},
  ]},
];
const PRECIOS_ESPECIALES=[
  {cat:'📺 Streaming',sub:'Plan mensual',items:[
    {id:'netflix_premium',n:'Netflix Premium',s:'1 mes',p:130,d:'Perfil Premium · 1 dispositivo a la vez'},
    {id:'netflix_premium_vip',n:'Netflix Premium VIP',s:'1 mes',p:150,d:'Acceso VIP · 1 dispositivo a la vez'},
    {id:'disney_premium',n:'Disney Premium',s:'1 mes',p:100,d:'Acceso por perfil · 1 dispositivo'},
    {id:'disney_premium_sin_espn',n:'Disney Premium sin ESPN',s:'1 mes',p:70,d:'Acceso por perfil · 1 dispositivo'},
    {id:'hbo_max',n:'HBO Max',s:'1 mes',p:80,d:'Acceso por perfil · 1 dispositivo'},
    {id:'prime_video',n:'Prime Video',s:'1 mes',p:80,d:'Acceso por perfil · 1 dispositivo'},
    {id:'crunchyroll',n:'Crunchyroll',s:'1 mes',p:80,d:'Acceso por perfil · 1 dispositivo'},
    {id:'paramount',n:'Paramount+',s:'1 mes',p:80,d:'Acceso mensual · 1 dispositivo'},
    {id:'vix',n:'ViX',s:'1 mes',p:80,d:'Acceso mensual · 1 dispositivo'},
    {id:'viki_rakuten',n:'Viki Rakuten',s:'1 mes',p:80,d:'Acceso mensual · 1 dispositivo'},
  ]},
  {cat:'📡 IPTV y TV',items:[
    {id:'oleada_tv_1',n:'Oleada TV',s:'1 dispositivo',p:90,d:'Usuario y clave · 1 dispositivo'},
    {id:'oleada_tv_3',n:'Oleada TV',s:'3 dispositivos',p:200,d:'Usuario y clave · 3 dispositivos'},
    {id:'liontv_1',n:'LionTV',s:'1 dispositivo',p:250,d:'Plan LionTV · 1 dispositivo'},
    {id:'liontv_2',n:'LionTV',s:'2 dispositivos',p:275,d:'Plan LionTV · 2 dispositivos'},
    {id:'liontv_3',n:'LionTV',s:'3 dispositivos',p:300,d:'Plan LionTV · 3 dispositivos'},
    {id:'liontv_5',n:'LionTV',s:'5 dispositivos',p:350,d:'Plan LionTV · 5 dispositivos'},
    {id:'latintv_1',n:'LatinTV',s:'1 dispositivo',p:99,d:'Plan LatinTV · 1 dispositivo'},
    {id:'latintv_2',n:'LatinTV',s:'2 dispositivos',p:149,d:'Plan LatinTV · 2 dispositivos'},
    {id:'latintv_3',n:'LatinTV',s:'3 dispositivos',p:199,d:'Plan LatinTV · 3 dispositivos'},
    {id:'latintv_4',n:'LatinTV',s:'4 dispositivos',p:249,d:'Plan LatinTV · 4 dispositivos'},
  ]},
  {cat:'🎵 Música',sub:'Plan mensual',items:[
    {id:'spotify',n:'Spotify Premium',s:'1 mes',p:110,d:'Acceso Premium mensual'},
    {id:'deezer',n:'Deezer Premium',s:'1 mes',p:90,d:'Acceso Premium mensual'},
  ]},
  {cat:'💻 Productividad y seguridad',items:[
    {id:'nod32',n:'ESET NOD32 Antivirus',s:'1 año · 1 dispositivo',p:399,d:'Licencia por 1 año para 1 dispositivo'},
    {id:'duolingo',n:'Duolingo',s:'1 mes',p:89,d:'Acceso mensual'},
    {id:'canva',n:'Canva Pro',s:'1 mes',p:69,d:'Activación por 1 mes'},
    {id:'office_365',n:'Office 365',s:'1 año',p:449,d:'Licencia por 1 año'},
    {id:'office_2021',n:'Office 2021 Pro Plus',s:'Licencia permanente',p:449,d:'Licencia permanente para Windows'},
  ]},
  {cat:'🤖 Inteligencia Artificial',items:[
    {id:'gemini_pro',n:'Gemini Pro',s:'1 mes',p:170,d:'Activación por 1 mes'},
  ]},
];
function esTarifaEspecial(r){const tier=norm(r?.priceTier||r?.tarifa||'');if(tier)return ['especial','vip','diamante','mayorista-especial'].includes(tier);return ['sublicuentas','sublicuentas 2','relojes','geisell','geissel'].includes(norm(r?.nombre_norm||r?.nombre||''))}
let PRECIOS=JSON.parse(JSON.stringify(PRECIOS_BASE));
function toggleDet(id,row){const d=document.getElementById(id);if(!d)return;const open=d.classList.toggle('show');row.classList.toggle('open',open)}
/* ── Políticas y términos (editable: cambiá el texto por el de tu catálogo) ── */
const POLITICAS=[
  {t:'📄 Términos y condiciones', c:
`• Los servicios son suscripciones digitales, en perfil compartido o privado (individual) según el plan elegido.
• En el perfil PRIVADO se entregan correo y contraseña de la cuenta. En el perfil compartido solo se entrega el acceso al perfil asignado, sin correo ni contraseña.
• El cliente se compromete a no cambiar la contraseña, el correo ni la configuración de las cuentas compartidas. Hacerlo puede suspender el servicio sin reembolso.
• El servicio se activa una vez confirmado el pago.
• La vigencia de cada servicio corresponde al periodo contratado.`},
  {t:'🔄 Políticas y devoluciones', c:
`• No se realizan devoluciones de dinero una vez entregado y funcionando el acceso.
• Si una cuenta presenta fallas, se repone o reemplaza sin costo dentro del periodo contratado.
• La garantía cubre fallas de la cuenta, no el mal uso del cliente (cambio de contraseña, compartir el acceso, etc.).
• Todo reemplazo o reclamo se gestiona por el mismo medio de compra (WhatsApp).`},
  {t:'🔒 Política de privacidad', c:
`• Los datos del cliente (nombre, teléfono, correo) se usan únicamente para gestionar y dar soporte al servicio.
• No compartimos ni vendemos los datos a terceros.
• El cliente puede solicitar la eliminación de sus datos al finalizar el servicio.`},
];
function togglePol(el){el.classList.toggle('open');const b=el.querySelector('.pol-body');b.style.maxHeight=el.classList.contains('open')?(b.scrollHeight+30)+'px':'0'}
function politicasHTML(){
  return `<div class="card" style="margin-top:4px">
    <div style="font-family:var(--ff);font-weight:700;font-size:18px;color:var(--txt);margin-bottom:4px">📋 Políticas y términos</div>
    <p style="font-family:var(--fn);font-weight:700;font-size:12.5px;color:var(--muted);margin-bottom:12px">Para tenerlas a mano y compartirlas con el cliente.</p>
    ${POLITICAS.map(p=>`<div class="pol-item" onclick="togglePol(this)">
      <div class="pol-head">${p.t}<span class="det-caret">▾</span></div>
      <div class="pol-body">${p.c}</div>
    </div>`).join('')}
  </div>`;
}

const CAT_THEMES=[
  {g:'linear-gradient(145deg,#8560f2,#6437d3)',s:'#5429b6',i:'🎬'},
  {g:'linear-gradient(145deg,#20c9a1,#0c9c7f)',s:'#087c65',i:'📺'},
  {g:'linear-gradient(145deg,#ffad43,#f07827)',s:'#c65b13',i:'🎵'},
  {g:'linear-gradient(145deg,#36b9ef,#177bdc)',s:'#1162b3',i:'💼'},
  {g:'linear-gradient(145deg,#ff5c83,#db3268)',s:'#b52250',i:'🎮'},
  {g:'linear-gradient(145deg,#8f9caf,#65758b)',s:'#4b596d',i:'🛡️'}
];
function catalogTheme(i){return CAT_THEMES[i%CAT_THEMES.length]}
function catalogIcon(cat,i){const t=norm(cat);if(/stream|pelicula|series/.test(t))return'🎬';if(/iptv|television/.test(t))return'📡';if(/music|musica/.test(t))return'🎵';if(/herramient|productiv|office|ia/.test(t))return'✨';if(/juego|gamer|recarga/.test(t))return'🎮';if(/seguridad|antivirus/.test(t))return'🛡️';return catalogTheme(i).i}
function catalogAppStyle(i){const a=[['linear-gradient(145deg,#ffad43,#f07827)','rgba(240,120,39,.25)'],['linear-gradient(145deg,#24d9bd,#0aa58d)','rgba(10,165,141,.25)'],['linear-gradient(145deg,#ed66df,#b944d6)','rgba(185,68,214,.25)'],['linear-gradient(145deg,#40c8f2,#248be0)','rgba(36,139,224,.25)'],['linear-gradient(145deg,#8969ee,#6741ce)','rgba(103,65,206,.25)']];return a[i%a.length]}
function openCatalogCategory(ix){catalogCategoria=String(ix);vPrecios();window.scrollTo({top:0,behavior:'smooth'})}
function closeCatalogCategory(){catalogCategoria='';vPrecios();window.scrollTo({top:0,behavior:'smooth'})}
function copyCatalogPrice(btn){const txt=btn?.dataset?.copy||'';navigator.clipboard?.writeText(txt)}
function buyFromCatalog(ix){if(socioSinCompras())return;const g=PRECIOS[Number(catalogCategoria)],it=g?.items?.[ix];if(!it)return;const nombre=it.s?`${it.n} · ${it.s}`:it.n,found=compraProductosCatalogo().find(p=>p.nombre===nombre);if(found){const st=inventoryState(found);if(!st.available)return alert('Este producto aparece agotado por el momento.');compraSels=[found.id];compraPickerOpen=false;go('compras')}}
function vPrecios(){
  const restricted=socioSinCompras();
  const me=gamificacion.perfil||{ventas:0,nivel:'Sin nivel'},ventas=Number(me.ventas||0);
  const siguiente=ventas<1?1:ventas<10?10:ventas<26?26:26;
  const progreso=ventas>=26?100:Math.min(100,Math.round((ventas/siguiente)*100));
  const faltan=Math.max(0,siguiente-ventas);
  const oferta=restricted?'':`<div class="reward-card">
      <div class="reward-top"><span>🎁</span><b>Recompensas de socio</b></div>
      <h3>${me.nivel==='Sin nivel'?'Complete su primera venta para alcanzar Diamante.':`${me.nivel} · ${ventas} ventas registradas`}</h3>
      <p>${ventas>=26?'Ya alcanzó el nivel máximo. Puede escoger una recompensa Inmortal.':`Le faltan ${faltan} venta${faltan===1?'':'s'} para ${ventas<1?'Diamante':ventas<10?'Leyenda':'Inmortal'}.`}</p>
      <div class="goalbar"><i style="width:${progreso}%"></i></div>
      <small>${ventas>=26?'Nivel Inmortal':`${ventas} / ${siguiente} ventas`}</small>
      <button class="ask-copy" style="margin-top:12px" onclick="go('recompensas')">Ver y escoger premios</button>
    </div>`;
  const catMs=Number(gamificacion.catalogoActualizadoAt||syncAt.precios||0),catTxt=catMs?new Date(catMs).toLocaleString('es-HN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'sincronizado ahora';
  const rewardMini=!restricted&&(gamificacion.recompensas||[]).length?`<button class="reward-open" style="margin:0 0 16px" onclick="go('recompensas')">🎁 ${gamificacion.perfil?.nivel}: escoja su recompensa <span>›</span></button>`:'';
  const accessNote=restricted?`<div class="geisell-access-note">👀 Consulte y copie sus precios personalizados. Para gestionar vencimientos y mensajes, abra Renovaciones.</div>`:'';
  if(catalogCategoria!==''&&PRECIOS[Number(catalogCategoria)]){
    const ix=Number(catalogCategoria),g=PRECIOS[ix],t=catalogTheme(ix),ico=catalogIcon(g.cat,ix);
    const apps=g.items.map((it,i)=>{
      const [grad,glow]=catalogAppStyle(i);
      const copy=String(`${it.n} · ${it.p==null?'Por comisión':'Lps. '+it.p}`);
      const invItem={catalogId:it.id||'',id:it.id||'',nombre:it.n,base:it.n};
      const stock=inventoryState(invItem);
      const copyBtn=`<button data-copy="${escAttr(copy)}" onclick="copyCatalogPrice(this)">📋 Copiar precio</button>`;
      const buyBtn=stock.available?`<button onclick="buyFromCatalog(${i})">🛒 Nueva compra</button>`:`<button disabled aria-disabled="true">⛔ Agotado</button>`;
      const actions=restricted?copyBtn:buyBtn+copyBtn;
      return `<article class="catalog-app ${!stock.available?'is-out':''}"><div class="catalog-app-main"><span class="catalog-app-icon" style="--app-grad:${grad};--app-glow:${glow}">${compraEmoji(it.n,g.cat)}</span><div class="catalog-app-name"><b>${escHtml(it.n)}</b><small>${escHtml(it.s||'Servicio disponible')}</small><em class="stock-badge ${stock.key}">${escHtml(stock.label)}</em></div><strong class="catalog-app-price">${it.p==null?'Comisión':'Lps. '+Number(it.p).toLocaleString('es-HN')}</strong></div><div class="catalog-app-desc">${escHtml(it.d||'Consulte disponibilidad y condiciones antes de confirmar la venta.')}</div><div class="catalog-app-actions">${actions}</div></article>`;
    }).join('');
    content.innerHTML=`<div class="catalog-detail-shell"><div class="catalog-detail-head" style="background:${t.g};--cat-shadow:${t.s}"><button class="catalog-back" onclick="closeCatalogCategory()">‹</button><div class="cat-icon">${ico}</div><h2>${escHtml(g.cat)}</h2><p>${g.sub?escHtml(g.sub):`${g.items.length} opciones disponibles para sus clientes`}</p></div>${accessNote}<div class="catalog-fresh">Catálogo actualizado · ${catTxt}</div><div class="catalog-app-list">${apps}</div>${politicasHTML()}</div>`;
    return;
  }
  const categorias=PRECIOS.map((g,i)=>{
    const t=catalogTheme(i),ico=catalogIcon(g.cat,i);
    return `<button class="catalog-category" style="background:${t.g};--cat-shadow:${t.s}" onclick="openCatalogCategory(${i})"><span class="cat-arrow">›</span><span class="cat-icon">${ico}</span><b>${escHtml(g.cat)}</b><small>${g.items.length} producto${g.items.length===1?'':'s'}${g.sub?' · '+escHtml(g.sub):''}</small></button>`;
  }).join('');
  content.innerHTML=`<div class="scr-title">${socioGeisell()?'Catálogo de Geisell':'Catálogo mayorista'}</div>${accessNote}<div class="catalog-fresh">Catálogo actualizado · ${catTxt}</div>${rewardMini}<p class="catalog-intro">Seleccione una categoría para consultar aplicaciones, precios y condiciones. Este es su costo mayorista.</p>${oferta}<div class="catalog-section-title"><h2>Categorías</h2><span>${PRECIOS.length} secciones</span></div><div class="catalog-categories">${categorias}</div>${politicasHTML()}`;
}

/* AULA */
function vAula(){
  const plantillas=askPlantillas();
  content.innerHTML=CONFIG.academiaUrl
    ?`<div class="scr-title">Subli Aula</div><div class="aula-wrap"><iframe src="${CONFIG.academiaUrl}" allow="fullscreen"></iframe></div>`
    :`<section class="operations-hero"><h2>Subli Aula</h2><p>Aprenda, complete cursos, gane score e impulse sus ventas con ayuda de Subli IA.</p><img src="${ROBOT_IMG}" alt="Mascota Sublicuentas"></section>
      <div class="ai-panel">
        <b>✨ Asistente IA</b>
        <p>Escribí qué necesitás (cobrar, vender, responder una falla, cerrar una venta…) y la IA te arma el mensaje listo para enviar.</p>
        <textarea id="aiPrompt" placeholder="Ej: mensaje para convencer a un cliente indeciso de Netflix, trato de usted y corto"></textarea>
        <div class="chip-row">
          <button onclick="aiQuick('Mensaje amable para cobrar una renovación, trato de usted, corto')">💰 Cobro</button>
          <button onclick="aiQuick('Mensaje para cerrar una venta de IPTV ya mismo, trato de usted')">🔥 Cierre</button>
          <button onclick="aiQuick('Respuesta para una falla técnica pidiendo captura y dispositivo')">🛠️ Falla</button>
          <button onclick="aiQuick('Mensaje de bienvenida para un cliente nuevo con reglas de uso')">🤝 Bienvenida</button>
          <button onclick="aiQuick('Mensaje para ofrecer un combo de plataformas y que pague mejor')">🎁 Combo</button>
        </div>
        <button class="act primary" style="width:100%" onclick="aiGenerar(event)">Generar mensaje</button>
        <div class="ai-result" id="aiResult" style="display:none">
          <textarea id="aiOut" readonly></textarea>
          <div class="cobro-actions">
            <button class="act ghost" onclick="aiOtra(event)">🎲 Otra</button>
            <button class="act ghost" onclick="aiCopy(event)">Copiar</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><h2>Ask Sublicuentas</h2><a onclick="go('inicio')">Inicio</a></div>
        <p style="color:var(--muted);font-weight:800;font-family:var(--fn);font-size:13.5px;line-height:1.45">Respuestas listas para cobrar, vender, atender fallas y cerrar mejor. Todo queda dentro del aula.</p>
        <div class="ask-grid">${plantillas.map((p,ix)=>`<div class="ask-item"><div class="ai">${p.i}</div><div style="min-width:0"><b>${p.t}</b><p id="askp_${ix}">${p.m}</p><div class="ask-tools"><button onclick='copyAskId("askp_${ix}",event)'>Copiar</button><button onclick='iaVarianteId("askp_${ix}",event)'>✨ IA</button></div></div></div>`).join('')}</div>
      </div>
      <div class="card">
        <div class="card-h"><h2>Centro de entrenamiento</h2><a onclick="go('clientes')">Clientes</a></div>
        <p style="color:var(--muted);font-weight:800;font-family:var(--fn);font-size:13.5px;line-height:1.45">Cursos rápidos para socios: atención, renovaciones, instalación y cierre de ventas.</p>
        <div class="aula-grid">
          <div class="aula-item"><div class="ai">💬</div><div><b>Atención al cliente</b><p>Responda corto, claro y siempre de usted. Confirme dispositivo antes de vender IPTV.</p><button class="ask-copy" onclick="completarCurso('atencion',this)">✓ Marcar completado</button></div></div>
          <div class="aula-item"><div class="ai">🔔</div><div><b>Renovaciones</b><p>Cobre antes del vencimiento. Envíe recordatorio amable, luego urgente y finalmente último aviso.</p><button class="ask-copy" onclick="completarCurso('renovaciones',this)">✓ Marcar completado</button></div></div>
          <div class="aula-item"><div class="ai">📲</div><div><b>Instalaciones</b><p>Pida marca/modelo. Guíe por pasos y solicite captura si aparece error.</p><button class="ask-copy" onclick="completarCurso('instalaciones',this)">✓ Marcar completado</button></div></div>
          <div class="aula-item"><div class="ai">🧾</div><div><b>Reglas de entrega</b><p>No prometa más dispositivos de los vendidos. Indique renovación, perfil, PIN y cuidados.</p><button class="ask-copy" onclick="completarCurso('entregas',this)">✓ Marcar completado</button></div></div>
        </div>
      </div>`;
}
async function completarCurso(cursoId,btn){
  const old=btn.textContent;btn.disabled=true;btn.textContent='Guardando…';
  try{await API.call('/rev/curso-completado',{method:'POST',body:JSON.stringify({cursoId})});btn.textContent='✅ Completado';await loadGamificacion()}catch(e){btn.disabled=false;btn.textContent=old;alert('No se pudo guardar el progreso del curso.')}
}

function askPlantillas(){return [
  {i:'⚡',t:'Disponibilidad',m:'Sí, tenemos disponible. Indíqueme por favor el dispositivo donde lo usará y por cuánto tiempo desea el servicio.'},
  {i:'💳',t:'Precio',m:'Con gusto. El precio depende del servicio y cantidad de pantallas. Le confirmo opciones para que elija la que más le conviene.'},
  {i:'🔔',t:'Renovación hoy',m:'Hola 👋 le recuerdo que su servicio vence *hoy* ⚡ Para no perder el acceso, puede renovar cuando guste. Avíseme y lo dejo activo al toque 🚀'},
  {i:'⏳',t:'Por vencer',m:'Hola 👋 su servicio está *próximo a vencer* 📅 Puede renovar desde ya y seguir disfrutando todo sin interrupciones 🍿 Quedo atento 🙌'},
  {i:'🚨',t:'Vencido',m:'Hola 👋 su servicio ya aparece *vencido* 🛑 No se preocupe, lo reactivo apenas confirme su renovación 🔄 Estoy para servirle 🤝'},
  {i:'🛠️',t:'Falla técnica',m:'Con gusto le ayudo. Envíeme captura del error, dispositivo que usa y desde cuándo le aparece para revisarlo rápido.'},
  {i:'📲',t:'Instalación',m:'Claro. Primero necesito saber si usará Smart TV, TV Box, celular, tablet o computadora para darle los pasos correctos.'},
  {i:'🤝',t:'Cliente nuevo',m:'Bienvenido. Le explico rápido: el servicio se entrega con acceso, reglas de uso y fecha de renovación para que todo quede claro.'},
  {i:'🔥',t:'Cierre directo',m:'Perfecto. Si desea, se lo puedo activar ahora mismo y le envío los datos de acceso al confirmar el pago.'},
  {i:'🎁',t:'Combo',m:'Le puedo armar un combo para que tenga más contenido y pague mejor. Dígame qué plataformas usa más y le recomiendo opción.'},
  {i:'💬',t:'Cliente indeciso',m:'Entiendo. Para que elija mejor, le resumo las opciones por precio, contenido y dispositivo donde lo verá.'},
  {i:'🧓',t:'Adulto mayor',m:'Con gusto le explico despacio. Solo necesito saber qué televisor o celular usa y le voy indicando paso por paso.'},
  {i:'✅',t:'Confirmación pago',m:'Pago confirmado, muchas gracias. En unos momentos le envío sus datos de acceso y la fecha de renovación.'},
  {i:'📌',t:'Reglas de uso',m:'Importante: use solo el dispositivo/pantallas contratadas, no cambie datos de la cuenta y avise si necesita soporte.'},
  {i:'🙌',t:'Agradecimiento',m:'Gracias por renovar con nosotros. Quedamos atentos para apoyarle si necesita algo durante su mes de servicio.'},
  {i:'🔁',t:'Seguimiento',m:'Hola 👋 solo paso a confirmar si desea que le reserve el servicio o si lo dejamos pendiente por ahora.'},
  {i:'💵',t:'Métodos de pago',m:'Con gusto. Puede pagar por transferencia, depósito o billetera. Apenas confirme, le envío sus datos de acceso enseguida.'},
  {i:'📺',t:'Recomendar plataforma',m:'Según lo que ve, le recomiendo la opción que mejor se ajusta a su gusto y dispositivo. ¿Qué tipo de contenido disfruta más?'},
  {i:'🔐',t:'Cambio de contraseña',m:'Por seguridad, no comparta ni cambie los datos de la cuenta. Si necesita un ajuste, escríbame y lo gestiono por usted.'},
  {i:'🧩',t:'Pantallas / perfiles',m:'Recuerde usar solo las pantallas/perfiles contratados. Si necesita más, con gusto le amplío el plan.'},
  {i:'🎯',t:'Promo del mes',m:'Tenemos una promo especial este mes 🎉 Si renueva ahora, aprovecha el mejor precio. ¿Le reservo la suya?'},
  {i:'😟',t:'Cliente molesto',m:'Lamento el inconveniente 🙏 Cuénteme qué pasó y lo resolvemos de inmediato. Su servicio es importante para nosotros.'},
  {i:'⭐',t:'Pedir reseña',m:'Si quedó contento con el servicio, me ayudaría muchísimo una pequeña recomendación 🙏 ¡Gracias por su confianza!'},
  {i:'📅',t:'Recordar fecha',m:'Le anoto su fecha de renovación para avisarle con tiempo. Así nunca pierde el acceso sin querer 🙌'}
]}
function vAsk(){go('aula')}
function copyAsk(txt,ev){navigator.clipboard?.writeText(txt);const b=ev.target,o=b.textContent;b.textContent='Copiado';setTimeout(()=>b.textContent=o,1000)}
/* ── IA del Aula ── */
let aiLastPrompt='';
function aiQuick(t){const ta=document.getElementById('aiPrompt');if(ta){ta.value=t;ta.focus()}}
async function aiGenerar(ev){
  const ta=document.getElementById('aiPrompt'); const t=(ta?.value||'').trim();
  if(!t){alert('Escribí qué mensaje necesitás 🙂');return}
  aiLastPrompt=t;
  const btn=ev.target,old=btn.textContent;btn.textContent='Pensando…';btn.disabled=true;
  const out=await askGemini('Generá un mensaje de WhatsApp para un negocio de suscripciones digitales en Honduras. Pedido: '+t+'. Reglas: español hondureño, trato de usted, claro y cálido, máximo 5 líneas, con 1 o 2 emojis, sin inventar precios. Devolvé SOLO el mensaje.','');
  btn.textContent=old;btn.disabled=false;
  if(!out){alert('La IA no respondió.\n\nDetalle: '+(aiLastError||'sin respuesta')+'\n\nRevisá la llave GEMINI_API_KEY en Render.');return}
  const box=document.getElementById('aiResult'),o=document.getElementById('aiOut');
  o.value=out;box.style.display='block';o.scrollIntoView({behavior:'smooth',block:'center'});
}
async function aiOtra(ev){
  if(!aiLastPrompt)return;
  const btn=ev.target,old=btn.textContent;btn.textContent='🎲…';btn.disabled=true;
  const out=await askGemini('Generá OTRA versión distinta de un mensaje de WhatsApp. Pedido: '+aiLastPrompt+'. Reglas: español hondureño, trato de usted, cálido, máximo 5 líneas, 1-2 emojis, sin precios, redacción diferente a la anterior. Devolvé SOLO el mensaje.','');
  btn.textContent=old;btn.disabled=false;
  if(out)document.getElementById('aiOut').value=out;
}
function aiCopy(ev){const v=document.getElementById('aiOut').value;navigator.clipboard?.writeText(v);const b=ev.target,o=b.textContent;b.textContent='¡Copiado!';setTimeout(()=>b.textContent=o,1200)}
function copyAskId(pid,ev){const t=document.getElementById(pid)?.textContent||'';navigator.clipboard?.writeText(t);const b=ev.target,o=b.textContent;b.textContent='¡Copiado!';setTimeout(()=>b.textContent=o,1000)}
async function iaVarianteId(pid,ev){
  const el=document.getElementById(pid);if(!el)return;
  const base=el.textContent||'';
  const btn=ev.target,old=btn.textContent;btn.textContent='✨…';btn.disabled=true;
  const out=await askGemini('Reescribí este mensaje con otras palabras, mismo sentido, para WhatsApp. Español hondureño, trato de usted, cálido, máximo 5 líneas, 1-2 emojis. Mensaje base: "'+base+'". Devolvé SOLO el mensaje nuevo.','');
  btn.textContent=old;btn.disabled=false;
  if(!out){alert('La IA no respondió.\n\nDetalle: '+(aiLastError||'sin respuesta')+'\n\nRevisá la llave GEMINI_API_KEY en Render.');return}
  el.textContent=out;                 // cambia el texto AHÍ MISMO
  el.style.transition='background .3s';el.style.background='#FFF7CC';
  setTimeout(()=>{el.style.background='transparent'},700);
}
