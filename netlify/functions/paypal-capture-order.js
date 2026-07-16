/**
 * Captura (cobra de verdad) una orden de PayPal ya aprobada por el comprador.
 * Se llama justo después de que PayPal confirme en el navegador que el
 * cliente ha aprobado el pago (evento onApprove del botón de PayPal).
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
    const { orderID } = JSON.parse(event.body || "{}");
    if (!orderID) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta el identificador de la orden" }) };
    }

    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${paypalBase()}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const captureData = await captureRes.json();
    if (!captureRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: captureData }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: captureData.status, // "COMPLETED" si todo fue bien
        paypalOrderId: captureData.id,
        payerEmail: captureData.payer?.email_address || null,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
