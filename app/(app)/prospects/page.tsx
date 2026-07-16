import { PageHeader } from "@/components/PageHeader";
import { ProspectsExplorer } from "@/components/ProspectsExplorer";
import { getAllProspects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const prospects = await getAllProspects();

  return (
    <div>
      <PageHeader
        title="Prospects"
        subtitle={`${prospects.length} prospect(s) au total`}
      />
      <ProspectsExplorer prospects={prospects} />
    </div>
  );
}
