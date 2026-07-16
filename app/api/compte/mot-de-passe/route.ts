import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validerForceMotDePasse } from "@/lib/validation";
import { notifierMotDePasseModifie } from "@/lib/notifications/email";
import { verifierCodeVerification } from "@/lib/codes";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "non_authentifie" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ancien =
    typeof body?.ancien_mot_de_passe === "string" ? body.ancien_mot_de_passe : "";
  const nouveau =
    typeof body?.nouveau_mot_de_passe === "string" ? body.nouveau_mot_de_passe : "";
  const confirmation =
    typeof body?.confirmation === "string" ? body.confirmation : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!ancien || !nouveau || !confirmation || !code) {
    return NextResponse.json({ error: "parametres_invalides" }, { status: 400 });
  }

  if (nouveau !== confirmation) {
    return NextResponse.json({ error: "confirmation_invalide" }, { status: 400 });
  }

  const erreurForce = validerForceMotDePasse(nouveau);
  if (erreurForce) {
    return NextResponse.json(
      { error: "mot_de_passe_faible", message: erreurForce },
      { status: 400 },
    );
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

  const resultatCode = await verifierCodeVerification(
    utilisateur.id,
    "changement_mdp",
    code,
  );
  if (resultatCode !== "ok") {
    return NextResponse.json({ error: "code_invalide" }, { status: 400 });
  }

  const mot_de_passe_hash = await bcrypt.hash(nouveau, 12);
  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { mot_de_passe_hash },
  });

  await notifierMotDePasseModifie(utilisateur.email).catch((error) =>
    console.error(
      "[compte] notification de changement de mot de passe échouée :",
      error,
    ),
  );

  return NextResponse.json({ ok: true });
}
