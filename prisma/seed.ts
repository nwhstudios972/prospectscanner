import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Nettoyage des données existantes...");
  await prisma.prospect.deleteMany();
  await prisma.presenceEnLigne.deleteMany();
  await prisma.etablissement.deleteMany();
  await prisma.scan.deleteMany();

  console.log("Insertion des scans et prospects factices...");

  // --- Scan 1 : Garages automobiles à Toulouse (terminé) ---
  const scanToulouse = await prisma.scan.create({
    data: {
      statut: "termine",
      secteur: "Garage automobile",
      ville: "Toulouse",
      rayon_km: 15,
      date_fin: new Date("2026-07-08T09:24:41Z"),
      nombre_etablissements_trouves: 142,
      nombre_prospects_qualifies: 3,
      etablissements: {
        create: [
          {
            nom: "Garage Performance 31",
            secteur: "Garage automobile",
            ville: "Toulouse",
            adresse: "18 avenue de Muret, 31300 Toulouse",
            telephone: "05 61 42 18 90",
            siret: "823 456 719 00021",
            statut_siret: "actif",
            note_google: 4.8,
            nombre_avis_google: 156,
            presences: {
              create: [
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/garageperformance31",
                  nombre_abonnes: 3200,
                  derniere_activite: new Date("2026-07-06T00:00:00Z"),
                  details: { avis_moyen: 4.9, publications_par_semaine: 4 },
                },
                {
                  plateforme: "instagram",
                  trouve: true,
                  url: "https://instagram.com/garageperformance31",
                  nombre_abonnes: 5400,
                  derniere_activite: new Date("2026-07-09T00:00:00Z"),
                  details: { stories_actives: true },
                },
                {
                  plateforme: "tiktok",
                  trouve: true,
                  url: "https://tiktok.com/@garageperformance31",
                  nombre_abonnes: 18000,
                  derniere_activite: new Date("2026-07-09T00:00:00Z"),
                  details: { videos_virales: 3 },
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 97,
                priorite: "tres_elevee",
                a_site_web: false,
                analyse_commerciale:
                  "Forte présence sociale multi-plateformes (Facebook, Instagram, TikTok) avec un engagement élevé et une excellente réputation Google (4.8/5, 156 avis). Aucun site web détecté : opportunité idéale pour convertir cette audience déjà acquise en clientèle en ligne.",
                statut_suivi: "nouveau",
              },
            },
          },
          {
            nom: "Auto Sud Mécanique",
            secteur: "Garage automobile",
            ville: "Toulouse",
            adresse: "72 route de Narbonne, 31400 Toulouse",
            telephone: "05 61 33 22 10",
            statut_siret: "actif",
            note_google: 4.2,
            nombre_avis_google: 48,
            presences: {
              create: [
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/autosudmecanique",
                  nombre_abonnes: 640,
                  derniere_activite: new Date("2026-06-20T00:00:00Z"),
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 61,
                priorite: "moyenne",
                a_site_web: false,
                analyse_commerciale:
                  "Présence Facebook active mais peu suivie. Bonne réputation locale, marge de progression sur la visibilité en ligne.",
                statut_suivi: "nouveau",
              },
            },
          },
          {
            nom: "Carrosserie Garonne",
            secteur: "Garage automobile",
            ville: "Colomiers",
            adresse: "5 impasse des Ateliers, 31770 Colomiers",
            statut_siret: "actif",
            note_google: 3.6,
            nombre_avis_google: 12,
            presences: {
              create: [
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/carrosseriegaronne",
                  nombre_abonnes: 95,
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 34,
                priorite: "faible",
                a_site_web: false,
                analyse_commerciale:
                  "Faible activité sociale et peu d'avis. Le potentiel de conversion est limité à court terme.",
                statut_suivi: "nouveau",
              },
            },
          },
        ],
      },
    },
  });

  // --- Scan 2 : Hôtels & chambres d'hôtes à Annecy (en cours) ---
  const scanAnnecy = await prisma.scan.create({
    data: {
      statut: "en_cours",
      secteur: "Hôtel & chambres d'hôtes",
      ville: "Annecy",
      rayon_km: 25,
      nombre_etablissements_trouves: 88,
      nombre_prospects_qualifies: 2,
      etablissements: {
        create: [
          {
            nom: "Hôtel Les Cimes",
            secteur: "Hôtel",
            ville: "Annecy",
            adresse: "5 avenue du Lac, 74000 Annecy",
            telephone: "04 50 33 22 11",
            statut_siret: "actif",
            note_google: 4.6,
            nombre_avis_google: 210,
            presences: {
              create: [
                {
                  plateforme: "instagram",
                  trouve: true,
                  url: "https://instagram.com/hotellescimes",
                  nombre_abonnes: 5600,
                },
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/hotellescimes",
                  nombre_abonnes: 2100,
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 88,
                priorite: "tres_elevee",
                a_site_web: false,
                analyse_commerciale:
                  "Établissement touristique avec une forte présence Instagram et une excellente note Google. Absence de site web pénalisante pour les réservations directes.",
                statut_suivi: "contacte",
              },
            },
          },
          {
            nom: "Chambres d'hôtes du Semnoz",
            secteur: "Chambre d'hôtes",
            ville: "Annecy",
            adresse: "22 chemin du Semnoz, 74000 Annecy",
            statut_siret: "actif",
            note_google: 4.1,
            nombre_avis_google: 34,
            presences: {
              create: [
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/chambresdusemnoz",
                  nombre_abonnes: 340,
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 66,
                priorite: "moyenne",
                a_site_web: false,
                analyse_commerciale:
                  "Petite structure avec présence sociale correcte. Cible pertinente pour un site vitrine simple.",
                statut_suivi: "nouveau",
              },
            },
          },
        ],
      },
    },
  });

  // --- Scan 3 : Restaurants à Grenoble (erreur) ---
  const scanGrenoble = await prisma.scan.create({
    data: {
      statut: "erreur",
      secteur: "Restaurant",
      ville: "Grenoble",
      rayon_km: 10,
      nombre_etablissements_trouves: 40,
      nombre_prospects_qualifies: 1,
      etablissements: {
        create: [
          {
            nom: "Le Bouchon Grenoblois",
            secteur: "Restaurant",
            ville: "Grenoble",
            adresse: "9 rue Lakanal, 38000 Grenoble",
            telephone: "04 76 44 55 66",
            statut_siret: "actif",
            note_google: 3.9,
            nombre_avis_google: 87,
            presences: {
              create: [
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/lebouchongrenoblois",
                  nombre_abonnes: 150,
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 41,
                priorite: "faible",
                a_site_web: false,
                analyse_commerciale:
                  "Scan interrompu par un dépassement de quota API avant analyse complète du secteur. Données partielles.",
                statut_suivi: "nouveau",
              },
            },
          },
        ],
      },
    },
  });

  // --- Scan 4 : Salons de coiffure à Chambéry (en attente) ---
  const scanChambery = await prisma.scan.create({
    data: {
      statut: "en_attente",
      secteur: "Salon de coiffure",
      ville: "Chambéry",
      rayon_km: 12,
      nombre_etablissements_trouves: 0,
      nombre_prospects_qualifies: 0,
    },
  });

  // --- Scan 5 : Fleuristes à Bordeaux (terminé) ---
  const scanBordeaux = await prisma.scan.create({
    data: {
      statut: "termine",
      secteur: "Fleuriste",
      ville: "Bordeaux",
      rayon_km: 8,
      date_fin: new Date("2026-07-05T16:40:00Z"),
      nombre_etablissements_trouves: 27,
      nombre_prospects_qualifies: 2,
      etablissements: {
        create: [
          {
            nom: "Fleurs de Garonne",
            secteur: "Fleuriste",
            ville: "Bordeaux",
            adresse: "14 cours de l'Intendance, 33000 Bordeaux",
            telephone: "05 56 12 34 56",
            statut_siret: "actif",
            note_google: 4.7,
            nombre_avis_google: 92,
            presences: {
              create: [
                {
                  plateforme: "instagram",
                  trouve: true,
                  url: "https://instagram.com/fleursdegaronne",
                  nombre_abonnes: 4100,
                },
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/fleursdegaronne",
                  nombre_abonnes: 1300,
                },
                { plateforme: "site_web", trouve: false },
              ],
            },
            prospect: {
              create: {
                score: 79,
                priorite: "elevee",
                a_site_web: false,
                analyse_commerciale:
                  "Belle image de marque sur Instagram, potentiel fort pour la vente en ligne (livraison de bouquets).",
                statut_suivi: "en_negociation",
              },
            },
          },
          {
            nom: "Bouquet & Co",
            secteur: "Fleuriste",
            ville: "Bordeaux",
            adresse: "3 rue Sainte-Catherine, 33000 Bordeaux",
            statut_siret: "actif",
            note_google: 4.3,
            nombre_avis_google: 21,
            presences: {
              create: [
                {
                  plateforme: "facebook",
                  trouve: true,
                  url: "https://facebook.com/bouquetandco",
                  nombre_abonnes: 210,
                },
                {
                  plateforme: "site_web",
                  trouve: true,
                  url: "https://bouquetandco.fr",
                },
              ],
            },
            prospect: {
              create: {
                score: 18,
                priorite: "faible",
                a_site_web: true,
                analyse_commerciale:
                  "Possède déjà un site web fonctionnel : non prioritaire pour une offre de création de site.",
                statut_suivi: "perdu",
              },
            },
          },
        ],
      },
    },
  });

  console.log("Seed terminé :", {
    scans: [
      scanToulouse.id,
      scanAnnecy.id,
      scanGrenoble.id,
      scanChambery.id,
      scanBordeaux.id,
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
