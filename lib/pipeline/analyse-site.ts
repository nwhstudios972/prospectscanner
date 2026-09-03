import type { PageSite } from "@/lib/pipeline/site-fetch";

export interface AnalyseSite {
  scorePerformance: number | null;
  scoreSeo: number | null;
}

function compterOccurrences(html: string, regex: RegExp): number {
  return html.match(regex)?.length ?? 0;
}

// Approximation de la performance sans navigateur headless (pas de vrai
// rendu/Core Web Vitals) : temps de réponse, poids de la page, compression,
// nombre de scripts bloquants dans le <head>. Nettement moins précis qu'un
// vrai Lighthouse, mais gratuit, sans dépendance lourde, et garanti de
// fonctionner sur n'importe quel hébergement (choix fait après abandon de
// l'accès Google Cloud PageSpeed).
function noterPerformance(latenceMs: number, tailleOctets: number, compresse: boolean, html: string): number {
  let score = 100;

  if (latenceMs > 3000) score -= 40;
  else if (latenceMs > 1500) score -= 20;
  else if (latenceMs > 800) score -= 8;

  if (tailleOctets > 3_000_000) score -= 30;
  else if (tailleOctets > 1_500_000) score -= 15;
  else if (tailleOctets > 700_000) score -= 5;

  if (!compresse) score -= 15;

  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const scriptsBloquants = compterOccurrences(
    head,
    /<script(?![^>]*\b(?:async|defer|type=["']application\/(?:ld\+)?json["'])\b)[^>]*\bsrc=/gi,
  );
  score -= Math.min(20, scriptsBloquants * 5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Approximation du SEO on-page à partir de signaux HTML statiques standards
// (title, meta description, structure des titres, viewport, canonical).
function noterSeo(html: string): number {
  let score = 0;

  const titre = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  if (titre.length >= 10 && titre.length <= 65) score += 25;
  else if (titre.length > 0) score += 10;

  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";
  if (description.length >= 50 && description.length <= 160) score += 25;
  else if (description.length > 0) score += 10;

  const nombreH1 = compterOccurrences(html, /<h1[\s>]/gi);
  if (nombreH1 === 1) score += 20;
  else if (nombreH1 > 0) score += 8;

  if (/<meta[^>]+name=["']viewport["']/i.test(html)) score += 15;
  if (/<link[^>]+rel=["']canonical["']/i.test(html)) score += 10;

  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  if (images.length > 0) {
    const avecAlt = images.filter((img) => /\balt=["'][^"']+["']/i.test(img)).length;
    if (avecAlt / images.length >= 0.8) score += 5;
  } else {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Best-effort, sans navigateur headless (voir noterPerformance), à partir
// d'une page déjà récupérée par recupererPageSite (site-fetch.ts) — pas de
// fetch ici, la latence mesurée lors de ce fetch partagé reste représentative
// du temps de réponse réel du site.
export function analyserSiteDepuisPage(page: PageSite): AnalyseSite {
  const tailleOctets = new TextEncoder().encode(page.html).length;

  return {
    scorePerformance: noterPerformance(page.latenceMs, tailleOctets, page.compresse, page.html),
    scoreSeo: noterSeo(page.html),
  };
}
