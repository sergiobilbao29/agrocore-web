/* AgroCore - Asistente web (100% navegador, sin servidor). Requiere bot-kb.js */
(function(){
  if (window.__agroBot) return; window.__agroBot = true;
  var KB = window.AGRO_KB || {sistema:[],calc:[],guia:[],vade:[]};
  var sa = function(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); };
  var STOP = {'de':1,'la':1,'el':1,'los':1,'las':1,'un':1,'una':1,'y':1,'o':1,'que':1,'como':1,'cual':1,'cuanto':1,'cuanta':1,'para':1,'con':1,'en':1,'del':1,'al':1,'se':1,'es':1,'mi':1,'me':1,'por':1,'lo':1,'su':1,'a':1,'the':1};
  function toks(s){ return sa(s).replace(/[^a-z0-9ñ ]/g,' ').split(/\s+/).filter(function(w){return w.length>2 && !STOP[w];}); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var IDX = [];
  (KB.sistema||[]).forEach(function(x){ IDX.push({tipo:'sistema', titulo:x.p, texto:x.p+' '+x.r, resp:esc(x.r)}); });
  (KB.calc||[]).forEach(function(x){ IDX.push({tipo:'calc', titulo:x.n, texto:x.n+' '+x.u+' '+x.f, resp:'<b>'+esc(x.n)+'</b><br>'+esc(x.u)+'<br><span style="color:#166534">Cómo se calcula:</span> '+esc(x.f)}); });
  (KB.guia||[]).forEach(function(x){ IDX.push({tipo:'guia', titulo:x.t, texto:x.t+' '+x.c, resp:'<b>'+esc(x.t)+'</b><br>'+esc(x.c)}); });
  (KB.vade||[]).forEach(function(v){
    var cult=(v.cultivos||[]).join(', '), obj=(v.objetivos||[]).join(', ');
    var r='<b>'+esc(v.principioActivo)+'</b> ('+esc(v.tipo||'')+')'+(v.grupoMoa?' · '+esc(v.grupoMoa):'')+'<br>'+
      (v.dosis?('<span style="color:#166534">Dosis:</span> '+esc(v.dosis)+'<br>'):'')+
      (cult?('<span style="color:#166534">Cultivos:</span> '+esc(cult)+'<br>'):'')+
      (obj?('<span style="color:#166534">Controla:</span> '+esc(obj)+'<br>'):'')+
      (v.bandaTox?('<span style="color:#166534">Banda:</span> '+esc(v.bandaTox)+' '):'')+
      (v.carencia?('· <span style="color:#166534">Carencia:</span> '+esc(v.carencia)):'')+
      (v.nota?('<br><i>'+esc(v.nota)+'</i>'):'');
    IDX.push({tipo:'vade', titulo:v.principioActivo, texto:[v.principioActivo,v.tipo,v.grupoMoa,cult,obj,v.dosis,v.nota].join(' '), resp:r});
  });
  IDX.forEach(function(it){ it._t = toks(it.texto); });

  function buscar(q){
    var qt = toks(q); if(!qt.length) return [];
    var res = IDX.map(function(it){
      var sc=0; qt.forEach(function(w){
        if(it._t.indexOf(w)>=0) sc+=2;
        else if(it._t.some(function(t){return t.indexOf(w)>=0;})) sc+=1;
        if(sa(it.titulo).indexOf(w)>=0) sc+=2;
      });
      return {it:it, sc:sc};
    }).filter(function(x){return x.sc>0;}).sort(function(a,b){return b.sc-a.sc;});
    return res.slice(0,4).map(function(x){return x.it;});
  }

  var CSS = '#agb-btn{position:fixed;right:18px;bottom:18px;z-index:99999;background:#166534;color:#fff;border:none;border-radius:999px;padding:12px 18px;font-weight:700;font-family:Inter,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer;font-size:14px}'+
  '#agb-btn:hover{background:#14532d}'+
  '#agb-panel{position:fixed;right:18px;bottom:74px;z-index:99999;width:360px;max-width:calc(100vw - 36px);height:520px;max-height:calc(100vh - 110px);background:#fff;border:1px solid #d1d5db;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,sans-serif}'+
  '#agb-head{background:#166534;color:#fff;padding:12px 14px;font-weight:700;display:flex;justify-content:space-between;align-items:center}'+
  '#agb-head small{font-weight:400;opacity:.85;display:block;font-size:11px}'+
  '#agb-x{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}'+
  '#agb-msgs{flex:1;overflow-y:auto;padding:12px;background:#f8fafc}'+
  '.agb-m{margin-bottom:10px;font-size:13.5px;line-height:1.45}'+
  '.agb-u{text-align:right}.agb-u span{background:#166534;color:#fff;padding:8px 11px;border-radius:12px 12px 2px 12px;display:inline-block;max-width:85%}'+
  '.agb-b span{background:#fff;border:1px solid #e2e8f0;color:#1e293b;padding:9px 12px;border-radius:12px 12px 12px 2px;display:inline-block;max-width:92%}'+
  '.agb-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px}'+
  '.agb-chip{background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer}'+
  '.agb-chip:hover{background:#bbf7d0}'+
  '#agb-foot{display:flex;gap:6px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}'+
  '#agb-in{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:9px 11px;font-size:13.5px;outline:none}'+
  '#agb-in:focus{box-shadow:0 0 0 2px #22c55e}'+
  '#agb-send{background:#166534;color:#fff;border:none;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}';

  function el(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstElementChild; }
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
  var btn=el('<button id="agb-btn">💬 Asistente</button>');
  var panel=el('<div id="agb-panel"><div id="agb-head"><div>Asistente AgroCore<small>Sistema · calculadoras · vademécum · Guía del Ing. Agrónomo</small></div><button id="agb-x" title="Cerrar">×</button></div><div id="agb-msgs"></div><div id="agb-foot"><input id="agb-in" placeholder="Escribí tu consulta…" autocomplete="off"/><button id="agb-send">➤</button></div></div>');
  document.body.appendChild(btn); document.body.appendChild(panel);
  var msgs=panel.querySelector('#agb-msgs'), input=panel.querySelector('#agb-in');

  function add(html, who){ var m=el('<div class="agb-m agb-'+(who==='u'?'u':'b')+'"><span>'+html+'</span></div>'); msgs.appendChild(m); msgs.scrollTop=msgs.scrollHeight; return m; }
  function chips(list){
    var c=el('<div class="agb-chips"></div>');
    list.forEach(function(t){ var b=el('<button class="agb-chip">'+esc(t)+'</button>'); b.onclick=function(){ input.value=t; responder(t); }; c.appendChild(b); });
    msgs.appendChild(c); msgs.scrollTop=msgs.scrollHeight;
  }
  function log(q, hit){
    // Registro de consultas: se manda como evento a Google Analytics (si está gtag).
    try{ if(typeof gtag==='function'){ gtag('event','bot_consulta',{
      pregunta:String(q||'').slice(0,100),
      tema: hit?hit.tipo:'sin_resultado',
      respuesta: hit?String(hit.titulo||'').slice(0,100):'(sin resultado)'
    }); } }catch(e){}
  }
  // Charla / cortesía: responde a saludos, gracias, negativas, etc. (sin buscar en la base).
  function smalltalk(q){
    var n = sa(q).replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ').trim();
    if(!n) return null;
    var IN = function(arr){ return arr.indexOf(n)>=0; };
    var HAS = function(w){ return (' '+n+' ').indexOf(' '+w+' ')>=0; };
    // Cierre / negativas (incluye "no gracias") — chequear antes que "gracias".
    if(IN(['no','no gracias','nada','nada mas','nada más','ninguno','ninguna','listo','ya esta','ya está','chau','adios','adiós','nos vemos','no por ahora','todo bien','esta bien','está bien'])){
      return 'Listo. Cuando necesites algo del sistema, las calculadoras o el vademécum, escribime. 🌱'; }
    // Agradecimiento
    if(HAS('gracias')||IN(['genial','perfecto','buenisimo','buenísimo','barbaro','bárbaro','joya','de una','crack','excelente'])){
      return '¡De nada! Si querés, preguntame otra cosa.'; }
    // Saludos
    if(/^(hola|buenas|buen dia|buen día|buenos dias|buenos días|buenas tardes|buenas noches|hey|ey|que tal|qué tal|holis)\b/.test(n)){
      return '¡Hola! ¿En qué te ayudo? Puedo con el sistema, calculadoras agronómicas, vademécum y la Guía del Ing. Agrónomo.'; }
    // Afirmaciones sueltas
    if(IN(['si','sí','dale','ok','oka','okey','bueno','claro','obvio','sip','sisi','de una'])){
      return '¡Bien! Contame el tema y te amplío (ej. "densidad de siembra", "glifosato", "costo del kilo").'; }
    // Pedido de ayuda / qué sabe
    if(HAS('ayuda')||/que (podes|puedes|sabes|haces|hace)/.test(n)||n==='?'){
      return 'Puedo ayudarte con: 🧮 <b>calculadoras</b> (densidad, urea, pulverizadora, rinde…), 🧫 <b>vademécum</b> (dosis, modo de acción, carencia), 💻 el <b>sistema</b> (costo del kilo, flujo de fondos, facturación…) y la 📘 <b>Guía del Ing. Agrónomo</b>. Escribí una palabra clave.'; }
    return null;
  }
  var AGRO_BOT_API = 'https://demo.agrocore.ar';
  // ¿El match local es "fuerte"? (consulta corta cuyos términos están casi todos en el tema)
  function confiable(q, hit){
    var qt=toks(q); if(!qt.length||!hit) return false;
    var m=0; qt.forEach(function(w){ if(hit._t.indexOf(w)>=0 || sa(hit.titulo).indexOf(w)>=0) m++; });
    return qt.length<=3 && m===qt.length;
  }
  function fmtIA(t){ return esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>'); }
  async function askIA(q){
    try{
      var r=await fetch(AGRO_BOT_API+'/api/bot-web',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pregunta:q})});
      var j=await r.json();
      if(j && j.ok && j.respuesta) return { texto:j.respuesta, fuente:j.fuente||'ia' };
    }catch(e){}
    return null;
  }
  async function responder(q){
    add(esc(q),'u'); input.value='';
    var st=smalltalk(q);
    if(st){ log(q,{tipo:'charla',titulo:q}); add(st,'b'); return; }
    var hits=buscar(q);
    // 1) Match local fuerte → respuesta instantánea (gratis)
    if(hits.length && confiable(q, hits[0])){
      log(q, hits[0]); add(hits[0].resp,'b');
      if(hits.length>1){ add('¿Querés saber más sobre alguno de estos temas?','b'); chips(hits.slice(1).map(function(h){return h.titulo;})); }
      return;
    }
    // 2) Pregunta libre → IA (con la base como contexto en el server)
    var pensando=add('Pensando… ⏳','b');
    var ia=await askIA(q);
    if(pensando && pensando.parentNode) pensando.parentNode.removeChild(pensando);
    if(ia && ia.texto){
      log(q,{tipo:ia.fuente,titulo:q}); add(fmtIA(ia.texto),'b');
      if(hits.length){ chips(hits.slice(0,3).map(function(h){return h.titulo;})); }
      return;
    }
    // 3) Fallback: mejor resultado local, o mensaje de ayuda
    if(hits.length){ log(q,hits[0]); add(hits[0].resp,'b'); if(hits.length>1){ add('¿Querés saber más sobre alguno de estos temas?','b'); chips(hits.slice(1).map(function(h){return h.titulo;})); } return; }
    log(q,null); add('No encontré algo puntual. Probá con: una calculadora (ej. "densidad de siembra", "urea"), un principio activo del vademécum (ej. "glifosato"), o una función del sistema (ej. "costo del kilo", "flujo de fondos").','b');
  }
  function saludo(){
    if(msgs.childElementCount) return;
    add('¡Hola! Soy el asistente de AgroCore. Puedo ayudarte con el <b>sistema</b>, las <b>calculadoras agronómicas</b>, el <b>vademécum de insumos</b> y la <b>Guía del Ing. Agrónomo</b>. ¿Qué querés saber?','b');
    chips(['¿Qué es AgroCore?','Densidad de siembra','Dosis de glifosato','Costo del kilo de carne','Rinde de indiferencia']);
  }
  function open(){ panel.style.display='flex'; saludo(); setTimeout(function(){input.focus();},80); }
  btn.onclick=function(){ panel.style.display==='flex'?panel.style.display='none':open(); };
  panel.querySelector('#agb-x').onclick=function(){ panel.style.display='none'; };
  panel.querySelector('#agb-send').onclick=function(){ if(input.value.trim()) responder(input.value.trim()); };
  input.addEventListener('keydown',function(e){ if(e.key==='Enter' && input.value.trim()) responder(input.value.trim()); });
})();
