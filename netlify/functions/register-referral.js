/**
 * Registra que un cliente nuevo viene recomendado por otro, a partir del CÓDIGO
 * de recomendación (p. ej. LJ-7K3Q9X). Se hace en el servidor para no exponer
 * nunca el email de quien recomienda.
 *
 * Reglas: el código debe existir, no vale recomendarse a uno mismo, el cliente
 * nuevo no puede haber comprado antes ni tener ya otra recomendación.
 */
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const { code, referredEmail } = JSON.parse(event.body || "{}");
    const cleanCode = String(code || "").trim().toUpperCase();
    const referred = String(referredEmail || "").trim().toLowerCase();
    if (!cleanCode || !referred) return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos" }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: owner } = await supabase.from("customer_codes").select("email").eq("code", cleanCode).maybeSingle();
    if (!owner) return { statusCode: 200, body: JSON.stringify({ registered: false, reason: "codigo_no_valido" }) };
    const referrer = owner.email.toLowerCase();
    if (referrer === referred) return { statusCode: 200, body: JSON.stringify({ registered: false, reason: "autorreferencia" }) };

    const { data: existing } = await supabase.from("referrals").select("id").eq("referred_email", referred).maybeSingle();
    if (existing) return { statusCode: 200, body: JSON.stringify({ registered: false, reason: "ya_recomendado" }) };

    const { data: ordersRow } = await supabase.from("app_storage").select("value").eq("key", "lonja:orders").eq("shared", true).maybeSingle();
    const orders = Array.isArray(ordersRow?.value) ? ordersRow.value : [];
    const alreadyBought = orders.some((o) => o.status !== "cancelado" && (o.shippingAddress?.email || "").trim().toLowerCase() === referred);
    if (alreadyBought) return { statusCode: 200, body: JSON.stringify({ registered: false, reason: "ya_ha_comprado" }) };

    const { error } = await supabase.from("referrals").insert({ referrer_email: referrer, referred_email: referred, status: "pending" });
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ registered: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
