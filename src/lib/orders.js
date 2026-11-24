import { supabase } from "./storage";

/**
 * Pedidos protegidos: se LEEN de la tabla "orders" (la base de datos solo
 * devuelve al cliente los suyos, al vendedor los suyos y al admin todos) y se
 * ESCRIBEN únicamente a través de la función del servidor "orders-api".
 */

export async function fetchOrders() {
  const { data, error } = await supabase.from("orders").select("data").order("created_at", { ascending: false }).limit(3000);
  if (error) throw error;
  return (data || []).map((r) => r.data);
}

async function callApi(action, payload = {}) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch("/.netlify/functions/orders-api", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action, ...payload }),
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...body };
  } catch {
    return { ok: false, status: 0, error: "No se pudo conectar con el servidor" };
  }
}

/** Crea el pedido en el servidor (que valida precios, descuentos, puntos y el pago de PayPal). */
export const createOrderApi = (order, paypalOrderId) => callApi("create", { order, paypalOrderId });
/** Pregunta al servidor si el cliente tiene derecho al descuento de primera compra y cuántos puntos puede canjear. */
export const quoteApi = (who) => callApi("quote", who);
/** Solo administrador. */
export const setOrderStatusApi = (orderId, status) => callApi("set-status", { orderId, status });
export const claimPaidApi = (orderId) => callApi("claim-paid", { orderId });
export const orderStatusApi = (orderId) => callApi("order-status", { orderId });
