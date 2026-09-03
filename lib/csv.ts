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

// Sépare plusieurs valeurs à l'intérieur d'une même colonne CSV — le
// séparateur de colonnes du fichier est ";", donc on ne peut pas réutiliser
// la virgule ni le point-virgule ici.
const SEPARATEUR_INTRA_CHAMP = " | ";

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
    "forme_juridique",
    "nom_commercial",
    "date_creation_entreprise",
    "categorie_entreprise",
    "tva_intracommunautaire",
    "nombre_etablissements",
    "note_google",
    "nombre_avis_google",
    "a_site_web",
    "statut_suivi",
    "acceptation_client",
    "lien_fiche_google",
    "dirigeant_principal_nom",
    "dirigeant_principal_qualite",
    "annee_dernier_exercice",
    "chiffre_affaires_dernier_exercice",
    "resultat_net_dernier_exercice",
    "technologies_detectees",
    "offres_emploi_actives_approx",
    "score_performance_web",
    "score_seo_web",
    "score_anciennete_domaine_approx",
    "nombre_produits_catalogue",
    "echantillon_catalogue",
    "derniers_signaux_business",
    "score_croissance",
    "score_digital",
    "score_technologique",
    "score_recrutement",
    "score_intention",
    "segment",
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

    const dirigeantPrincipal =
      etablissement.dirigeants.find((d) => d.type_dirigeant === "personne physique") ??
      etablissement.dirigeants[0];

    const dernierExercice = etablissement.donneesFinancieres[0];

    const technologies = etablissement.technologies.map((t) => t.nom).join(SEPARATEUR_INTRA_CHAMP);

    const derniersSignaux = etablissement.evenements
      .slice(0, 3)
      .map((e) => `${e.titre} (${e.date_evenement.toISOString().slice(0, 10)})`)
      .join(SEPARATEUR_INTRA_CHAMP);

    const nombreOffresEmploi = etablissement.evenements.filter(
      (e) => e.type === "recrutement",
    ).length;

    const echantillonCatalogue = etablissement.produitsEcommerce
      .slice(0, 5)
      .map((p) => (p.prix !== null ? `${p.nom} (${p.prix}${p.devise ? ` ${p.devise}` : ""})` : p.nom))
      .join(SEPARATEUR_INTRA_CHAMP);

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
      etablissement.forme_juridique ?? "",
      etablissement.nom_commercial ?? "",
      etablissement.date_creation_entreprise
        ? etablissement.date_creation_entreprise.toISOString().slice(0, 10)
        : "",
      etablissement.categorie_entreprise ?? "",
      etablissement.tva_intracommunautaire ?? "",
      etablissement.nombre_etablissements !== null &&
      etablissement.nombre_etablissements !== undefined
        ? String(etablissement.nombre_etablissements)
        : "",
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
      dirigeantPrincipal
        ? [dirigeantPrincipal.prenoms, dirigeantPrincipal.nom].filter(Boolean).join(" ") ||
          dirigeantPrincipal.denomination ||
          ""
        : "",
      dirigeantPrincipal?.qualite ?? "",
      dernierExercice?.annee ?? "",
      dernierExercice?.chiffre_affaires !== null && dernierExercice?.chiffre_affaires !== undefined
        ? String(dernierExercice.chiffre_affaires)
        : "",
      dernierExercice?.resultat_net !== null && dernierExercice?.resultat_net !== undefined
        ? String(dernierExercice.resultat_net)
        : "",
      technologies,
      String(nombreOffresEmploi),
      etablissement.score_performance_web !== null &&
      etablissement.score_performance_web !== undefined
        ? String(etablissement.score_performance_web)
        : "",
      etablissement.score_seo_web !== null && etablissement.score_seo_web !== undefined
        ? String(etablissement.score_seo_web)
        : "",
      etablissement.score_autorite_domaine !== null &&
      etablissement.score_autorite_domaine !== undefined
        ? String(etablissement.score_autorite_domaine)
        : "",
      String(etablissement.produitsEcommerce.length),
      echantillonCatalogue,
      derniersSignaux,
      prospect.score_croissance !== null && prospect.score_croissance !== undefined
        ? String(prospect.score_croissance)
        : "",
      prospect.score_digital !== null && prospect.score_digital !== undefined
        ? String(prospect.score_digital)
        : "",
      prospect.score_technologique !== null && prospect.score_technologique !== undefined
        ? String(prospect.score_technologique)
        : "",
      prospect.score_recrutement !== null && prospect.score_recrutement !== undefined
        ? String(prospect.score_recrutement)
        : "",
      prospect.score_intention !== null && prospect.score_intention !== undefined
        ? String(prospect.score_intention)
        : "",
      prospect.segment ?? "",
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
