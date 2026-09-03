import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creerCodeVerification, peutDemanderNouveauCode } from "@/lib/codes";
import { notifierCodeVerification } from "@/lib/notifications/email";
import { estEmailValide } from "@/lib/validation";

// Réponse identique que le compte existe ou non (et que la demande soit
// acceptée ou mise en cooldown), pour ne pas révéler si un email est
// enregistré (même logique que l'authentification).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !estEmailValide(email)) {
    return NextResponse.json({ error: "email_requis" }, { status: 400 });
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });

  if (utilisateur && utilisateur.actif) {
    const peutDemander = await peutDemanderNouveauCode(
      utilisateur.id,
      "reinitialisation_mdp",
    );
    if (peutDemander) {
      const code = await creerCodeVerification(utilisateur.id, "reinitialisation_mdp");
      await notifierCodeVerification(utilisateur.email, code, "reinitialisation_mdp").catch(
        (error) => console.error("[mot-de-passe-oublie] envoi du code échoué :", error),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
