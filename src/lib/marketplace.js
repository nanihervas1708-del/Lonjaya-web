import { supabase } from "./storage";

/**
 * Vendedores y productos viven ahora en tablas reales de Postgres (no en el
 * almacenamiento genérico tipo "clave-valor"), protegidas con políticas de
 * seguridad por fila (RLS): cada vendedor solo puede escribir sus propios
 * productos, y solo el admin puede aprobar vendedores o cambiar comisiones.
 * Ver la migración SQL para el detalle exacto de las políticas.
 */

/* ---------------------------- Vendors ---------------------------- */

function rowToVendor(r) {
  return {
    id: r.id,
    name: r.name,
    ownerUserId: r.owner_user_id,
    ownerName: r.owner_name,
    location: r.location,
    rating: Number(r.rating) || 0,
    since: r.since,
    specialty: r.specialty,
    bio: r.bio,
    status: r.status,
    commissionRate: Number(r.commission_rate),
    verified: r.verified,
    vendorType: r.vendor_type,
  };
}

function vendorToRow(v) {
  return {
    id: v.id,
    name: v.name,
    owner_user_id: v.ownerUserId || null,
    owner_name: v.ownerName || null,
    location: v.location || null,
    rating: v.rating ?? 0,
    since: v.since || null,
    specialty: v.specialty || null,
    bio: v.bio || null,
    status: v.status || "pendiente",
    commission_rate: v.commissionRate,
    verified: !!v.verified,
    vendor_type: v.vendorType || "pescaderia",
  };
}

export async function fetchVendors() {
  const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToVendor);
}

export async function upsertVendorRow(vendor) {
  const { error } = await supabase.from("vendors").upsert(vendorToRow(vendor));
  if (error) throw error;
}

export async function bulkInsertVendors(vendorList) {
  const { error } = await supabase.from("vendors").upsert(vendorList.map(vendorToRow));
  if (error) throw error;
}

/* ---------------------------- Products ---------------------------- */

function rowToProduct(r) {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    name: r.name,
    category: r.category,
    price: Number(r.price),
    unit: r.unit,
    stock: r.stock,
    freshness: r.freshness,
    origin: r.origin,
    emoji: r.emoji,
    image: r.image,
    desc: r.description,
  };
}

function productToRow(p) {
  return {
    id: p.id,
    vendor_id: p.vendorId,
    name: p.name,
    category: p.category,
    price: p.price,
    unit: p.unit || "kg",
    stock: p.stock ?? 0,
    freshness: p.freshness,
    origin: p.origin || null,
    emoji: p.emoji || null,
    image: p.image || null,
    description: p.desc || null,
  };
}

export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToProduct);
}

export async function upsertProductRow(product) {
  const { error } = await supabase.from("products").upsert(productToRow(product));
  if (error) throw error;
}

export async function bulkInsertProducts(productList) {
  const { error } = await supabase.from("products").upsert(productList.map(productToRow));
  if (error) throw error;
}

export async function deleteProductRow(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
