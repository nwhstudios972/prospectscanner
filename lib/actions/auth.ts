"use server";

import { AuthError } from "next-auth";
import { signIn, signOut, auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard?bienvenue=1",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email ou mot de passe incorrect.";
    }
    throw error;
  }
}

export async function logout() {
  const session = await auth();
  if (session?.user?.id) {
    await prisma.journalConnexion
      .updateMany({
        where: { utilisateur_id: session.user.id, deconnecte_a: null },
        data: { deconnecte_a: new Date(), type_deconnexion: "manuelle" },
      })
      .catch((error) =>
        console.error("[auth] échec de clôture du journal (logout manuel) :", error),
      );
  }

  await signOut({ redirectTo: "/login" });
}
