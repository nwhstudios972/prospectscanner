export interface PageSite {
  html: string;
  latenceMs: number;
  compresse: boolean;
}

const TIMEOUT_MS = 10000;
const USER_AGENT = "Mozilla/5.0 (compatible; ProspectScannerBot/1.0; +https://prospectscan.cyou)";

// Fetch unique et partagé de la page d'accueil du site du prospect, réutilisé
// par email-scraper, tech-detector, analyse-site et social-links : évite de
// faire 4 requêtes séparées vers le même site à chaque enrichissement (plus
// rapide, et plus poli vis-à-vis de petits sites qui peuvent avoir un
// pare-feu/anti-bot sensible à des rafales de requêtes). Best-effort : site
// injoignable, timeout ou contenu non HTML → null, jamais bloquant.
export async function recupererPageSite(url: string): Promise<PageSite | null> {
  const controleur = new AbortController();
  const timeout = setTimeout(() => controleur.abort(), TIMEOUT_MS);
  const debut = Date.now();

  try {
    const reponse = await fetch(url, {
      signal: controleur.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Encoding": "gzip, br",
      },
    });
    const latenceMs = Date.now() - debut;
    if (!reponse.ok) return null;

    const contentType = reponse.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await reponse.text();
    const compresse = Boolean(reponse.headers.get("content-encoding"));

    return { html, latenceMs, compresse };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
