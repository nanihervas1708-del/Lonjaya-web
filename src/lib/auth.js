import { supabase } from "./storage";

/**
 * Autenticación real con Supabase Auth, usada por estos tipos de cuenta:
 *
 *  - ADMIN: un único usuario creado a mano por ti en el panel de Supabase
 *    (Authentication > Users). No tiene "role" en sus metadatos.
 *  - VENDEDOR: se crea a sí mismo al rellenar "Vender en LonjaYa". Se marca
 *    con user_metadata.role = "vendedor".
 *  - COMPRADOR: se crea a sí mismo antes de poder hacer un pedido. Se marca
 *    con user_metadata.role = "comprador".
 */

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/** Crea una cuenta nueva de vendedor. Requiere confirmar el email antes de poder entrar
 * (así está configurado el proyecto de Supabase), así que no devuelve sesión activa.
 * Los datos de la tienda (nombre, ubicación...) se guardan en los metadatos de la
 * cuenta y se usan para crear la ficha real de vendedor en el primer login. */
export async function signUpVendor(email, password, profile = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "vendedor", ...profile } },
  });
  if (error) throw error;
  return data.user;
}

/** Crea una cuenta nueva de comprador (nombre y teléfono en los metadatos).
 * También requiere confirmar el email antes de poder iniciar sesión. */
export async function signUpBuyer(email, password, profile = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "comprador", ...profile } },
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Devuelve el usuario autenticado si hay sesión activa, o null. */
export async function getAuthSession() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

/** Se dispara cuando cambia el estado de sesión (login/logout en otra pestaña, expiración, etc). */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}

/** true si el usuario autenticado es un vendedor (por sus metadatos). */
export function isVendorAccount(authUser) {
  return authUser?.user_metadata?.role === "vendedor";
}

/** true si el usuario autenticado es un comprador (por sus metadatos). */
export function isBuyerAccount(authUser) {
  return authUser?.user_metadata?.role === "comprador";
}

