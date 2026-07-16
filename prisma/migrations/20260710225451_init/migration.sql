-- CreateEnum
CREATE TYPE "StatutScan" AS ENUM ('en_attente', 'en_cours', 'termine', 'erreur');

-- CreateEnum
CREATE TYPE "Plateforme" AS ENUM ('facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'x', 'pagesjaunes', 'booking', 'tripadvisor', 'airbnb', 'site_web');

-- CreateEnum
CREATE TYPE "Priorite" AS ENUM ('tres_elevee', 'elevee', 'moyenne', 'faible');

-- CreateEnum
CREATE TYPE "StatutSuivi" AS ENUM ('nouveau', 'contacte', 'en_negociation', 'converti', 'perdu');

-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "statut" "StatutScan" NOT NULL DEFAULT 'en_attente',
    "secteur" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "rayon_km" INTEGER NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(3),
    "nombre_etablissements_trouves" INTEGER NOT NULL DEFAULT 0,
    "nombre_prospects_qualifies" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "telephone" TEXT,
    "siret" TEXT,
    "statut_siret" TEXT,
    "note_google" DOUBLE PRECISION,
    "nombre_avis_google" INTEGER,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences_en_ligne" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "plateforme" "Plateforme" NOT NULL,
    "trouve" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "nombre_abonnes" INTEGER,
    "derniere_activite" TIMESTAMP(3),
    "details" JSONB,

    CONSTRAINT "presences_en_ligne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "priorite" "Priorite" NOT NULL,
    "a_site_web" BOOLEAN NOT NULL DEFAULT false,
    "analyse_commerciale" TEXT,
    "date_calcul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut_suivi" "StatutSuivi" NOT NULL DEFAULT 'nouveau',

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presences_en_ligne_etablissement_id_plateforme_key" ON "presences_en_ligne"("etablissement_id", "plateforme");

-- CreateIndex
CREATE UNIQUE INDEX "prospects_etablissement_id_key" ON "prospects"("etablissement_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- AddForeignKey
ALTER TABLE "etablissements" ADD CONSTRAINT "etablissements_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences_en_ligne" ADD CONSTRAINT "presences_en_ligne_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
