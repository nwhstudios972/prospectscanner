import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { JournalConnexionsTable } from "@/components/JournalConnexionsTable";
import { getJournalConnexions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SecuritePage() {
  const session = await auth();
  if (!session?.user?.est_admin) {
    redirect("/dashboard");
  }

  const entrees = await getJournalConnexions();

  return (
    <div>
      <PageHeader
        title="Sécurité"
        subtitle="Journal des connexions à ProspectScanner"
      />
      <JournalConnexionsTable entrees={entrees} />
    </div>
  );
}
