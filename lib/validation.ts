export function validerForceMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < 10) {
    return "Le mot de passe doit contenir au moins 10 caractères.";
  }
  if (
    !/[a-z]/.test(motDePasse) ||
    !/[A-Z]/.test(motDePasse) ||
    !/[0-9]/.test(motDePasse)
  ) {
    return "Le mot de passe doit mélanger majuscules, minuscules et chiffres.";
  }
  return null;
}
