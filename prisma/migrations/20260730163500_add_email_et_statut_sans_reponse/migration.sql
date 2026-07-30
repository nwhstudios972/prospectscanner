-- AlterEnum
ALTER TYPE "StatutSuivi" ADD VALUE 'sans_reponse';

-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN     "email" TEXT;
