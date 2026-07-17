import { supabase } from "./storage";

/**
 * Analítica propia y ligera (sin Google Analytics ni cookies de terceros).
 * Cada visitante anónimo genera un "session_id" temporal (dura mientras
 * tiene la pestaña abierta) y se registran eventos sueltos en Supabase.
 * Solo el admin autenticado puede leer los datos agregados (ver storage.js /
 * la política de la tabla analytics_events).
 */

function getSessionId() {
  let id = sessionStorage.getItem("lonjaya_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("lonjaya_session_id", id);
  }
  return id;
}

/* Geolocalización aproximada por IP, una sola vez por sesión (gratuita, sin clave). */
let geoPromise = null;
function getGeo() {
  const cached = sessionStorage.getItem("lonjaya_geo");
  if (cached) return Promise.resolve(JSON.parse(cached));
  if (geoPromise) return geoPromise;
  geoPromise = fetch("https://ipapi.co/json/")
    .then((r) => r.json())
    .then((d) => {
      const geo = { country: d.country_name || null, region: d.region || null, city: d.city || null };
      sessionStorage.setItem("lonjaya_geo", JSON.stringify(geo));
      return geo;
    })
    .catch(() => ({ country: null, region: null, city: null }));
  return geoPromise;
}

async function logEvent(fields) {
  try {
    const geo = await getGeo();
    await supabase.from("analytics_events").insert({
      session_id: getSessionId(),
      country: geo.country,
      region: geo.region,
      city: geo.city,
      ...fields,
    });
  } catch {
    // La analítica nunca debe romper la experiencia de compra: si falla, se ignora.
  }
}

export function trackPageView(path) {
  logEvent({ event_type: "page_view", path });
}

export function trackProductView(productId, productName) {
  logEvent({ event_type: "product_view", product_id: productId, product_name: productName });
}

export function trackSearch(term) {
  if (!term?.trim()) return;
  logEvent({ event_type: "search", search_term: term.trim().toLowerCase() });
}

export function trackHeartbeat() {
  logEvent({ event_type: "heartbeat" });
}

/**
 * Trae los datos agregados para el panel de admin. Solo funciona si quien
 * llama está autenticado como admin (si no, Supabase devuelve 0 filas por
 * la política de seguridad, no un error).
 */
export async function fetchAnalyticsSummary(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, path, product_id, product_name, search_term, session_id, country, city, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { visits: 0, avgMinutes: 0, topProducts: [], topSearches: [], topPlaces: [], hasAccess: !error };
  }

  const bySession = new Map();
  for (const ev of data) {
    if (!bySession.has(ev.session_id)) bySession.set(ev.session_id, []);
    bySession.get(ev.session_id).push(ev);
  }

  const visits = bySession.size;

  let totalMs = 0;
  for (const events of bySession.values()) {
    const times = events.map((e) => new Date(e.created_at).getTime());
    totalMs += Math.max(...times) - Math.min(...times);
  }
  const avgMinutes = visits > 0 ? totalMs / visits / 60000 : 0;

  const productCounts = new Map();
  const searchCounts = new Map();
  const placeCounts = new Map();

  for (const ev of data) {
    if (ev.event_type === "product_view" && ev.product_name) {
      productCounts.set(ev.product_name, (productCounts.get(ev.product_name) || 0) + 1);
    }
    if (ev.event_type === "search" && ev.search_term) {
      searchCounts.set(ev.search_term, (searchCounts.get(ev.search_term) || 0) + 1);
    }
    const place = [ev.city, ev.country].filter(Boolean).join(", ");
    if (place) placeCounts.set(place, (placeCounts.get(place) || 0) + 1);
  }

  const topN = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, count]) => ({ label, count }));

  return {
    visits,
    avgMinutes,
    topProducts: topN(productCounts, 5),
    topSearches: topN(searchCounts, 5),
    topPlaces: topN(placeCounts, 5),
    hasAccess: true,
  };
}
