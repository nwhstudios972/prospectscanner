export interface ProduitCatalogue {
  nom: string;
  prix: number | null;
  devise: string | null;
  url: string | null;
}

const TIMEOUT_MS = 8000;
const MAX_PRODUITS = 10;
const USER_AGENT = "Mozilla/5.0 (compatible; ProspectScannerBot/1.0; +https://prospectscan.cyou)";

async function fetchJson(url: string): Promise<unknown | null> {
  const controleur = new AbortController();
  const timeout = setTimeout(() => controleur.abort(), TIMEOUT_MS);
  try {
    const reponse = await fetch(url, {
      signal: controleur.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!reponse.ok) return null;
    const contentType = reponse.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return await reponse.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

interface ShopifyVariant {
  price?: string;
}
interface ShopifyProduit {
  title: string;
  handle: string;
  variants?: ShopifyVariant[];
}
interface ShopifyReponse {
  products?: ShopifyProduit[];
}

// Shopify expose par défaut un catalogue public en JSON sur /products.json
// (endpoint intentionnellement public, pas de contournement de protection).
async function recupererCatalogueShopify(baseUrl: string): Promise<ProduitCatalogue[]> {
  const data = (await fetchJson(`${baseUrl}/products.json?limit=${MAX_PRODUITS}`)) as ShopifyReponse | null;
  if (!data?.products) return [];

  return data.products.slice(0, MAX_PRODUITS).map((produit) => {
    const prixBrut = produit.variants?.[0]?.price;
    return {
      nom: produit.title,
      prix: prixBrut ? Number(prixBrut) : null,
      devise: null, // products.json n'indique pas la devise du magasin
      url: `${baseUrl}/products/${produit.handle}`,
    };
  });
}

interface WooCommerceProduit {
  name: string;
  permalink?: string;
  prices?: { price?: string; currency_minor_unit?: number; currency_code?: string };
}

// La "Store API" de WooCommerce (blocs de la boutique) est publique par
// défaut sur les installations récentes — /wp-json/wc/store/v1/products.
async function recupererCatalogueWooCommerce(baseUrl: string): Promise<ProduitCatalogue[]> {
  const data = (await fetchJson(
    `${baseUrl}/wp-json/wc/store/v1/products?per_page=${MAX_PRODUITS}`,
  )) as WooCommerceProduit[] | null;
  if (!Array.isArray(data)) return [];

  return data.slice(0, MAX_PRODUITS).map((produit) => {
    const prixMineur = produit.prices?.price ? Number(produit.prices.price) : null;
    const decimales = produit.prices?.currency_minor_unit ?? 2;
    return {
      nom: produit.name,
      prix: prixMineur !== null ? prixMineur / 10 ** decimales : null,
      devise: produit.prices?.currency_code ?? null,
      url: produit.permalink ?? null,
    };
  });
}

// Best-effort, uniquement quand la plateforme e-commerce détectée expose un
// endpoint public connu (voir tech-detector.ts). Aucune tentative de
// contournement d'authentification/protection — juste les deux endpoints
// publics par défaut les plus courants. Retourne [] pour tout autre cas
// (PrestaShop/Magento webservice nécessitent une clé API, non gérés ici).
export async function recupererCatalogueEcommerce(
  siteWeb: string,
  technologies: { nom: string }[],
): Promise<ProduitCatalogue[]> {
  let baseUrl: string;
  try {
    baseUrl = new URL(siteWeb).origin;
  } catch {
    return [];
  }

  const noms = new Set(technologies.map((t) => t.nom));
  if (noms.has("Shopify")) return recupererCatalogueShopify(baseUrl);
  if (noms.has("WooCommerce")) return recupererCatalogueWooCommerce(baseUrl);
  return [];
}
