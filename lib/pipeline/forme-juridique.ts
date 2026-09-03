// Nomenclature INSEE des catégories juridiques (niveau 3, code sur 4 chiffres).
// On ne couvre que les formes réellement rencontrées en prospection PME/TPE ;
// le reste retombe sur une estimation par préfixe, elle-même repliée sur un
// libellé générique plutôt que d'inventer une forme juridique précise.
const CODES_EXACTS: Record<string, string> = {
  "5202": "Société en nom collectif (SNC)",
  "5203": "Société en nom collectif (SNC)",
  "5306": "Société en commandite simple",
  "5307": "Société en commandite simple",
  "5308": "Société en commandite simple",
  "5385": "Société en commandite par actions",
  "5410": "Société à responsabilité limitée (SARL)",
  "5415": "SARL coopérative",
  "5422": "Entreprise unipersonnelle à responsabilité limitée (EURL)",
  "5498": "Société à responsabilité limitée (SARL)",
  "5499": "Société à responsabilité limitée (SARL)",
  "5505": "Société anonyme (SA) à conseil d'administration",
  "5599": "Société anonyme (SA)",
  "5610": "Société anonyme (SA) à directoire",
  "5699": "Société anonyme (SA)",
  "5710": "Société par actions simplifiée (SAS)",
  "5720": "Société par actions simplifiée unipersonnelle (SASU)",
  "5800": "Société européenne",
  "6100": "Société civile immobilière (SCI)",
  "6316": "Société coopérative de production (SCOP)",
  "9220": "Association déclarée",
  "9221": "Association déclarée d'insertion par l'économique",
  "9260": "Association reconnue d'utilité publique",
};

export function libelleFormeJuridique(natureJuridique: string | null): string | null {
  if (!natureJuridique) return null;

  const exact = CODES_EXACTS[natureJuridique];
  if (exact) return exact;

  if (natureJuridique.startsWith("1")) return "Entrepreneur individuel";
  if (natureJuridique.startsWith("54")) return "Société à responsabilité limitée (SARL)";
  if (natureJuridique.startsWith("55") || natureJuridique.startsWith("56"))
    return "Société anonyme (SA)";
  if (natureJuridique.startsWith("57")) return "Société par actions simplifiée (SAS)";
  if (natureJuridique.startsWith("92") || natureJuridique.startsWith("93"))
    return "Association";

  return "Autre forme juridique";
}
