/**
 * Stripe llama a esta función cuando el pago se completa de verdad (evento
 * "checkout.session.completed"). Es la única fuente de verdad del pago —
 * nunca nos fiamos de que el navegador vuelva a la página de "éxito", que
 * se puede interrumpir o falsear.
 *
 * Aquí replicamos, en el servidor, lo mismo que hace
 * confirmPendingOrderPayment en la app: marcar el pedido como "confirmado",
 * descontar stock, avisar por email al comprador/vendedor/admin y dar los
 * puntos de fidelidad.
 */

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const SHARED_MARKER = "__shared__";

function lineRow(l) {
  return `<tr><td style="padding:4px 8px">${l.qty} ${l.unit || ""} × ${l.name}</td><td style="padding:4px 8px;text-align:right">${(l.price * l.qty).toFixed(2)} €</td></tr>`;
}

async function sendResendEmail({ to, subject, html }) {
  const from = process.env.RESEND_FROM_EMAIL || "LonjaYa <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
  } catch {}
}

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, event.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: `Firma de webhook inválida: ${err.message}` };
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "ignorado" };
  }

  const session = stripeEvent.data.object;
  const orderId = session.metadata?.orderId;
  if (!orderId) return { statusCode: 200, body: "sin orderId" };

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: row, error: readError } = await supabase
      .from("app_storage")
      .select("value")
      .eq("key", "lonja:orders")
      .eq("shared", true)
      .eq("user_id", SHARED_MARKER)
      .maybeSingle();
    if (readError || !row) throw new Error("No se pudo leer la lista de pedidos");

    const orders = JSON.parse(row.value);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error(`Pedido ${orderId} no encontrado`);
    if (orders[idx].status === "confirmado") {
      return { statusCode: 200, body: "ya estaba confirmado" }; // evita duplicar si Stripe reintenta el evento
    }

    const order = { ...orders[idx], status: "confirmado", payment: { provider: "stripe", stripeSessionId: session.id } };
    orders[idx] = order;

    const { error: writeError } = await supabase
      .from("app_storage")
      .upsert({ key: "lonja:orders", value: JSON.stringify(orders), shared: true, user_id: SHARED_MARKER }, { onConflict: "key,shared,user_id" });
    if (writeError) throw writeError;

    // Descuenta stock de verdad
    for (const l of order.lines) {
      try {
        await supabase.rpc("decrement_stock", { p_product_id: l.productId, p_qty: l.qty });
      } catch {}
    }

    // Puntos de fidelidad
    if (order.pointsEarned > 0 && order.shippingAddress?.email) {
      try {
        await supabase.from("referral_bonus_ledger").insert({ buyer_email: order.shippingAddress.email, points: order.pointsEarned, reason: "order_payment" });
      } catch {}
    }

    // Emails: comprador, vendedores implicados, y admin (albarán completo)
    const addr = order.shippingAddress || {};
    if (addr.email) {
      await sendResendEmail({
        to: addr.email,
        subject: `Tu pedido en LonjaYa #${order.id.slice(-6)} está confirmado`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#0E3A45">¡Gracias por tu pedido, ${addr.name || ""}!</h2>
          <p>Tu pedido <strong>#${order.id.slice(-6)}</strong> ha sido confirmado (pago con tarjeta) y se está preparando en cadena de frío.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">${order.lines.map(lineRow).join("")}</table>
          <p style="font-size:18px"><strong>Total: ${order.total.toFixed(2)} €</strong></p>
          <p>Dirección de entrega: ${addr.address}, ${addr.city} (${addr.postal})</p>
        </div>`,
      });
    }

    const { data: vendorRows } = await supabase.from("vendors").select("id,name,email").in("id", [...new Set(order.lines.map((l) => l.vendorId))]);
    for (const v of vendorRows || []) {
      if (!v.email) continue;
      const vendorLines = order.lines.filter((l) => l.vendorId === v.id);
      await sendResendEmail({
        to: v.email,
        subject: `Nuevo pedido en LonjaYa para ${v.name}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#0E3A45">¡Tienes un pedido nuevo!</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">${vendorLines.map(lineRow).join("")}</table>
          <div style="background:#F6F8F7;border-radius:8px;padding:14px;margin:16px 0">
            <p style="margin:2px 0"><strong>Entregar a:</strong> ${addr.name || ""}</p>
            <p style="margin:2px 0">${addr.address || ""}, ${addr.city || ""} (${addr.postal || ""})</p>
            <p style="margin:2px 0">Tel: ${addr.phone || "—"}</p>
          </div>
        </div>`,
      });
    }

    if (process.env.ADMIN_EMAIL) {
      await sendResendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `📦 Nuevo pedido #${order.id.slice(-6)} — ${order.total.toFixed(2)} € (tarjeta, Stripe)`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#0E3A45">Nuevo pedido pagado con tarjeta</h2>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">${order.lines.map(lineRow).join("")}</table>
          <p style="font-size:18px"><strong>Total: ${order.total.toFixed(2)} €</strong></p>
          <div style="background:#F6F8F7;border-radius:8px;padding:14px;margin:16px 0">
            <p style="margin:2px 0"><strong>Comprador:</strong> ${addr.name || ""} — ${addr.email || ""} — ${addr.phone || "—"}</p>
            <p style="margin:2px 0"><strong>Dirección:</strong> ${addr.address || ""}, ${addr.city || ""} (${addr.postal || ""})</p>
          </div>
        </div>`,
      });
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
