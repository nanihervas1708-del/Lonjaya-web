import { supabase } from "./storage";

/**
 * Autenticación del panel de administración.
 *
 * A diferencia del resto de la app (comprador/vendedor, que son roles de
 * demostración sin contraseña), el acceso de ADMIN usa Supabase Auth de
 * verdad: solo puede entrar quien tenga un usuario creado a mano por ti
 * en el panel de Supabase (Authentication > Users). No hay formulario de
 * registro público para esto en ningún sitio de la app.
 */

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

/** Devuelve el usuario admin ya autenticado (si hay una sesión activa), o null. */
export async function getAdminSession() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

/** Se dispara cuando cambia el estado de sesión (login/logout en otra pestaña, expiración, etc). */
export function onAdminAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}
