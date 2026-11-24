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

/** Da puntos de regalo a un comprador por su email (los "recoge" la próxima
 * vez que entre con su cuenta, en cualquier dispositivo) — se reutiliza la
 * misma ficha que el programa de referidos, con otro motivo. */
export async function awardBonusPoints(buyerEmail, points, reason) {
  if (!buyerEmail || !points) return;
  try {
    await supabase.from("referral_bonus_ledger").insert({ buyer_email: buyerEmail, points, reason });
  } catch {
    // no crítico
  }
}

/** Código de recomendación propio del cliente (p. ej. LJ-7K3Q9X). Se crea la
 * primera vez que lo necesita y se queda fijo. Solo el propio cliente (y el
 * admin) puede leer su fila: el email de quien recomienda nunca se expone. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusiones
function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "LJ-" + [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}
export async function ensureMyReferralCode(email) {
  if (!email) return null;
  const mail = email.trim().toLowerCase();
  const { data: existing } = await supabase.from("customer_codes").select("code").eq("email", mail).maybeSingle();
  if (existing?.code) return existing.code;
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    const { error } = await supabase.from("customer_codes").insert({ email: mail, code });
    if (!error) return code;
    // Si falla porque otro dispositivo lo creó a la vez, lo leemos; si fue colisión de código, reintentamos.
    const { data: again } = await supabase.from("customer_codes").select("code").eq("email", mail).maybeSingle();
    if (again?.code) return again.code;
  }
  return null;
}

/** Avisa al servidor de que este cliente nuevo viene recomendado por un código. */
export async function registerReferralByCode(code, referredEmail) {
  try {
    await fetch("/.netlify/functions/register-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, referredEmail }),
    });
  } catch {
    // no crítico
  }
}

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

/* ---------------------------- Boletín de noticias ---------------------------- */

export async function subscribeNewsletter(email) {
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error && !String(error.message).includes("duplicate")) throw error;
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
