import type { Coordonnees } from "@/lib/pipeline/geocode";

export interface PlaceResultat {
  placeId: string;
  nom: string;
  adresse: string;
  telephone: string | null;
  siteWeb: string | null;
  note: number | null;
  nombreAvis: number | null;
  latitude: number | null;
  longitude: number | null;
}

interface PlacesApiPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
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
  "places.location",
  "nextPageToken",
].join(",");

const MAX_PAGES = 3; // Places API (New) plafonne à 20 résultats/page, 60 au total.

// L'API Places n'accepte un biais circulaire que jusqu'à 50 km de rayon. Au
// delà on bascule sur un rectangle (calculé depuis le centre), et à partir
// d'une échelle "monde" on retire carrément le biais géographique pour
// laisser le texte de la requête ("secteur à ville") guider la recherche
// sans aucune restriction de zone.
const RAYON_MAX_CERCLE_KM = 50;
const RAYON_SEUIL_MONDIAL_KM = 20000;

function clamp(valeur: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valeur));
}

function construireLocationBias(
  centre: Coordonnees,
  rayonKm: number,
): Record<string, unknown> | undefined {
  if (rayonKm >= RAYON_SEUIL_MONDIAL_KM) {
    return undefined;
  }

  if (rayonKm <= RAYON_MAX_CERCLE_KM) {
    return {
      circle: {
        center: { latitude: centre.latitude, longitude: centre.longitude },
        radius: rayonKm * 1000,
      },
    };
  }

  const latDelta = clamp(rayonKm / 111, 0, 90);
  const cosLat = Math.max(Math.cos((centre.latitude * Math.PI) / 180), 0.01);
  const lonDelta = clamp(rayonKm / (111 * cosLat), 0, 180);

  return {
    rectangle: {
      low: {
        latitude: clamp(centre.latitude - latDelta, -90, 90),
        longitude: centre.longitude - lonDelta,
      },
      high: {
        latitude: clamp(centre.latitude + latDelta, -90, 90),
        longitude: centre.longitude + lonDelta,
      },
    },
  };
}

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
  const locationBias = construireLocationBias(centre, rayonKm);

  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    // Une requête de pagination doit répéter tous les paramètres de la
    // requête initiale (Google refuse un pageToken isolé) : on n'ajoute
    // que le pageToken en plus du corps de base.
    const body: Record<string, unknown> = {
      textQuery,
      ...(locationBias ? { locationBias } : {}),
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
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;

    // Le pageToken Google Places met quelques secondes à devenir valide.
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return resultats;
}
