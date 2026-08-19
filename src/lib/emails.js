/**
 * Notificaciones por email: confirmación al comprador, aviso de pedido
 * nuevo al vendedor, y aviso de nueva solicitud de venta al admin.
 * El envío real ocurre en el servidor (netlify/functions/send-email.js);
 * aquí solo se construyen las plantillas y se llama a esa función.
 */

const BRAND_FOOTER = `
  <p style="color:#5C6B6E;font-size:12px;margin-top:24px;border-top:1px solid #E4D9C4;padding-top:12px">
    LonjaYa — pescado y marisco de lonja a mesa.
  </p>
`;

export async function sendEmail({ to, subject, html }) {
  if (!to) return;
  try {
    await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch {
    // Un fallo al enviar el email nunca debe romper la compra ni el registro.
  }
}

/** Igual que sendEmail, pero para avisos al administrador: el destinatario
 * se resuelve siempre en el servidor (variable ADMIN_EMAIL), nunca se envía
 * desde el navegador, así su dirección no queda expuesta en ningún momento. */
export async function sendAdminNotification({ subject, html }) {
  try {
    await fetch("/.netlify/functions/notify-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, html }),
    });
  } catch {
    // Igual que arriba: nunca debe romper la experiencia del usuario.
  }
}

function moneyRow(label, value) {
  return `<tr><td style="padding:4px 8px">${label}</td><td style="padding:4px 8px;text-align:right">${value.toFixed(2)} €</td></tr>`;
}

function lineRow(l) {
  return `<tr><td style="padding:4px 8px">${l.qty} ${l.unit || ""} × ${l.name}</td><td style="padding:4px 8px;text-align:right">${(l.price * l.qty).toFixed(2)} €</td></tr>`;
}

/** Email de confirmación para el comprador, justo tras pagar. */
export function buildOrderConfirmationEmail(order) {
  const addr = order.shippingAddress || {};
  return {
    subject: `Tu pedido en LonjaYa #${order.id.slice(-6)} está confirmado`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0E3A45">¡Gracias por tu pedido, ${addr.name || ""}!</h2>
        <p>Tu pedido <strong>#${order.id.slice(-6)}</strong> ha sido confirmado y se está preparando en cadena de frío.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${order.lines.map(lineRow).join("")}
          ${moneyRow("Envío", order.shippingCost)}
        </table>
        <p style="font-size:18px"><strong>Total: ${order.total.toFixed(2)} €</strong></p>
        <p>Dirección de entrega: ${addr.address}, ${addr.city} (${addr.postal})</p>
        ${BRAND_FOOTER}
      </div>`,
  };
}

/** Email con las instrucciones de pago cuando eligen transferencia o Bizum
 * (el pedido queda "pendiente de pago" hasta que el admin confirma a mano
 * que ha recibido el dinero). */
export function buildPendingPaymentEmail(order, method, payDetails) {
  const addr = order.shippingAddress || {};
  const isBizum = method === "bizum";
  return {
    subject: `Completa el pago de tu pedido #${order.id.slice(-6)} en LonjaYa`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0E3A45">Ya casi está, ${addr.name || ""}</h2>
        <p>Tu pedido <strong>#${order.id.slice(-6)}</strong> está reservado. Para confirmarlo, completa el pago de <strong>${order.total.toFixed(2)} €</strong> por ${isBizum ? "Bizum" : "transferencia bancaria"}:</p>
        <div style="background:#F6F8F7;border-radius:8px;padding:16px;margin:16px 0">
          ${isBizum
            ? `<p style="margin:4px 0"><strong>Teléfono Bizum:</strong> ${payDetails.bizumPhone}</p>`
            : `<p style="margin:4px 0"><strong>IBAN:</strong> ${payDetails.iban}</p>
               <p style="margin:4px 0"><strong>Titular:</strong> ${payDetails.holder}</p>`}
          <p style="margin:4px 0"><strong>Importe exacto:</strong> ${order.total.toFixed(2)} €</p>
          <p style="margin:4px 0"><strong>Concepto (importante, inclúyelo):</strong> LONJAYA-${order.id.slice(-6)}</p>
        </div>
        <p>En cuanto se confirme la recepción del pago, te llegará un email con la confirmación definitiva y empezará a prepararse tu pedido.</p>
        ${BRAND_FOOTER}
      </div>`,
  };
}

/** Email para el vendedor cuando le entra un pedido nuevo (solo sus líneas). */
export function buildVendorNewOrderEmail(order, vendorLines, vendorName) {
  const totalNet = vendorLines.reduce((s, l) => s + (l.vendorPayout ?? l.price * l.qty), 0);
  const addr = order.shippingAddress || {};
  return {
    subject: `Nuevo pedido en LonjaYa para ${vendorName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0E3A45">¡Tienes un pedido nuevo!</h2>
        <p>Pedido <strong>#${order.id.slice(-6)}</strong>, del ${new Date(order.date).toLocaleDateString("es-ES")}.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">${vendorLines.map(lineRow).join("")}</table>
        <p style="font-size:16px"><strong>Tu ingreso neto (tras comisión LonjaYa): ${totalNet.toFixed(2)} €</strong></p>
        <div style="background:#F6F8F7;border-radius:8px;padding:14px;margin:16px 0">
          <p style="margin:2px 0"><strong>Entregar a:</strong> ${addr.name || ""}</p>
          <p style="margin:2px 0">${addr.address || ""}, ${addr.city || ""} (${addr.postal || ""})</p>
          <p style="margin:2px 0">Tel: ${addr.phone || "—"}</p>
        </div>
        <p>Entra en tu panel de vendedor en lonjaya.com para ver el pedido completo.</p>
        ${BRAND_FOOTER}
      </div>`,
  };
}

/** Albarán completo para el admin — se manda con cada pedido nuevo, para
 * que no dependa de mirar el panel para enterarse. */
export function buildAdminOrderEmail(order) {
  const addr = order.shippingAddress || {};
  return {
    subject: `📦 Nuevo pedido #${order.id.slice(-6)} — ${order.total.toFixed(2)} €`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0E3A45">Nuevo pedido en LonjaYa</h2>
        <p>Pedido <strong>#${order.id.slice(-6)}</strong> · ${new Date(order.date).toLocaleString("es-ES")} · Pago: ${order.payment?.provider || "—"} · Estado: ${order.status || "confirmado"}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${order.lines.map(lineRow).join("")}
          ${moneyRow("Envío", order.shippingCost)}
        </table>
        <p style="font-size:18px"><strong>Total: ${order.total.toFixed(2)} €</strong></p>
        <div style="background:#F6F8F7;border-radius:8px;padding:14px;margin:16px 0">
          <p style="margin:2px 0"><strong>Comprador:</strong> ${addr.name || ""}</p>
          <p style="margin:2px 0"><strong>Email:</strong> ${addr.email || ""}</p>
          <p style="margin:2px 0"><strong>Teléfono:</strong> ${addr.phone || "—"}</p>
          <p style="margin:2px 0"><strong>Dirección:</strong> ${addr.address || ""}, ${addr.city || ""} (${addr.postal || ""})</p>
        </div>
        ${BRAND_FOOTER}
      </div>`,
  };
}

/** Email para el admin cuando alguien se da de alta como vendedor nuevo. */
export function buildAdminNewVendorEmail(vendor) {
  return {
    subject: `Nueva solicitud de vendedor: ${vendor.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0E3A45">Nueva solicitud para vender en LonjaYa</h2>
        <p><strong>${vendor.name}</strong> (contacto: ${vendor.ownerName || "—"}) quiere unirse como ${vendor.vendorType}.</p>
        <p><strong>Ubicación:</strong> ${vendor.location || "—"}</p>
        <p><strong>Email:</strong> ${vendor.email || "—"}</p>
        <p>${vendor.bio || ""}</p>
        <p>Revísala y apruébala desde el panel de administración en lonjaya.com.</p>
        ${BRAND_FOOTER}
      </div>`,
  };
}
