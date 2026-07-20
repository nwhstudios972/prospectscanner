import { prisma } from "@/lib/prisma";
import { geocoderVille } from "@/lib/pipeline/geocode";
import { rechercherEtablissements } from "@/lib/pipeline/google-places";
import { rechercherSiret } from "@/lib/pipeline/sirene";
import { extraireCodePostal } from "@/lib/pipeline/matching";
import { calculerScore } from "@/lib/pipeline/scoring";
import { notifierSiProspectPrioritaire } from "@/lib/notifications/telegram";
import type { ProspectWithDetails } from "@/lib/queries";

const DELAI_ENTRE_APPELS_SIRENE_MS = 200;

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    let prospectsQualifies = 0;

    for (const place of places) {
      const codePostal = extraireCodePostal(place.adresse);

      let siret: string | null = null;
      let statutSiret: "actif" | "ferme" | null = null;
      let natureJuridique: string | null = null;

      try {
        const match = await rechercherSiret(place.nom, codePostal);
        if (match) {
          siret = match.siret;
          statutSiret = match.statut;
          natureJuridique = match.natureJuridique;
        }
      } catch (error) {
        console.warn(
          `[scan ${scanId}] recherche SIRENE échouée pour "${place.nom}" :`,
          error,
        );
      }
      await attendre(DELAI_ENTRE_APPELS_SIRENE_MS);

      const aSiteWeb = Boolean(place.siteWeb);
      const { score, priorite } = calculerScore({
        aSiteWeb,
        noteGoogle: place.note,
        nombreAvisGoogle: place.nombreAvis,
        statutSiret,
      });

      // Dédoublonnage : un même établissement Google (place_id) ne doit être
      // écrit qu'une fois, même si un nouveau scan retombe dessus.
      const dejaExistant = await prisma.etablissement.findUnique({
        where: { google_place_id: place.placeId },
      });
      if (dejaExistant) {
        console.warn(
          `[scan ${scanId}] "${place.nom}" (${place.placeId}) déjà présent en base (scan ${dejaExistant.scan_id}), ignoré.`,
        );
        continue;
      }

      const etablissement = await prisma.etablissement.create({
        data: {
          scan_id: scanId,
          google_place_id: place.placeId,
          nom: place.nom,
          secteur: scan.secteur,
          ville: scan.ville,
          adresse: place.adresse,
          telephone: place.telephone,
          siret,
          statut_siret: statutSiret,
          nature_juridique: natureJuridique,
          note_google: place.note,
          nombre_avis_google: place.nombreAvis,
          presences: {
            create: [
              {
                plateforme: "site_web",
                trouve: aSiteWeb,
                url: place.siteWeb,
              },
            ],
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
            },
          },
        },
        include: {
          presences: true,
          prospect: true,
          scan: true,
        },
      });

      prospectsQualifies++;

      await prisma.scan.update({
        where: { id: scanId },
        data: { nombre_prospects_qualifies: prospectsQualifies },
      });

      if (etablissement.prospect) {
        const prospectDetail: ProspectWithDetails = {
          ...etablissement.prospect,
          etablissement,
        };
        await notifierSiProspectPrioritaire(prospectDetail).catch((error) =>
          console.warn(`[scan ${scanId}] notification Telegram échouée :`, error),
        );
      }
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
