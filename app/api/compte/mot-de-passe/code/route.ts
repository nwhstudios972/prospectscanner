import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creerCodeVerification, peutDemanderNouveauCode } from "@/lib/codes";
import { notifierCodeVerification } from "@/lib/notifications/email";

// Étape 1 du changement de mot de passe : vérifie l'ancien mot de passe
// puis envoie un code par email, requis pour confirmer le changement.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ancien =
    typeof body?.ancien_mot_de_passe === "string" ? body.ancien_mot_de_passe : "";

  if (!ancien) {
    return NextResponse.json({ error: "parametres_invalides" }, { status: 400 });
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: session.user.id },
  });
  if (!utilisateur) {
    return NextResponse.json({ error: "utilisateur_introuvable" }, { status: 404 });
  }

  const ancienValide = await bcrypt.compare(ancien, utilisateur.mot_de_passe_hash);
  if (!ancienValide) {
    return NextResponse.json(
      { error: "ancien_mot_de_passe_incorrect" },
      { status: 400 },
    );
  }

  const peutDemander = await peutDemanderNouveauCode(utilisateur.id, "changement_mdp");
  if (!peutDemander) {
    return NextResponse.json({ error: "trop_de_tentatives" }, { status: 429 });
  }

  const code = await creerCodeVerification(utilisateur.id, "changement_mdp");
  await notifierCodeVerification(utilisateur.email, code, "changement_mdp").catch(
    (error) => console.error("[compte] envoi du code de changement échoué :", error),
  );

  return NextResponse.json({ ok: true });
}
