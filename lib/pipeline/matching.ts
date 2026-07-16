const DIACRITICS_REGEX = /[̀-ͯ]/g;

// Normalise une chaîne pour comparaison approximative : minuscules, sans accents,
// sans ponctuation, espaces multiples réduits. Utilisé pour rapprocher les noms
// d'établissement Google Places des dénominations/enseignes SIRENE.
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Score de similarité 0-1 basé sur le ratio de mots communs (Jaccard sur tokens).
// Volontairement simple : suffisant pour départager quelques candidats SIRENE
// par code postal déjà filtrés, pas besoin d'un algorithme de distance d'édition.
export function similarite(a: string, b: string): number {
  const tokensA = new Set(normaliser(a).split(" ").filter(Boolean));
  const tokensB = new Set(normaliser(b).split(" ").filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Extrait un code postal français (5 chiffres) d'une adresse formatée.
export function extraireCodePostal(adresse: string): string | null {
  const match = adresse.match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}
