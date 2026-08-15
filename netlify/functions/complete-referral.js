/**
 * Se llama cuando un comprador REFERIDO hace su primer pedido. Marca el
 * referido como completado y añade puntos de bonificación tanto al que
 * invitó como al invitado, en la tabla referral_bonus_ledger (el propio
 * comprador los "recoge" la próxima vez que entre con su cuenta).
 *
 * Usa la clave "service role" porque acreditar puntos a la cuenta de OTRA
 * persona (quien invitó) no es algo que deba poder hacer cualquiera desde
 * el navegador.
 */

const { createClient } = require("@supabase/supabase-js");

const REFERRAL_REWARD_POINTS = 100;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { referredEmail } = JSON.parse(event.body || "{}");
    if (!referredEmail) return { statusCode: 400, body: JSON.stringify({ error: "Falta referredEmail" }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: referral, error: refError } = await supabase
      .from("referrals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("referred_email", referredEmail)
      .eq("status", "pending")
      .select()
      .maybeSingle();
    if (refError) throw refError;
    if (!referral) return { statusCode: 200, body: JSON.stringify({ completed: false }) };

    await supabase.from("referral_bonus_ledger").insert([
      { buyer_email: referral.referrer_email, points: REFERRAL_REWARD_POINTS, reason: "referral_referrer" },
      { buyer_email: referral.referred_email, points: REFERRAL_REWARD_POINTS, reason: "referral_referred" },
    ]);

    return { statusCode: 200, body: JSON.stringify({ completed: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
