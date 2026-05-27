/**
 * Cloudflare Pages Function — endpoint del formulario de contacto.
 *
 * Recibe el POST del form de agrocore.ar y envía un mail con plantilla HTML
 * en español, branding AgroCore, vía Resend (https://resend.com).
 *
 * ===== Setup =====
 * 1. Crear cuenta gratis en https://resend.com (3.000 mails/mes sin tarjeta).
 * 2. Generar API key (Dashboard → API Keys → Create).
 * 3. En Cloudflare Pages (proyecto agrocore-web) → Settings → Environment
 *    variables → agregar:
 *       RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *       CONTACT_TO     = sergiodbilbao@gmail.com   (a quién llegan las consultas)
 * 4. (Opcional) Verificar el dominio agrocore.ar en Resend para usar
 *    "consultas@agrocore.ar" como remitente. Hasta entonces se usa el
 *    sender por defecto de Resend (onboarding@resend.dev).
 * 5. Hacer un git push (cualquier cambio) para que Cloudflare re-deploye con
 *    la variable nueva disponible.
 *
 * Ante cualquier error, el frontend hace fallback a WhatsApp para que la
 * consulta no se pierda.
 */
export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); }
  catch { return _json({ ok: false, error: 'JSON inválido' }, 400); }

  // Honeypot anti-spam (campo invisible del form)
  if (data.botcheck) return _json({ ok: false, error: 'spam' }, 400);

  // Validación mínima
  const nombre  = (data.nombre  || '').trim();
  const email   = (data.email   || '').trim();
  const mensaje = (data.mensaje || '').trim();
  const telefono = (data.telefono || '').trim();
  const empresa  = (data.empresa  || '').trim();
  if (!nombre)  return _json({ ok: false, error: 'Falta el nombre' }, 400);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return _json({ ok: false, error: 'Email inválido' }, 400);
  if (!mensaje) return _json({ ok: false, error: 'Falta el mensaje' }, 400);

  if (!env.RESEND_API_KEY) {
    return _json({
      ok: false,
      error: 'El servicio de mail no está configurado todavía. Probá por WhatsApp.',
      noConfig: true,
    }, 503);
  }

  const to = env.CONTACT_TO || 'sergiodbilbao@gmail.com';
  const from = env.CONTACT_FROM || 'AgroCore <onboarding@resend.dev>';

  const fechaArg = new Date().toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'long', timeStyle: 'short',
  });

  const subject = `Nueva consulta de ${nombre} — AgroCore.ar`;

  const html = _armarEmailHtml({ nombre, email, telefono, empresa, mensaje, fechaArg });
  const text = _armarEmailText({ nombre, email, telefono, empresa, mensaje, fechaArg });

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject,
      html,
      text,
    }),
  });

  if (!resendResp.ok) {
    let detalle = '';
    try { detalle = JSON.stringify(await resendResp.json()); } catch { detalle = await resendResp.text(); }
    return _json({ ok: false, error: 'Resend devolvió ' + resendResp.status, detalle }, 502);
  }

  return _json({ ok: true });
}

function _json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function _armarEmailText({ nombre, email, telefono, empresa, mensaje, fechaArg }) {
  return [
    `Nueva consulta desde AgroCore.ar`,
    `Recibida el ${fechaArg}`,
    ``,
    `Nombre:    ${nombre}`,
    `Email:     ${email}`,
    telefono ? `Teléfono:  ${telefono}` : null,
    empresa  ? `Empresa:   ${empresa}`  : null,
    ``,
    `Mensaje:`,
    mensaje,
    ``,
    `--`,
    `AgroCore Argentina · agrocore.ar`,
  ].filter(Boolean).join('\n');
}

function _armarEmailHtml({ nombre, email, telefono, empresa, mensaje, fechaArg }) {
  const telDigits = String(telefono || '').replace(/\D/g, '');
  const filas = [
    ['Nombre',   _esc(nombre)],
    ['Email',    `<a href="mailto:${_esc(email)}" style="color:#15803d;text-decoration:none">${_esc(email)}</a>`],
    telefono ? ['Teléfono', _esc(telefono)] : null,
    empresa  ? ['Empresa',  `<strong>${_esc(empresa)}</strong>`] : null,
  ].filter(Boolean).map(([k, v]) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#64748b;width:110px;vertical-align:top">${k}</td>
      <td style="padding:8px 0;font-size:14px;color:#1e293b">${v}</td>
    </tr>`).join('');

  // Mensaje con saltos de línea preservados (escapamos HTML y mantenemos \n).
  const mensajeHtml = _esc(mensaje).replace(/\n/g, '<br>');

  const waButton = telDigits ? `
    <a href="https://wa.me/${telDigits}" style="display:inline-block;background:#25d366;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;margin-left:8px">
      💬 Abrir WhatsApp
    </a>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nueva consulta — AgroCore</title>
</head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1e293b;line-height:1.5">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">
    <tr>
      <td style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:28px 24px;text-align:center;color:#ffffff">
        <div style="font-size:13px;font-weight:600;opacity:.85;letter-spacing:.5px;text-transform:uppercase">🌾 AgroCore Argentina</div>
        <div style="font-size:22px;font-weight:800;margin-top:6px">Nueva consulta desde el sitio</div>
        <div style="font-size:12px;opacity:.8;margin-top:6px">${_esc(fechaArg)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px">
        <h2 style="margin:0 0 18px;font-size:18px;color:#15803d;font-weight:700">${_esc(nombre)} te escribió</h2>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;border-collapse:collapse">
          ${filas}
        </table>

        <div style="background:#f0fdf4;border-left:4px solid #15803d;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">Mensaje</div>
          <div style="font-size:14px;color:#1e293b;white-space:pre-wrap">${mensajeHtml}</div>
        </div>

        <div style="text-align:center">
          <a href="mailto:${_esc(email)}?subject=Re%3A%20Tu%20consulta%20en%20AgroCore" style="display:inline-block;background:#15803d;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            ✉️ Responder por mail
          </a>${waButton}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:14px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
        AgroCore Argentina · <a href="https://agrocore.ar" style="color:#94a3b8;text-decoration:none">agrocore.ar</a> · El corazón del negocio agrícola
      </td>
    </tr>
  </table>
</body>
</html>`;
}
