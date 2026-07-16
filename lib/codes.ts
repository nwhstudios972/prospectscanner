import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { TypeCodeVerification } from "@/lib/generated/prisma/enums";

const DUREES_VALIDITE_MINUTES: Record<TypeCodeVerification, number> = {
  reinitialisation_mdp: 10,
  changement_mdp: 10,
  connexion: 5,
};

const MAX_TENTATIVES = 5;
const DUREE_BLOCAGE_MINUTES = 15;

function genererCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function dureeValiditeMinutes(type: TypeCodeVerification): number {
  return DUREES_VALIDITE_MINUTES[type];
}

// Anti-brute-force sur le code de connexion : si un code du même type a déjà
// atteint MAX_TENTATIVES récemment, on refuse d'en générer un nouveau tant
// que la fenêtre de blocage n'est pas expirée (sinon un "renvoyer le code"
// répété contournerait la limite de tentatives).
export async function peutDemanderCodeConnexion(
  utilisateurId: string,
): Promise<boolean> {
  const blocageRecent = await prisma.codeVerification.findFirst({
    where: {
      utilisateur_id: utilisateurId,
      type: "connexion",
      tentatives: { gte: MAX_TENTATIVES },
      date_creation: { gt: new Date(Date.now() - DUREE_BLOCAGE_MINUTES * 60 * 1000) },
    },
    orderBy: { date_creation: "desc" },
  });
  return !blocageRecent;
}

// Un seul code actif à la fois par (utilisateur, type) : toute nouvelle
// demande invalide silencieusement les codes non utilisés précédents.
export async function creerCodeVerification(
  utilisateurId: string,
  type: TypeCodeVerification,
): Promise<string> {
  const code = genererCode();
  const code_hash = await bcrypt.hash(code, 10);
  const expire_a = new Date(
    Date.now() + DUREES_VALIDITE_MINUTES[type] * 60 * 1000,
  );

  await prisma.codeVerification.deleteMany({
    where: { utilisateur_id: utilisateurId, type, utilise: false },
  });
  await prisma.codeVerification.create({
    data: { utilisateur_id: utilisateurId, code_hash, type, expire_a },
  });

  return code;
}

export type ResultatVerificationCode =
  | "ok"
  | "invalide"
  | "expire_ou_absent"
  | "trop_de_tentatives";

export async function verifierCodeVerification(
  utilisateurId: string,
  type: TypeCodeVerification,
  code: string,
): Promise<ResultatVerificationCode> {
  const entree = await prisma.codeVerification.findFirst({
    where: { utilisateur_id: utilisateurId, type, utilise: false },
    orderBy: { date_creation: "desc" },
  });
  if (!entree || entree.expire_a < new Date()) return "expire_ou_absent";

  const valide = await bcrypt.compare(code, entree.code_hash);
  if (valide) {
    await prisma.codeVerification.update({
      where: { id: entree.id },
      data: { utilise: true },
    });
    return "ok";
  }

  const tentatives = entree.tentatives + 1;
  const bloque = tentatives >= MAX_TENTATIVES;
  await prisma.codeVerification.update({
    where: { id: entree.id },
    // Un code bloqué est marqué "utilise" pour l'invalider immédiatement :
    // il ne doit plus jamais être acceptable, même si l'expiration n'est
    // pas encore atteinte.
    data: { tentatives, utilise: bloque },
  });
  return bloque ? "trop_de_tentatives" : "invalide";
}
