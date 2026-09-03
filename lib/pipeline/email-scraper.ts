const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// Domaines d'images/traceurs qui ressemblent à des emails dans le markup
// (ex: image@2x.png) et faux positifs fréquents à ignorer.
const EXTENSIONS_IGNOREES = /\.(png|jpe?g|gif|svg|webp|css|js)$/i;

function nettoyerEmail(brut: string): string | null {
  const email = brut.trim().toLowerCase();
  if (EXTENSIONS_IGNOREES.test(email)) return null;
  return email;
}

// Va chercher un email public dans le HTML de la page d'accueil du site du
// prospect (mailto: en priorité, sinon première adresse trouvée). Le HTML
// est déjà récupéré par recupererPageSite (site-fetch.ts) — cette fonction
// est un simple parsing, pas de fetch ici.
export function extraireEmail(html: string): string | null {
  const mailto = html.match(/href=["']mailto:([^"'?]+)/i);
  if (mailto) {
    const email = nettoyerEmail(decodeURIComponent(mailto[1]));
    if (email) return email;
  }

  const correspondance = html.match(EMAIL_REGEX);
  if (correspondance) {
    return nettoyerEmail(correspondance[0]);
  }

  return null;
}
