-- CreateEnum
CREATE TYPE "CategorieTechnologie" AS ENUM ('cms', 'ecommerce', 'crm_marketing', 'analytics', 'paiement', 'autre');

-- CreateEnum
CREATE TYPE "TypeEvenementBusiness" AS ENUM ('depot_comptes', 'procedure_collective', 'modification', 'radiation', 'marche_public', 'recrutement');

-- CreateEnum
CREATE TYPE "Segment" AS ENUM ('fort_potentiel', 'a_developper', 'stable', 'a_risque');

-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN     "categorie_entreprise" TEXT,
ADD COLUMN     "date_creation_entreprise" TIMESTAMP(3),
ADD COLUMN     "forme_juridique" TEXT,
ADD COLUMN     "nom_commercial" TEXT,
ADD COLUMN     "nombre_etablissements" INTEGER,
ADD COLUMN     "tva_intracommunautaire" TEXT;

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN     "score_croissance" INTEGER,
ADD COLUMN     "score_digital" INTEGER,
ADD COLUMN     "score_intention" INTEGER,
ADD COLUMN     "score_recrutement" INTEGER,
ADD COLUMN     "score_technologique" INTEGER,
ADD COLUMN     "segment" "Segment";

-- CreateTable
CREATE TABLE "dirigeants" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "nom" TEXT,
    "prenoms" TEXT,
    "qualite" TEXT,
    "type_dirigeant" TEXT,
    "annee_naissance" TEXT,
    "denomination" TEXT,
    "siren_personne_morale" TEXT,

    CONSTRAINT "dirigeants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donnees_financieres" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "chiffre_affaires" INTEGER,
    "resultat_net" INTEGER,

    CONSTRAINT "donnees_financieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technologies_detectees" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "categorie" "CategorieTechnologie" NOT NULL,
    "nom" TEXT NOT NULL,
    "detecte_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technologies_detectees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_business" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "type" "TypeEvenementBusiness" NOT NULL,
    "date_evenement" TIMESTAMP(3) NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "evenements_business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_reputation" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "date_mesure" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note_google" DOUBLE PRECISION,
    "nombre_avis_google" INTEGER,

    CONSTRAINT "historique_reputation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donnees_financieres_etablissement_id_annee_key" ON "donnees_financieres"("etablissement_id", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "technologies_detectees_etablissement_id_nom_key" ON "technologies_detectees"("etablissement_id", "nom");

-- CreateIndex
CREATE INDEX "evenements_business_etablissement_id_date_evenement_idx" ON "evenements_business"("etablissement_id", "date_evenement");

-- CreateIndex
CREATE INDEX "historique_reputation_etablissement_id_date_mesure_idx" ON "historique_reputation"("etablissement_id", "date_mesure");

-- AddForeignKey
ALTER TABLE "dirigeants" ADD CONSTRAINT "dirigeants_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donnees_financieres" ADD CONSTRAINT "donnees_financieres_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technologies_detectees" ADD CONSTRAINT "technologies_detectees_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_business" ADD CONSTRAINT "evenements_business_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_reputation" ADD CONSTRAINT "historique_reputation_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
