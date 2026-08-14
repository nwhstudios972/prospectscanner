import type { ProspectWithEtablissement } from "@/lib/queries";
import type { Plateforme } from "@/lib/generated/prisma/enums";
import { urlFicheGoogleMaps } from "@/lib/utils";

function escapeCsvField(value: string): string {
  const safeValue = /^[=+\-@\t]/.test(value) ? `'${value}` : value;
  if (/[",\n;]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

const PLATEFORMES_LABELS: Record<Plateforme, string> = {
  facebook: "lien_facebook",
  instagram: "lien_instagram",
  tiktok: "lien_tiktok",
  linkedin: "lien_linkedin",
  youtube: "lien_youtube",
  x: "lien_x",
  pagesjaunes: "lien_pagesjaunes",
  booking: "lien_booking",
  tripadvisor: "lien_tripadvisor",
  airbnb: "lien_airbnb",
  site_web: "lien_site_web",
};

const ORDRE_PLATEFORMES = Object.keys(PLATEFORMES_LABELS) as Plateforme[];

export function prospectsToCsv(prospects: ProspectWithEtablissement[]): string {
  const header = [
    "nom",
    "secteur",
    "ville",
    "adresse",
    "telephone",
    "email",
    "siret",
    "statut_siret",
    "nature_juridique",
    "note_google",
    "nombre_avis_google",
    "a_site_web",
    "statut_suivi",
    "acceptation_client",
    "lien_fiche_google",
    ...ORDRE_PLATEFORMES.map((plateforme) => PLATEFORMES_LABELS[plateforme]),
  ];

  const rows = prospects.map((prospect) => {
    const { etablissement } = prospect;

    const liensParPlateforme = ORDRE_PLATEFORMES.map((plateforme) => {
      const presence = etablissement.presences.find(
        (p) => p.plateforme === plateforme,
      );
      return presence?.trouve && presence.url ? presence.url : "";
    });

    return [
      etablissement.nom,
      etablissement.secteur,
      etablissement.ville,
      etablissement.adresse,
      etablissement.telephone ?? "",
      etablissement.email ?? "",
      etablissement.siret ?? "",
      etablissement.statut_siret ?? "",
      etablissement.nature_juridique ?? "",
      etablissement.note_google !== null && etablissement.note_google !== undefined
        ? String(etablissement.note_google)
        : "",
      etablissement.nombre_avis_google !== null &&
      etablissement.nombre_avis_google !== undefined
        ? String(etablissement.nombre_avis_google)
        : "",
      prospect.a_site_web ? "oui" : "non",
      prospect.statut_suivi,
      "oui",
      etablissement.google_place_id
        ? urlFicheGoogleMaps(etablissement.google_place_id)
        : "",
      ...liensParPlateforme,
    ]
      .map(escapeCsvField)
      .join(";");
  });

  return [header.join(";"), ...rows].join("\n");
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([`﻿${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
