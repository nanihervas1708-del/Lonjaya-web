import { supabase } from "./storage";

/* ---------------------------- Alertas de producto ---------------------------- */

export async function createProductAlert(productId, buyerEmail, alertType, referencePrice = null) {
  const { error } = await supabase.from("product_alerts").insert({
    product_id: productId,
    buyer_email: buyerEmail,
    alert_type: alertType,
    reference_price: referencePrice,
  });
  if (error) throw error;
}

/* ---------------------------- Programa de referidos ---------------------------- */

export async function registerReferral(referrerEmail, referredEmail) {
  if (!referrerEmail || !referredEmail || referrerEmail === referredEmail) return;
  const { error } = await supabase.from("referrals").insert({
    referrer_email: referrerEmail,
    referred_email: referredEmail,
    status: "pending",
  });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

export async function completeReferralIfAny(referredEmail) {
  const { data, error } = await supabase
    .from("referrals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("referred_email", referredEmail)
    .eq("status", "pending")
    .select();
  if (error) throw error;
  return data?.[0] || null; // devuelve la fila si había una referencia pendiente que se acaba de completar
}

/** "Recoge" los puntos de bonificación pendientes (de referidos u otras
 * gratificaciones) que le corresponden a este comprador, y los marca como
 * ya recogidos. Devuelve el total de puntos nuevos a sumar. */
export async function claimPendingBonusPoints(buyerEmail) {
  const { data: pending, error } = await supabase
    .from("referral_bonus_ledger")
    .select("*")
    .eq("buyer_email", buyerEmail)
    .eq("claimed", false);
  if (error || !pending?.length) return 0;

  const total = pending.reduce((s, r) => s + r.points, 0);
  const ids = pending.map((r) => r.id);
  await supabase.from("referral_bonus_ledger").update({ claimed: true }).in("id", ids);
  return total;
}

/* ---------------------------- Carrito abandonado (seguimiento) ---------------------------- */

export async function logCheckoutAttempt(email, name, cartSnapshot) {
  try {
    await supabase.from("checkout_attempts").insert({ email, name, cart_snapshot: cartSnapshot });
  } catch {
    // no crítico
  }
}

export async function markCheckoutConverted(email) {
  try {
    await supabase.from("checkout_attempts").update({ converted: true }).eq("email", email).eq("converted", false);
  } catch {}
}
