import type { Priorite } from "@/lib/generated/prisma/enums";

export interface DonneesScoring {
  aSiteWeb: boolean;
  noteGoogle: number | null;
  nombreAvisGoogle: number | null;
  statutSiret: "actif" | "ferme" | null;
}

export interface ResultatScoring {
  score: number;
  priorite: Priorite;
}

// Score orienté "prospect pour création de site web" : l'absence de site est le
// signal principal, pondéré par la crédibilité commerciale déjà en place
// (note Google, volume d'avis, établissement bien immatriculé).
export function calculerScore(donnees: DonneesScoring): ResultatScoring {
  let score = 0;

  score += donnees.aSiteWeb ? 0 : 45;

  if (donnees.noteGoogle !== null) {
    score += Math.round((donnees.noteGoogle / 5) * 20);
  }

  if (donnees.nombreAvisGoogle !== null && donnees.nombreAvisGoogle > 0) {
    score += Math.min(20, Math.round(Math.log10(donnees.nombreAvisGoogle + 1) * 9));
  }

  if (donnees.statutSiret === "actif") {
    score += 15;
  } else if (donnees.statutSiret === "ferme") {
    score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  let priorite: Priorite;
  if (score >= 80) priorite = "tres_elevee";
  else if (score >= 60) priorite = "elevee";
  else if (score >= 35) priorite = "moyenne";
  else priorite = "faible";

  return { score, priorite };
}
