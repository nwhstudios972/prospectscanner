import type { Priorite, Segment } from "@/lib/generated/prisma/enums";
import type { CategorieTechnologie } from "@/lib/pipeline/tech-detector";

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

export interface DonneesScoringDetaille {
  nombreEtablissements: number | null;
  trancheEffectifSalarie: string | null;
  nombrePresencesEnLigne: number;
  technologies: { categorie: CategorieTechnologie }[];
  nombreOffresRecrutement: number;
  nombreEvenementsRecents: number; // BODACC/DECP des 12 derniers mois
  aEvenementNegatifRecent: boolean; // radiation / procédure collective récente
  autoriteDomaine: number | null; // proxy d'ancienneté de domaine (0-100, voir anciennete-domaine.ts), null si non mesuré
}

export interface ResultatScoringDetaille {
  scoreCroissance: number;
  scoreDigital: number;
  scoreTechnologique: number;
  scoreRecrutement: number;
  scoreIntention: number;
  segment: Segment;
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

function clamp0100(valeur: number): number {
  return Math.max(0, Math.min(100, Math.round(valeur)));
}

// Scores secondaires "Signaux business" / "Intent data" : dérivés des
// données collectées gratuitement (SIRENE, BODACC, DECP, technologies
// détectées, présences en ligne) plutôt que d'un fournisseur d'intent data
// payant, qui n'existe pas à un tarif accessible pour des PME françaises.
export function calculerScoresDetailles(
  donnees: DonneesScoringDetaille,
): ResultatScoringDetaille {
  let scoreCroissance = 0;
  if (donnees.nombreEtablissements !== null) {
    scoreCroissance += Math.min(40, (donnees.nombreEtablissements - 1) * 15);
  }
  if (donnees.trancheEffectifSalarie && donnees.trancheEffectifSalarie !== "NN") {
    scoreCroissance += Math.min(30, parseInt(donnees.trancheEffectifSalarie, 10) * 2 || 0);
  }
  scoreCroissance += Math.min(30, donnees.nombreOffresRecrutement * 10);
  scoreCroissance = clamp0100(scoreCroissance);

  const scoreDigital = clamp0100(
    donnees.nombrePresencesEnLigne * 12 +
      Math.min(30, donnees.technologies.filter((t) => t.categorie === "analytics").length * 15) +
      (donnees.autoriteDomaine !== null ? donnees.autoriteDomaine * 0.2 : 0),
  );

  const categoriesTechUniques = new Set(donnees.technologies.map((t) => t.categorie));
  const scoreTechnologique = clamp0100(
    donnees.technologies.length * 10 + categoriesTechUniques.size * 10,
  );

  // Approximatif (voir france-travail.ts : pas de filtre officiel par
  // employeur, comptage par rapprochement commune + nom d'entreprise).
  const scoreRecrutement = clamp0100(donnees.nombreOffresRecrutement * 25);

  let scoreIntention = clamp0100(
    donnees.nombreEvenementsRecents * 20 + donnees.nombreOffresRecrutement * 15,
  );
  if (donnees.aEvenementNegatifRecent) {
    scoreIntention = clamp0100(scoreIntention - 40);
  }

  let segment: Segment;
  if (donnees.aEvenementNegatifRecent) {
    segment = "a_risque";
  } else if (scoreCroissance >= 50 && scoreDigital >= 50) {
    segment = "fort_potentiel";
  } else if (scoreDigital < 40 || scoreTechnologique < 30) {
    segment = "a_developper";
  } else {
    segment = "stable";
  }

  return {
    scoreCroissance,
    scoreDigital,
    scoreTechnologique,
    scoreRecrutement,
    scoreIntention,
    segment,
  };
}
