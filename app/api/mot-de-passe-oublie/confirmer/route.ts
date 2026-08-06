import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifierCodeVerification } from "@/lib/codes";
import { estEmailValide, validerForceMotDePasse } from "@/lib/validation";
import { notifierMotDePasseModifie } from "@/lib/notifications/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const nouveau =
    typeof body?.nouveau_mot_de_passe === "string" ? body.nouveau_mot_de_passe : "";
  const confirmation =
    typeof body?.confirmation === "string" ? body.confirmation : "";

  if (!email || !code || !nouveau || !confirmation || !estEmailValide(email)) {
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

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur) {
    // Même erreur générique que pour un code invalide : ne pas révéler si le compte existe.
    return NextResponse.json({ error: "code_invalide" }, { status: 400 });
  }

  const resultatCode = await verifierCodeVerification(
    utilisateur.id,
    "reinitialisation_mdp",
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
    console.error("[mot-de-passe-oublie] notification de changement échouée :", error),
  );

  return NextResponse.json({ ok: true });
}
