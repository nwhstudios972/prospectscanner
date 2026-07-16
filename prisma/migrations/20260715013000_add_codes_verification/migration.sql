-- CreateEnum
CREATE TYPE "TypeCodeVerification" AS ENUM ('reinitialisation_mdp', 'changement_mdp');

-- CreateTable
CREATE TABLE "codes_verification" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "type" "TypeCodeVerification" NOT NULL,
    "expire_a" TIMESTAMP(3) NOT NULL,
    "utilise" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codes_verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codes_verification_utilisateur_id_type_idx" ON "codes_verification"("utilisateur_id", "type");

-- AddForeignKey
ALTER TABLE "codes_verification" ADD CONSTRAINT "codes_verification_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
