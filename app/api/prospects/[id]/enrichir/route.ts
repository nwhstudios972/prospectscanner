import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  recupererEnrichissement,
  calculerScoresDepuisEnrichissement,
} from "@/lib/pipeline/enrichir-etablissement";
import { PLATEFORMES_SOCIALES } from "@/lib/pipeline/social-links";

// Relance uniquement l'enrichissement B2B (dirigeants, finances, BODACC,
// DECP, technologies, réseaux sociaux, catalogue e-commerce, France Travail)
// pour un établissement déjà scanné — sans refaire la recherche Google
// Places (pas de re-géocodage, pas de nouvel appel Places, la présence
// "site_web" elle-même n'est pas retouchée). Les anciennes lignes
// dirigeants/technologies/évènements/présences sociales/produits sont
// remplacées par les nouvelles pour éviter les doublons.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const { id } = await params;

  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: { etablissement: { include: { presences: true } } },
  });

  if (!prospect) {
    return NextResponse.json({ error: "prospect_introuvable" }, { status: 404 });
  }

  const { etablissement } = prospect;
  const siteWeb =
    etablissement.presences.find((p) => p.plateforme === "site_web" && p.trouve)?.url ?? null;

  const enrichissement = await recupererEnrichissement(
    `reenrichissement:${etablissement.id}`,
    etablissement.nom,
    etablissement.siret,
    siteWeb,
    etablissement.latitude,
    etablissement.longitude,
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
    etablissement.tranche_effectif_salarie,
    Boolean(siteWeb),
  );

  await prisma.$transaction([
    prisma.dirigeant.deleteMany({ where: { etablissement_id: etablissement.id } }),
    prisma.donneeFinanciere.deleteMany({ where: { etablissement_id: etablissement.id } }),
    prisma.technologieDetectee.deleteMany({ where: { etablissement_id: etablissement.id } }),
    prisma.evenementBusiness.deleteMany({ where: { etablissement_id: etablissement.id } }),
    prisma.produitEcommerce.deleteMany({ where: { etablissement_id: etablissement.id } }),
    prisma.presenceEnLigne.deleteMany({
      where: { etablissement_id: etablissement.id, plateforme: { not: "site_web" } },
    }),
    prisma.etablissement.update({
      where: { id: etablissement.id },
      data: {
        email,
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
          create: PLATEFORMES_SOCIALES.map((plateforme) => ({
            plateforme,
            trouve: plateforme in reseauxSociaux,
            url: reseauxSociaux[plateforme] ?? null,
          })),
        },
        produitsEcommerce: {
          create: produitsEcommerce.map((p) => ({
            nom: p.nom,
            prix: p.prix,
            devise: p.devise,
            url: p.url,
          })),
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
          create: technologies.map((t) => ({ categorie: t.categorie, nom: t.nom })),
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
      },
    }),
    prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        score_croissance: scoresDetailles.scoreCroissance,
        score_digital: scoresDetailles.scoreDigital,
        score_technologique: scoresDetailles.scoreTechnologique,
        score_recrutement: scoresDetailles.scoreRecrutement,
        score_intention: scoresDetailles.scoreIntention,
        segment: scoresDetailles.segment,
      },
    }),
  ]);

  return NextResponse.json({ id: prospect.id, ok: true });
}
