/**
 * Se ejecuta sola cada hora (configurado en netlify.toml). Busca intentos
 * de checkout de hace más de 2 horas que no se convirtieron en compra ni
 * recibieron ya un aviso, y manda un recordatorio por email.
 */

const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: attempts, error } = await supabase
      .from("checkout_attempts")
      .select("*")
      .lt("created_at", twoHoursAgo)
      .eq("converted", false)
      .is("reminded_at", null)
      .limit(50);

    if (error) throw error;

    const from = process.env.RESEND_FROM_EMAIL || "LonjaYa <onboarding@resend.dev>";
    let sent = 0;

    for (const attempt of attempts || []) {
      const lines = attempt.cart_snapshot || [];
      const itemsHtml = lines.map((l) => `<li>${l.qty} × ${l.name}</li>`).join("");
      const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#0E3A45">¿Se te olvidó algo, ${attempt.name || ""}?</h2>
          <p>Dejaste estos productos en tu cesta de LonjaYa:</p>
          <ul>${itemsHtml}</ul>
          <p>Siguen disponibles, pero el pescado fresco no espera — vuelve cuando quieras a terminar tu pedido.</p>
          <p><a href="https://lonjaya.com/#cart" style="color:#2F6B5E">Volver a mi cesta</a></p>
        </div>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [attempt.email], subject: "¿Se te olvidó algo en LonjaYa?", html }),
      });

      await supabase.from("checkout_attempts").update({ reminded_at: new Date().toISOString() }).eq("id", attempt.id);
      sent++;
    }

    return { statusCode: 200, body: JSON.stringify({ sent }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

exports.config = {
  schedule: "@hourly",
};
