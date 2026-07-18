import { supabase } from "./storage";

/**
 * Autenticación real con Supabase Auth, usada por DOS tipos de cuenta:
 *
 *  - ADMIN: un único usuario creado a mano por ti en el panel de Supabase
 *    (Authentication > Users). No tiene "role" en sus metadatos.
 *  - VENDEDOR: se crea a sí mismo al rellenar "Vender en LonjaYa" (email +
 *    contraseña). Se marca con user_metadata.role = "vendedor" para poder
 *    diferenciarlo de un admin al iniciar sesión.
 *
 * El comprador sigue siendo un acceso de demostración sin contraseña; no
 * se ha tocado en este cambio.
 */

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/** Crea una cuenta nueva de vendedor. Requiere confirmar el email antes de poder entrar
 * (así está configurado el proyecto de Supabase), así que no devuelve sesión activa. */
export async function signUpVendor(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "vendedor" } },
  });
  if (error) throw error;
  return data.user; // puede no tener sesión activa todavía si hace falta confirmar el email
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Devuelve el usuario autenticado (admin o vendedor) si hay sesión activa, o null. */
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

/** true si el usuario autenticado es un vendedor (por sus metadatos); false si es el admin. */
export function isVendorAccount(authUser) {
  return authUser?.user_metadata?.role === "vendedor";
}
