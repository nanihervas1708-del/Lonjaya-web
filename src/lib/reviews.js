import { supabase } from "./storage";

function rowToReview(r) {
  return {
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    vendorId: r.vendor_id,
    buyerEmail: r.buyer_email,
    buyerName: r.buyer_name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  };
}

export async function fetchReviews() {
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToReview);
}

export async function submitReview({ orderId, productId, vendorId, buyerEmail, buyerName, rating, comment }) {
  const { error } = await supabase.from("reviews").insert({
    id: "rv" + Date.now() + Math.floor(Math.random() * 1000),
    order_id: orderId,
    product_id: productId,
    vendor_id: vendorId,
    buyer_email: buyerEmail,
    buyer_name: buyerName || null,
    rating,
    comment: comment || null,
  });
  if (error) throw error;
}

/** Media de valoraciones de un vendedor, a partir de reseñas reales. */
export function vendorAverageRating(reviews, vendorId) {
  const own = reviews.filter((r) => r.vendorId === vendorId);
  if (own.length === 0) return null;
  const avg = own.reduce((s, r) => s + r.rating, 0) / own.length;
  return { average: Math.round(avg * 10) / 10, count: own.length };
}
