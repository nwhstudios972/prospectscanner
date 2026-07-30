export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function urlFicheGoogleMaps(googlePlaceId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`;
}
