import type { ProspectWithEtablissement } from "@/lib/queries";

function escapeCsvField(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function prospectsToCsv(prospects: ProspectWithEtablissement[]): string {
  const header = [
    "nom",
    "ville",
    "telephone",
    "email",
    "siret",
    "score",
    "priorite",
    "statut_suivi",
    "plateformes_trouvees",
    "a_site_web",
  ];

  const rows = prospects.map((prospect) => {
    const plateformesTrouvees = prospect.etablissement.presences
      .filter((presence) => presence.trouve)
      .map((presence) => presence.plateforme)
      .join(" | ");

    return [
      prospect.etablissement.nom,
      prospect.etablissement.ville,
      prospect.etablissement.telephone ?? "",
      prospect.etablissement.email ?? "",
      prospect.etablissement.siret ?? "",
      String(prospect.score),
      prospect.priorite,
      prospect.statut_suivi,
      plateformesTrouvees,
      prospect.a_site_web ? "oui" : "non",
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
