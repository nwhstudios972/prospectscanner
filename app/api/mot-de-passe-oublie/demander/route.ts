import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creerCodeVerification } from "@/lib/codes";
import { notifierCodeVerification } from "@/lib/notifications/email";

// Réponse identique que le compte existe ou non, pour ne pas révéler
// si un email est enregistré (même logique que l'authentification).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "email_requis" }, { status: 400 });
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });

  if (utilisateur && utilisateur.actif) {
    const code = await creerCodeVerification(utilisateur.id, "reinitialisation_mdp");
    await notifierCodeVerification(utilisateur.email, code, "reinitialisation_mdp").catch(
      (error) => console.error("[mot-de-passe-oublie] envoi du code échoué :", error),
    );
  }

  return NextResponse.json({ ok: true });
}
