export interface Coordonnees {
  latitude: number;
  longitude: number;
}

// Nominatim (OpenStreetMap) : géocodage gratuit sans clé API.
// Politique d'usage : 1 requête/seconde max, User-Agent obligatoire.
// https://operations.osmfoundation.org/policies/nominatim/
export async function geocoderVille(ville: string): Promise<Coordonnees> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", ville);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ProspectScanner/1.0 (usage interne)",
      "Accept-Language": "fr",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Géocodage échoué pour "${ville}" (HTTP ${response.status})`,
    );
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
  }>;

  if (results.length === 0) {
    throw new Error(`Ville introuvable : "${ville}"`);
  }

  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
  };
}
