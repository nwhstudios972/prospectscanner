"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { StatutScan } from "@/types";

const INTERVALLE_MS = 2500;

// Recharge périodiquement les données serveur de la page tant que le scan
// n'est pas terminé — pas besoin d'un flux temps réel (SSE/WebSocket) pour
// un scan qui dure quelques dizaines de secondes à quelques minutes.
export function ScanAutoRefresh({ statut }: { statut: StatutScan }) {
  const router = useRouter();
  const actif = statut === "en_attente" || statut === "en_cours";

  useEffect(() => {
    if (!actif) return;
    const intervalId = setInterval(() => router.refresh(), INTERVALLE_MS);
    return () => clearInterval(intervalId);
  }, [actif, router]);

  return null;
}
