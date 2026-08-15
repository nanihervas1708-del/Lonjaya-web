import { supabase } from "./storage";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/** Pide permiso y suscribe al navegador a notificaciones push, guardando
 * la suscripción asociada al email del comprador. */
export async function subscribeToPush(buyerEmail, vapidPublicKey) {
  if (!isPushSupported()) throw new Error("Este navegador no soporta notificaciones push");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso de notificaciones denegado");

  const registration = await navigator.serviceWorker.ready;
  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const json = sub.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    { buyer_email: buyerEmail, endpoint: json.endpoint, keys: json.keys },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
  return true;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

/** Pide al servidor que envíe un push a un comprador (usado tras cambios
 * de estado de pedido, etc.) */
export async function sendPushNotification(buyerEmail, title, body, url) {
  try {
    await fetch("/.netlify/functions/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerEmail, title, body, url }),
    });
  } catch {
    // no crítico
  }
}
