import { supabase } from "./storage";

function rowToOffer(r) {
  return {
    id: r.id,
    productId: r.product_id,
    vendorId: r.vendor_id,
    offerPrice: Number(r.offer_price),
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    createdAt: r.created_at,
  };
}

export async function fetchFlashOffers() {
  const { data, error } = await supabase.from("flash_offers").select("*").order("ends_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToOffer);
}

export async function createFlashOffer({ productId, vendorId, offerPrice, endsAt }) {
  const id = "fo" + Date.now();
  const { error } = await supabase.from("flash_offers").insert({
    id, product_id: productId, vendor_id: vendorId, offer_price: offerPrice, ends_at: endsAt,
  });
  if (error) throw error;
  return id;
}

export async function deleteFlashOffer(id) {
  const { error } = await supabase.from("flash_offers").delete().eq("id", id);
  if (error) throw error;
}

/** Solo las que no han caducado todavía (se calcula en el momento, no
 * depende de que nadie cambie ningún estado a mano). */
export function activeOffers(offers) {
  const now = Date.now();
  return offers.filter((o) => new Date(o.endsAt).getTime() > now);
}
