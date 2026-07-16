-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "est_admin" BOOLEAN NOT NULL DEFAULT false;
