import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: process.argv[4] || ".env.production", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.argv[2] || "").trim();
  const password = process.argv[3] || "";

  if (!email || !password) {
    console.error("Usage: tsx scripts/create-user.ts <email> <password> [chemin_env]");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exitCode = 1;
    return;
  }

  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant) {
    console.error(`Un utilisateur existe déjà pour ${email} (${existant.id}).`);
    process.exitCode = 1;
    return;
  }

  const mot_de_passe_hash = await bcrypt.hash(password, 12);

  const utilisateur = await prisma.utilisateur.create({
    data: { email, mot_de_passe_hash, est_admin: false, actif: true },
  });

  console.log(`Utilisateur créé : ${utilisateur.email} (${utilisateur.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
