import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  const email = (await rl.question("Email de l'administrateur : ")).trim();
  const password = await rl.question("Mot de passe : ");

  rl.close();

  if (!email || !password) {
    console.error("Email et mot de passe requis.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exitCode = 1;
    return;
  }

  const mot_de_passe_hash = await bcrypt.hash(password, 12);

  const utilisateur = await prisma.utilisateur.upsert({
    where: { email },
    update: { mot_de_passe_hash, est_admin: true, actif: true },
    create: { email, mot_de_passe_hash, est_admin: true },
  });

  console.log(`Utilisateur admin prêt : ${utilisateur.email} (${utilisateur.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
