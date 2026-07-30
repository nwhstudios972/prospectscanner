const TIMEOUT_MS = 5000;
const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// Domaines d'images/traceurs qui ressemblent à des emails dans le markup
// (ex: image@2x.png) et faux positifs fréquents à ignorer.
const EXTENSIONS_IGNOREES = /\.(png|jpe?g|gif|svg|webp|css|js)$/i;

function nettoyerEmail(brut: string): string | null {
  const email = brut.trim().toLowerCase();
  if (EXTENSIONS_IGNOREES.test(email)) return null;
  return email;
}

function extraireEmail(html: string): string | null {
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

// Best-effort : va chercher un email public sur la page d'accueil du site du
// prospect (mailto: en priorité, sinon première adresse trouvée dans le
// HTML). Échoue silencieusement (site down, timeout, pas d'email) — l'email
// reste simplement absent, ce n'est jamais bloquant pour le scan.
export async function extraireEmailDuSiteWeb(
  url: string,
): Promise<string | null> {
  const controleur = new AbortController();
  const timeout = setTimeout(() => controleur.abort(), TIMEOUT_MS);

  try {
    const reponse = await fetch(url, {
      signal: controleur.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProspectScannerBot/1.0; +https://prospectscan.cyou)",
      },
    });
    if (!reponse.ok) return null;

    const contentType = reponse.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await reponse.text();
    return extraireEmail(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
