/* AgroCore - tracking de conversiones (GA4 + Google Ads)
 * Centraliza los 3 eventos de conversion del sitio:
 *   - trial_signup   : "Crear mi prueba gratis" (alta de prueba en /prueba)
 *   - contact_whatsapp: clic en cualquier boton/enlace de WhatsApp
 *   - generate_lead  : "Enviar consulta" (formulario de contacto)
 *
 * Como queda contando en Google Ads (elegi UNA de las dos):
 *  A) RECOMENDADO - Importar desde GA4: en Google Ads -> Objetivos ->
 *     Conversiones -> + Nueva -> "Importar" -> Google Analytics 4 y elegi los
 *     eventos trial_signup, contact_whatsapp y generate_lead. No hace falta
 *     tocar nada mas aca.
 *  B) Conversion directa de Ads: crea cada conversion en Ads (Sitio web),
 *     copia su "Etiqueta de conversion" y pegala abajo en AC_ADS_LABELS.
 *     Ej: trial_signup:'AbC-dEfGhIj'. Con eso se dispara gtag conversion.
 */
(function(){
  window.AC_ADS_ID = 'AW-18358928255';
  window.AC_ADS_LABELS = window.AC_ADS_LABELS || {
    trial_signup: 'WzIOCMWm3JsdEP-GnLJE',   // "Registro" (alta de prueba gratis)
    contact_whatsapp: 'alZICOCg9tscEP-GnLJE', // "Clic WhatsApp"
    generate_lead: 'n3pPCJbo9dscEP-GnLJE'   // "Enviar formulario de clientes potenciales"
  };
  function ads(key){
    try{
      var l = window.AC_ADS_LABELS[key];
      if(l && typeof gtag === 'function'){ gtag('event','conversion',{ send_to: window.AC_ADS_ID + '/' + l }); }
    }catch(e){}
  }
  // acTrack(accion, params) -> dispara el evento GA4 y, si hay etiqueta, la conversion de Ads.
  window.acTrack = function(action, params){
    try{ if(typeof gtag === 'function') gtag('event', action, params || {}); }catch(e){}
    if(action === 'trial_signup'){ try{ if(typeof gtag === 'function') gtag('event','sign_up',{ method:'trial' }); }catch(e){} }
    ads(action);
  };
  // Cualquier clic en un enlace de WhatsApp cuenta como conversion de contacto.
  document.addEventListener('click', function(e){
    try{
      var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me"],a[href*="api.whatsapp.com"],a[href^="whatsapp:"]') : null;
      if(a){ window.acTrack('contact_whatsapp', { link_url: a.href }); }
    }catch(_){}
  }, true);
})();
