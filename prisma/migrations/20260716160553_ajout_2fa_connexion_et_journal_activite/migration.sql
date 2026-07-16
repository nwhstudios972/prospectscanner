-- CreateEnum
CREATE TYPE "TypeEvenementJournal" AS ENUM ('connexion', 'activite_suspecte');

-- AlterEnum
ALTER TYPE "TypeCodeVerification" ADD VALUE 'connexion';

-- AlterTable
ALTER TABLE "codes_verification" ADD COLUMN     "tentatives" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "journal_connexions" ADD COLUMN     "type_evenement" "TypeEvenementJournal" NOT NULL DEFAULT 'connexion';
