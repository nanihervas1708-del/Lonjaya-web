import { useState, useEffect, useMemo, useCallback } from "react";
import { storage } from "./lib/storage";
import {
  ShoppingCart, Search, X, Star, Plus, Minus, Trash2, ChevronRight,
  ChevronLeft, Anchor, Store, Package, TrendingUp, User, LogOut,
  Check, MapPin, Clock, SlidersHorizontal, ArrowLeft, ShieldCheck,
  PlusCircle, Pencil, BarChart3, Users, Waves, Snowflake, Sun,
  Building2, Globe
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "pescado-blanco", name: "Pescado Blanco", emoji: "🐟" },
  { id: "pescado-azul", name: "Pescado Azul", emoji: "🐠" },
  { id: "mariscos", name: "Mariscos", emoji: "🦐" },
  { id: "moluscos", name: "Moluscos", emoji: "🐙" },
  { id: "crustaceos", name: "Crustáceos", emoji: "🦀" },
  { id: "ahumados", name: "Ahumados y Conservas", emoji: "🍣" },
];

const DEFAULT_COMMISSION = 0.12;

/**
 * Programa de puntos LonjaYa — todo en un solo sitio para poder ajustarlo
 * sin tocar el resto del código (o incluso convertirlo en configuración
 * editable desde el panel de admin más adelante).
 */
const LOYALTY_CONFIG = {
  pointsPerEuro: 10,     // puntos ganados por cada € gastado
  rewardThreshold: 500,  // puntos necesarios para el siguiente descuento
  rewardValue: 5,        // € de descuento que se consiguen cada "rewardThreshold" puntos
};

/**
 * Información del socio logístico. Se muestra en checkout, ficha de
 * producto y footer. Cámbiala aquí si cambia el proveedor de transporte.
 */
const LOGISTICS_INFO = {
  partnerName: "empresa de transporte nacional especializada en frío",
  headline: "Logística en frío por transportista nacional",
  detail:
    "Todos los envíos los realiza una empresa de transporte nacional con garantía de cadena de frío " +
    "y control de temperatura durante todo el trayecto, desde la lonja o pescadería hasta tu puerta.",
  shortBadge: "Transporte en frío controlado",
};

/* Tipos de vendedor que puede haber en el marketplace */
const VENDOR_TYPES = [
  { id: "pescaderia", label: "Pescaderías y lonjas", icon: Store, blurb: "Negocios locales y lonjas de subasta con venta directa." },
  { id: "empresa", label: "Empresas y distribuidores", icon: Building2, blurb: "Mayoristas y empresas con distribución a gran escala." },
  { id: "web", label: "Webs especializadas", icon: Globe, blurb: "Tiendas online centradas en un producto o nicho concreto." },
];

const VENDOR_SEED = [
  { id: "v1", name: "Lonja del Cantábrico", location: "Santander", rating: 4.8, since: 2015, specialty: "pescado-azul", bio: "Pescado azul de bajura, desembarcado a diario en la lonja de Santander.", status: "activo", commissionRate: 0.12, verified: true, vendorType: "pescaderia" },
  { id: "v2", name: "Mariscos Rías Baixas", location: "Vigo", rating: 4.9, since: 2010, specialty: "mariscos", bio: "Marisco gallego de las rías, criado en bateas propias.", status: "activo", commissionRate: 0.12, verified: true, vendorType: "pescaderia" },
  { id: "v3", name: "Pescadería Mediterránea", location: "Valencia", rating: 4.6, since: 2018, specialty: "pescado-blanco", bio: "Pesca de arrastre y palangre del litoral mediterráneo.", status: "activo", commissionRate: 0.13, verified: true, vendorType: "pescaderia" },
  { id: "v4", name: "Costa Brava Seafood", location: "Girona", rating: 4.7, since: 2012, specialty: "crustaceos", bio: "Cigala y gamba de roca de la Costa Brava, subasta diaria.", status: "activo", commissionRate: 0.14, verified: true, vendorType: "pescaderia" },
  { id: "v5", name: "Ahumados Artesanos del Norte", location: "Bilbao", rating: 4.9, since: 2005, specialty: "ahumados", bio: "Ahumado lento sobre madera de haya, receta tradicional vasca.", status: "activo", commissionRate: 0.15, verified: true, vendorType: "pescaderia" },
  { id: "v6", name: "Lonja de Isla Cristina", location: "Isla Cristina (Huelva)", rating: 4.8, since: 2008, specialty: "mariscos", bio: "Flota de bajura y cerco de Isla Cristina, cuna de la gamba blanca.", status: "activo", commissionRate: 0.12, verified: true, vendorType: "pescaderia" },
  { id: "v7", name: "Lonja de Huelva", location: "Huelva capital", rating: 4.6, since: 2011, specialty: "pescado-blanco", bio: "Pescado de la ría de Huelva y el litoral onubense, subasta diaria.", status: "activo", commissionRate: 0.12, verified: true, vendorType: "pescaderia" },
  { id: "v8", name: "Lonja de Ayamonte", location: "Ayamonte (Huelva)", rating: 4.7, since: 2009, specialty: "moluscos", bio: "Marisco de la desembocadura del Guadiana, frontera con Portugal.", status: "activo", commissionRate: 0.12, verified: true, vendorType: "pescaderia" },
  { id: "v9", name: "Lonja de Punta Umbría", location: "Punta Umbría (Huelva)", rating: 4.7, since: 2013, specialty: "crustaceos", bio: "Marisco y pesca de bajura de la ría del Odiel.", status: "activo", commissionRate: 0.13, verified: true, vendorType: "pescaderia" },
  { id: "v10", name: "Lonja de Sanlúcar", location: "Sanlúcar de Barrameda (Cádiz)", rating: 4.9, since: 2006, specialty: "mariscos", bio: "Langostino de Sanlúcar y pesca de la desembocadura del Guadalquivir.", status: "activo", commissionRate: 0.12, verified: true, vendorType: "pescaderia" },
  { id: "v11", name: "Grupo Mar Atlántico Distribución", location: "Vigo (envíos a toda España)", rating: 4.5, since: 2001, specialty: "pescado-blanco", bio: "Mayorista con red de frío nacional, suministra a hostelería y grandes superficies.", status: "activo", commissionRate: 0.10, verified: true, vendorType: "empresa" },
  { id: "v12", name: "Frigoríficos del Sur", location: "Algeciras (envíos a toda España)", rating: 4.4, since: 1998, specialty: "crustaceos", bio: "Empresa especializada en congelado a gran escala de crustáceos y pescado azul.", status: "activo", commissionRate: 0.10, verified: true, vendorType: "empresa" },
  { id: "v13", name: "MarPuerta Selecto", location: "Venta online (España)", rating: 4.8, since: 2019, specialty: "ahumados", bio: "Tienda online especializada en ahumados y conservas gourmet, envío directo a domicilio.", status: "activo", commissionRate: 0.16, verified: true, vendorType: "web" },
  { id: "v14", name: "OceanoBox", location: "Venta online (España)", rating: 4.7, since: 2021, specialty: "mariscos", bio: "E-commerce de cajas de marisco fresco por suscripción semanal, directo del puerto a tu puerta.", status: "activo", commissionRate: 0.16, verified: true, vendorType: "web" },
];

/* Vendor ids treated as "más vendido" for storefront ribbons */
const BESTSELLER_IDS = new Set(["p13", "p22", "p2", "p9", "p31"]);

/* Productos en "oferta relámpago" hasta el cierre de la lonja de hoy */
const FLASH_DEAL_IDS = ["p1", "p14", "p22", "p31"];
const FLASH_DISCOUNT = 0.22;

/* Feed de compras simuladas para dar sensación de actividad en vivo */
const ACTIVITY_FEED = [
  { city: "Madrid", product: "Langostino de Sanlúcar" },
  { city: "Bilbao", product: "Bonito del Norte" },
  { city: "Sevilla", product: "Gamba blanca de Huelva" },
  { city: "Barcelona", product: "Cigala de roca" },
  { city: "Valencia", product: "Dorada" },
  { city: "Vigo", product: "Pulpo gallego cocido" },
  { city: "Zaragoza", product: "Salmón ahumado" },
  { city: "Málaga", product: "Bogavante vivo" },
  { city: "A Coruña", product: "Mejillón de batea" },
  { city: "San Sebastián", product: "Atún rojo (lomo)" },
];

const PRODUCT_SEED = [
  { id: "p1", name: "Atún rojo (lomo)", category: "pescado-azul", vendorId: "v1", price: 24.9, unit: "kg", stock: 18, freshness: "hoy", origin: "Cantábrico", emoji: "🐟", desc: "Lomo de atún rojo, corte limpio, ideal para tartar o plancha." },
  { id: "p2", name: "Bonito del Norte", category: "pescado-azul", vendorId: "v1", price: 14.5, unit: "kg", stock: 25, freshness: "hoy", origin: "Cantábrico", emoji: "🐠", desc: "Bonito de temporada, capturado con caña en el Cantábrico." },
  { id: "p3", name: "Sardina fresca", category: "pescado-azul", vendorId: "v1", price: 6.9, unit: "kg", stock: 40, freshness: "hoy", origin: "Santander", emoji: "🐟", desc: "Sardina pequeña de estas, perfecta para la brasa." },
  { id: "p4", name: "Percebe gallego", category: "mariscos", vendorId: "v2", price: 68, unit: "kg", stock: 6, freshness: "hoy", origin: "Rías Baixas", emoji: "🦐", desc: "Percebe de roca, marea de esta madrugada." },
  { id: "p5", name: "Mejillón de batea", category: "moluscos", vendorId: "v2", price: 4.5, unit: "kg", stock: 60, freshness: "hoy", origin: "Rías Baixas", emoji: "🐚", desc: "Mejillón gallego de batea, carnoso y de sabor intenso." },
  { id: "p6", name: "Almeja fina", category: "moluscos", vendorId: "v2", price: 32, unit: "kg", stock: 15, freshness: "ayer", origin: "Rías Baixas", emoji: "🐚", desc: "Almeja fina depurada, lista para cocinar." },
  { id: "p7", name: "Pulpo gallego cocido", category: "moluscos", vendorId: "v2", price: 39, unit: "kg", stock: 10, freshness: "ayer", origin: "Rías Baixas", emoji: "🐙", desc: "Pulpo cocido en su punto, listo para á feira." },
  { id: "p8", name: "Merluza del pincho", category: "pescado-blanco", vendorId: "v3", price: 18.9, unit: "kg", stock: 22, freshness: "hoy", origin: "Golfo de Cádiz", emoji: "🐟", desc: "Merluza capturada al pincho, una a una." },
  { id: "p9", name: "Lubina salvaje", category: "pescado-blanco", vendorId: "v3", price: 22.5, unit: "kg", stock: 14, freshness: "hoy", origin: "Mediterráneo", emoji: "🐟", desc: "Lubina de estero, textura firme y sabor limpio." },
  { id: "p10", name: "Dorada", category: "pescado-blanco", vendorId: "v3", price: 16.9, unit: "kg", stock: 20, freshness: "hoy", origin: "Mediterráneo", emoji: "🐟", desc: "Dorada mediterránea, ideal a la sal." },
  { id: "p11", name: "Bacalao desalado", category: "pescado-blanco", vendorId: "v3", price: 19.9, unit: "kg", stock: 30, freshness: "congelado", origin: "Islandia", emoji: "🐟", desc: "Bacalao ya desalado, punto justo de sal." },
  { id: "p12", name: "Cigala de roca", category: "crustaceos", vendorId: "v4", price: 54, unit: "kg", stock: 8, freshness: "hoy", origin: "Costa Brava", emoji: "🦞", desc: "Cigala de roca, subasta de esta mañana en Palamós." },
  { id: "p13", name: "Gamba roja", category: "crustaceos", vendorId: "v4", price: 42, unit: "kg", stock: 12, freshness: "hoy", origin: "Palamós", emoji: "🦐", desc: "Gamba roja de Palamós, denominación de origen." },
  { id: "p14", name: "Bogavante vivo", category: "crustaceos", vendorId: "v4", price: 49, unit: "kg", stock: 5, freshness: "hoy", origin: "Costa Brava", emoji: "🦞", desc: "Bogavante vivo, se sirve en tanque de agua de mar." },
  { id: "p15", name: "Centolla gallega", category: "crustaceos", vendorId: "v4", price: 36, unit: "unidad", stock: 9, freshness: "hoy", origin: "Rías Baixas", emoji: "🦀", desc: "Centolla hembra, cargada, tamaño mediano-grande." },
  { id: "p16", name: "Salmón ahumado", category: "ahumados", vendorId: "v5", price: 28, unit: "kg", stock: 16, freshness: "ahumado", origin: "Bilbao (elaboración)", emoji: "🍣", desc: "Ahumado en frío sobre haya durante 18 horas." },
  { id: "p17", name: "Anchoa en salazón", category: "ahumados", vendorId: "v5", price: 22, unit: "kg", stock: 20, freshness: "conserva", origin: "Cantábrico", emoji: "🍣", desc: "Anchoa curada 6 meses en sal, limpieza artesanal." },
  { id: "p18", name: "Bacalao ahumado", category: "ahumados", vendorId: "v5", price: 26, unit: "kg", stock: 11, freshness: "ahumado", origin: "Bilbao (elaboración)", emoji: "🍣", desc: "Bacalao ahumado en lascas, listo para ensalada." },
  { id: "p19", name: "Caballa fresca", category: "pescado-azul", vendorId: "v1", price: 7.5, unit: "kg", stock: 35, freshness: "hoy", origin: "Cantábrico", emoji: "🐠", desc: "Caballa de anzuelo, grasa y brillante." },
  { id: "p20", name: "Navaja", category: "moluscos", vendorId: "v2", price: 21, unit: "kg", stock: 18, freshness: "hoy", origin: "Rías Baixas", emoji: "🐚", desc: "Navaja viva de las rías, purgada y lista." },
  { id: "p21", name: "Gamba blanca de Huelva", category: "mariscos", vendorId: "v6", price: 45, unit: "kg", stock: 10, freshness: "hoy", origin: "Isla Cristina", emoji: "🦐", desc: "Gamba blanca con IGP, la joya de la lonja de Isla Cristina." },
  { id: "p22", name: "Langostino de Isla Cristina", category: "mariscos", vendorId: "v6", price: 38, unit: "kg", stock: 12, freshness: "hoy", origin: "Isla Cristina", emoji: "🦐", desc: "Langostino de estero, sabor intenso y textura firme." },
  { id: "p23", name: "Boquerón de Isla Cristina", category: "pescado-azul", vendorId: "v6", price: 8.5, unit: "kg", stock: 30, freshness: "hoy", origin: "Isla Cristina", emoji: "🐠", desc: "Boquerón victoriano, ideal en adobo o frito." },
  { id: "p24", name: "Acedía", category: "pescado-blanco", vendorId: "v7", price: 13.9, unit: "kg", stock: 20, freshness: "hoy", origin: "Ría de Huelva", emoji: "🐟", desc: "Pequeño lenguado onubense, perfecto para freír." },
  { id: "p25", name: "Choco de Huelva", category: "moluscos", vendorId: "v7", price: 17.5, unit: "kg", stock: 16, freshness: "hoy", origin: "Ría de Huelva", emoji: "🐙", desc: "Sepia local a la plancha, textura tierna y dulce." },
  { id: "p26", name: "Raya", category: "pescado-blanco", vendorId: "v7", price: 11.9, unit: "kg", stock: 14, freshness: "hoy", origin: "Golfo de Cádiz", emoji: "🐟", desc: "Raya fresca del litoral onubense, ideal en pimentón." },
  { id: "p27", name: "Coquina de Ayamonte", category: "moluscos", vendorId: "v8", price: 19, unit: "kg", stock: 22, freshness: "hoy", origin: "Ayamonte", emoji: "🐚", desc: "Coquina fina de la desembocadura del Guadiana, ya purgada." },
  { id: "p28", name: "Almeja de Ayamonte", category: "moluscos", vendorId: "v8", price: 29, unit: "kg", stock: 15, freshness: "hoy", origin: "Ayamonte", emoji: "🐚", desc: "Almeja de estero, criada en las marismas del Guadiana." },
  { id: "p29", name: "Cañaílla", category: "moluscos", vendorId: "v9", price: 16, unit: "kg", stock: 18, freshness: "hoy", origin: "Punta Umbría", emoji: "🐚", desc: "Caracolillo de roca típico de la ría del Odiel, cocido al punto de sal." },
  { id: "p30", name: "Cigala de Punta Umbría", category: "crustaceos", vendorId: "v9", price: 48, unit: "kg", stock: 7, freshness: "hoy", origin: "Punta Umbría", emoji: "🦞", desc: "Cigala de bajura, subasta de esta mañana en la ría del Odiel." },
  { id: "p31", name: "Langostino de Sanlúcar", category: "mariscos", vendorId: "v10", price: 44, unit: "kg", stock: 11, freshness: "hoy", origin: "Sanlúcar de Barrameda", emoji: "🦐", desc: "El langostino más célebre del Guadalquivir, sabor a marisma." },
  { id: "p32", name: "Corvina de Sanlúcar", category: "pescado-blanco", vendorId: "v10", price: 15.9, unit: "kg", stock: 16, freshness: "hoy", origin: "Sanlúcar de Barrameda", emoji: "🐟", desc: "Corvina de la desembocadura del Guadalquivir, carne prieta." },
  { id: "p33", name: "Camarón de Sanlúcar", category: "mariscos", vendorId: "v10", price: 34, unit: "kg", stock: 13, freshness: "hoy", origin: "Sanlúcar de Barrameda", emoji: "🦐", desc: "Camarón vivo para tortillitas, recién subastado." },
  { id: "p34", name: "Merluza congelada IQF", category: "pescado-blanco", vendorId: "v11", price: 12.9, unit: "kg", stock: 300, freshness: "congelado", origin: "Gran Sol", emoji: "🐟", desc: "Merluza ultracongelada a bordo, formato mayorista para hostelería." },
  { id: "p35", name: "Filete de bacalao congelado", category: "pescado-blanco", vendorId: "v11", price: 15.5, unit: "kg", stock: 250, freshness: "congelado", origin: "Atlántico Norte", emoji: "🐟", desc: "Filete desespinado, congelado individual, gran formato." },
  { id: "p36", name: "Langostino congelado premium", category: "crustaceos", vendorId: "v12", price: 28, unit: "kg", stock: 180, freshness: "congelado", origin: "Origen variable (importación)", emoji: "🦐", desc: "Langostino cocido y congelado, calibre grande, caja de 5kg." },
  { id: "p37", name: "Gamba congelada extra", category: "crustaceos", vendorId: "v12", price: 24, unit: "kg", stock: 200, freshness: "congelado", origin: "Origen variable (importación)", emoji: "🦐", desc: "Gamba blanca congelada a bordo, formato mayorista." },
  { id: "p38", name: "Caja ahumados gourmet", category: "ahumados", vendorId: "v13", price: 32, unit: "caja", stock: 40, freshness: "ahumado", origin: "Elaboración propia", emoji: "🍣", desc: "Selección de ahumados artesanales en caja de regalo, ideal para picoteo." },
  { id: "p39", name: "Salmón ahumado reserva", category: "ahumados", vendorId: "v13", price: 30, unit: "kg", stock: 22, freshness: "ahumado", origin: "Elaboración propia", emoji: "🍣", desc: "Salmón ahumado en lonchas finas, curación lenta de 24h." },
  { id: "p40", name: "Caja marisco sorpresa", category: "mariscos", vendorId: "v14", price: 55, unit: "caja", stock: 25, freshness: "hoy", origin: "Selección semanal de varios puertos", emoji: "🦀", desc: "Caja semanal por suscripción con la mejor selección de marisco de temporada." },
  { id: "p41", name: "Pack degustación mar", category: "mariscos", vendorId: "v14", price: 42, unit: "caja", stock: 30, freshness: "hoy", origin: "Selección semanal de varios puertos", emoji: "🦐", desc: "Pack listo para compartir: gamba, mejillón y almeja en una sola caja." },
];

const FRESH_LABEL = {
  hoy: { text: "Fresco · hoy", icon: Sun, color: "#2F6B5E" },
  ayer: { text: "Fresco · ayer", icon: Sun, color: "#B08900" },
  congelado: { text: "Congelado", icon: Snowflake, color: "#3A6EA5" },
  ahumado: { text: "Ahumado artesanal", icon: Waves, color: "#8A4B2B" },
  conserva: { text: "En salazón", icon: Waves, color: "#8A4B2B" },
};

const eur = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

/* Deterministic pseudo-rating/review-count per product id, so it's stable across renders */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function productReviews(id) {
  const h = hashStr(id);
  const rating = Math.round((3.9 + (h % 100) / 100 * 1.1) * 10) / 10;
  const count = 8 + (h % 340);
  return { rating: Math.min(rating, 5), count };
}

/* ------------------------------------------------------------------ */
/*  STORAGE HELPERS                                                    */
/* ------------------------------------------------------------------ */

async function loadShared(key, fallback) {
  try {
    const r = await storage.get(key, true);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}
async function saveShared(key, value) {
  try { await storage.set(key, JSON.stringify(value), true); } catch {}
}
async function loadPersonal(key, fallback) {
  try {
    const r = await storage.get(key, false);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}
async function savePersonal(key, value) {
  try { await storage.set(key, JSON.stringify(value), false); } catch {}
}

/* ------------------------------------------------------------------ */
/*  SMALL UI ATOMS                                                     */
/* ------------------------------------------------------------------ */

/* Cuenta atrás hasta el cierre de la lonja de hoy (20:00), o de mañana si ya ha pasado */
function useMarketCountdown() {
  const getTarget = () => {
    const now = new Date();
    const t = new Date(now);
    t.setHours(20, 0, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return t;
  };
  const [remaining, setRemaining] = useState(() => getTarget() - new Date());
  useEffect(() => {
    const id = setInterval(() => setRemaining(getTarget() - new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.max(0, remaining);
  const h = String(Math.floor(total / 3600000)).padStart(2, "0");
  const m = String(Math.floor((total % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((total % 60000) / 1000)).padStart(2, "0");
  return { h, m, s };
}

/* Ticker flotante de compras recientes (prueba social simulada) */
function LiveActivityTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const showTimer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(showTimer);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % ACTIVITY_FEED.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(cycle);
  }, [dismissed]);

  if (dismissed) return null;
  const item = ACTIVITY_FEED[idx];

  return (
    <div
      className="fixed bottom-5 left-5 z-40 flex max-w-xs items-center gap-2.5 rounded-lg border bg-white p-3 shadow-lg transition-all duration-500"
      style={{
        borderColor: "#E4D9C4",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
      }}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#2F6B5E" }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#2F6B5E" }} />
      </span>
      <p className="text-xs leading-snug">
        Alguien en <strong>{item.city}</strong> acaba de comprar <strong>{item.product}</strong>
      </p>
      <button onClick={() => setDismissed(true)} className="shrink-0" style={{ color: "#5C6B6E" }}>
        <X size={13} />
      </button>
    </div>
  );
}

function FreshBadge({ freshness }) {
  const f = FRESH_LABEL[freshness] || FRESH_LABEL.hoy;
  const Icon = f.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
      style={{ backgroundColor: `${f.color}1A`, color: f.color, fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {f.text.toUpperCase()}
    </span>
  );
}

function RatingStars({ rating, count, size = 12 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} fill={i <= Math.round(rating) ? "#B08900" : "none"} color="#B08900" strokeWidth={1.5} />
        ))}
      </div>
      <span className="text-[11px]" style={{ color: "#5C6B6E" }}>{rating.toFixed(1)}{count !== undefined ? ` (${count})` : ""}</span>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#2F6B5E" }}>
      <ShieldCheck size={11} /> Vendedor verificado
    </span>
  );
}

function BestsellerRibbon() {
  return (
    <div
      className="absolute left-0 top-3 flex items-center gap-1 rounded-r-full py-1 pl-2 pr-3 text-[10px] font-bold text-white"
      style={{ backgroundColor: "#B08900", fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <TrendingUp size={11} /> MÁS VENDIDO
    </div>
  );
}

function StampBadge({ children }) {
  return (
    <div
      className="absolute -top-3 -right-3 flex h-16 w-16 rotate-[9deg] items-center justify-center rounded-full border-2 text-center text-[9px] font-bold leading-tight"
      style={{ borderColor: "#E85D42", color: "#E85D42", fontFamily: "'IBM Plex Mono', monospace", backgroundColor: "#F6F8F7" }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [lastOrder, setLastOrder] = useState(null);

  const [view, setView] = useState("home");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [filters, setFilters] = useState({ vendor: "all", vendorType: "all", maxPrice: 100, freshness: "all", sort: "relevance" });

  /* -------- init -------- */
  useEffect(() => {
    (async () => {
      let v = await loadShared("lonja:vendors", null);
      if (!v) {
        v = VENDOR_SEED;
      } else {
        const knownIds = new Set(v.map((x) => x.id));
        const missing = VENDOR_SEED.filter((x) => !knownIds.has(x.id));
        if (missing.length) v = [...v, ...missing];
      }
      v = v.map((x) => ({ commissionRate: DEFAULT_COMMISSION, verified: true, status: "activo", vendorType: "pescaderia", ...x }));
      await saveShared("lonja:vendors", v);

      let p = await loadShared("lonja:products", null);
      if (!p) {
        p = PRODUCT_SEED;
      } else {
        const knownIds = new Set(p.map((x) => x.id));
        const missing = PRODUCT_SEED.filter((x) => !knownIds.has(x.id));
        if (missing.length) p = [...p, ...missing];
      }
      await saveShared("lonja:products", p);
      let o = await loadShared("lonja:orders", []);
      let c = await loadPersonal("lonja:cart", []);
      let u = await loadPersonal("lonja:user", null);
      let pts = await loadPersonal("lonja:points", 0);
      setProducts(p); setVendors(v); setOrders(o); setCart(c); setUser(u); setPoints(pts);
      setReady(true);
    })();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const goTo = (v, extra = {}) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMenuOpen(false);
    if (extra.category !== undefined) setActiveCategory(extra.category);
    if (extra.productId !== undefined) setActiveProductId(extra.productId);
  };

  /* -------- cart ops -------- */
  const addToCart = (productId, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      let next;
      if (existing) {
        next = prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i));
      } else {
        next = [...prev, { productId, qty }];
      }
      savePersonal("lonja:cart", next);
      return next;
    });
    showToast("Añadido a la cesta");
  };
  const updateQty = (productId, qty) => {
    setCart((prev) => {
      const next = qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
      savePersonal("lonja:cart", next);
      return next;
    });
  };
  const removeFromCart = (productId) => updateQty(productId, 0);

  const cartLines = useMemo(
    () => cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) })).filter((l) => l.product),
    [cart, products]
  );
  const cartTotal = useMemo(() => cartLines.reduce((s, l) => s + l.product.price * l.qty, 0), [cartLines]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  /* -------- auth (demo) -------- */
  const login = async (name, role, vendorId) => {
    const u = { name, role, vendorId: vendorId || null };
    setUser(u);
    await savePersonal("lonja:user", u);
    showToast(`Sesión iniciada como ${role === "vendedor" ? "vendedor" : role === "admin" ? "administrador" : "comprador"}`);
    goTo(role === "admin" ? "admin" : role === "vendedor" ? "vendor-dash" : "home");
  };
  const logout = async () => {
    setUser(null);
    await savePersonal("lonja:user", null);
    goTo("home");
  };

  /* -------- vendor product CRUD -------- */
  const upsertProduct = async (prod) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === prod.id);
      const next = exists ? prev.map((p) => (p.id === prod.id ? prod : p)) : [...prev, prod];
      saveShared("lonja:products", next);
      return next;
    });
    showToast("Producto guardado");
  };
  const deleteProduct = async (id) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveShared("lonja:products", next);
      return next;
    });
  };

  /* -------- vendor admin ops -------- */
  const setVendorStatus = async (id, status) => {
    setVendors((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, status } : v));
      saveShared("lonja:vendors", next);
      return next;
    });
    showToast(status === "activo" ? "Vendedor aprobado" : status === "suspendido" ? "Vendedor suspendido" : "Solicitud rechazada");
  };
  const setVendorCommission = async (id, commissionRate) => {
    setVendors((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, commissionRate } : v));
      saveShared("lonja:vendors", next);
      return next;
    });
  };
  const addVendor = async (vendor) => {
    setVendors((prev) => {
      const next = [...prev, vendor];
      saveShared("lonja:vendors", next);
      return next;
    });
  };
  /* Seller self sign-up: creates a pending vendor and logs the user in as its owner */
  const registerSeller = async ({ storeName, location, specialty, bio, ownerName, vendorType }) => {
    const vendor = {
      id: "v" + Date.now(),
      name: storeName,
      location,
      rating: 0,
      since: new Date().getFullYear(),
      specialty,
      bio,
      status: "pendiente",
      commissionRate: DEFAULT_COMMISSION,
      verified: false,
      vendorType: vendorType || "pescaderia",
    };
    setVendors((prev) => {
      const next = [...prev, vendor];
      saveShared("lonja:vendors", next);
      return next;
    });
    await login(ownerName, "vendedor", vendor.id);
    showToast("Solicitud enviada. Un administrador la revisará en breve.");
  };

  /* -------- checkout -------- */
  const placeOrder = async (shipping) => {
    const earnedPoints = Math.round(cartTotal * LOYALTY_CONFIG.pointsPerEuro);
    const order = {
      id: "o" + Date.now(),
      user: user?.name || "Invitado",
      date: new Date().toISOString(),
      lines: cartLines.map((l) => {
        const rate = vendors.find((v) => v.id === l.product.vendorId)?.commissionRate ?? DEFAULT_COMMISSION;
        const gross = l.product.price * l.qty;
        return {
          productId: l.productId, name: l.product.name, vendorId: l.product.vendorId, qty: l.qty, price: l.product.price,
          commissionRate: rate, commission: Math.round(gross * rate * 100) / 100, vendorPayout: Math.round(gross * (1 - rate) * 100) / 100,
        };
      }),
      total: cartTotal,
      shipping,
      status: "confirmado",
      pointsEarned: earnedPoints,
    };
    const next = [order, ...orders];
    setOrders(next);
    await saveShared("lonja:orders", next);
    setCart([]);
    await savePersonal("lonja:cart", []);
    const nextPoints = points + earnedPoints;
    setPoints(nextPoints);
    await savePersonal("lonja:points", nextPoints);
    setLastOrder(order);
    goTo("confirm", {});
    return order;
  };

  /* -------- derived: only show products from approved, active vendors -------- */
  const storefrontProducts = useMemo(() => {
    const activeIds = new Set(vendors.filter((v) => v.status === "activo").map((v) => v.id));
    return products.filter((p) => activeIds.has(p.vendorId));
  }, [products, vendors]);

  /* -------- derived: filtered catalog -------- */
  const filteredProducts = useMemo(() => {
    let list = [...storefrontProducts];
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q));
    }
    if (filters.vendor !== "all") list = list.filter((p) => p.vendorId === filters.vendor);
    if (filters.vendorType && filters.vendorType !== "all") {
      list = list.filter((p) => (vendors.find((v) => v.id === p.vendorId)?.vendorType || "pescaderia") === filters.vendorType);
    }
    if (filters.freshness !== "all") list = list.filter((p) => p.freshness === filters.freshness);
    list = list.filter((p) => p.price <= filters.maxPrice);
    if (filters.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (filters.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (filters.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [storefrontProducts, activeCategory, searchQuery, filters, vendors]);

  const activeProduct = products.find((p) => p.id === activeProductId);
  const vendorOf = (id) => vendors.find((v) => v.id === id);

  const tickerItems = useMemo(
    () => storefrontProducts.filter((p) => p.freshness === "hoy").slice(0, 10),
    [storefrontProducts]
  );

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ backgroundColor: "#0E3A45" }}>
        <div className="flex items-center gap-3 text-[#F6F8F7]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <Anchor className="animate-pulse" />
          <span>Abriendo la lonja…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F6F8F7", color: "#16242A", fontFamily: "'Inter', sans-serif" }}>
      <FontImports />

      {/* ---------------- TICKER ---------------- */}
      <div className="overflow-hidden whitespace-nowrap py-1.5" style={{ backgroundColor: "#16242A" }}>
        <div className="ticker-track inline-block" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {[...tickerItems, ...tickerItems].map((p, idx) => (
            <span key={idx} className="mx-6 inline-flex items-center gap-2 text-xs" style={{ color: "#E4D9C4" }}>
              <span style={{ color: "#E85D42" }}>●</span> {p.name} — {eur(p.price)}/{p.unit}
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- HEADER ---------------- */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "#0E3A45", borderColor: "#0A2B33" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button onClick={() => goTo("home", { category: null })} className="flex shrink-0 items-center gap-2">
            <Anchor size={26} color="#E85D42" strokeWidth={2.5} />
            <span className="text-2xl tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: "#F6F8F7", fontWeight: 600 }}>
              LonjaYa
            </span>
          </button>

          <div className="ml-2 hidden flex-1 items-center rounded-md bg-[#F6F8F7] px-3 py-2 sm:flex">
            <Search size={18} color="#5C6B6E" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goTo("catalog", { category: null })}
              placeholder="Buscar merluza, gamba roja, pulpo…"
              className="w-full bg-transparent px-2 text-sm outline-none"
            />
            <button
              onClick={() => goTo("catalog", { category: null })}
              className="rounded px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: "#E85D42" }}
            >
              Buscar
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {(!user || user.role !== "vendedor") && (
              <button
                onClick={() => goTo("sell")}
                className="hidden items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold sm:flex"
                style={{ color: "#0E3A45", backgroundColor: "#E4D9C4" }}
              >
                <Store size={14} /> Vender en LonjaYa
              </button>
            )}
            {user ? (
              <button
                onClick={() => goTo(user.role === "admin" ? "admin" : user.role === "vendedor" ? "vendor-dash" : "home")}
                className="hidden items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium sm:flex"
                style={{ color: "#F6F8F7", border: "1px solid #2A4E56" }}
              >
                <User size={14} /> {user.name}
                {user.role === "comprador" && points > 0 && (
                  <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#B08900", color: "#16242A" }}>
                    🎣 {points}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => goTo("login")}
                className="hidden items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium sm:flex"
                style={{ color: "#F6F8F7", border: "1px solid #2A4E56" }}
              >
                <User size={14} /> Entrar
              </button>
            )}
            <button onClick={() => goTo("cart")} className="relative flex items-center gap-1.5 rounded px-2.5 py-1.5" style={{ color: "#F6F8F7" }}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#E85D42" }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* mobile search */}
        <div className="flex items-center gap-2 px-4 pb-3 sm:hidden">
          <div className="flex flex-1 items-center rounded-md bg-[#F6F8F7] px-3 py-2">
            <Search size={16} color="#5C6B6E" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goTo("catalog", { category: null })}
              placeholder="Buscar…"
              className="w-full bg-transparent px-2 text-sm outline-none"
            />
          </div>
          <button onClick={() => goTo(user ? (user.role === "admin" ? "admin" : user.role === "vendedor" ? "vendor-dash" : "home") : "login")} style={{ color: "#F6F8F7" }}>
            <User size={20} />
          </button>
        </div>

        {/* category nav */}
        <nav className="scrollbar-none flex gap-1 overflow-x-auto border-t px-4 py-2" style={{ borderColor: "#1A4650" }}>
          <button
            onClick={() => goTo("catalog", { category: null })}
            className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold tracking-wide"
            style={{ color: "#F6F8F7", backgroundColor: !activeCategory && view === "catalog" ? "#1A4650" : "transparent" }}
          >
            Todo
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => goTo("catalog", { category: c.id })}
              className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold tracking-wide"
              style={{ color: "#F6F8F7", backgroundColor: activeCategory === c.id ? "#1A4650" : "transparent" }}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </nav>
      </header>

      {/* ---------------- MAIN ---------------- */}
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        {view === "home" && (
          <HomeView products={storefrontProducts} vendors={vendors} goTo={goTo} addToCart={addToCart} />
        )}
        {view === "sell" && <SellerSignupView registerSeller={registerSeller} categories={CATEGORIES} goTo={goTo} />}
        {view === "catalog" && (
          <CatalogView
            products={filteredProducts}
            vendors={vendors}
            activeCategory={activeCategory}
            filters={filters}
            setFilters={setFilters}
            goTo={goTo}
            addToCart={addToCart}
          />
        )}
        {view === "product" && activeProduct && (
          <ProductView
            product={activeProduct}
            vendor={vendorOf(activeProduct.vendorId)}
            allProducts={storefrontProducts}
            vendors={vendors}
            addToCart={addToCart}
            goTo={goTo}
          />
        )}
        {view === "cart" && (
          <CartView lines={cartLines} updateQty={updateQty} removeFromCart={removeFromCart} total={cartTotal} goTo={goTo} />
        )}
        {view === "checkout" && (
          <CheckoutView lines={cartLines} total={cartTotal} user={user} placeOrder={placeOrder} goTo={goTo} />
        )}
        {view === "confirm" && <ConfirmView goTo={goTo} order={lastOrder} totalPoints={points} />}
        {view === "login" && <LoginView login={login} vendors={vendors} goTo={goTo} />}
        {view === "vendor-dash" && user?.role === "vendedor" && (
          <VendorDashboard
            vendor={vendorOf(user.vendorId)}
            products={products.filter((p) => p.vendorId === user.vendorId)}
            orders={orders}
            upsertProduct={upsertProduct}
            deleteProduct={deleteProduct}
            categories={CATEGORIES}
          />
        )}
        {view === "admin" && user?.role === "admin" && (
          <AdminView
            vendors={vendors}
            products={products}
            orders={orders}
            setVendorStatus={setVendorStatus}
            setVendorCommission={setVendorCommission}
            addVendor={addVendor}
          />
        )}
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t py-10" style={{ backgroundColor: "#16242A", borderColor: "#26383D" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center">
          <button onClick={() => goTo("sell")} className="flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "#E4D9C4", color: "#0E3A45" }}>
            <Store size={14} /> ¿Tienes una lonja o pescadería? Vende en LonjaYa
          </button>
          <p className="text-xs" style={{ color: "#7C8B8E", fontFamily: "'IBM Plex Mono', monospace" }}>
            LonjaYa — marketplace de pescado y marisco de lonja a mesa. Comisión transparente por venta, tú fijas tus precios.
            {" "}Logística en frío a cargo de {LOGISTICS_INFO.partnerName}. Prototipo de demostración.
          </p>
        </div>
      </footer>

      {view === "home" && <LiveActivityTicker />}

      {/* ---------------- TOAST ---------------- */}
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: "#2F6B5E" }}
        >
          <span className="mr-1.5 inline-flex align-middle"><Check size={16} /></span>{toast}
        </div>
      )}

      <style>{`
        .ticker-track { animation: ticker-scroll 28s linear infinite; }
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
        }
      `}</style>
    </div>
  );
}

function FontImports() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCT CARD (signature: auction ticket)                           */
/* ------------------------------------------------------------------ */

function ProductCard({ product, vendor, onOpen, onAdd }) {
  const { rating, count } = productReviews(product.id);
  const isBestseller = BESTSELLER_IDS.has(product.id);
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
      style={{ borderColor: "#E4D9C4" }}
    >
      {product.freshness === "hoy" && <StampBadge>FRESCO{"\n"}DE HOY</StampBadge>}
      {isBestseller && <BestsellerRibbon />}
      <button onClick={() => onOpen(product.id)} className="flex flex-col items-start text-left">
        <div
          className="flex h-36 w-full items-center justify-center text-6xl"
          style={{ background: "linear-gradient(160deg,#EAF2EF,#DCEAE3)" }}
        >
          {product.emoji}
        </div>
        <div className="flex w-full flex-col gap-1.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs" style={{ color: "#5C6B6E" }}>{vendor?.name}</span>
            {vendor?.verified && <ShieldCheck size={12} color="#2F6B5E" className="shrink-0" />}
          </div>
          <h3 className="text-sm font-semibold leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
            {product.name}
          </h3>
          <RatingStars rating={rating} count={count} />
          <FreshBadge freshness={product.freshness} />
          {product.stock <= 8 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#B04A2F" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#B04A2F" }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#B04A2F" }} />
              </span>
              ¡Solo quedan {product.stock}!
            </span>
          )}
          <div className="mt-1 flex items-baseline gap-1 border-t border-dashed pt-2" style={{ borderColor: "#D9CBB3" }}>
            <span className="text-lg font-bold" style={{ color: "#E85D42", fontFamily: "'IBM Plex Mono', monospace" }}>
              {eur(product.price)}
            </span>
            <span className="text-xs" style={{ color: "#5C6B6E" }}>/{product.unit}</span>
          </div>
        </div>
      </button>
      <div className="px-3 pb-3">
        <button
          onClick={() => onAdd(product.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold text-white transition-colors"
          style={{ backgroundColor: "#0E3A45" }}
        >
          <Plus size={14} /> Añadir a la cesta
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HOME                                                                */
/* ------------------------------------------------------------------ */

function HomeView({ products, vendors, goTo, addToCart }) {
  const featured = products.filter((p) => p.freshness === "hoy").slice(0, 8);
  const vendorOf = (id) => vendors.find((v) => v.id === id);
  const countdown = useMarketCountdown();
  const flashProducts = FLASH_DEAL_IDS.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const topVendors = [...vendors].filter((v) => v.status === "activo").sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div className="flex flex-col gap-12">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-xl px-6 py-12 sm:px-12 sm:py-16"
        style={{ background: "linear-gradient(120deg,#0E3A45,#173F49 60%,#1F4A45)" }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-semibold tracking-[0.2em]" style={{ color: "#E4D9C4", fontFamily: "'IBM Plex Mono', monospace" }}>
            BOLETÍN DE LA LONJA — HOY
          </span>
          <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl" style={{ fontFamily: "'Fraunces', serif", color: "#F6F8F7", fontWeight: 600 }}>
            De la lonja a tu mesa, sin escalas.
          </h1>
          <p className="mt-4 text-sm sm:text-base" style={{ color: "#C9D6D2" }}>
            Compra directo a pescaderías y lonjas de toda España. Trazabilidad de captura, precios de subasta y envío en frío en 24h.
          </p>
          <button
            onClick={() => goTo("catalog", { category: null })}
            className="mt-6 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "#E85D42" }}
          >
            Ver la lonja de hoy <ChevronRight size={16} />
          </button>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-6 select-none text-[180px] opacity-10 sm:text-[240px]">🐟</div>
      </section>

      {/* TRUST BAR */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Store, label: `${vendors.filter((v) => v.status === "activo").length} lonjas asociadas` },
          { icon: ShieldCheck, label: "Vendedores verificados" },
          { icon: Snowflake, label: LOGISTICS_INFO.shortBadge },
          { icon: TrendingUp, label: "Comisión transparente" },
        ].map((it, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-3" style={{ borderColor: "#E4D9C4" }}>
            <it.icon size={16} color="#2F6B5E" />
            <span className="text-xs font-medium">{it.label}</span>
          </div>
        ))}
      </section>

      {/* FLASH DEALS */}
      {flashProducts.length > 0 && (
        <section className="overflow-hidden rounded-xl" style={{ backgroundColor: "#16242A" }}>
          <div className="flex flex-col items-start justify-between gap-3 px-5 pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "#E85D42" }}>⚡</span>
              <div>
                <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "'Fraunces', serif" }}>Subasta relámpago</h2>
                <p className="text-[11px]" style={{ color: "#9FB0AC" }}>Precio directo de lonja, sin intermediarios — solo hasta el cierre de hoy</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-md px-3 py-1.5" style={{ backgroundColor: "#0E3A45" }}>
              <Clock size={14} color="#E4D9C4" />
              {[countdown.h, countdown.m, countdown.s].map((v, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: "#1A4650", fontFamily: "'IBM Plex Mono', monospace" }}>{v}</span>
                  {i < 2 && <span className="text-white">:</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {flashProducts.map((p) => {
              const refPrice = Math.round(p.price * (1 + FLASH_DISCOUNT) * 100) / 100;
              return (
                <button
                  key={p.id}
                  onClick={() => goTo("product", { productId: p.id })}
                  className="flex flex-col items-start rounded-lg p-3 text-left transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "#1E3A40" }}
                >
                  <span className="text-4xl">{p.emoji}</span>
                  <span className="mt-2 text-xs font-semibold text-white">{p.name}</span>
                  <span className="mt-1 rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "#E85D42", color: "white" }}>
                    -{Math.round(FLASH_DISCOUNT * 100)}%
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-sm font-bold" style={{ color: "#E85D42", fontFamily: "'IBM Plex Mono', monospace" }}>{eur(p.price)}</span>
                    <span className="text-[11px] line-through" style={{ color: "#7C8B8E" }}>{eur(refPrice)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* TOP VENDEDORES */}
      {topVendors.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>🏆 Top lonjas de la semana</h2>
          <p className="mb-4 text-xs" style={{ color: "#5C6B6E" }}>Ranking por valoración y actividad reciente en la plataforma</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topVendors.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border bg-white p-3" style={{ borderColor: i === 0 ? "#B08900" : "#E4D9C4" }}>
                <span className="text-2xl">{["🥇", "🥈", "🥉"][i]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{v.name}</p>
                  <p className="flex items-center gap-1 text-[11px]" style={{ color: "#5C6B6E" }}>
                    <Star size={11} fill="#B08900" color="#B08900" /> {v.rating} · {v.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section>
        <h2 className="mb-4 text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Comprar por categoría</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => goTo("catalog", { category: c.id })}
              className="flex flex-col items-center gap-2 rounded-lg border bg-white py-5 transition-colors hover:border-[#2F6B5E]"
              style={{ borderColor: "#E4D9C4" }}
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-xs font-medium text-center px-1">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Captura fresca de hoy</h2>
          <button onClick={() => goTo("catalog", { category: null })} className="text-xs font-semibold" style={{ color: "#2F6B5E" }}>
            Ver todo →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} vendor={vendorOf(p.vendorId)} onOpen={(id) => goTo("product", { productId: id })} onAdd={addToCart} />
          ))}
        </div>
      </section>

      {/* VENDORS */}
      {VENDOR_TYPES.map((t) => {
        const group = vendors.filter((v) => v.status === "activo" && (v.vendorType || "pescaderia") === t.id);
        if (group.length === 0) return null;
        return (
          <section key={t.id}>
            <div className="mb-1 flex items-center gap-2">
              <t.icon size={18} color="#0E3A45" />
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{t.label}</h2>
            </div>
            <p className="mb-4 text-xs" style={{ color: "#5C6B6E" }}>{t.blurb}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((v) => (
                <div key={v.id} className="rounded-lg border bg-white p-4" style={{ borderColor: "#E4D9C4" }}>
                  <div className="flex items-center gap-2">
                    <Store size={16} color="#0E3A45" />
                    <h3 className="font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{v.name}</h3>
                    {v.verified && <ShieldCheck size={14} color="#2F6B5E" />}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "#5C6B6E" }}>
                    <MapPin size={12} /> {v.location} · desde {v.since}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "#5C6B6E" }}>{v.bio}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: "#B08900" }}>
                    <Star size={13} fill="#B08900" /> {v.rating || "Nuevo"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CATALOG                                                             */
/* ------------------------------------------------------------------ */

function CatalogView({ products, vendors, activeCategory, filters, setFilters, goTo, addToCart }) {
  const vendorOf = (id) => vendors.find((v) => v.id === id);
  const catName = CATEGORIES.find((c) => c.id === activeCategory)?.name || "Todos los productos";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <div className="rounded-lg border bg-white p-4" style={{ borderColor: "#E4D9C4" }}>
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#5C6B6E" }}>
            <SlidersHorizontal size={14} /> Filtros
          </div>

          <label className="mb-1 block text-xs font-medium">Tipo de vendedor</label>
          <select
            value={filters.vendorType}
            onChange={(e) => setFilters((f) => ({ ...f, vendorType: e.target.value, vendor: "all" }))}
            className="mb-3 w-full rounded border px-2 py-1.5 text-xs"
            style={{ borderColor: "#D9CBB3" }}
          >
            <option value="all">Todos</option>
            {VENDOR_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>

          <label className="mb-1 block text-xs font-medium">Vendedor</label>
          <select
            value={filters.vendor}
            onChange={(e) => setFilters((f) => ({ ...f, vendor: e.target.value }))}
            className="mb-3 w-full rounded border px-2 py-1.5 text-xs"
            style={{ borderColor: "#D9CBB3" }}
          >
            <option value="all">Todos</option>
            {vendors.filter((v) => filters.vendorType === "all" || (v.vendorType || "pescaderia") === filters.vendorType).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>

          <label className="mb-1 block text-xs font-medium">Frescura</label>
          <select
            value={filters.freshness}
            onChange={(e) => setFilters((f) => ({ ...f, freshness: e.target.value }))}
            className="mb-3 w-full rounded border px-2 py-1.5 text-xs"
            style={{ borderColor: "#D9CBB3" }}
          >
            <option value="all">Cualquiera</option>
            <option value="hoy">Fresco · hoy</option>
            <option value="ayer">Fresco · ayer</option>
            <option value="congelado">Congelado</option>
            <option value="ahumado">Ahumado</option>
            <option value="conserva">En salazón</option>
          </select>

          <label className="mb-1 block text-xs font-medium">Precio máx: {eur(filters.maxPrice)}</label>
          <input
            type="range" min="5" max="70" value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
            className="mb-3 w-full"
          />

          <label className="mb-1 block text-xs font-medium">Ordenar por</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="w-full rounded border px-2 py-1.5 text-xs"
            style={{ borderColor: "#D9CBB3" }}
          >
            <option value="relevance">Relevancia</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>{catName}</h1>
          <span className="text-xs" style={{ color: "#5C6B6E" }}>{products.length} productos</span>
        </div>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center text-sm" style={{ borderColor: "#D9CBB3", color: "#5C6B6E" }}>
            No hay productos que coincidan con estos filtros. Prueba a ampliar el precio máximo.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} vendor={vendorOf(p.vendorId)} onOpen={(id) => goTo("product", { productId: id })} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCT DETAIL                                                      */
/* ------------------------------------------------------------------ */

function ProductView({ product, vendor, allProducts, vendors, addToCart, goTo }) {
  const [qty, setQty] = useState(1);
  const { rating, count } = productReviews(product.id);

  const alternatives = useMemo(() => {
    return allProducts
      .filter((p) => p.category === product.category && p.vendorId !== product.vendorId)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }, [allProducts, product]);

  return (
    <div>
      <button onClick={() => goTo("catalog", { category: product.category })} className="mb-4 flex items-center gap-1 text-xs font-medium" style={{ color: "#5C6B6E" }}>
        <ArrowLeft size={14} /> Volver
      </button>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-xl" style={{ background: "linear-gradient(160deg,#EAF2EF,#DCEAE3)", minHeight: 340 }}>
          <span className="text-[140px]">{product.emoji}</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: "#2F6B5E" }}>{vendor?.name}</span>
            {vendor?.verified && <VerifiedBadge />}
          </div>
          <h1 className="mt-1 text-3xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{product.name}</h1>
          <div className="mt-1.5"><RatingStars rating={rating} count={count} size={14} /></div>
          <div className="mt-3 flex items-center gap-3">
            <FreshBadge freshness={product.freshness} />
            <span className="flex items-center gap-1 text-xs" style={{ color: "#5C6B6E" }}><MapPin size={12} /> {product.origin}</span>
          </div>
          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold" style={{ color: "#E85D42", fontFamily: "'IBM Plex Mono', monospace" }}>{eur(product.price)}</span>
            <span className="text-sm" style={{ color: "#5C6B6E" }}>/{product.unit}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3A4649" }}>{product.desc}</p>

          <div className="mt-5 flex items-center gap-1 text-xs" style={{ color: product.stock > 5 ? "#2F6B5E" : "#B04A2F" }}>
            <Package size={14} /> {product.stock > 5 ? "En stock" : `Últimas ${product.stock} unidades`}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#5C6B6E" }}>
            <Snowflake size={13} /> {LOGISTICS_INFO.shortBadge} · {LOGISTICS_INFO.partnerName}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border" style={{ borderColor: "#D9CBB3" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-2"><Plus size={14} /></button>
            </div>
            <button
              onClick={() => addToCart(product.id, qty)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "#0E3A45" }}
            >
              <ShoppingCart size={16} /> Añadir a la cesta
            </button>
          </div>

          {vendor && (
            <div className="mt-8 rounded-lg border p-4" style={{ borderColor: "#E4D9C4" }}>
              <div className="flex items-center gap-2"><Store size={16} /><span className="font-semibold text-sm">{vendor.name}</span>{vendor.verified && <ShieldCheck size={14} color="#2F6B5E" />}</div>
              <p className="mt-1 text-xs" style={{ color: "#5C6B6E" }}>{vendor.bio}</p>
              <div className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#B08900" }}><Star size={12} fill="#B08900" /> {vendor.rating} · {vendor.location}</div>
            </div>
          )}

          {alternatives.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "#5C6B6E" }}>Otras lonjas también venden esto</h3>
              <div className="flex flex-col gap-2">
                {alternatives.map((alt) => {
                  const av = vendors.find((v) => v.id === alt.vendorId);
                  return (
                    <button
                      key={alt.id}
                      onClick={() => goTo("product", { productId: alt.id })}
                      className="flex items-center gap-3 rounded-lg border bg-white p-2.5 text-left"
                      style={{ borderColor: "#E4D9C4" }}
                    >
                      <span className="text-2xl">{alt.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold">{alt.name}</p>
                        <p className="text-[11px]" style={{ color: "#5C6B6E" }}>{av?.name}{av?.verified ? " · verificado" : ""}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#E85D42", fontFamily: "'IBM Plex Mono', monospace" }}>{eur(alt.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CART                                                                */
/* ------------------------------------------------------------------ */

function CartView({ lines, updateQty, removeFromCart, total, goTo }) {
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ShoppingCart size={36} color="#5C6B6E" />
        <h2 className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Tu cesta está vacía</h2>
        <p className="text-sm" style={{ color: "#5C6B6E" }}>Añade pescado o marisco fresco desde el catálogo.</p>
        <button onClick={() => goTo("catalog", { category: null })} className="mt-2 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "#0E3A45" }}>
          Ir a la lonja
        </button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Tu cesta</h1>
        <div className="flex flex-col gap-3">
          {lines.map((l) => (
            <div key={l.productId} className="flex items-center gap-3 rounded-lg border bg-white p-3" style={{ borderColor: "#E4D9C4" }}>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded text-3xl" style={{ background: "#EAF2EF" }}>{l.product.emoji}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{l.product.name}</p>
                <p className="text-xs" style={{ color: "#5C6B6E" }}>{eur(l.product.price)}/{l.product.unit}</p>
              </div>
              <div className="flex items-center rounded-md border" style={{ borderColor: "#D9CBB3" }}>
                <button onClick={() => updateQty(l.productId, l.qty - 1)} className="p-1.5"><Minus size={12} /></button>
                <span className="w-6 text-center text-xs">{l.qty}</span>
                <button onClick={() => updateQty(l.productId, l.qty + 1)} className="p-1.5"><Plus size={12} /></button>
              </div>
              <span className="w-16 text-right text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{eur(l.product.price * l.qty)}</span>
              <button onClick={() => removeFromCart(l.productId)} style={{ color: "#B04A2F" }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="h-fit rounded-lg border bg-white p-5" style={{ borderColor: "#E4D9C4" }}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "#5C6B6E" }}>Resumen</h2>
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{eur(total)}</span></div>
        <div className="flex justify-between text-sm"><span>Envío en frío</span><span>{total > 40 ? "Gratis" : eur(4.9)}</span></div>
        <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold" style={{ borderColor: "#E4D9C4" }}>
          <span>Total</span><span style={{ color: "#E85D42" }}>{eur(total > 40 ? total : total + 4.9)}</span>
        </div>
        <button onClick={() => goTo("checkout")} className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "#E85D42" }}>
          Tramitar pedido
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CHECKOUT                                                            */
/* ------------------------------------------------------------------ */

function CheckoutView({ lines, total, user, placeOrder, goTo }) {
  const [form, setForm] = useState({ name: user?.name || "", address: "", city: "", postal: "", payment: "tarjeta" });
  const [submitting, setSubmitting] = useState(false);
  const shipping = total > 40 ? 0 : 4.9;

  const canSubmit = form.name && form.address && form.city && form.postal;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Finalizar pedido</h1>
        <div className="rounded-lg border bg-white p-5" style={{ borderColor: "#E4D9C4" }}>
          <h2 className="mb-3 text-sm font-semibold">Dirección de entrega</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="Nombre completo" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded border px-3 py-2 text-sm sm:col-span-2" style={{ borderColor: "#D9CBB3" }} />
            <input placeholder="Dirección" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="rounded border px-3 py-2 text-sm sm:col-span-2" style={{ borderColor: "#D9CBB3" }} />
            <input placeholder="Ciudad" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
            <input placeholder="Código postal" value={form.postal} onChange={(e) => setForm((f) => ({ ...f, postal: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          </div>

          <h2 className="mb-3 mt-5 text-sm font-semibold">Pago (simulado)</h2>
          <div className="flex gap-2">
            {["tarjeta", "transferencia", "contrareembolso"].map((p) => (
              <button
                key={p}
                onClick={() => setForm((f) => ({ ...f, payment: p }))}
                className="rounded-md border px-3 py-1.5 text-xs font-medium capitalize"
                style={{ borderColor: form.payment === p ? "#0E3A45" : "#D9CBB3", backgroundColor: form.payment === p ? "#0E3A45" : "white", color: form.payment === p ? "white" : "#16242A" }}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: "#5C6B6E" }}>Este es un prototipo: no se procesa ningún pago real.</p>

          <div className="mt-5 flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: "#2F6B5E33", backgroundColor: "#2F6B5E0D" }}>
            <Snowflake size={16} color="#2F6B5E" className="mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold" style={{ color: "#2F6B5E" }}>{LOGISTICS_INFO.headline}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: "#5C6B6E" }}>{LOGISTICS_INFO.detail}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-fit rounded-lg border bg-white p-5" style={{ borderColor: "#E4D9C4" }}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "#5C6B6E" }}>Tu pedido</h2>
        <div className="flex flex-col gap-2">
          {lines.map((l) => (
            <div key={l.productId} className="flex justify-between text-xs">
              <span>{l.qty}× {l.product.name}</span>
              <span>{eur(l.product.price * l.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t pt-3 text-sm" style={{ borderColor: "#E4D9C4" }}>
          <span>Envío</span><span>{shipping === 0 ? "Gratis" : eur(shipping)}</span>
        </div>
        <div className="mt-1 flex justify-between text-base font-bold">
          <span>Total</span><span style={{ color: "#E85D42" }}>{eur(total + shipping)}</span>
        </div>
        <button
          disabled={!canSubmit || submitting}
          onClick={async () => { setSubmitting(true); await placeOrder(form); }}
          className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "#E85D42" }}
        >
          {submitting ? "Confirmando…" : "Confirmar pedido"}
        </button>
        <button onClick={() => goTo("cart")} className="mt-2 w-full text-xs font-medium" style={{ color: "#5C6B6E" }}>Volver a la cesta</button>
      </div>
    </div>
  );
}

function ConfirmView({ goTo, order, totalPoints }) {
  const nextReward = LOYALTY_CONFIG.rewardThreshold;
  const progress = Math.min(100, ((totalPoints % nextReward) / nextReward) * 100);
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#2F6B5E1A" }}>
        <Check size={30} color="#2F6B5E" />
      </div>
      <h2 className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>¡Pedido confirmado!</h2>
      <p className="max-w-sm text-sm" style={{ color: "#5C6B6E" }}>
        Tu pedido se está preparando en cadena de frío por cada vendedor y llegará en 24-48h.
      </p>

      {order && (
        <div className="mt-4 w-full max-w-sm rounded-lg border p-4" style={{ borderColor: "#B08900", backgroundColor: "#B0890010" }}>
          <p className="flex items-center justify-center gap-1.5 text-sm font-bold" style={{ color: "#8A6A00" }}>
            🎣 +{order.pointsEarned} puntos LonjaYa ganados
          </p>
          <p className="mt-1 text-[11px]" style={{ color: "#5C6B6E" }}>
            Acumulas {LOYALTY_CONFIG.pointsPerEuro} puntos por cada euro. Cada {nextReward} puntos = {eur(LOYALTY_CONFIG.rewardValue)} de descuento en tu próximo pedido.
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#E4D9C4" }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: "#B08900" }} />
          </div>
          <p className="mt-1 text-[11px] font-medium" style={{ color: "#5C6B6E" }}>Total acumulado: {totalPoints} puntos</p>
        </div>
      )}

      <button onClick={() => goTo("catalog", { category: null })} className="mt-2 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "#0E3A45" }}>
        Seguir comprando
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LOGIN (demo)                                                        */
/* ------------------------------------------------------------------ */

function LoginView({ login, vendors, goTo }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("comprador");
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="mb-1 text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Acceder a LonjaYa</h1>
      <p className="mb-6 text-xs" style={{ color: "#5C6B6E" }}>Acceso de demostración — sin contraseña, elige un rol para explorar esa parte de la app.</p>

      <label className="mb-1 block text-xs font-medium">Tu nombre</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Marta García" className="mb-4 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />

      <label className="mb-1 block text-xs font-medium">Entrar como</label>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[{ id: "comprador", label: "Comprador", icon: User }, { id: "vendedor", label: "Vendedor", icon: Store }, { id: "admin", label: "Admin", icon: ShieldCheck }].map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className="flex flex-col items-center gap-1 rounded-md border py-2.5 text-xs font-medium"
            style={{ borderColor: role === r.id ? "#0E3A45" : "#D9CBB3", backgroundColor: role === r.id ? "#0E3A45" : "white", color: role === r.id ? "white" : "#16242A" }}
          >
            <r.icon size={16} /> {r.label}
          </button>
        ))}
      </div>

      {role === "vendedor" && (
        <>
          <label className="mb-1 block text-xs font-medium">Tu pescadería / lonja</label>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="mb-4 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </>
      )}

      <button
        disabled={!name.trim()}
        onClick={() => login(name.trim(), role, vendorId)}
        className="w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        style={{ backgroundColor: "#E85D42" }}
      >
        Entrar
      </button>
      <button onClick={() => goTo("home")} className="mt-3 w-full text-xs font-medium" style={{ color: "#5C6B6E" }}>Cancelar</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SELLER SIGN-UP                                                      */
/* ------------------------------------------------------------------ */

function SellerSignupView({ registerSeller, categories, goTo }) {
  const [form, setForm] = useState({ ownerName: "", storeName: "", location: "", specialty: categories[0].id, bio: "", vendorType: "pescaderia" });
  const [submitting, setSubmitting] = useState(false);
  const [kg, setKg] = useState(120);
  const [avgPrice, setAvgPrice] = useState(20);
  const canSubmit = form.ownerName && form.storeName && form.location;

  const gross = kg * avgPrice;
  const commission = gross * DEFAULT_COMMISSION;
  const net = gross - commission;

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <span className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#B08900", fontFamily: "'IBM Plex Mono', monospace" }}>PARA VENDEDORES</span>
          <h1 className="mt-2 text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Vende tu pescado en LonjaYa</h1>
          <p className="mt-3 text-sm" style={{ color: "#5C6B6E" }}>
            Da igual si eres una pescadería de barrio, una empresa distribuidora o una tienda online especializada: todos tienen su sitio en LonjaYa.
          </p>

          <div className="mt-5 rounded-lg p-4" style={{ backgroundColor: "#0E3A45" }}>
            <p className="text-xs font-semibold text-white">🧮 Calcula lo que podrías ganar</p>
            <label className="mt-3 flex items-center justify-between text-[11px]" style={{ color: "#C9D6D2" }}>
              <span>Kilos vendidos al mes</span><span className="font-bold text-white">{kg} kg</span>
            </label>
            <input type="range" min="10" max="1000" step="10" value={kg} onChange={(e) => setKg(Number(e.target.value))} className="w-full" />
            <label className="mt-2 flex items-center justify-between text-[11px]" style={{ color: "#C9D6D2" }}>
              <span>Precio medio por kg</span><span className="font-bold text-white">{eur(avgPrice)}</span>
            </label>
            <input type="range" min="4" max="60" step="1" value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} className="w-full" />
            <div className="mt-3 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "#1A4650" }}>
              <div className="flex justify-between text-[11px]" style={{ color: "#9FB0AC" }}><span>Ventas brutas / mes</span><span>{eur(gross)}</span></div>
              <div className="flex justify-between text-[11px]" style={{ color: "#9FB0AC" }}><span>Comisión LonjaYa ({(DEFAULT_COMMISSION * 100).toFixed(0)}%)</span><span>− {eur(commission)}</span></div>
              <div className="flex justify-between text-sm font-bold text-white"><span>Ingreso neto estimado</span><span style={{ color: "#7FD9B5" }}>{eur(net)}/mes</span></div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg border bg-white p-3" style={{ borderColor: "#E4D9C4" }}>
              <TrendingUp size={16} color="#2F6B5E" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Comisión del {(DEFAULT_COMMISSION * 100).toFixed(0)}% por venta</p>
                <p className="text-[11px]" style={{ color: "#5C6B6E" }}>Solo se cobra cuando vendes. Sin cuotas fijas ni permanencia.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border bg-white p-3" style={{ borderColor: "#E4D9C4" }}>
              <ShieldCheck size={16} color="#2F6B5E" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Revisión de calidad</p>
                <p className="text-[11px]" style={{ color: "#5C6B6E" }}>Un administrador aprueba tu alta antes de aparecer en el catálogo.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border bg-white p-3" style={{ borderColor: "#E4D9C4" }}>
              <BarChart3 size={16} color="#2F6B5E" className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Panel de ventas propio</p>
                <p className="text-[11px]" style={{ color: "#5C6B6E" }}>Gestiona productos, pedidos e ingresos netos en tiempo real.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 lg:col-span-3" style={{ borderColor: "#E4D9C4" }}>
          <h2 className="mb-3 text-sm font-semibold">¿Qué tipo de vendedor eres?</h2>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {VENDOR_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setForm((f) => ({ ...f, vendorType: t.id }))}
                className="flex flex-col items-center gap-1.5 rounded-md border py-3 text-center text-[11px] font-medium"
                style={{
                  borderColor: form.vendorType === t.id ? "#0E3A45" : "#D9CBB3",
                  backgroundColor: form.vendorType === t.id ? "#0E3A45" : "white",
                  color: form.vendorType === t.id ? "white" : "#16242A",
                }}
              >
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>

          <h2 className="mb-3 text-sm font-semibold">Solicitud de alta</h2>
          <div className="flex flex-col gap-3">
            <input placeholder="Tu nombre" value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
            <input
              placeholder={form.vendorType === "empresa" ? "Nombre de la empresa" : form.vendorType === "web" ? "Nombre de tu tienda online" : "Nombre de tu lonja o pescadería"}
              value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}
            />
            <input
              placeholder={form.vendorType === "web" ? "Ámbito de envío (ej. Venta online, España)" : "Ubicación (ciudad, puerto...)"}
              value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}
            />
            <select value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <textarea placeholder="Cuéntanos qué vendes y de dónde viene tu captura" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          </div>
          <button
            disabled={!canSubmit || submitting}
            onClick={async () => { setSubmitting(true); await registerSeller(form); }}
            className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: "#E85D42" }}
          >
            {submitting ? "Enviando…" : "Enviar solicitud"}
          </button>
          <button onClick={() => goTo("home")} className="mt-2 w-full text-xs font-medium" style={{ color: "#5C6B6E" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VENDOR DASHBOARD                                                    */
/* ------------------------------------------------------------------ */

function emptyProduct(vendorId) {
  return { id: "p" + Date.now(), name: "", category: CATEGORIES[0].id, vendorId, price: 10, unit: "kg", stock: 10, freshness: "hoy", origin: "", emoji: "🐟", desc: "" };
}

function VendorDashboard({ vendor, products, orders, upsertProduct, deleteProduct, categories }) {
  const [tab, setTab] = useState("productos");
  const [editing, setEditing] = useState(null);

  const myOrders = orders.filter((o) => o.lines.some((l) => l.vendorId === vendor?.id));
  const myLines = myOrders.flatMap((o) => o.lines.filter((l) => l.vendorId === vendor?.id));
  const gross = myLines.reduce((s, l) => s + l.price * l.qty, 0);
  const commissionRate = vendor?.commissionRate ?? DEFAULT_COMMISSION;
  const commissionPaid = myLines.reduce((s, l) => s + (l.commission ?? l.price * l.qty * commissionRate), 0);
  const net = gross - commissionPaid;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Store size={22} />
        <div>
          <h1 className="flex items-center gap-1.5 text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>
            {vendor?.name} {vendor?.verified && <ShieldCheck size={16} color="#2F6B5E" />}
          </h1>
          <p className="text-xs" style={{ color: "#5C6B6E" }}>Panel de vendedor · comisión LonjaYa {(commissionRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {vendor?.status === "pendiente" && (
        <div className="mb-6 rounded-lg border p-3 text-xs font-medium" style={{ borderColor: "#B08900", backgroundColor: "#B0890014", color: "#8A6A00" }}>
          Tu solicitud está en revisión. Puedes preparar tu catálogo ya, pero tus productos no aparecerán en la tienda hasta que un administrador te apruebe.
        </div>
      )}
      {vendor?.status === "suspendido" && (
        <div className="mb-6 rounded-lg border p-3 text-xs font-medium" style={{ borderColor: "#B04A2F", backgroundColor: "#B04A2F14", color: "#8A3720" }}>
          Tu cuenta está suspendida temporalmente y tus productos no son visibles. Contacta con administración.
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Package} label="Productos" value={products.length} />
        <StatCard icon={BarChart3} label="Pedidos" value={myOrders.length} />
        <StatCard icon={TrendingUp} label="Ventas brutas" value={eur(gross)} />
        <StatCard icon={ShieldCheck} label={`Comisión LonjaYa (${(commissionRate * 100).toFixed(0)}%)`} value={`− ${eur(commissionPaid)}`} />
        <StatCard icon={Check} label="Ingreso neto" value={eur(net)} />
      </div>

      <div className="mb-4 flex gap-2 border-b" style={{ borderColor: "#E4D9C4" }}>
        {["productos", "pedidos"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className="border-b-2 px-3 py-2 text-sm font-medium capitalize" style={{ borderColor: tab === t ? "#E85D42" : "transparent", color: tab === t ? "#16242A" : "#5C6B6E" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "productos" && (
        <div>
          <button onClick={() => setEditing(emptyProduct(vendor.id))} className="mb-4 flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: "#0E3A45" }}>
            <PlusCircle size={14} /> Nuevo producto
          </button>
          <div className="flex flex-col gap-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-white p-3" style={{ borderColor: "#E4D9C4" }}>
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs" style={{ color: "#5C6B6E" }}>{eur(p.price)}/{p.unit} · stock {p.stock}</p>
                </div>
                <button onClick={() => setEditing(p)} className="rounded p-1.5" style={{ color: "#2F6B5E" }}><Pencil size={16} /></button>
                <button onClick={() => deleteProduct(p.id)} className="rounded p-1.5" style={{ color: "#B04A2F" }}><Trash2 size={16} /></button>
              </div>
            ))}
            {products.length === 0 && <p className="text-sm" style={{ color: "#5C6B6E" }}>Todavía no tienes productos publicados.</p>}
          </div>
        </div>
      )}

      {tab === "pedidos" && (
        <div className="flex flex-col gap-2">
          {myOrders.length === 0 && <p className="text-sm" style={{ color: "#5C6B6E" }}>Sin pedidos todavía.</p>}
          {myOrders.map((o) => (
            <div key={o.id} className="rounded-lg border bg-white p-3" style={{ borderColor: "#E4D9C4" }}>
              <div className="flex justify-between text-sm font-semibold">
                <span>Pedido {o.id.slice(-5)}</span>
                <span style={{ color: "#2F6B5E" }}>{o.status}</span>
              </div>
              <p className="text-xs" style={{ color: "#5C6B6E" }}>{o.user} · {new Date(o.date).toLocaleDateString("es-ES")}</p>
              {o.lines.filter((l) => l.vendorId === vendor.id).map((l, i) => (
                <div key={i} className="mt-1.5 flex items-center justify-between text-xs">
                  <span>{l.qty}× {l.name}</span>
                  <span style={{ color: "#5C6B6E" }}>
                    {eur(l.price * l.qty)} · comisión {eur(l.commission ?? 0)} · <span style={{ color: "#2F6B5E", fontWeight: 600 }}>neto {eur(l.vendorPayout ?? l.price * l.qty)}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductEditorModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={(p) => { upsertProduct(p); setEditing(null); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: "#E4D9C4" }}>
      <Icon size={16} color="#5C6B6E" />
      <p className="mt-2 text-lg font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
      <p className="text-xs" style={{ color: "#5C6B6E" }}>{label}</p>
    </div>
  );
}

function ProductEditorModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Editar producto</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-2.5">
          <input placeholder="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.1" placeholder="Precio" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
            <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}>
              <option value="kg">kg</option><option value="unidad">unidad</option><option value="docena">docena</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
            <select value={form.freshness} onChange={(e) => setForm((f) => ({ ...f, freshness: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }}>
              <option value="hoy">Fresco hoy</option><option value="ayer">Fresco ayer</option><option value="congelado">Congelado</option><option value="ahumado">Ahumado</option><option value="conserva">Conserva</option>
            </select>
          </div>
          <input placeholder="Origen (ej. Rías Baixas)" value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          <input placeholder="Emoji (ej. 🐟)" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          <textarea placeholder="Descripción" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} rows={2} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
        </div>
        <button
          disabled={!form.name}
          onClick={() => onSave(form)}
          className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "#0E3A45" }}
        >
          Guardar producto
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ADMIN                                                               */
/* ------------------------------------------------------------------ */

function AdminView({ vendors, products, orders, setVendorStatus, setVendorCommission, addVendor }) {
  const [showNew, setShowNew] = useState(false);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCommission = orders.reduce((s, o) => s + o.lines.reduce((s2, l) => s2 + (l.commission ?? 0), 0), 0);
  const pending = vendors.filter((v) => v.status === "pendiente");
  const active = vendors.filter((v) => v.status !== "pendiente");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck size={22} />
        <div>
          <h1 className="text-xl font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Panel de administración</h1>
          <p className="text-xs" style={{ color: "#5C6B6E" }}>Visión global del marketplace</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Users} label="Vendedores" value={vendors.length} />
        <StatCard icon={Package} label="Productos" value={products.length} />
        <StatCard icon={BarChart3} label="Pedidos" value={orders.length} />
        <StatCard icon={TrendingUp} label="Ventas totales (GMV)" value={eur(totalRevenue)} />
        <StatCard icon={ShieldCheck} label="Comisión generada" value={eur(totalCommission)} />
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: "#B08900" }}>Solicitudes pendientes ({pending.length})</h2>
          <div className="flex flex-col gap-2">
            {pending.map((v) => (
              <div key={v.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center" style={{ borderColor: "#B08900", backgroundColor: "#B0890010" }}>
                <Store size={16} />
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {v.name}
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#0E3A4514", color: "#0E3A45" }}>
                      {VENDOR_TYPES.find((t) => t.id === (v.vendorType || "pescaderia"))?.label}
                    </span>
                  </p>
                  <p className="text-xs" style={{ color: "#5C6B6E" }}>{v.location} · especialidad {CATEGORIES.find((c) => c.id === v.specialty)?.name}</p>
                  {v.bio && <p className="mt-0.5 text-xs" style={{ color: "#5C6B6E" }}>{v.bio}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setVendorStatus(v.id, "activo")} className="rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "#2F6B5E" }}>Aprobar</button>
                  <button onClick={() => setVendorStatus(v.id, "rechazado")} className="rounded-md border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "#D9CBB3" }}>Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#5C6B6E" }}>Vendedores y comisiones</h2>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "#0E3A45" }}>
          <PlusCircle size={14} /> Añadir vendedor
        </button>
      </div>

      {VENDOR_TYPES.map((t) => {
        const group = active.filter((v) => (v.vendorType || "pescaderia") === t.id);
        if (group.length === 0) return null;
        return (
          <div key={t.id} className="mb-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#5C6B6E" }}>
              <t.icon size={13} /> {t.label} ({group.length})
            </h3>
            <div className="flex flex-col gap-2">
              {group.map((v) => (
                <div key={v.id} className="flex flex-col gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center" style={{ borderColor: "#E4D9C4" }}>
                  <Store size={16} />
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">{v.name} {v.verified && <ShieldCheck size={13} color="#2F6B5E" />}</p>
                    <p className="text-xs" style={{ color: "#5C6B6E" }}>{v.location} · {products.filter((p) => p.vendorId === v.id).length} productos</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]" style={{ color: "#5C6B6E" }}>Comisión</span>
                    <input
                      type="number" min="0" max="40" step="1"
                      value={Math.round(v.commissionRate * 100)}
                      onChange={(e) => setVendorCommission(v.id, Math.max(0, Math.min(40, Number(e.target.value))) / 100)}
                      className="w-14 rounded border px-1.5 py-1 text-xs"
                      style={{ borderColor: "#D9CBB3" }}
                    />
                    <span className="text-[11px]" style={{ color: "#5C6B6E" }}>%</span>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: v.status === "activo" ? "#2F6B5E1A" : "#B04A2F1A", color: v.status === "activo" ? "#2F6B5E" : "#B04A2F" }}>
                    {v.status}
                  </span>
                  <button
                    onClick={() => setVendorStatus(v.id, v.status === "activo" ? "suspendido" : "activo")}
                    className="rounded border px-2.5 py-1 text-xs font-medium"
                    style={{ borderColor: "#D9CBB3" }}
                  >
                    {v.status === "activo" ? "Suspender" : "Reactivar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {showNew && (
        <NewVendorModal onClose={() => setShowNew(false)} onSave={(v) => { addVendor(v); setShowNew(false); }} />
      )}
    </div>
  );
}

function NewVendorModal({ onClose, onSave }) {
  const [form, setForm] = useState({ id: "v" + Date.now(), name: "", location: "", rating: 4.5, since: new Date().getFullYear(), specialty: CATEGORIES[0].id, bio: "", status: "activo", commissionRate: DEFAULT_COMMISSION, verified: true, vendorType: "pescaderia" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold" style={{ fontFamily: "'Fraunces', serif" }}>Nuevo vendedor</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {VENDOR_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setForm((f) => ({ ...f, vendorType: t.id }))}
              className="flex flex-col items-center gap-1 rounded-md border py-2 text-center text-[10px] font-medium"
              style={{
                borderColor: form.vendorType === t.id ? "#0E3A45" : "#D9CBB3",
                backgroundColor: form.vendorType === t.id ? "#0E3A45" : "white",
                color: form.vendorType === t.id ? "white" : "#16242A",
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <input placeholder="Nombre de la pescadería/lonja/empresa" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          <input placeholder="Ubicación" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
          <textarea placeholder="Descripción breve" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={2} className="rounded border px-3 py-2 text-sm" style={{ borderColor: "#D9CBB3" }} />
        </div>
        <button disabled={!form.name} onClick={() => onSave(form)} className="mt-4 w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-40" style={{ backgroundColor: "#0E3A45" }}>
          Aprobar y publicar
        </button>
      </div>
    </div>
  );
}
