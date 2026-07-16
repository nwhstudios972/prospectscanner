import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifierCodeVerification } from "@/lib/codes";
import { notifierActiviteSuspecte } from "@/lib/notifications/email";

function extraireAdresseIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "inconnue";
}

// Deuxième étape de la connexion à deux facteurs : vérifie uniquement le
// code reçu par email. Ne crée pas de session — le client doit ensuite
// appeler la server action `authenticate` (email + mot de passe déjà
// validés à l'étape précédente) pour finaliser réellement la connexion.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const adresseIp = extraireAdresseIp(request);

  if (!email || !code) {
    return NextResponse.json({ error: "parametres_invalides" }, { status: 400 });
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur) {
    return NextResponse.json({ error: "code_invalide" }, { status: 400 });
  }

  const resultat = await verifierCodeVerification(utilisateur.id, "connexion", code);

  if (resultat === "trop_de_tentatives") {
    await prisma.journalConnexion
      .create({
        data: {
          utilisateur_id: utilisateur.id,
          email: utilisateur.email,
          adresse_ip: adresseIp,
          type_evenement: "activite_suspecte",
        },
      })
      .catch((error) =>
        console.error("[auth] journal d'activité suspecte échoué :", error),
      );

    await notifierActiviteSuspecte({ email: utilisateur.email, adresseIp }).catch(
      (error) => console.warn("[auth] alerte d'activité suspecte échouée :", error),
    );

    return NextResponse.json({ error: "trop_de_tentatives" }, { status: 429 });
  }

  if (resultat === "expire_ou_absent") {
    return NextResponse.json({ error: "code_expire" }, { status: 400 });
  }

  if (resultat === "invalide") {
    return NextResponse.json({ error: "code_invalide" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
