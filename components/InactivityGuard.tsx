"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const DELAI_INACTIVITE_MS = 5 * 60 * 1000;
const EVENEMENTS_ACTIVITE = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

// Verrouillage par inactivité côté client : en complément du maxAge court
// de la session NextAuth (qui invalide le cookie côté serveur), on déconnecte
// proactivement l'utilisateur dès 5 min sans interaction, sans attendre
// qu'il déclenche une requête qui échouerait silencieusement.
export function InactivityGuard() {
  const minuteurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reinitialiserMinuteur() {
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
      minuteurRef.current = setTimeout(() => {
        void signOut({ callbackUrl: "/login" });
      }, DELAI_INACTIVITE_MS);
    }

    reinitialiserMinuteur();
    EVENEMENTS_ACTIVITE.forEach((evenement) =>
      window.addEventListener(evenement, reinitialiserMinuteur, { passive: true }),
    );

    return () => {
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
      EVENEMENTS_ACTIVITE.forEach((evenement) =>
        window.removeEventListener(evenement, reinitialiserMinuteur),
      );
    };
  }, []);

  return null;
}
