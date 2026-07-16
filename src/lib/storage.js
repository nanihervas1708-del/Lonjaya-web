import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Faltan las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Copia .env.example a .env y rellénalas con los datos de tu proyecto de Supabase."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE = "app_storage";

/**
 * Identificador de "este navegador". Como el login de la app es solo una
 * demo (sin contraseña ni backend de autenticación), usamos un id anónimo
 * guardado en localStorage para separar los datos "personales" (carrito,
 * usuario, puntos) de cada visitante. No es un sistema de cuentas real.
 */
function getDeviceId() {
  let id = localStorage.getItem("lonjaya_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lonjaya_device_id", id);
  }
  return id;
}

/**
 * Réplica de la API window.storage del entorno de artefactos de Claude,
 * para que el resto de App.jsx no tenga que cambiar casi nada:
 *   storage.get(key, shared)
 *   storage.set(key, value, shared)
 *   storage.delete(key, shared)
 *   storage.list(prefix, shared)
 */
/**
 * Sube una foto de producto al bucket público "product-images" y devuelve
 * su URL pública, lista para guardar en product.image.
 */
export async function uploadProductImage(file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export const storage = {
  async get(key, shared = false) {
    const userId = shared ? null : getDeviceId();
    let query = supabase.from(TABLE).select("key,value").eq("key", key).eq("shared", shared);
    query = shared ? query.is("user_id", null) : query.eq("user_id", userId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("not found");
    return { key: data.key, value: data.value, shared };
  },

  async set(key, value, shared = false) {
    const userId = shared ? null : getDeviceId();
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, value, shared, user_id: userId }, { onConflict: "key,shared,user_id" });
    if (error) throw error;
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const userId = shared ? null : getDeviceId();
    let query = supabase.from(TABLE).delete().eq("key", key).eq("shared", shared);
    query = shared ? query.is("user_id", null) : query.eq("user_id", userId);
    const { error } = await query;
    if (error) throw error;
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    const userId = shared ? null : getDeviceId();
    let query = supabase.from(TABLE).select("key").eq("shared", shared).ilike("key", `${prefix}%`);
    query = shared ? query.is("user_id", null) : query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    return { keys: (data || []).map((d) => d.key), prefix, shared };
  },
};
