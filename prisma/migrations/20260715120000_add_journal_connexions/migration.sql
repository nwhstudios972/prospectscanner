-- CreateEnum
CREATE TYPE "TypeDeconnexion" AS ENUM ('manuelle', 'inactivite');

-- CreateTable
CREATE TABLE "journal_connexions" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "email" TEXT NOT NULL,
    "adresse_ip" TEXT NOT NULL,
    "connecte_a" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deconnecte_a" TIMESTAMP(3),
    "type_deconnexion" "TypeDeconnexion",

    CONSTRAINT "journal_connexions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journal_connexions_connecte_a_idx" ON "journal_connexions"("connecte_a");

-- AddForeignKey
ALTER TABLE "journal_connexions" ADD CONSTRAINT "journal_connexions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
