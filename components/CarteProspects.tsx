"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type { Priorite } from "@/types";

export interface ProspectLocalise {
  id: string;
  nom: string;
  ville: string;
  secteur: string;
  priorite: Priorite;
  latitude: number;
  longitude: number;
}

const COULEUR_PRIORITE: Record<Priorite, string> = {
  tres_elevee: "#00ff9d",
  elevee: "#00ff9d",
  moyenne: "#ff9d00",
  faible: "#ff3b5c",
};

export function CarteProspects({
  prospects,
}: {
  prospects: ProspectLocalise[];
}) {
  const router = useRouter();
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conteneurRef.current) return;

    let carte: import("leaflet").Map | undefined;
    let annule = false;

    import("leaflet").then((L) => {
      if (annule || !conteneurRef.current) return;

      carte = L.map(conteneurRef.current, {
        worldCopyJump: true,
      }).setView([20, 10], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(carte);

      const points: [number, number][] = [];

      for (const prospect of prospects) {
        const point: [number, number] = [
          prospect.latitude,
          prospect.longitude,
        ];
        points.push(point);

        const marqueur = L.circleMarker(point, {
          radius: 7,
          color: COULEUR_PRIORITE[prospect.priorite],
          fillColor: COULEUR_PRIORITE[prospect.priorite],
          fillOpacity: 0.75,
          weight: 1.5,
        }).addTo(carte!);

        marqueur.bindPopup(
          `<strong>${escapeHtml(prospect.nom)}</strong><br/>${escapeHtml(prospect.secteur)} · ${escapeHtml(prospect.ville)}`,
        );
        marqueur.on("click", () => {
          router.push(`/prospects/${prospect.id}`);
        });
      }

      if (points.length > 0) {
        carte.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
      }
    });

    return () => {
      annule = true;
      carte?.remove();
    };
  }, [prospects, router]);

  return (
    <div
      ref={conteneurRef}
      className="h-[70vh] w-full overflow-hidden rounded-lg border border-neon-green/20"
    />
  );
}

function escapeHtml(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
