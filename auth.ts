import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import {
  notifierConnexionReussie,
  notifierTentativeEchouee,
} from "@/lib/notifications/email";

// Verrouillage par inactivité : la session (JWT) expire 5 min après la
// dernière requête authentifiée. updateAge court = le cookie est réémis
// avec une nouvelle expiration à (quasi) chaque requête active, ce qui
// transforme le maxAge en fenêtre glissante d'inactivité plutôt qu'une
// durée de vie absolue depuis la connexion.
const DUREE_SESSION_SECONDES = 5 * 60;

function extraireAdresseIp(request: Request | undefined): string {
  if (!request) return "inconnue";
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "inconnue";
}

// Hash factice utilisé quand l'email n'existe pas, pour que bcrypt.compare
// s'exécute dans tous les cas et éviter une différence de timing qui
// révélerait si un compte existe.
const HASH_FACTICE = "$2b$12$C6UzMDM.H6dfI/f/IKcEeOWFbf0/j1KMxhP9UcpkK.EK4b1vSJ2Iy";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: DUREE_SESSION_SECONDES,
    updateAge: 30,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email;
        const password = credentials?.password;
        const adresseIp = extraireAdresseIp(request);

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const utilisateur = await prisma.utilisateur.findUnique({
          where: { email },
        });

        const motDePasseValide = await bcrypt.compare(
          password,
          utilisateur?.mot_de_passe_hash ?? HASH_FACTICE,
        );
        const connexionReussie =
          Boolean(utilisateur) && utilisateur!.actif && motDePasseValide;

        if (!connexionReussie || !utilisateur) {
          await notifierTentativeEchouee({ email, adresseIp }).catch((error) =>
            console.warn("[auth] notification d'échec de connexion :", error),
          );
          return null;
        }

        await prisma.journalConnexion
          .create({
            data: {
              utilisateur_id: utilisateur.id,
              email: utilisateur.email,
              adresse_ip: adresseIp,
            },
          })
          .catch((error) =>
            console.error("[auth] échec de l'enregistrement du journal de connexion :", error),
          );

        await notifierConnexionReussie({
          email: utilisateur.email,
          adresseIp,
        }).catch((error) =>
          console.warn("[auth] notification de connexion réussie échouée :", error),
        );

        return {
          id: utilisateur.id,
          email: utilisateur.email,
          est_admin: utilisateur.est_admin,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.est_admin = Boolean((user as { est_admin?: boolean }).est_admin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.est_admin = Boolean(token.est_admin);
      }
      return session;
    },
  },
  events: {
    // Filet de sécurité pour la déconnexion automatique par inactivité
    // (déclenchée côté client par InactivityGuard, qui appelle signOut()
    // directement sans passer par l'action `logout`). Si l'entrée du journal
    // a déjà été clôturée par une déconnexion manuelle, cette requête ne
    // trouve aucune ligne à mettre à jour (deconnecte_a déjà renseigné) et
    // ne fait rien.
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const utilisateurId = token?.id;
      if (!utilisateurId) return;

      await prisma.journalConnexion
        .updateMany({
          where: { utilisateur_id: utilisateurId, deconnecte_a: null },
          data: { deconnecte_a: new Date(), type_deconnexion: "inactivite" },
        })
        .catch((error) =>
          console.error("[auth] échec de clôture du journal (signOut) :", error),
        );
    },
  },
});
