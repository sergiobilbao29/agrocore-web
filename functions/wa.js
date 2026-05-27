/**
 * Redirector /wa — abre WhatsApp en el destino correcto según el dispositivo.
 *
 * Útil cuando armamos links de WhatsApp en lugares donde no hay JavaScript
 * (mails, PDFs, mensajes, etc.) y queremos saltar el cartel intermedio
 * "¿Abrir WhatsApp?" cuando el usuario está en una PC.
 *
 * Detecta el User-Agent del request:
 *   - Mobile (Android / iOS) → wa.me/<phone>  → abre la app nativa de WhatsApp.
 *   - Desktop                → web.whatsapp.com/send?phone=<phone>
 *                              → abre directamente en la pestaña de WhatsApp Web.
 *
 * Uso desde un link:
 *   https://agrocore.ar/wa?p=5493582408884
 *   https://agrocore.ar/wa?p=5493582408884&t=Hola%20!
 */
export function onRequest({ request }) {
  const url = new URL(request.url);
  const phone = (url.searchParams.get('p') || '').replace(/\D/g, '');
  const text  = url.searchParams.get('t') || '';

  // Sin teléfono no tiene mucho sentido — mandamos a la home.
  if (!phone) {
    return Response.redirect('https://agrocore.ar/', 302);
  }

  const ua = request.headers.get('user-agent') || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  let target;
  if (isMobile) {
    target = 'https://wa.me/' + phone + (text ? '?text=' + encodeURIComponent(text) : '');
  } else {
    const qs = ['phone=' + phone];
    if (text) qs.push('text=' + encodeURIComponent(text));
    target = 'https://web.whatsapp.com/send?' + qs.join('&');
  }

  // 302 (temporal) para que los navegadores no cacheen la decisión: si el mismo
  // usuario abre el link primero del desktop y después del cel, se recalcula.
  return Response.redirect(target, 302);
}
