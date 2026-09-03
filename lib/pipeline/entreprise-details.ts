import { libelleFormeJuridique } from "@/lib/pipeline/forme-juridique";

export interface DirigeantDetail {
  nom: string | null;
  prenoms: string | null;
  qualite: string | null;
  typeDirigeant: string | null;
  anneeNaissance: string | null;
  denomination: string | null;
  sirenPersonneMorale: string | null;
}

export interface DonneeFinanciereDetail {
  annee: string;
  chiffreAffaires: number | null;
  resultatNet: number | null;
}

export interface EntrepriseDetails {
  formeJuridique: string | null;
  nomCommercial: string | null;
  dateCreationEntreprise: Date | null;
  categorieEntreprise: string | null;
  tvaIntracommunautaire: string | null;
  nombreEtablissements: number | null;
  dirigeants: DirigeantDetail[];
  donneesFinancieres: DonneeFinanciereDetail[];
}

interface DirigeantApi {
  nom?: string;
  prenoms?: string;
  qualite?: string;
  type_dirigeant?: string;
  annee_de_naissance?: string;
  denomination?: string;
  siren?: string;
}

interface EntrepriseApiResultat {
  nature_juridique: string | null;
  date_creation: string | null;
  categorie_entreprise: string | null;
  nombre_etablissements: number | null;
  dirigeants: DirigeantApi[] | null;
  finances: Record<string, { ca: number | null; resultat_net: number | null }> | null;
  tva: string[] | null;
  siege: { nom_commercial: string | null } | null;
}

interface EntrepriseApiReponse {
  results: EntrepriseApiResultat[];
}

const BASE_URL = "https://recherche-entreprises.api.gouv.fr/search";

// Même API publique que sirene.ts, mais on interroge directement par SIREN une
// fois l'entreprise déjà identifiée : on récupère en un seul appel tout ce que
// l'API expose (dirigeants, finances, TVA, catégorie d'entreprise...), sans
// dupliquer la recherche par nom déjà faite dans rechercherSiret().
export async function recupererDetailsEntreprise(
  siren: string,
): Promise<EntrepriseDetails | null> {
  const url = new URL(BASE_URL);
  url.searchParams.set("q", siren);
  url.searchParams.set("per_page", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API entreprise (HTTP ${response.status})`);
  }

  const data = (await response.json()) as EntrepriseApiReponse;
  const resultat = data.results[0] ?? null;
  if (!resultat) return null;

  const dirigeants: DirigeantDetail[] = (resultat.dirigeants ?? []).map((d) => ({
    nom: d.nom ?? null,
    prenoms: d.prenoms ?? null,
    qualite: d.qualite ?? null,
    typeDirigeant: d.type_dirigeant ?? null,
    anneeNaissance: d.annee_de_naissance ?? null,
    denomination: d.denomination ?? null,
    sirenPersonneMorale: d.siren ?? null,
  }));

  const donneesFinancieres: DonneeFinanciereDetail[] = Object.entries(
    resultat.finances ?? {},
  ).map(([annee, valeurs]) => ({
    annee,
    chiffreAffaires: valeurs.ca ?? null,
    resultatNet: valeurs.resultat_net ?? null,
  }));

  return {
    formeJuridique: libelleFormeJuridique(resultat.nature_juridique),
    nomCommercial: resultat.siege?.nom_commercial ?? null,
    dateCreationEntreprise: resultat.date_creation ? new Date(resultat.date_creation) : null,
    categorieEntreprise: resultat.categorie_entreprise ?? null,
    tvaIntracommunautaire: resultat.tva?.[0] ?? null,
    nombreEtablissements: resultat.nombre_etablissements ?? null,
    dirigeants,
    donneesFinancieres,
  };
}
