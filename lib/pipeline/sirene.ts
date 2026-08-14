import { similarite } from "@/lib/pipeline/matching";

export interface SireneMatch {
  siret: string;
  statut: "actif" | "ferme";
  natureJuridique: string | null;
  trancheEffectifSalarie: string | null;
  confiance: number;
}

// Nomenclature INSEE des tranches d'effectif salarié (code "tranche_effectif_salarie") :
// "21" correspond à 50-99 salariés. On considère qu'à partir de ce seuil, la
// structure est trop grande pour être une cible de prospection pertinente
// (l'app cible plutôt les petites entreprises sans présence en ligne solide).
const SEUIL_GROSSE_ENTREPRISE = "21";

export function estGrosseEntreprise(
  trancheEffectifSalarie: string | null,
): boolean {
  if (!trancheEffectifSalarie || trancheEffectifSalarie === "NN") {
    return false;
  }
  return trancheEffectifSalarie >= SEUIL_GROSSE_ENTREPRISE;
}

// Nomenclature INSEE des catégories juridiques : les codes commençant par "1"
// désignent les personnes physiques (entrepreneurs individuels), régime sous
// lequel s'inscrivent quasi systématiquement les auto-entrepreneurs /
// micro-entrepreneurs. Le registre SIRENE ne distingue pas le régime fiscal
// "micro-entreprise" en tant que tel, donc c'est la meilleure approximation
// disponible via cette API.
export function estEntrepreneurIndividuel(
  natureJuridique: string | null,
): boolean {
  return natureJuridique !== null && natureJuridique.startsWith("1");
}

interface SireneEtablissement {
  siret: string;
  code_postal: string | null;
  etat_administratif: string | null;
  liste_enseignes: string[] | null;
}

interface SireneResultat {
  nom_complet: string;
  nom_raison_sociale: string | null;
  sigle: string | null;
  nature_juridique: string | null;
  tranche_effectif_salarie: string | null;
  matching_etablissements: SireneEtablissement[];
  siege: SireneEtablissement | null;
}

interface SireneReponse {
  results: SireneResultat[];
}

const SIRENE_BASE_URL = "https://recherche-entreprises.api.gouv.fr/search";

// API publique "Recherche d'entreprises" (recherche-entreprises.api.gouv.fr) :
// gratuite, sans clé, données SIRENE/INSEE officielles. On filtre par code postal
// pour ne récupérer que les établissements de la bonne zone, puis on choisit le
// meilleur candidat par similarité de nom (enseigne ou dénomination).
export async function rechercherSiret(
  nom: string,
  codePostal: string | null,
): Promise<SireneMatch | null> {
  const url = new URL(SIRENE_BASE_URL);
  url.searchParams.set("q", nom);
  url.searchParams.set("per_page", "5");
  if (codePostal) {
    url.searchParams.set("code_postal", codePostal);
  }

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Quota API SIRENE dépassé (429)");
    }
    throw new Error(`Erreur API SIRENE (HTTP ${response.status})`);
  }

  const data = (await response.json()) as SireneReponse;

  let meilleur: { match: SireneMatch; score: number } | null = null;

  for (const resultat of data.results) {
    const candidats = resultat.matching_etablissements.length > 0
      ? resultat.matching_etablissements
      : resultat.siege
        ? [resultat.siege]
        : [];

    const nomsPossibles = [
      resultat.nom_complet,
      resultat.nom_raison_sociale,
      resultat.sigle,
    ].filter((n): n is string => Boolean(n));

    for (const etablissement of candidats) {
      if (!etablissement.siret) continue;

      const enseignes = etablissement.liste_enseignes ?? [];
      const score = Math.max(
        0,
        ...[...nomsPossibles, ...enseignes].map((candidat) =>
          similarite(nom, candidat),
        ),
      );

      if (!meilleur || score > meilleur.score) {
        meilleur = {
          score,
          match: {
            siret: etablissement.siret,
            statut:
              etablissement.etat_administratif === "A" ? "actif" : "ferme",
            natureJuridique: resultat.nature_juridique,
            trancheEffectifSalarie: resultat.tranche_effectif_salarie,
            confiance: score,
          },
        };
      }
    }
  }

  // Seuil de confiance : au moins un tiers des mots en commun, sinon on
  // considère qu'il n'y a pas de correspondance fiable.
  if (!meilleur || meilleur.score < 0.34) {
    return null;
  }

  return meilleur.match;
}
