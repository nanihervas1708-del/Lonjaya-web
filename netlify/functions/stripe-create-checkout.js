/**
 * Crea una sesión de pago de Stripe Checkout para un pedido ya reservado
 * (guardado como "pendiente_pago"). El navegador simplemente redirige al
 * comprador a la URL que devuelve esta función — Stripe se encarga de todo
 * el formulario de tarjeta, no pasa ningún dato de tarjeta por LonjaYa.
 */

const Stripe = require("stripe");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { orderId, amount, email, description } = JSON.parse(event.body || "{}");

    if (!orderId || !amount || amount <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos del pedido" }) };
    }

    const siteUrl = process.env.URL || "https://lonjaya.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100), // Stripe trabaja en céntimos
            product_data: { name: description || `Pedido LonjaYa #${orderId.slice(-6)}` },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId },
      success_url: `${siteUrl}/?stripe_status=success&order=${orderId}`,
      cancel_url: `${siteUrl}/?stripe_status=cancel&order=${orderId}`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
