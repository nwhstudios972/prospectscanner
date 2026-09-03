const TIMEOUT_MS = 8000;
const AGE_MAX_ANNEES = 15; // au-delà, on considère le domaine "établi" (score 100)

interface RdapEvenement {
  eventAction?: string;
  eventDate?: string;
}
interface RdapReponse {
  events?: RdapEvenement[];
}

// RDAP (successeur standardisé du WHOIS, IANA/ICANN) : protocole ouvert,
// gratuit, sans clé, sans scraping d'interface — rdap.org redirige vers le
// registre officiel du TLD (Verisign pour .com, AFNIC pour .fr, etc.) qui
// renvoie la date d'enregistrement du domaine. Remplace OpenPageRank après
// son rachat par Keywords Everywhere (passé à un modèle payant à l'usage) :
// l'ancienneté d'un domaine est un proxy de crédibilité plus grossier qu'un
// vrai score d'autorité, mais gratuit sans aucune limite ni inscription.
export async function estimerAncienneteDomaine(siteWeb: string): Promise<number | null> {
  let domaine: string;
  try {
    domaine = new URL(siteWeb).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  const controleur = new AbortController();
  const timeout = setTimeout(() => controleur.abort(), TIMEOUT_MS);

  try {
    // rdap.org bloque (403 Cloudflare) les clients sans en-tête User-Agent
    // de navigateur — un simple fetch Node par défaut ne suffit pas.
    const reponse = await fetch(`https://rdap.org/domain/${domaine}`, {
      signal: controleur.signal,
      headers: {
        Accept: "application/rdap+json, application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!reponse.ok) return null;

    const data = (await reponse.json()) as RdapReponse;
    const dateEnregistrement = data.events?.find((e) => e.eventAction === "registration")?.eventDate;
    if (!dateEnregistrement) return null;

    const ageAnnees = (Date.now() - new Date(dateEnregistrement).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageAnnees < 0) return null;

    return Math.max(0, Math.min(100, Math.round((ageAnnees / AGE_MAX_ANNEES) * 100)));
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
