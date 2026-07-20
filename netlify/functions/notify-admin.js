/**
 * Envía una notificación al administrador de LonjaYa (reclamaciones,
 * mensajes de contacto, nuevas solicitudes de vendedor...).
 *
 * A diferencia de send-email.js, aquí el destinatario NUNCA se recibe desde
 * el navegador: se lee siempre de la variable de entorno ADMIN_EMAIL,
 * configurada solo en el servidor (Netlify). Así, aunque alguien inspeccione
 * las peticiones de red de la web, no puede ver la dirección de email real
 * del administrador en ningún momento.
 */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { subject, html } = JSON.parse(event.body || "{}");
    if (!subject || !html) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos del mensaje (subject, html)" }) };
    }

    const to = process.env.ADMIN_EMAIL;
    if (!to) {
      return { statusCode: 500, body: JSON.stringify({ error: "ADMIN_EMAIL no está configurado en el servidor" }) };
    }

    const from = process.env.RESEND_FROM_EMAIL || "LonjaYa <onboarding@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data }) };
    }
    return { statusCode: 200, body: JSON.stringify({ id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
