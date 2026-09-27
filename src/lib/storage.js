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

// Antes usábamos NULL para las filas "compartidas" (sin dueño concreto),
// pero eso rompía el ON CONFLICT del upsert (ver migración
// fix_app_storage_upsert_bug). Ahora usamos este valor fijo en su lugar.
const SHARED_MARKER = "__shared__";

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
 * Redimensiona y comprime una imagen en el propio navegador antes de
 * subirla — así una foto de 5-10MB directa del móvil se queda en unos
 * cientos de KB, sin que el vendedor tenga que hacer nada especial.
 * Los vídeos y otros archivos que no sean imagen se dejan tal cual.
 * Si por lo que sea la compresión no reduce el tamaño, se sube el
 * original en vez del comprimido.
 */
function compressImage(file, maxWidth = 1200, quality = 0.82) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return Promise.resolve(file);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) resolve(file);
            else resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una foto de producto al bucket público "product-images" y devuelve
 * su URL pública, lista para guardar en product.image.
 */
export async function uploadProductImage(file) {
  const optimized = await compressImage(file);
  const ext = optimized.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, optimized, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sube un archivo de "medios del sitio" (vídeo o imagen de portada) al
 * bucket público "site-media". Solo el admin puede escribir aquí (lo
 * protege la política de seguridad, no solo el código). Los vídeos no se
 * tocan; las imágenes (como la foto de apertura) sí se optimizan.
 */
export async function uploadSiteMedia(file) {
  const optimized = await compressImage(file, 1920, 0.85);
  const ext = optimized.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-media").upload(path, optimized, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("site-media").getPublicUrl(path);
  return data.publicUrl;
}

export const storage = {
  async get(key, shared = false) {
    const userId = shared ? SHARED_MARKER : getDeviceId();
    const { data, error } = await supabase
      .from(TABLE)
      .select("key,value")
      .eq("key", key)
      .eq("shared", shared)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("not found");
    return { key: data.key, value: data.value, shared };
  },

  async set(key, value, shared = false) {
    const userId = shared ? SHARED_MARKER : getDeviceId();
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, value, shared, user_id: userId }, { onConflict: "key,shared,user_id" });
    if (error) throw error;
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const userId = shared ? SHARED_MARKER : getDeviceId();
    const { error } = await supabase.from(TABLE).delete().eq("key", key).eq("shared", shared).eq("user_id", userId);
    if (error) throw error;
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    const userId = shared ? SHARED_MARKER : getDeviceId();
    const { data, error } = await supabase
      .from(TABLE)
      .select("key")
      .eq("shared", shared)
      .eq("user_id", userId)
      .ilike("key", `${prefix}%`);
    if (error) throw error;
    return { keys: (data || []).map((d) => d.key), prefix, shared };
  },
};
