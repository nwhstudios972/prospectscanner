import type { ApiKeyConfig } from "@/types";

// Configuration affichée sur /parametres. Les scans réels (voir lib/pipeline/)
// lisent ces variables d'environnement directement ; `configured` ici reflète
// juste leur présence pour l'affichage.
export const mockApiKeys: ApiKeyConfig[] = [
  {
    id: "sirene",
    label: "API SIRENE (Recherche d'entreprises)",
    description:
      "recherche-entreprises.api.gouv.fr — API publique gratuite, aucune clé requise.",
    envVar: "SIRENE_API_KEY",
    configured: true,
  },
  {
    id: "google_places",
    label: "Google Places API",
    description: "Recherche des établissements et de leurs fiches Google Business.",
    envVar: "GOOGLE_PLACES_API_KEY",
    configured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
  },
  {
    id: "telegram",
    label: "Telegram Bot — Token",
    description: "Notifications en temps réel sur l'avancement des scans et nouveaux prospects.",
    envVar: "TELEGRAM_BOT_TOKEN",
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  },
  {
    id: "telegram_chat_id",
    label: "Telegram Bot — Chat ID",
    description: "Identifiant de la conversation ou du groupe qui recevra les notifications.",
    envVar: "TELEGRAM_CHAT_ID",
    configured: Boolean(process.env.TELEGRAM_CHAT_ID),
  },
  {
    id: "facebook_graph",
    label: "Facebook Graph API",
    description: "Analyse des pages Facebook professionnelles (followers, activité).",
    envVar: "FACEBOOK_GRAPH_TOKEN",
    configured: false,
  },
];
