-- AlterTable
ALTER TABLE "scans" ADD COLUMN "erreur_message" TEXT;

-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN "google_place_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "etablissements_google_place_id_key" ON "etablissements"("google_place_id");
