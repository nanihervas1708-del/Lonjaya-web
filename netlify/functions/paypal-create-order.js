/**
 * Crea una orden de pago en PayPal (Orders API v2).
 * El importe se calcula y se envía desde el navegador (subtotal + envío),
 * y aquí simplemente se registra en PayPal como el importe a cobrar.
 */

function paypalBase() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "No se pudo autenticar con PayPal");
  return data.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }
  try {
    const { amount, currency } = JSON.parse(event.body || "{}");
    const value = Number(amount);
    if (!value || value <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Importe inválido" }) };
    }

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency || "EUR",
              value: value.toFixed(2),
            },
            description: "Pedido LonjaYa",
          },
        ],
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: orderData }) };
    }

    return { statusCode: 200, body: JSON.stringify({ id: orderData.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
