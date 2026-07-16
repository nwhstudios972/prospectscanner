import Link from "next/link";
import { Radar, Users, Activity, Target, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { getDashboardStats, getRecentScans } from "@/lib/queries";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenue?: string }>;
}) {
  const [{ bienvenue }, session, stats, recentScans] = await Promise.all([
    searchParams,
    auth(),
    getDashboardStats(),
    getRecentScans(),
  ]);

  return (
    <div>
      {bienvenue === "1" && session?.user?.email && (
        <WelcomeBanner email={session.user.email} />
      )}
      <PageHeader
        title="Dashboard"
        subtitle="Vue d'ensemble de vos scans et prospects"
        action={
          <LinkButton href="/scan/nouveau" variant="primary">
            <Plus className="h-4 w-4" />
            Nouveau scan
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Scans au total"
          value={stats.totalScans}
          icon={Radar}
          accent="green"
        />
        <StatCard
          label="Scans en cours"
          value={stats.scansEnCours}
          icon={Activity}
          accent="cyan"
          hint={stats.scansEnCours > 0 ? "Analyse en temps réel" : undefined}
        />
        <StatCard
          label="Prospects collectés"
          value={stats.totalProspects}
          icon={Users}
          accent="green"
        />
        <StatCard
          label="Prospects excellents"
          value={stats.prospectsExcellents}
          icon={Target}
          accent="orange"
        />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-lg font-semibold text-foreground">
            Scans récents
          </h2>
          <Link
            href="/prospects"
            className="font-sans text-xs text-neon-cyan hover:text-glow-cyan"
          >
            Voir tous les prospects →
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <Card className="text-center text-sm text-foreground/40">
            Aucun scan pour l&apos;instant.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {recentScans.map((scan) => (
              <Link key={scan.id} href={`/scan/${scan.id}`}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-sm font-medium text-foreground">
                        {scan.secteur}
                      </span>
                      <span className="font-mono text-xs text-foreground/40">
                        {scan.id}
                      </span>
                    </div>
                    <span className="font-sans text-xs text-foreground/50">
                      {scan.ville} · rayon {scan.rayon_km} km
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-foreground/50">
                      {scan.nombre_prospects_qualifies} prospect(s)
                    </span>
                    <ScanStatusBadge status={scan.statut} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
