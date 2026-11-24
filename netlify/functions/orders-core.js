/**
 * Lógica de pedidos en el SERVIDOR. Los pedidos ya no se guardan en una tabla
 * abierta: solo esta lógica (con la clave "service role") puede crearlos o
 * cambiarlos, y comprueba todo lo que manda el navegador:
 *  - los precios deben coincidir con los de la base de datos,
 *  - el envío y los descuentos se recalculan,
 *  - los puntos canjeados deben existir de verdad en el saldo del cliente,
 *  - el pago con PayPal se verifica con PayPal antes de dar el pedido por pagado,
 *  - el estado "confirmado" jamás lo decide el navegador.
 */

const DEFAULT_COMMISSION = 0.12;
const LOYALTY = { pointsPerEuro: 10, block: 500, blockValue: 5, maxPerOrder: 1000, minPurchase: 100 };

const r2 = (n) => Math.round(n * 100) / 100;
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const digits = (t) => String(t || "").replace(/\D/g, "");
const phoneKey = (t) => { const d = digits(t).slice(-9); return d.length === 9 ? d : null; };
const addrKey = (address, postal) => {
  const a = String(address || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const p = digits(postal);
  return a.length >= 6 && p.length === 5 ? `${a}|${p}` : null;
};
const normEmail = (e) => String(e || "").trim().toLowerCase();

function parseJsonValue(v, fallback) {
  try {
    let x = v;
    for (let i = 0; i < 2 && typeof x === "string"; i++) x = JSON.parse(x);
    return x ?? fallback;
  } catch { return fallback; }
}

function shippingForUnits(units) {
  if (units <= 0) return 0;
  if (units <= 5) return 10;
  return 10 + Math.ceil((units - 5) / 5) * 4;
}

async function getSettings(sb) {
  const { data } = await sb.from("app_storage").select("value").eq("key", "lonja:site_settings").eq("shared", true).maybeSingle();
  const s = parseJsonValue(data?.value, {});
  return s && typeof s === "object" ? s : {};
}

/** ¿Es la primera compra de este cliente? Por email, teléfono o dirección. */
async function isFirstPurchase(sb, who) {
  const checks = [];
  const email = normEmail(who.email);
  const pk = phoneKey(who.phone);
  const ak = addrKey(who.address, who.postal);
  if (email) checks.push(["buyer_email", email]);
  if (pk) checks.push(["buyer_phone_key", pk]);
  if (ak) checks.push(["addr_key", ak]);
  for (const [col, val] of checks) {
    const { data } = await sb.from("orders").select("status, data").eq(col, val);
    const hit = (data || []).some((o) => {
      if (o.status === "cancelado") return false;
      if (o.status === "pendiente_pago") {
        const prov = o.data?.payment?.provider;
        if (prov !== "bizum" && prov !== "transferencia") return false;
      }
      return true;
    });
    if (hit) return false;
  }
  return true;
}

/** Saldo de puntos que se puede canjear de verdad (según pedidos y bonus). */
async function verifiedPoints(sb, email) {
  const mail = normEmail(email);
  if (!mail) return 0;
  const { data: orders } = await sb.from("orders").select("status, data").eq("buyer_email", mail);
  let earned = 0, used = 0;
  for (const o of orders || []) {
    if (o.status === "cancelado") continue;
    if (o.status === "confirmado") earned += o.data?.pointsEarned || 0;
    used += o.data?.pointsUsed || 0;
  }
  const { data: bonus } = await sb.from("referral_bonus_ledger").select("points, reason").eq("buyer_email", mail);
  const bonusTotal = (bonus || []).filter((b) => b.reason !== "order_payment").reduce((s, b) => s + (b.points || 0), 0);
  return Math.max(0, earned + bonusTotal - used);
}

function allowedPointsToRedeem(requested, subtotal, balance) {
  if (!(subtotal > LOYALTY.minPurchase)) return 0;
  const byBalance = Math.floor(balance / LOYALTY.block) * LOYALTY.block;
  const wanted = Math.floor((Number(requested) || 0) / LOYALTY.block) * LOYALTY.block;
  return Math.max(0, Math.min(wanted, byBalance, LOYALTY.maxPerOrder));
}

/** Comprueba con PayPal que la orden está COMPLETADA y cuánto se pagó. */
async function verifyPaypal(fetchImpl, env, paypalOrderId) {
  const base = env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const tokRes = await fetchImpl(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const tok = await tokRes.json();
  if (!tokRes.ok) throw new Error("No se pudo autenticar con PayPal");
  const res = await fetchImpl(`${base}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  const o = await res.json();
  if (!res.ok) return { ok: false, amount: 0 };
  const capture = o.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = Number(capture?.amount?.value ?? 0);
  const currency = capture?.amount?.currency_code;
  return { ok: o.status === "COMPLETED" && capture?.status === "COMPLETED" && currency === "EUR", amount, payerEmail: o.payer?.email_address || null };
}

function cleanAddress(a) {
  const out = {
    name: str(a?.name, 120), email: normEmail(a?.email), phone: str(a?.phone, 30), address: str(a?.address, 200),
    city: str(a?.city, 80), postal: str(a?.postal, 10), ageRange: str(a?.ageRange, 30), deliveryDate: str(a?.deliveryDate, 12),
  };
  if (!out.name || !out.email.includes("@") || !out.address || !out.city) return null;
  return out;
}

const fail = (status, error) => ({ status, body: { error } });

async function createOrder({ sb, fetchImpl, env, user, body }) {
  const input = body?.order || {};
  const address = cleanAddress(input.shippingAddress);
  if (!address) return fail(400, "Faltan datos de envío");
  const providerRaw = str(input.payment?.provider, 20);
  const isAuction = !!input.isAuction;
  const settings = await getSettings(sb);

  // ---- líneas (precios SIEMPRE de la base de datos) ----
  let lines = [];
  let shippingCost = 0, subtotal = 0, units = 0;
  const vendorRows = (await sb.from("vendors").select("id, commission_rate")).data || [];
  const rateOf = (vid) => Number(vendorRows.find((v) => v.id === vid)?.commission_rate ?? DEFAULT_COMMISSION);
  let auctionRow = null;

  if (isAuction) {
    if (!user?.email) return fail(401, "Inicia sesión para comprar en subasta");
    const { data: a } = await sb.from("auctions").select("*").eq("id", str(input.auctionId, 80)).maybeSingle();
    if (!a || a.status !== "vendida" || normEmail(a.buyer_email) !== normEmail(user.email) || !(Number(a.sold_price) > 0)) {
      return fail(400, "La subasta no está reservada y confirmada a tu nombre");
    }
    auctionRow = a;
    const { data: p } = await sb.from("products").select("id, name, unit, vendor_id").eq("id", a.product_id).maybeSingle();
    const price = r2(Number(a.sold_price)), rate = rateOf(a.vendor_id);
    lines = [{ productId: a.product_id, name: p?.name || "Producto en subasta", vendorId: a.vendor_id, qty: 1, unit: p?.unit || "kg", price,
      commissionRate: rate, commission: r2(price * rate), vendorPayout: r2(price * (1 - rate)) }];
    subtotal = price; units = 1; shippingCost = shippingForUnits(1);
  } else {
    const items = Array.isArray(input.lines) ? input.lines.slice(0, 60) : [];
    if (items.length === 0) return fail(400, "El pedido no tiene productos");
    const ids = [...new Set(items.map((l) => str(l.productId, 80)))];
    const products = ((await sb.from("products").select("*").in("id", ids)).data) || [];
    const offers = ((await sb.from("flash_offers").select("product_id, offer_price, starts_at, ends_at")).data) || [];
    const now = Date.now();
    for (const l of items) {
      const p = products.find((x) => x.id === str(l.productId, 80));
      const qty = Number(l.qty), price = Number(l.price);
      if (!p) return fail(400, "Un producto del pedido ya no existe");
      if (!(qty > 0) || qty > 500) return fail(400, "Cantidad no válida");
      const allowed = new Set([Number(p.price), ...(Array.isArray(p.variants) ? p.variants.map((v) => Number(v.price)) : [])]);
      for (const o of offers) {
        if (o.product_id === p.id && (!o.starts_at || Date.parse(o.starts_at) <= now) && (!o.ends_at || Date.parse(o.ends_at) >= now)) allowed.add(Number(o.offer_price));
      }
      if (![...allowed].some((x) => Math.abs(x - price) < 0.011)) return fail(400, `El precio de "${p.name}" no coincide con el de la tienda`);
      const rate = rateOf(p.vendor_id);
      lines.push({ productId: p.id, name: str(l.name, 160) || p.name, vendorId: p.vendor_id, qty, unit: p.unit, price: r2(price),
        commissionRate: rate, commission: r2(price * qty * rate), vendorPayout: r2(price * qty * (1 - rate)) });
      subtotal += price * qty; units += qty;
    }
    subtotal = r2(subtotal);
    const threshold = settings.freeShippingThreshold ?? 100;
    shippingCost = subtotal >= threshold ? 0 : shippingForUnits(units);
  }

  // ---- descuento de primera compra ----
  let discountAmount = 0;
  if (!isAuction && Number(input.discountAmount) > 0 && settings.discountActive !== false) {
    const pct = settings.discountPercent ?? 10;
    if (await isFirstPurchase(sb, address)) discountAmount = r2(subtotal * (pct / 100));
  }

  // ---- puntos canjeados ----
  let pointsUsed = 0;
  if (!isAuction && Number(input.pointsUsed) > 0 && user?.email && normEmail(user.email) === address.email) {
    const balance = await verifiedPoints(sb, address.email);
    pointsUsed = allowedPointsToRedeem(input.pointsUsed, subtotal, balance);
  }
  const pointsDiscount = r2((pointsUsed / LOYALTY.block) * LOYALTY.blockValue);
  const total = Math.max(0, r2(subtotal + shippingCost - discountAmount - pointsDiscount));
  const pointsEarned = Math.round(subtotal * LOYALTY.pointsPerEuro);

  // ---- pago: el estado lo decide el servidor ----
  let status = "pendiente_pago";
  let payment = { provider: ["bizum", "transferencia", "stripe"].includes(providerRaw) ? providerRaw : "bizum" };
  let reviewNote = null;
  let paypalOrderId = null;

  if (providerRaw === "paypal") {
    paypalOrderId = str(body.paypalOrderId || input.payment?.paypalOrderId, 60);
    if (!paypalOrderId) return fail(400, "Falta el identificador del pago de PayPal");
    const { data: dup } = await sb.from("orders").select("data").eq("paypal_order_id", paypalOrderId).maybeSingle();
    if (dup) return { status: 200, body: { order: dup.data, duplicate: true } }; // un mismo pago no sirve para dos pedidos
    const pp = await verifyPaypal(fetchImpl, env, paypalOrderId);
    if (!pp.ok) return fail(402, "PayPal no confirma este pago");
    if (pp.amount + 0.011 < total) return fail(402, `El importe pagado (${pp.amount.toFixed(2)} €) es menor que el total del pedido (${total.toFixed(2)} €)`);
    if (r2(Number(input.total)) !== total) {
      reviewNote = `El navegador del cliente indicó un total de ${r2(Number(input.total)).toFixed(2)} €, pero el servidor lo ha recalculado a ${total.toFixed(2)} € (descuento o puntos no válidos). El cliente pagó ${pp.amount.toFixed(2)} €. Revisa el pedido.`;
    }
    status = "confirmado";
    payment = { provider: "paypal", paypalOrderId, payerEmail: pp.payerEmail || str(input.payment?.payerEmail, 120) || null };
  }
  if (isAuction && status !== "confirmado") return fail(400, "Las subastas solo se pagan con PayPal");

  const order = {
    id: (isAuction ? "oa" : "o") + Date.now() + Math.floor(Math.random() * 10),
    user: str(user?.name || input.user || "Invitado", 120),
    date: new Date().toISOString(),
    lines, subtotal, shippingCost, discountAmount, pointsUsed, pointsDiscount, total,
    shippingAddress: address, payment, status, pointsEarned,
    ...(isAuction ? { isAuction: true, auctionId: auctionRow.id } : {}),
    ...(reviewNote ? { reviewNote } : {}),
  };

  const { error } = await sb.from("orders").insert({
    id: order.id, data: order, buyer_email: address.email, buyer_phone_key: phoneKey(address.phone), addr_key: addrKey(address.address, address.postal),
    vendor_ids: [...new Set(lines.map((l) => l.vendorId))], status, paypal_order_id: paypalOrderId, auction_id: isAuction ? auctionRow.id : null,
    created_at: order.date,
  });
  if (error) {
    if (String(error.code) === "23505" || /duplicate|unique/i.test(error.message || "")) {
      for (const [col, val] of [["paypal_order_id", paypalOrderId], ["auction_id", isAuction ? auctionRow?.id : null]]) {
        if (!val) continue;
        const { data: dup } = await sb.from("orders").select("data").eq(col, val).maybeSingle();
        if (dup) return { status: 200, body: { order: dup.data, duplicate: true } };
      }
    }
    return fail(500, "No se pudo guardar el pedido");
  }

  if (reviewNote && env.RESEND_API_KEY && env.ADMIN_EMAIL) {
    try {
      await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.RESEND_FROM_EMAIL || "LonjaYa <onboarding@resend.dev>", to: [env.ADMIN_EMAIL],
          subject: `⚠️ Revisar pedido #${order.id.slice(-6)}: el importe pagado no cuadra`, html: `<p>${reviewNote}</p><p>Cliente: ${address.name} (${address.email})</p>` }),
      });
    } catch {}
  }
  return { status: 200, body: { order } };
}

/** Lo que necesita el checkout para no mostrar descuentos que luego no valdrían. */
async function quote({ sb, user, body }) {
  const who = { email: body?.email, phone: body?.phone, address: body?.address, postal: body?.postal };
  const firstPurchase = await isFirstPurchase(sb, who);
  const points = user?.email ? await verifiedPoints(sb, user.email) : 0;
  return { status: 200, body: { firstPurchase, redeemablePoints: points } };
}

async function setStatus({ sb, user, body }) {
  if (user?.app_metadata?.role !== "admin") return fail(403, "Solo el administrador puede cambiar el estado");
  const status = str(body?.status, 20);
  if (!["confirmado", "cancelado", "pendiente_pago"].includes(status)) return fail(400, "Estado no válido");
  const { data: row } = await sb.from("orders").select("data").eq("id", str(body?.orderId, 80)).maybeSingle();
  if (!row) return fail(404, "Pedido no encontrado");
  const data = { ...row.data, status };
  const { error } = await sb.from("orders").update({ data, status, updated_at: new Date().toISOString() }).eq("id", data.id);
  if (error) return fail(500, "No se pudo actualizar el pedido");
  return { status: 200, body: { order: data } };
}

/** Estado mínimo de un pedido (sin datos personales) para la vuelta desde Stripe. */
async function orderStatus({ sb, body }) {
  const { data: row } = await sb.from("orders").select("data, status").eq("id", str(body?.orderId, 80)).maybeSingle();
  if (!row) return fail(404, "Pedido no encontrado");
  return { status: 200, body: { order: { id: row.data.id, status: row.status, total: row.data.total, pointsEarned: row.data.pointsEarned || 0 } } };
}

async function claimPaid({ sb, body }) {
  const { data: row } = await sb.from("orders").select("data").eq("id", str(body?.orderId, 80)).maybeSingle();
  if (!row) return fail(404, "Pedido no encontrado");
  if (row.data.status !== "pendiente_pago") return { status: 200, body: { order: row.data } };
  const data = { ...row.data, claimedPaidAt: new Date().toISOString() };
  const { error } = await sb.from("orders").update({ data, updated_at: new Date().toISOString() }).eq("id", data.id);
  if (error) return fail(500, "No se pudo enviar el aviso");
  return { status: 200, body: { order: data } };
}

module.exports = { createOrder, quote, setStatus, claimPaid, orderStatus, parseJsonValue, isFirstPurchase, verifiedPoints, shippingForUnits, normEmail, phoneKey, addrKey };
