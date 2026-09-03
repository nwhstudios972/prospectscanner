export interface EvenementMarchePublic {
  dateEvenement: Date;
  titre: string;
  description: string | null;
}

interface DecpRecord {
  fields: {
    datenotification?: string;
    objetmarche?: string;
    lieuexecutionnom?: string;
    montant?: number;
  };
}

interface DecpReponse {
  records: DecpRecord[];
}

const BASE_URL = "https://data.economie.gouv.fr/api/records/1.0/search/";
const MAX_MARCHES = 5;

// Données Essentielles de la Commande Publique (DECP), gratuites et sans
// clé, hébergées par data.economie.gouv.fr : marchés publics attribués à
// l'établissement (par SIRET). Beaucoup de TPE/PME n'en ont jamais — un
// tableau vide est le cas normal, pas une erreur.
export async function rechercherMarchesPublics(
  siret: string,
): Promise<EvenementMarchePublic[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("dataset", "decp_augmente");
  url.searchParams.set("q", `siretetablissement:"${siret}"`);
  url.searchParams.set("rows", String(MAX_MARCHES));
  url.searchParams.set("sort", "-datenotification");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API DECP (HTTP ${response.status})`);
  }

  const data = (await response.json()) as DecpReponse;

  return data.records
    .filter((r) => r.fields.datenotification)
    .map((r) => ({
      dateEvenement: new Date(r.fields.datenotification as string),
      titre: r.fields.objetmarche ?? "Marché public attribué",
      description: r.fields.lieuexecutionnom
        ? `Lieu d'exécution : ${r.fields.lieuexecutionnom}`
        : null,
    }));
}
