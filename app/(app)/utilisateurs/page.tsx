import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { UtilisateursManager } from "@/components/UtilisateursManager";
import { getUtilisateurs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UtilisateursPage() {
  const session = await auth();
  if (!session?.user?.est_admin) {
    redirect("/dashboard");
  }

  const utilisateurs = await getUtilisateurs();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des comptes ayant accès à ProspectScanner"
      />
      <UtilisateursManager
        utilisateursInitiaux={utilisateurs}
        idUtilisateurCourant={session.user.id}
      />
    </div>
  );
}
