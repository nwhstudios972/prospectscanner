import type { Coordonnees } from "@/lib/pipeline/geocode";

export interface PlaceResultat {
  placeId: string;
  nom: string;
  adresse: string;
  telephone: string | null;
  siteWeb: string | null;
  note: number | null;
  nombreAvis: number | null;
}

interface PlacesApiPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[];
  nextPageToken?: string;
}

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

const MAX_PAGES = 3; // Places API (New) plafonne à 20 résultats/page, 60 au total.

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY manquante — ajoute ta clé dans .env pour lancer un scan réel.",
    );
  }
  return key;
}

export async function rechercherEtablissements(
  secteur: string,
  ville: string,
  centre: Coordonnees,
  rayonKm: number,
): Promise<PlaceResultat[]> {
  const apiKey = getApiKey();
  const resultats: PlaceResultat[] = [];
  const idsVus = new Set<string>();
  const textQuery = `${secteur} à ${ville}`;

  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    // Une requête de pagination doit répéter tous les paramètres de la
    // requête initiale (Google refuse un pageToken isolé) : on n'ajoute
    // que le pageToken en plus du corps de base.
    const body: Record<string, unknown> = {
      textQuery,
      locationBias: {
        circle: {
          center: {
            latitude: centre.latitude,
            longitude: centre.longitude,
          },
          radius: Math.min(rayonKm * 1000, 50000),
        },
      },
      languageCode: "fr",
      ...(pageToken ? { pageToken } : {}),
    };

    const response = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Erreur API Google Places (HTTP ${response.status}) : ${detail.slice(0, 300)}`,
      );
    }

    const data = (await response.json()) as PlacesApiResponse;
    const places = data.places ?? [];

    for (const place of places) {
      if (idsVus.has(place.id)) continue;
      idsVus.add(place.id);

      resultats.push({
        placeId: place.id,
        nom: place.displayName?.text ?? "Établissement sans nom",
        adresse: place.formattedAddress ?? "",
        telephone: place.internationalPhoneNumber ?? null,
        siteWeb: place.websiteUri ?? null,
        note: place.rating ?? null,
        nombreAvis: place.userRatingCount ?? null,
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;

    // Le pageToken Google Places met quelques secondes à devenir valide.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return resultats;
}
