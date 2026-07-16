import type { ProspectWithDetails } from "@/lib/queries";

const PRIORITE_LABELS: Record<string, string> = {
  tres_elevee: "TRÈS ÉLEVÉE",
  elevee: "ÉLEVÉE",
  moyenne: "MOYENNE",
  faible: "FAIBLE",
};

const PLATEFORME_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X",
  pagesjaunes: "PagesJaunes",
  booking: "Booking.com",
  tripadvisor: "TripAdvisor",
  airbnb: "Airbnb",
  site_web: "Site web",
};

export function formatProspectMessage(prospect: ProspectWithDetails): string {
  const { etablissement } = prospect;

  const plateformesTrouvees = etablissement.presences
    .filter((presence) => presence.trouve)
    .map((presence) => {
      const label = PLATEFORME_LABELS[presence.plateforme] ?? presence.plateforme;
      const abonnes =
        presence.nombre_abonnes !== null
          ? ` (${presence.nombre_abonnes.toLocaleString("fr-FR")} abonnés)`
          : "";
      return `✅ ${label}${abonnes}`;
    });

  const lignes = [
    `🚨 NOUVEAU PROSPECT — SCORE ${prospect.score}/100`,
    "",
    `🏢 ${etablissement.nom}`,
    `📍 ${etablissement.ville}`,
  ];

  if (etablissement.telephone) {
    lignes.push(`📞 ${etablissement.telephone}`);
  }

  lignes.push(
    "",
    `💡 Priorité : ${PRIORITE_LABELS[prospect.priorite] ?? prospect.priorite}`,
    `🌐 Site web : ${prospect.a_site_web ? "Oui" : "Aucun"}`,
  );

  if (plateformesTrouvees.length > 0) {
    lignes.push("", "📱 Présence en ligne :", ...plateformesTrouvees);
  }

  if (prospect.analyse_commerciale) {
    lignes.push("", `📝 ${prospect.analyse_commerciale}`);
  }

  return lignes.join("\n");
}

export interface EnvoyerNotificationResult {
  success: boolean;
  error?: string;
}

export async function envoyerNotificationTelegram(
  message: string,
): Promise<EnvoyerNotificationResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant — notification non envoyée. " +
        "Voir .env.example pour la procédure de configuration du bot.",
    );
    return { success: false, error: "missing_config" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[telegram] Échec de l'envoi :", body);
      return { success: false, error: body };
    }

    return { success: true };
  } catch (error) {
    console.error("[telegram] Erreur réseau lors de l'envoi :", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

export async function notifierSiProspectPrioritaire(
  prospect: ProspectWithDetails,
): Promise<EnvoyerNotificationResult | null> {
  if (prospect.priorite !== "tres_elevee") {
    return null;
  }
  return envoyerNotificationTelegram(formatProspectMessage(prospect));
}
