import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Radius, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { ScanStatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { ScanAutoRefresh } from "@/components/ScanAutoRefresh";
import { getScanDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = await getScanDetail(id);

  if (!scan) {
    notFound();
  }

  const prospects = scan.etablissements
    .filter((etablissement) => etablissement.prospect)
    .map((etablissement) => ({ etablissement, prospect: etablissement.prospect! }))
    .sort((a, b) => b.prospect.score - a.prospect.score);

  const progress =
    scan.statut === "termine" || scan.statut === "erreur"
      ? 100
      : scan.nombre_etablissements_trouves > 0
        ? Math.round(
            (scan.etablissements.length / scan.nombre_etablissements_trouves) * 100,
          )
        : 0;

  return (
    <div>
      <ScanAutoRefresh statut={scan.statut} />

      <PageHeader
        title={scan.secteur}
        subtitle={`Scan ${scan.id}`}
        action={<ScanStatusBadge status={scan.statut} />}
      />

      <Card variant="cyan" className="mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <MapPin className="h-4 w-4 text-neon-cyan" />
            {scan.ville}
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Radius className="h-4 w-4 text-neon-cyan" />
            {scan.rayon_km} km
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-xs text-foreground/50">
              {scan.etablissements.length} analysés
            </span>
            <span className="font-mono text-xs text-neon-green">
              {scan.nombre_prospects_qualifies} prospects trouvés
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-neon-cyan transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-foreground/40">
            <span>
              {scan.statut === "en_attente"
                ? "En attente de démarrage"
                : "Progression"}
            </span>
            <span>{progress}%</span>
          </div>
        </div>

        {scan.statut === "erreur" && scan.erreur_message && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {scan.erreur_message}
          </div>
        )}
      </Card>

      <h2 className="mb-4 font-sans text-lg font-semibold text-foreground">
        Résultats{" "}
        {scan.statut === "en_cours" && (
          <span className="ml-2 font-mono text-xs text-neon-cyan animate-scan-pulse">
            live
          </span>
        )}
      </h2>

      {prospects.length === 0 ? (
        <Card className="text-center text-sm text-foreground/40">
          Aucun prospect détecté pour l&apos;instant.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {prospects.map(({ etablissement, prospect }) => (
            <Link key={prospect.id} href={`/prospects/${prospect.id}`}>
              <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-sm font-medium text-foreground">
                    {etablissement.nom}
                  </span>
                  <span className="font-sans text-xs text-foreground/50">
                    {etablissement.secteur} · {etablissement.ville}
                  </span>
                </div>
                <ScoreBadge score={prospect.score} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
