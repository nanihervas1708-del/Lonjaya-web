import { supabase } from "./storage";

/**
 * Contador de puntos "verificable": se calcula a partir de los PEDIDOS
 * (que el administrador ve) y de las bonificaciones del servidor, no de lo que
 * el navegador del cliente diga que tiene.
 *
 *   saldo = puntos ganados en pedidos confirmados
 *         + bonificaciones (referidos, etc.)
 *         - puntos canjeados en pedidos no cancelados
 *
 * Los puntos por reseñas/recetas se guardan solo en el dispositivo del cliente
 * y no pueden verificarse, así que no entran aquí ni se pueden canjear.
 */
const norm = (e) => (e || "").trim().toLowerCase();

export function summarizePoints(orders, bonusRows = []) {
  const map = new Map();
  const get = (email, name = "") => {
    if (!map.has(email)) map.set(email, { email, name, orders: 0, earned: 0, bonus: 0, used: 0, usedValue: 0, lastDate: null });
    const r = map.get(email);
    if (name && !r.name) r.name = name;
    return r;
  };
  for (const o of orders || []) {
    if (o.status === "cancelado") continue;
    const email = norm(o.shippingAddress?.email);
    if (!email) continue;
    const r = get(email, o.shippingAddress?.name || o.user || "");
    r.orders += 1;
    if (o.status === "confirmado") r.earned += o.pointsEarned || 0;
    r.used += o.pointsUsed || 0;
    r.usedValue += o.pointsDiscount || 0;
    if (!r.lastDate || o.date > r.lastDate) r.lastDate = o.date;
  }
  for (const b of bonusRows || []) {
    if (b.reason === "order_payment") continue; // ya se cuenta en 'ganados' por el pedido
    const email = norm(b.buyer_email);
    if (!email) continue;
    get(email).bonus += b.points || 0;
  }
  for (const r of map.values()) r.balance = r.earned + r.bonus - r.used;
  return map;
}

/** Bonificaciones de todos los clientes (solo el admin las ve, por RLS). */
export async function fetchAllReferrals() {
  const { data, error } = await supabase.from("referrals").select("referrer_email, referred_email, status, created_at, completed_at").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function fetchAllBonusRows() {
  const { data, error } = await supabase.from("referral_bonus_ledger").select("buyer_email, points, reason, claimed, created_at");
  if (error) return [];
  return data || [];
}

/** Total de bonificaciones del propio comprador (RLS: solo ve las suyas). */
export async function fetchMyBonusTotal(email) {
  if (!email) return 0;
  const { data, error } = await supabase.from("referral_bonus_ledger").select("points, reason").eq("buyer_email", email);
  if (error || !data) return 0;
  return data.filter((r) => r.reason !== "order_payment").reduce((s, r) => s + (r.points || 0), 0);
}
