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

/** Email para un vendedor cuando le entra un pedido nuevo (solo sus líneas). */
export function buildVendorNewOrderEmail(order, vendorLines, vendorName) {
  const totalNet = vendorLines.reduce((s, l) => s + (l.vendorPayout ?? l.price * l.qty), 0);
  return {
    subject: `Nuevo pedido en LonjaYa para ${vendorName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0E3A45">¡Tienes un pedido nuevo!</h2>
        <p>Pedido <strong>#${order.id.slice(-6)}</strong>, del ${new Date(order.date).toLocaleDateString("es-ES")}.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">${vendorLines.map(lineRow).join("")}</table>
        <p style="font-size:16px"><strong>Tu ingreso neto (tras comisión LonjaYa): ${totalNet.toFixed(2)} €</strong></p>
        <p>Entra en tu panel de vendedor en lonjaya.com para ver el pedido completo y la dirección de entrega.</p>
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
