/**
 * Se llama cuando un cliente referido tiene un pedido CONFIRMADO. Si venía
 * recomendado por otro cliente, marca la recomendación como completada y da
 * 500 puntos de bonus a cada uno (en referral_bonus_ledger). Como el bonus se
 * concede después de ese primer pedido, el cliente nuevo lo puede canjear a
 * partir de su segunda compra (y quien recomendó, en su siguiente compra).
 *
 * Todo se comprueba en el servidor con la clave "service role": no se fía de
 * lo que mande el navegador, salvo del email del referido.
 *  - el referido debe tener un pedido confirmado de verdad,
 *  - recomendador y referido no pueden compartir teléfono ni dirección
 *    (evita que alguien se recomiende a sí mismo con otro email),
 *  - cada recomendación solo se premia una vez.
 */

const { createClient } = require("@supabase/supabase-js");

const REFERRAL_REWARD_POINTS = 500;

const digits = (t) => String(t || "").replace(/\D/g, "");
const phoneKey = (t) => digits(t).slice(-9);
const addrKey = (a) =>
  (String(a?.address || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")) + "|" + digits(a?.postal);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { referredEmail } = JSON.parse(event.body || "{}");
    const referredLc = String(referredEmail || "").trim().toLowerCase();
    if (!referredLc) return { statusCode: 400, body: JSON.stringify({ error: "Falta referredEmail" }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: referral } = await supabase
      .from("referrals").select("*").eq("referred_email", referredLc).eq("status", "pending").maybeSingle();
    if (!referral) return { statusCode: 200, body: JSON.stringify({ completed: false }) };

    const byEmail = async (email) => {
      const { data } = await supabase.from("orders").select("status, data").eq("buyer_email", email);
      return (data || []).map((r) => ({ ...r.data, status: r.status }));
    };

    const referredOrders = await byEmail(referredLc);
    if (!referredOrders.some((o) => o.status === "confirmado")) {
      return { statusCode: 200, body: JSON.stringify({ completed: false, reason: "sin_pedido_confirmado" }) };
    }

    // Antifraude: no puede compartir teléfono ni dirección con quien le recomienda.
    const referrerOrders = await byEmail(String(referral.referrer_email).toLowerCase());
    const refPhones = new Set(referrerOrders.map((o) => phoneKey(o.shippingAddress?.phone)).filter((p) => p.length === 9));
    const refAddrs = new Set(referrerOrders.map((o) => addrKey(o.shippingAddress)).filter((a) => a.length > 8));
    const sameHousehold = referredOrders.some(
      (o) => refPhones.has(phoneKey(o.shippingAddress?.phone)) || refAddrs.has(addrKey(o.shippingAddress))
    );
    if (sameHousehold) {
      await supabase.from("referrals").update({ status: "rejected" }).eq("id", referral.id).eq("status", "pending");
      return { statusCode: 200, body: JSON.stringify({ completed: false, reason: "mismos_datos" }) };
    }

    const { data: updated } = await supabase
      .from("referrals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", referral.id).eq("status", "pending").select().maybeSingle();
    if (!updated) return { statusCode: 200, body: JSON.stringify({ completed: false }) }; // otro proceso ya lo completó

    await supabase.from("referral_bonus_ledger").insert([
      { buyer_email: referral.referrer_email, points: REFERRAL_REWARD_POINTS, reason: "referral_referrer" },
      { buyer_email: referral.referred_email, points: REFERRAL_REWARD_POINTS, reason: "referral_referred" },
    ]);

    return { statusCode: 200, body: JSON.stringify({ completed: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
