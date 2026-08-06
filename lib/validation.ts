// Forme basique + rejet explicite des retours chariot/sauts de ligne : cette
// valeur peut finir interpolee dans un sujet d'email (voir
// notifierTentativeEchouee), un CRLF y ouvrirait la porte a une injection
// d'en-tete SMTP.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function estEmailValide(email: string): boolean {
  return EMAIL_REGEX.test(email) && !/[\r\n]/.test(email);
}

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
