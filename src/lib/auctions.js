import { supabase } from "./storage";

function rowToAuction(r) {
  return {
    id: r.id,
    productId: r.product_id,
    vendorId: r.vendor_id,
    image: r.image,
    startPrice: Number(r.start_price),
    minPrice: Number(r.min_price),
    stepAmount: Number(r.step_amount),
    stepSeconds: r.step_seconds,
    status: r.status,
    startedAt: r.started_at,
    reservedUntil: r.reserved_until,
    reservedByEmail: r.reserved_by_email,
    soldAt: r.sold_at,
    soldPrice: r.sold_price != null ? Number(r.sold_price) : null,
    buyerEmail: r.buyer_email,
  };
}

export async function fetchAuctions() {
  const { data, error } = await supabase.from("auctions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToAuction);
}

/** Crea una subasta nueva (solo admin, aplicado también por RLS). */
export async function createAuctionRow(auction) {
  const { error } = await supabase.from("auctions").insert({
    id: auction.id,
    product_id: auction.productId,
    vendor_id: auction.vendorId,
    image: auction.image || null,
    start_price: auction.startPrice,
    min_price: auction.minPrice,
    step_amount: auction.stepAmount,
    step_seconds: auction.stepSeconds,
    status: "activa",
  });
  if (error) throw error;
}

export async function cancelAuctionRow(id) {
  const { error } = await supabase.from("auctions").update({ status: "cancelada" }).eq("id", id);
  if (error) throw error;
}

/** Calcula el precio actual de una subasta EN EL NAVEGADOR (para pintar la
 * cuenta atrás en directo). El precio real y definitivo siempre se vuelve a
 * calcular en el servidor al reservar/comprar — esto es solo para mostrar. */
export function computeCurrentPrice(auction) {
  const elapsedSeconds = (Date.now() - new Date(auction.startedAt).getTime()) / 1000;
  const steps = Math.floor(elapsedSeconds / auction.stepSeconds);
  const price = auction.startPrice - steps * auction.stepAmount;
  return Math.max(auction.minPrice, Math.round(price * 100) / 100);
}

/** Reserva la subasta a su precio actual (calculado y bloqueado en el
 * servidor, nunca por el navegador) antes de pagar. */
export async function reserveAuction(auctionId, buyerEmail) {
  const { data, error } = await supabase.rpc("reserve_auction", { p_auction_id: auctionId, p_buyer_email: buyerEmail });
  if (error) throw error;
  const row = data?.[0];
  if (!row?.ok) throw new Error(row?.message || "No se pudo reservar la subasta");
  return row.price;
}

export async function confirmAuctionSale(auctionId, buyerEmail) {
  const { data, error } = await supabase.rpc("confirm_auction_sale", { p_auction_id: auctionId, p_buyer_email: buyerEmail });
  if (error) throw error;
  return data;
}

export async function releaseAuctionReservation(auctionId, buyerEmail) {
  const { data, error } = await supabase.rpc("release_auction_reservation", { p_auction_id: auctionId, p_buyer_email: buyerEmail });
  if (error) throw error;
  return data;
}
