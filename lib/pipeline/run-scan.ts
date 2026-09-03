import { prisma } from "@/lib/prisma";
import { geocoderVille } from "@/lib/pipeline/geocode";
import {
  rechercherEtablissements,
  type PlaceResultat,
} from "@/lib/pipeline/google-places";
import { rechercherSiret } from "@/lib/pipeline/sirene";
import { extraireCodePostal } from "@/lib/pipeline/matching";
import { calculerScore } from "@/lib/pipeline/scoring";
import { notifierSiProspectPrioritaire } from "@/lib/notifications/telegram";
import {
  recupererEnrichissement,
  calculerScoresDepuisEnrichissement,
} from "@/lib/pipeline/enrichir-etablissement";
import { PLATEFORMES_SOCIALES } from "@/lib/pipeline/social-links";
import type { Scan } from "@/lib/generated/prisma/client";
import type { ProspectWithDetails } from "@/lib/queries";

// Les établissements sont traités par petits lots concurrents plutôt qu'un
// par un : ça divise le temps total d'un scan par ~TAILLE_LOT tout en
// gardant une pause entre les lots pour ménager l'API SIRENE.
const TAILLE_LOT = 5;
const DELAI_ENTRE_LOTS_SIRENE_MS = 200;

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decouperEnLots<T>(items: T[], taille: number): T[][] {
  const lots: T[][] = [];
  for (let i = 0; i < items.length; i += taille) {
    lots.push(items.slice(i, i + taille));
  }
  return lots;
}

export async function executerScan(scanId: string): Promise<void> {
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan) {
    console.error(`[scan ${scanId}] introuvable, abandon.`);
    return;
  }

  try {
    await prisma.scan.update({
      where: { id: scanId },
      data: { statut: "en_cours" },
    });

    const centre = await geocoderVille(scan.ville);
    const places = await rechercherEtablissements(
      scan.secteur,
      scan.ville,
      centre,
      scan.rayon_km,
    );

    await prisma.scan.update({
      where: { id: scanId },
      data: { nombre_etablissements_trouves: places.length },
    });

    // Dédoublonnage en une seule requête : un même établissement Google
    // (place_id) ne doit être écrit qu'une fois, même si un nouveau scan
    // retombe dessus.
    const dejaExistants = await prisma.etablissement.findMany({
      where: { google_place_id: { in: places.map((p) => p.placeId) } },
      select: { google_place_id: true },
    });
    const placeIdsExistants = new Set(dejaExistants.map((e) => e.google_place_id));

    let prospectsQualifies = 0;

    for (const lot of decouperEnLots(places, TAILLE_LOT)) {
      const resultats = await Promise.all(
        lot.map((place) =>
          traiterEtablissement(scanId, scan, place, placeIdsExistants),
        ),
      );
      const prospectsDuLot = resultats.filter(
        (r): r is ProspectWithDetails => r !== null,
      );

      if (prospectsDuLot.length > 0) {
        prospectsQualifies += prospectsDuLot.length;
        await prisma.scan.update({
          where: { id: scanId },
          data: { nombre_prospects_qualifies: prospectsQualifies },
        });

        for (const prospectDetail of prospectsDuLot) {
          void notifierSiProspectPrioritaire(prospectDetail).catch((error) =>
            console.warn(
              `[scan ${scanId}] notification Telegram échouée :`,
              error,
            ),
          );
        }
      }

      await attendre(DELAI_ENTRE_LOTS_SIRENE_MS);
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { statut: "termine", date_fin: new Date() },
    });
  } catch (error) {
    console.error(`[scan ${scanId}] échec du pipeline :`, error);
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        statut: "erreur",
        date_fin: new Date(),
        erreur_message:
          error instanceof Error ? error.message : "Erreur inconnue",
      },
    });
  }
}

async function traiterEtablissement(
  scanId: string,
  scan: Scan,
  place: PlaceResultat,
  placeIdsExistants: Set<string | null>,
): Promise<ProspectWithDetails | null> {
  if (placeIdsExistants.has(place.placeId)) {
    console.warn(
      `[scan ${scanId}] "${place.nom}" (${place.placeId}) déjà présent en base, ignoré.`,
    );
    return null;
  }

  const codePostal = extraireCodePostal(place.adresse);

  let siret: string | null = null;
  let statutSiret: "actif" | "ferme" | null = null;
  let natureJuridique: string | null = null;
  let trancheEffectifSalarie: string | null = null;

  try {
    const match = await rechercherSiret(place.nom, codePostal);
    if (match) {
      siret = match.siret;
      statutSiret = match.statut;
      natureJuridique = match.natureJuridique;
      trancheEffectifSalarie = match.trancheEffectifSalarie;
    }
  } catch (error) {
    console.warn(
      `[scan ${scanId}] recherche SIRENE échouée pour "${place.nom}" :`,
      error,
    );
  }

  const aSiteWeb = Boolean(place.siteWeb);
  const { score, priorite } = calculerScore({
    aSiteWeb,
    noteGoogle: place.note,
    nombreAvisGoogle: place.nombreAvis,
    statutSiret,
  });

  const enrichissement = await recupererEnrichissement(
    `scan ${scanId}`,
    place.nom,
    siret,
    place.siteWeb,
    place.latitude,
    place.longitude,
  );
  const {
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
  } = enrichissement;

  const scoresDetailles = calculerScoresDepuisEnrichissement(
    enrichissement,
    trancheEffectifSalarie,
    aSiteWeb,
  );

  const etablissement = await prisma.etablissement.create({
    data: {
      scan_id: scanId,
      google_place_id: place.placeId,
      nom: place.nom,
      secteur: scan.secteur,
      ville: scan.ville,
      adresse: place.adresse,
      telephone: place.telephone,
      email,
      siret,
      statut_siret: statutSiret,
      nature_juridique: natureJuridique,
      tranche_effectif_salarie: trancheEffectifSalarie,
      note_google: place.note,
      nombre_avis_google: place.nombreAvis,
      latitude: place.latitude,
      longitude: place.longitude,
      forme_juridique: details?.formeJuridique ?? null,
      nom_commercial: details?.nomCommercial ?? null,
      date_creation_entreprise: details?.dateCreationEntreprise ?? null,
      categorie_entreprise: details?.categorieEntreprise ?? null,
      tva_intracommunautaire: details?.tvaIntracommunautaire ?? null,
      nombre_etablissements: details?.nombreEtablissements ?? null,
      score_performance_web: analyseSite?.scorePerformance ?? null,
      score_seo_web: analyseSite?.scoreSeo ?? null,
      score_autorite_domaine: ancienneteDomaine,
      presences: {
        create: [
          {
            plateforme: "site_web",
            trouve: aSiteWeb,
            url: place.siteWeb,
          },
          ...PLATEFORMES_SOCIALES.map((plateforme) => ({
            plateforme,
            trouve: plateforme in reseauxSociaux,
            url: reseauxSociaux[plateforme] ?? null,
          })),
        ],
      },
      dirigeants: {
        create: (details?.dirigeants ?? []).map((d) => ({
          nom: d.nom,
          prenoms: d.prenoms,
          qualite: d.qualite,
          type_dirigeant: d.typeDirigeant,
          annee_naissance: d.anneeNaissance,
          denomination: d.denomination,
          siren_personne_morale: d.sirenPersonneMorale,
        })),
      },
      donneesFinancieres: {
        create: (details?.donneesFinancieres ?? []).map((f) => ({
          annee: f.annee,
          chiffre_affaires: f.chiffreAffaires,
          resultat_net: f.resultatNet,
        })),
      },
      technologies: {
        create: technologies.map((t) => ({
          categorie: t.categorie,
          nom: t.nom,
        })),
      },
      evenements: {
        create: [
          ...evenementsBodacc.map((e) => ({
            type: e.type,
            date_evenement: e.dateEvenement,
            titre: e.titre,
            description: e.description,
            source: "bodacc",
            url: e.url,
          })),
          ...marchesPublics.map((m) => ({
            type: "marche_public" as const,
            date_evenement: m.dateEvenement,
            titre: m.titre,
            description: m.description,
            source: "decp",
            url: null,
          })),
          ...offresRecrutement.map((o) => ({
            type: "recrutement" as const,
            date_evenement: o.dateCreation,
            titre: o.titre,
            description: null,
            source: "france_travail",
            url: o.url,
          })),
        ],
      },
      historiqueReputation: {
        create: [
          {
            note_google: place.note,
            nombre_avis_google: place.nombreAvis,
          },
        ],
      },
      produitsEcommerce: {
        create: produitsEcommerce.map((p) => ({
          nom: p.nom,
          prix: p.prix,
          devise: p.devise,
          url: p.url,
        })),
      },
      prospect: {
        create: {
          score,
          priorite,
          a_site_web: aSiteWeb,
          analyse_commerciale: construireAnalyse({
            aSiteWeb,
            note: place.note,
            nombreAvis: place.nombreAvis,
            statutSiret,
          }),
          score_croissance: scoresDetailles.scoreCroissance,
          score_digital: scoresDetailles.scoreDigital,
          score_technologique: scoresDetailles.scoreTechnologique,
          score_recrutement: scoresDetailles.scoreRecrutement,
          score_intention: scoresDetailles.scoreIntention,
          segment: scoresDetailles.segment,
        },
      },
    },
    include: {
      presences: true,
      prospect: true,
      scan: true,
      dirigeants: true,
      donneesFinancieres: { orderBy: { annee: "desc" } },
      technologies: true,
      evenements: { orderBy: { date_evenement: "desc" } },
      historiqueReputation: { orderBy: { date_mesure: "asc" } },
      produitsEcommerce: true,
    },
  });

  if (!etablissement.prospect) return null;

  return { ...etablissement.prospect, etablissement };
}

function construireAnalyse(donnees: {
  aSiteWeb: boolean;
  note: number | null;
  nombreAvis: number | null;
  statutSiret: "actif" | "ferme" | null;
}): string {
  const parties: string[] = [];

  parties.push(
    donnees.aSiteWeb
      ? "Possède déjà un site web."
      : "Aucun site web détecté sur sa fiche Google : opportunité de conversion.",
  );

  if (donnees.note !== null && donnees.nombreAvis !== null) {
    parties.push(
      `Réputation Google : ${donnees.note}/5 sur ${donnees.nombreAvis} avis.`,
    );
  }

  if (donnees.statutSiret === "actif") {
    parties.push("Établissement actif au registre SIRENE.");
  } else if (donnees.statutSiret === "ferme") {
    parties.push("Établissement signalé fermé au registre SIRENE.");
  } else {
    parties.push("Aucune correspondance SIRENE fiable trouvée.");
  }

  return parties.join(" ");
}
