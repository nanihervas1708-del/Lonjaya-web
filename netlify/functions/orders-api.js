/**
 * Único punto de entrada para crear o cambiar pedidos (la tabla "orders" no se
 * puede escribir desde el navegador). Acciones: create, quote, set-status, claim-paid.
 */
const { createClient } = require("@supabase/supabase-js");
const core = require("./lib/orders-core");

const json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const body = JSON.parse(event.body || "{}");
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    let user = null;
    const token = (event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await sb.auth.getUser(token);
      if (data?.user) user = { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name, app_metadata: data.user.app_metadata || {} };
    }

    const ctx = { sb, fetchImpl: fetch, env: process.env, user, body };
    let out;
    if (body.action === "create") out = await core.createOrder(ctx);
    else if (body.action === "quote") out = await core.quote(ctx);
    else if (body.action === "set-status") out = await core.setStatus(ctx);
    else if (body.action === "claim-paid") out = await core.claimPaid(ctx);
    else if (body.action === "order-status") out = await core.orderStatus(ctx);
    else out = { status: 400, body: { error: "Acción no válida" } };
    return json(out.status, out.body);
  } catch (err) {
    return json(500, { error: "Error del servidor" });
  }
};
