/**
 * Service worker mínimo. Su único propósito aquí es cumplir el requisito
 * técnico para que la web sea "instalable" (PWA) y pueda empaquetarse como
 * app de Android con PWABuilder. No cachea datos sensibles ni de negocio
 * (pedidos, productos...) — eso siempre viene en vivo de Supabase.
 */

const CACHE_NAME = "lonjaya-shell-v1";
const APP_SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia "network first": siempre intenta traer la versión más
// reciente de la red (importante porque los precios, stock y pedidos
// cambian todo el tiempo), y solo usa la caché si no hay conexión.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

/* Notificaciones push: pedidos, avisos de stock/precio, etc. */
self.addEventListener("push", (event) => {
  let data = { title: "LonjaYa", body: "Tienes una novedad." };
  try { data = event.data.json(); } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || "LonjaYa", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
