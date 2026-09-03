import { recupererDetailsEntreprise, type EntrepriseDetails } from "@/lib/pipeline/entreprise-details";
import { rechercherEvenementsBodacc, type EvenementBodacc } from "@/lib/pipeline/bodacc";
import { rechercherMarchesPublics, type EvenementMarchePublic } from "@/lib/pipeline/decp";
import { recupererPageSite } from "@/lib/pipeline/site-fetch";
import { extraireEmail } from "@/lib/pipeline/email-scraper";
import { detecterTechnologiesDepuisHtml, type TechnologieDetectee } from "@/lib/pipeline/tech-detector";
import { analyserSiteDepuisPage, type AnalyseSite } from "@/lib/pipeline/analyse-site";
import { detecterReseauxSociaux } from "@/lib/pipeline/social-links";
import { estimerAncienneteDomaine } from "@/lib/pipeline/anciennete-domaine";
import { recupererCatalogueEcommerce, type ProduitCatalogue } from "@/lib/pipeline/catalogue-ecommerce";
import { rechercherOffresRecrutement, type OffreRecrutement } from "@/lib/pipeline/france-travail";
import { calculerScoresDetailles, type ResultatScoringDetaille } from "@/lib/pipeline/scoring";
import type { Plateforme } from "@/lib/generated/prisma/enums";

export interface Enrichissement {
  details: EntrepriseDetails | null;
  evenementsBodacc: EvenementBodacc[];
  marchesPublics: EvenementMarchePublic[];
  email: string | null;
  technologies: TechnologieDetectee[];
  analyseSite: AnalyseSite | null;
  reseauxSociaux: Partial<Record<Exclude<Plateforme, "site_web">, string>>;
  ancienneteDomaine: number | null;
  produitsEcommerce: ProduitCatalogue[];
  offresRecrutement: OffreRecrutement[];
}

const UN_AN_MS = 365 * 24 * 60 * 60 * 1000;

// Enrichissement B2B best-effort : chaque source externe (entreprise
// gouv/dirigeants/finances, BODACC, DECP, ancienneté de domaine, France
// Travail) est appelée en parallèle et échoue silencieusement à l'unité —
// jamais bloquant, ni pour la création du prospect (scan) ni pour un
// ré-enrichissement manuel. `contexte` sert uniquement à identifier la
// source dans les logs (id de scan ou "reenrichissement:<id>").
//
// La page d'accueil du site n'est récupérée qu'une seule fois
// (recupererPageSite) et réutilisée pour l'email, les technologies, l'analyse
// perf/SEO et les réseaux sociaux — au lieu de 4 fetchs séparés. Le catalogue
// e-commerce dépend des technologies détectées (Shopify/WooCommerce) : il
// est récupéré après coup, avec sa propre requête vers un endpoint différent.
export async function recupererEnrichissement(
  contexte: string,
  nomEtablissement: string,
  siret: string | null,
  siteWeb: string | null,
  latitude: number | null,
  longitude: number | null,
): Promise<Enrichissement> {
  const siren = siret ? siret.slice(0, 9) : null;

  const [details, evenementsBodacc, marchesPublics, ancienneteDomaine, offresRecrutement, pageSite] =
    await Promise.all([
      siren
        ? recupererDetailsEntreprise(siren).catch((error) => {
            console.warn(`[${contexte}] détails entreprise échoués pour "${nomEtablissement}" :`, error);
            return null;
          })
        : Promise.resolve(null),
      siren
        ? rechercherEvenementsBodacc(siren).catch((error) => {
            console.warn(`[${contexte}] BODACC échoué pour "${nomEtablissement}" :`, error);
            return [];
          })
        : Promise.resolve([]),
      siret
        ? rechercherMarchesPublics(siret).catch((error) => {
            console.warn(`[${contexte}] DECP échoué pour "${nomEtablissement}" :`, error);
            return [];
          })
        : Promise.resolve([]),
      siteWeb
        ? estimerAncienneteDomaine(siteWeb).catch((error) => {
            console.warn(`[${contexte}] Ancienneté domaine échouée pour "${nomEtablissement}" :`, error);
            return null;
          })
        : Promise.resolve(null),
      rechercherOffresRecrutement(nomEtablissement, latitude, longitude).catch((error) => {
        console.warn(`[${contexte}] France Travail échoué pour "${nomEtablissement}" :`, error);
        return [];
      }),
      siteWeb ? recupererPageSite(siteWeb) : Promise.resolve(null),
    ]);

  const email = pageSite ? extraireEmail(pageSite.html) : null;
  const technologies = pageSite ? detecterTechnologiesDepuisHtml(pageSite.html) : [];
  const analyseSite = pageSite ? analyserSiteDepuisPage(pageSite) : null;
  const reseauxSociaux = pageSite ? detecterReseauxSociaux(pageSite.html) : {};

  const produitsEcommerce = siteWeb
    ? await recupererCatalogueEcommerce(siteWeb, technologies).catch((error) => {
        console.warn(`[${contexte}] Catalogue e-commerce échoué pour "${nomEtablissement}" :`, error);
        return [];
      })
    : [];

  return {
    details,
    evenementsBodacc,
    marchesPublics,
    email,
    technologies,
    analyseSite,
    reseauxSociaux,
    ancienneteDomaine,
    produitsEcommerce,
    offresRecrutement,
  };
}

// Combine l'enrichissement récupéré avec les données déjà connues de
// l'établissement (tranche d'effectif SIRENE) pour produire les scores
// détaillés + segment — même calcul utilisé à la création (scan) et au
// ré-enrichissement manuel.
export function calculerScoresDepuisEnrichissement(
  enrichissement: Enrichissement,
  trancheEffectifSalarie: string | null,
  aSiteWeb: boolean,
): ResultatScoringDetaille {
  const maintenant = Date.now();
  const evenementsRecents = enrichissement.evenementsBodacc.filter(
    (e) => maintenant - e.dateEvenement.getTime() < UN_AN_MS,
  );
  const aEvenementNegatifRecent = evenementsRecents.some(
    (e) => e.type === "procedure_collective" || e.type === "radiation",
  );

  const nombrePresencesEnLigne =
    (aSiteWeb ? 1 : 0) + Object.keys(enrichissement.reseauxSociaux).length;

  return calculerScoresDetailles({
    nombreEtablissements: enrichissement.details?.nombreEtablissements ?? null,
    trancheEffectifSalarie,
    nombrePresencesEnLigne,
    technologies: enrichissement.technologies,
    nombreOffresRecrutement: enrichissement.offresRecrutement.length,
    nombreEvenementsRecents: evenementsRecents.length + enrichissement.marchesPublics.length,
    aEvenementNegatifRecent,
    autoriteDomaine: enrichissement.ancienneteDomaine,
  });
}
