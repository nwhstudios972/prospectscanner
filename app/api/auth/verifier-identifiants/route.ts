import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { creerCodeVerification, peutDemanderNouveauCode } from "@/lib/codes";
import {
  notifierCodeVerification,
  notifierTentativeEchouee,
} from "@/lib/notifications/email";
import { estEmailValide } from "@/lib/validation";

// Hash factice utilisé quand l'email n'existe pas, pour que bcrypt.compare
// s'exécute dans tous les cas et éviter une différence de timing qui
// révélerait si un compte existe (même protection que dans auth.ts).
const HASH_FACTICE = "$2b$12$C6UzMDM.H6dfI/f/IKcEeOWFbf0/j1KMxhP9UcpkK.EK4b1vSJ2Iy";

function extraireAdresseIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "inconnue";
}

// Première étape de la connexion à deux facteurs : vérifie email + mot de
// passe (sans créer de session) et, si valides, envoie un code de
// vérification par email. La session n'est créée qu'à l'étape suivante,
// une fois ce code confirmé (voir /api/auth/verifier-code-connexion).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const adresseIp = extraireAdresseIp(request);

  if (!email || !password || !estEmailValide(email)) {
    return NextResponse.json({ error: "parametres_invalides" }, { status: 400 });
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  const motDePasseValide = await bcrypt.compare(
    password,
    utilisateur?.mot_de_passe_hash ?? HASH_FACTICE,
  );
  const identifiantsValides =
    Boolean(utilisateur) && utilisateur!.actif && motDePasseValide;

  if (!identifiantsValides || !utilisateur) {
    await notifierTentativeEchouee({ email, adresseIp }).catch((error) =>
      console.warn("[auth] notification d'échec de connexion :", error),
    );
    return NextResponse.json({ error: "identifiants_invalides" }, { status: 401 });
  }

  const peutDemander = await peutDemanderNouveauCode(utilisateur.id, "connexion");
  if (!peutDemander) {
    return NextResponse.json({ error: "trop_de_tentatives" }, { status: 429 });
  }

  const code = await creerCodeVerification(utilisateur.id, "connexion");
  await notifierCodeVerification(utilisateur.email, code, "connexion").catch(
    (error) => console.error("[auth] envoi du code de connexion échoué :", error),
  );

  return NextResponse.json({ ok: true });
}
