import type { Plateforme } from "@/lib/generated/prisma/enums";

export type PlateformeSociale = Exclude<Plateforme, "site_web">;

export const PLATEFORMES_SOCIALES: PlateformeSociale[] = [
  "facebook",
  "instagram",
  "tiktok",
  "linkedin",
  "youtube",
  "x",
  "pagesjaunes",
  "booking",
  "tripadvisor",
  "airbnb",
];

interface Signature {
  plateforme: PlateformeSociale;
  regex: RegExp;
}

// Détection best-effort par recherche de liens sortants dans le HTML de la
// page d'accueil du prospect (déjà récupéré par recupererPageSite) — même
// logique que tech-detector.ts, appliquée aux réseaux/annuaires plutôt
// qu'aux technologies. On exclut les URLs génériques (boutons de partage,
// pixels de suivi, intents) pour ne garder que de vrais liens de profil.
const SIGNATURES: Signature[] = [
  {
    plateforme: "facebook",
    regex: /https?:\/\/(?:www\.|m\.)?facebook\.com\/(?!sharer|plugins|tr\?|dialog)[^\s"'<>)]+/i,
  },
  {
    plateforme: "instagram",
    regex: /https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|explore\/)[^\s"'<>)]+/i,
  },
  { plateforme: "tiktok", regex: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>)]+/i },
  {
    plateforme: "linkedin",
    regex: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^\s"'<>)]+/i,
  },
  {
    plateforme: "youtube",
    regex: /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user|@)[^\s"'<>)]+/i,
  },
  {
    plateforme: "x",
    regex: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!intent|share|hashtag)[^\s"'<>)]+/i,
  },
  { plateforme: "pagesjaunes", regex: /https?:\/\/(?:www\.)?pagesjaunes\.fr\/[^\s"'<>)]+/i },
  { plateforme: "booking", regex: /https?:\/\/(?:www\.)?booking\.com\/hotel\/[^\s"'<>)]+/i },
  { plateforme: "tripadvisor", regex: /https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/[^\s"'<>)]+/i },
  { plateforme: "airbnb", regex: /https?:\/\/(?:www\.)?airbnb\.[a-z.]+\/[^\s"'<>)]+/i },
];

// Ponctuation/entités HTML fréquemment happées en fin de match par la regex
// gourmande (guillemets échappés, points de phrase, entités &amp;...).
function nettoyerUrl(url: string): string {
  return url
    .replace(/&amp;/g, "&")
    .replace(/["'<>).,;]+$/, "");
}

export function detecterReseauxSociaux(html: string): Partial<Record<PlateformeSociale, string>> {
  const trouves: Partial<Record<PlateformeSociale, string>> = {};

  for (const signature of SIGNATURES) {
    const correspondance = html.match(signature.regex);
    if (correspondance) {
      trouves[signature.plateforme] = nettoyerUrl(correspondance[0]);
    }
  }

  return trouves;
}
