-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN     "score_autorite_domaine" INTEGER;

-- CreateTable
CREATE TABLE "produits_ecommerce" (
    "id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DOUBLE PRECISION,
    "devise" TEXT,
    "url" TEXT,
    "detecte_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produits_ecommerce_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "produits_ecommerce" ADD CONSTRAINT "produits_ecommerce_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
