import { PageHeader } from "@/components/PageHeader";
import { CarteProspects, type ProspectLocalise } from "@/components/CarteProspects";
import { getAllProspects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CartePage() {
  const prospects = await getAllProspects();

  const prospectsLocalises: ProspectLocalise[] = prospects
    .filter(
      (p) =>
        p.statut_suivi !== "perdu" &&
        p.etablissement.latitude !== null &&
        p.etablissement.longitude !== null,
    )
    .map((p) => ({
      id: p.id,
      nom: p.etablissement.nom,
      ville: p.etablissement.ville,
      secteur: p.etablissement.secteur,
      priorite: p.priorite,
      latitude: p.etablissement.latitude as number,
      longitude: p.etablissement.longitude as number,
    }));

  return (
    <div>
      <PageHeader
        title="Carte des prospects"
        subtitle={`${prospectsLocalises.length} prospect(s) géolocalisé(s) sur ${prospects.length} au total`}
      />
      <CarteProspects prospects={prospectsLocalises} />
    </div>
  );
}
