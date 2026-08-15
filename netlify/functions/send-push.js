/**
 * Envía una notificación push a todas las suscripciones guardadas de un
 * comprador (buyer_email). Usa la clave privada VAPID, que solo existe en
 * el servidor. Si una suscripción ya no es válida (el navegador la borró),
 * se elimina de la base de datos sin más.
 */

const webpush = require("web-push");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { buyerEmail, title, body, url } = JSON.parse(event.body || "{}");
    if (!buyerEmail || !title) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos (buyerEmail, title)" }) };
    }

    webpush.setVapidDetails(
      "mailto:" + (process.env.ADMIN_EMAIL || "contacto@lonjaya.com"),
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: subs, error } = await supabase.from("push_subscriptions").select("*").eq("buyer_email", buyerEmail);
    if (error) throw error;

    let sent = 0;
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({ title, body, url })
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ sent }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
