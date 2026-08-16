import { supabase } from "./storage";

/* ---------------------------- Subida de medios de usuario ---------------------------- */

/** Sube una foto o vídeo al bucket público "user-content" (cualquier
 * usuario autenticado puede subir aquí, a diferencia de "site-media"
 * que es solo para el admin). */
export async function uploadUserMedia(file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("user-content").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("user-content").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------------------- Blog de opiniones ---------------------------- */

function rowToPost(r) {
  return {
    id: r.id,
    authorEmail: r.author_email,
    authorName: r.author_name,
    targetType: r.target_type,
    targetId: r.target_id,
    title: r.title,
    body: r.body,
    rating: r.rating,
    image: r.image,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function fetchCommunityPosts() {
  const { data, error } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToPost);
}

export async function createCommunityPost({ authorEmail, authorName, targetType, targetId, title, body, rating, image }) {
  const id = "cp" + Date.now() + Math.floor(Math.random() * 1000);
  const { error } = await supabase.from("community_posts").insert({
    id, author_email: authorEmail, author_name: authorName,
    target_type: targetType || "general", target_id: targetId || null,
    title, body, rating: rating || null, image: image || null,
  });
  if (error) throw error;
  return id;
}

export async function hideCommunityPost(id) {
  const { error } = await supabase.from("community_posts").update({ status: "hidden" }).eq("id", id);
  if (error) throw error;
}

/* ---------------------------- Recetario ---------------------------- */

function rowToRecipe(r) {
  return {
    id: r.id,
    authorEmail: r.author_email,
    authorName: r.author_name,
    title: r.title,
    description: r.description,
    ingredients: r.ingredients,
    steps: r.steps,
    image: r.image,
    video: r.video,
    productId: r.product_id,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function fetchRecipes() {
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToRecipe);
}

export async function createRecipe({ authorEmail, authorName, title, description, ingredients, steps, image, video, productId }) {
  const id = "rc" + Date.now() + Math.floor(Math.random() * 1000);
  const { error } = await supabase.from("recipes").insert({
    id, author_email: authorEmail, author_name: authorName,
    title, description: description || null, ingredients, steps,
    image: image || null, video: video || null, product_id: productId || null,
  });
  if (error) throw error;
  return id;
}

export async function hideRecipe(id) {
  const { error } = await supabase.from("recipes").update({ status: "hidden" }).eq("id", id);
  if (error) throw error;
}
