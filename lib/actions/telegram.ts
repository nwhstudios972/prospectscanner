"use server";

import { getProspectDetail } from "@/lib/queries";
import {
  envoyerNotificationTelegram,
  formatProspectMessage,
  type EnvoyerNotificationResult,
} from "@/lib/notifications/telegram";

export async function envoyerFicheTelegram(
  prospectId: string,
): Promise<EnvoyerNotificationResult> {
  const prospect = await getProspectDetail(prospectId);

  if (!prospect) {
    return { success: false, error: "prospect_introuvable" };
  }

  const message = formatProspectMessage(prospect);
  return envoyerNotificationTelegram(message);
}
