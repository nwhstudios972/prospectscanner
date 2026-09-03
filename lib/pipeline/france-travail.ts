import { similarite } from "@/lib/pipeline/matching";

export interface OffreRecrutement {
  titre: string;
  dateCreation: Date;
  url: string | null;
}

interface TokenReponse {
  access_token: string;
  expires_in: number;
}

interface OffreApi {
  intitule: string;
  dateCreation: string;
  origineOffre?: { urlOrigine?: string };
  entreprise?: { nom?: string };
}

interface OffresReponse {
  resultats?: OffreApi[];
}

interface CommuneApi {
  code: string;
}

const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire";
const OFFRES_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const GEO_URL = "https://geo.api.gouv.fr/communes";

// L'API "Offres d'emploi v2" ne permet PAS de filtrer par SIRET/nom
// d'entreprise (vérifié en conditions réelles : le paramètre est ignoré, et
// la recherche plein texte n'indexe pas le nom de l'employeur). Elle permet
// en revanche de filtrer par commune (code INSEE) — vérifié également. On
// approxime donc le nombre d'offres d'un prospect en cherchant toutes les
// offres de sa commune, puis en ne gardant que celles dont le nom de
// l'employeur ressemble au nom de l'établissement. Best-effort assumé :
// faux négatifs (offre non trouvée) et faux positifs (homonymie) possibles.
const SEUIL_SIMILARITE_EMPLOYEUR = 0.4;

let tokenCache: { valeur: string; expireA: number } | null = null;

async function obtenirToken(): Promise<string | null> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && tokenCache.expireA > Date.now()) {
    return tokenCache.valeur;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "api_offresdemploiv2 o2dsoffre",
  });

  const reponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!reponse.ok) return null;

  const data = (await reponse.json()) as TokenReponse;
  tokenCache = {
    valeur: data.access_token,
    expireA: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

// geo.api.gouv.fr : gratuit, sans clé — convertit des coordonnées GPS en
// code commune INSEE (le seul identifiant géographique accepté par l'API
// France Travail).
async function resoudreCommune(latitude: number, longitude: number): Promise<string | null> {
  const url = new URL(GEO_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("fields", "code");
  url.searchParams.set("format", "json");

  const reponse = await fetch(url);
  if (!reponse.ok) return null;

  const communes = (await reponse.json()) as CommuneApi[];
  return communes[0]?.code ?? null;
}

// Optionnel : nécessite FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET
// (compte développeur gratuit sur francetravail.io — voir .env.example).
// Sans identifiants ou sans coordonnées GPS, retourne toujours [].
export async function rechercherOffresRecrutement(
  nomEtablissement: string,
  latitude: number | null,
  longitude: number | null,
): Promise<OffreRecrutement[]> {
  if (latitude === null || longitude === null) return [];

  const token = await obtenirToken();
  if (!token) return [];

  const commune = await resoudreCommune(latitude, longitude).catch(() => null);
  if (!commune) return [];

  const url = new URL(OFFRES_URL);
  url.searchParams.set("commune", commune);
  url.searchParams.set("distance", "0");
  url.searchParams.set("range", "0-49");

  try {
    const reponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 204 = aucune offre dans cette commune, pas une erreur.
    if (reponse.status === 204) return [];
    if (!reponse.ok) return [];

    const data = (await reponse.json()) as OffresReponse;
    return (data.resultats ?? [])
      .filter((offre) => similarite(nomEtablissement, offre.entreprise?.nom ?? "") >= SEUIL_SIMILARITE_EMPLOYEUR)
      .map((offre) => ({
        titre: offre.intitule,
        dateCreation: new Date(offre.dateCreation),
        url: offre.origineOffre?.urlOrigine ?? null,
      }));
  } catch {
    return [];
  }
}
