/**
 * Genera el sitemap.xml al vuelo, consultando los productos reales en cada
 * petición — así nunca queda desactualizado cuando se añade o se quita un
 * producto, sin tener que regenerar nada a mano.
 */

const { createClient } = require("@supabase/supabase-js");

const SITE = "https://lonjaya.com";
const CATEGORIES = ["pescado-blanco", "pescado-azul", "mariscos", "moluscos", "crustaceos", "ahumados"];

function url(loc, priority = "0.6", changefreq = "weekly") {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

exports.handler = async () => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: products } = await supabase.from("products").select("id").limit(5000);

    const staticUrls = [
      url(`${SITE}/`, "1.0", "daily"),
      url(`${SITE}/catalogo`, "0.9", "daily"),
      url(`${SITE}/blog`, "0.7", "daily"),
      url(`${SITE}/recetario`, "0.7", "weekly"),
      url(`${SITE}/ofertas-flash`, "0.8", "daily"),
      url(`${SITE}/subastas`, "0.7", "daily"),
      url(`${SITE}/hosteleria`, "0.6", "monthly"),
    ];

    const categoryUrls = CATEGORIES.map((c) => url(`${SITE}/catalogo/${c}`, "0.7", "daily"));
    const productUrls = (products || []).map((p) => url(`${SITE}/producto/${p.id}`, "0.8", "weekly"));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...categoryUrls, ...productUrls].join("\n")}\n</urlset>`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
      body: xml,
    };
  } catch (err) {
    return { statusCode: 500, body: `Error generando el sitemap: ${err.message}` };
  }
};
