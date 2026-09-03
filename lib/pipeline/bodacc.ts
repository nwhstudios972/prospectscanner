export interface EvenementBodacc {
  type:
    | "depot_comptes"
    | "procedure_collective"
    | "modification"
    | "radiation";
  dateEvenement: Date;
  titre: string;
  description: string | null;
  url: string | null;
}

interface BodaccRecord {
  fields: {
    dateparution?: string;
    familleavis_lib?: string;
    typeavis_lib?: string;
    commercant?: string;
    url_complete?: string;
    depot?: string;
  };
}

interface BodaccReponse {
  records: BodaccRecord[];
}

const BASE_URL =
  "https://bodacc-datadila.opendatasoft.com/api/records/1.0/search/";
const MAX_EVENEMENTS = 10;

// API publique BODACC (Bulletin officiel des annonces civiles et
// commerciales), gratuite et sans clé : annonces légales par SIREN
// (dépôts de comptes, procédures collectives, modifications, radiations).
// Best-effort — une entreprise sans historique BODACC renvoie simplement un
// tableau vide, ce n'est jamais une erreur bloquante pour le pipeline.
export async function rechercherEvenementsBodacc(
  siren: string,
): Promise<EvenementBodacc[]> {
  const url = new URL(BASE_URL);
  url.searchParams.set("dataset", "annonces-commerciales");
  url.searchParams.set("q", `registre="${siren}"`);
  url.searchParams.set("rows", String(MAX_EVENEMENTS));
  url.searchParams.set("sort", "-dateparution");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API BODACC (HTTP ${response.status})`);
  }

  const data = (await response.json()) as BodaccReponse;

  return data.records
    .map((record) => versEvenement(record))
    .filter((e): e is EvenementBodacc => e !== null);
}

function versEvenement(record: BodaccRecord): EvenementBodacc | null {
  const { fields } = record;
  if (!fields.dateparution) return null;

  const famille = (fields.familleavis_lib ?? "").toLowerCase();
  const typeAvis = (fields.typeavis_lib ?? "").toLowerCase();

  let type: EvenementBodacc["type"];
  if (famille.includes("dépôts des comptes") || famille.includes("depots des comptes")) {
    type = "depot_comptes";
  } else if (
    famille.includes("procédure") ||
    famille.includes("procedure") ||
    typeAvis.includes("jugement")
  ) {
    type = "procedure_collective";
  } else if (famille.includes("radiation") || typeAvis.includes("radiation")) {
    type = "radiation";
  } else {
    type = "modification";
  }

  return {
    type,
    dateEvenement: new Date(fields.dateparution),
    titre: fields.familleavis_lib ?? fields.typeavis_lib ?? "Annonce BODACC",
    description: fields.typeavis_lib ?? null,
    url: fields.url_complete ?? null,
  };
}
