/**
 * Cuando un producto vuelve a tener stock, avisa por email a todo el que
 * había pedido que le avisaran. Usa la clave "service role" porque los
 * emails de quienes piden la alerta son privados (no legibles ni por el
 * propio vendedor desde el navegador).
 */

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { productId } = JSON.parse(event.body || "{}");
    if (!productId) return { statusCode: 400, body: JSON.stringify({ error: "Falta productId" }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: alerts, error } = await supabase
      .from("product_alerts")
      .select("*")
      .eq("product_id", productId)
      .eq("alert_type", "back_in_stock")
      .is("notified_at", null);
    if (error) throw error;
    if (!alerts?.length) return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };

    const { data: product } = await supabase.from("products").select("name").eq("id", productId).maybeSingle();
    const from = process.env.RESEND_FROM_EMAIL || "LonjaYa <onboarding@resend.dev>";

    let sent = 0;
    for (const alert of alerts) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [alert.buyer_email],
          subject: `Ya está disponible: ${product?.name || "el producto que buscabas"}`,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#0E3A45">¡Ya está disponible!</h2>
            <p><strong>${product?.name || "El producto"}</strong> ha vuelto a tener stock en LonjaYa.</p>
            <p><a href="https://lonjaya.com" style="color:#2F6B5E">Ir a comprarlo</a> antes de que se agote otra vez.</p>
          </div>`,
        }),
      });
      await supabase.from("product_alerts").update({ notified_at: new Date().toISOString() }).eq("id", alert.id);
      sent++;
    }

    return { statusCode: 200, body: JSON.stringify({ sent }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
