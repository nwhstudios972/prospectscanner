export type CategorieTechnologie =
  | "cms"
  | "ecommerce"
  | "crm_marketing"
  | "analytics"
  | "paiement"
  | "autre";

export interface TechnologieDetectee {
  categorie: CategorieTechnologie;
  nom: string;
}

interface Signature {
  nom: string;
  categorie: CategorieTechnologie;
  regex: RegExp;
}

// Détection best-effort par signatures textuelles sur le HTML brut de la
// page d'accueil (balises meta generator, scripts tiers, classes CSS
// caractéristiques). Volontairement simple (pas de parsing DOM) : suffisant
// pour repérer la présence d'un outil, pas besoin d'une précision
// exhaustive façon Wappalyzer.
const SIGNATURES: Signature[] = [
  // CMS
  { nom: "WordPress", categorie: "cms", regex: /wp-content|wp-includes|generator["']?\s*content=["']wordpress/i },
  { nom: "Wix", categorie: "cms", regex: /static\.wixstatic\.com|wix\.com/i },
  { nom: "Squarespace", categorie: "cms", regex: /squarespace\.com|static1\.squarespace/i },
  { nom: "Joomla", categorie: "cms", regex: /joomla/i },
  { nom: "Drupal", categorie: "cms", regex: /sites\/(all|default)\/(modules|themes)|drupal\.js/i },
  { nom: "Webflow", categorie: "cms", regex: /webflow\.com|w-webflow-badge/i },

  // E-commerce
  { nom: "Shopify", categorie: "ecommerce", regex: /cdn\.shopify\.com|shopify\.com\/s\//i },
  { nom: "PrestaShop", categorie: "ecommerce", regex: /prestashop/i },
  { nom: "WooCommerce", categorie: "ecommerce", regex: /woocommerce/i },
  { nom: "Magento", categorie: "ecommerce", regex: /mage\/cookies|magento/i },
  { nom: "BigCommerce", categorie: "ecommerce", regex: /bigcommerce\.com/i },

  // CRM / marketing
  { nom: "HubSpot", categorie: "crm_marketing", regex: /js\.hs-scripts\.com|hubspot\.com/i },
  { nom: "Mailchimp", categorie: "crm_marketing", regex: /list-manage\.com|mailchimp\.com/i },
  { nom: "ActiveCampaign", categorie: "crm_marketing", regex: /activehosted\.com|activecampaign\.com/i },
  { nom: "Klaviyo", categorie: "crm_marketing", regex: /klaviyo\.com/i },
  { nom: "Salesforce", categorie: "crm_marketing", regex: /salesforce\.com|force\.com/i },
  { nom: "Brevo (Sendinblue)", categorie: "crm_marketing", regex: /sendinblue\.com|brevo\.com/i },

  // Analytics / pixels publicitaires
  { nom: "Google Analytics", categorie: "analytics", regex: /google-analytics\.com\/analytics\.js|gtag\(['"]config|googletagmanager\.com\/gtag/i },
  { nom: "Google Tag Manager", categorie: "analytics", regex: /googletagmanager\.com\/gtm\.js/i },
  { nom: "Meta Pixel", categorie: "analytics", regex: /connect\.facebook\.net.*fbevents\.js|fbq\(['"]init/i },
  { nom: "TikTok Pixel", categorie: "analytics", regex: /analytics\.tiktok\.com/i },
  { nom: "Hotjar", categorie: "analytics", regex: /static\.hotjar\.com/i },
  { nom: "LinkedIn Insight Tag", categorie: "analytics", regex: /snap\.licdn\.com\/li\.lms-analytics/i },

  // Paiement
  { nom: "Stripe", categorie: "paiement", regex: /js\.stripe\.com/i },
  { nom: "PayPal", categorie: "paiement", regex: /paypal\.com\/sdk\/js|paypalobjects\.com/i },
  { nom: "SumUp", categorie: "paiement", regex: /sumup\.com/i },
  { nom: "Mollie", categorie: "paiement", regex: /mollie\.com/i },
];

// Détection best-effort par signatures textuelles sur le HTML de la page
// d'accueil, déjà récupéré par recupererPageSite (site-fetch.ts) — simple
// parsing, pas de fetch ici.
export function detecterTechnologiesDepuisHtml(html: string): TechnologieDetectee[] {
  const trouvees = new Map<string, TechnologieDetectee>();

  for (const signature of SIGNATURES) {
    if (signature.regex.test(html)) {
      trouvees.set(signature.nom, { nom: signature.nom, categorie: signature.categorie });
    }
  }

  return Array.from(trouvees.values());
}
