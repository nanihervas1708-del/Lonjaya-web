/**
 * Envía un email a través de Resend. Recibe {to, subject, html} desde el
 * navegador y hace la llamada real a la API de Resend desde el servidor
 * (nunca desde el navegador, para no exponer la clave secreta).
 */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { to, subject, html } = JSON.parse(event.body || "{}");
    if (!to || !subject || !html) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos del email (to, subject, html)" }) };
    }

    const from = process.env.RESEND_FROM_EMAIL || "LonjaYa <onboarding@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
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
