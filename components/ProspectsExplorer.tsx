"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  ArrowUp,
  ArrowDown,
  Hash,
  Mail,
  MapPinned,
  EyeOff,
  Eye,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  PriorityBadge,
  ProspectStatusBadge,
  ScoreBadge,
  SegmentBadge,
  EntrepreneurIndividuelBadge,
} from "@/components/ui/Badge";
import { ProspectStatusActions } from "@/components/ProspectStatusActions";
import { ProspectHoverPreview } from "@/components/ProspectHoverPreview";
import type { ProspectWithEtablissement } from "@/lib/queries";
import type { Priorite, StatutSuivi, ProspectSegment } from "@/types";
import { downloadCsv, prospectsToCsv } from "@/lib/csv";
import { estEntrepreneurIndividuel, estGrosseEntreprise } from "@/lib/pipeline/sirene";
import { urlFicheGoogleMaps } from "@/lib/utils";

type SortKey = "score" | "nom" | "date" | "statut" | "metier" | "ville";
type SortDirection = "asc" | "desc";

const ORDRE_STATUT: Record<StatutSuivi, number> = {
  nouveau: 0,
  contacte: 1,
  sans_reponse: 2,
  en_negociation: 3,
  converti: 4,
  perdu: 5,
};

export function ProspectsExplorer({
  prospects: prospectsInitiaux,
}: {
  prospects: ProspectWithEtablissement[];
}) {
  const router = useRouter();
  const [prospects, setProspects] = useState(prospectsInitiaux);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priorite | "tous">(
    "tous",
  );
  const [statusFilter, setStatusFilter] = useState<StatutSuivi | "tous">(
    "tous",
  );
  const [metierFilter, setMetierFilter] = useState<string>("tous");
  const [segmentFilter, setSegmentFilter] = useState<ProspectSegment | "tous">("tous");
  const [entrepreneurIndividuelFilter, setEntrepreneurIndividuelFilter] =
    useState<"tous" | "oui" | "non">("tous");
  const [afficherRefuses, setAfficherRefuses] = useState(false);
  const [masquerGrossesEntreprises, setMasquerGrossesEntreprises] =
    useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const metiers = useMemo(
    () =>
      Array.from(
        new Set(prospects.map((p) => p.etablissement.secteur)),
      ).sort((a, b) => a.localeCompare(b)),
    [prospects],
  );

  function handleStatusChange(prospectId: string, statut: StatutSuivi) {
    setProspects((precedents) =>
      precedents.map((p) =>
        p.id === prospectId ? { ...p, statut_suivi: statut } : p,
      ),
    );
  }

  const filteredProspects = useMemo(() => {
    const comparerAsc = (
      a: ProspectWithEtablissement,
      b: ProspectWithEtablissement,
    ) => {
      switch (sortKey) {
        case "score":
          return a.score - b.score;
        case "nom":
          return a.etablissement.nom.localeCompare(b.etablissement.nom);
        case "statut":
          return ORDRE_STATUT[a.statut_suivi] - ORDRE_STATUT[b.statut_suivi];
        case "metier":
          return a.etablissement.secteur.localeCompare(
            b.etablissement.secteur,
          );
        case "ville":
          return a.etablissement.ville.localeCompare(b.etablissement.ville);
        case "date":
        default:
          return (
            new Date(a.date_calcul).getTime() -
            new Date(b.date_calcul).getTime()
          );
      }
    };

    return prospects
      .filter((p) => {
        const matchesSearch =
          search.trim() === "" ||
          p.etablissement.nom.toLowerCase().includes(search.toLowerCase()) ||
          p.etablissement.ville.toLowerCase().includes(search.toLowerCase());
        const matchesPriority =
          priorityFilter === "tous" || p.priorite === priorityFilter;
        const matchesStatus =
          statusFilter === "tous" || p.statut_suivi === statusFilter;
        const matchesMetier =
          metierFilter === "tous" || p.etablissement.secteur === metierFilter;
        const matchesSegment =
          segmentFilter === "tous" || p.segment === segmentFilter;
        const estEI = estEntrepreneurIndividuel(
          p.etablissement.nature_juridique,
        );
        const matchesEntrepreneurIndividuel =
          entrepreneurIndividuelFilter === "tous" ||
          (entrepreneurIndividuelFilter === "oui" ? estEI : !estEI);
        const matchesRefusVisibility =
          afficherRefuses ||
          statusFilter === "perdu" ||
          p.statut_suivi !== "perdu";
        const matchesTailleEntreprise =
          !masquerGrossesEntreprises ||
          !estGrosseEntreprise(p.etablissement.tranche_effectif_salarie);
        return (
          matchesSearch &&
          matchesPriority &&
          matchesStatus &&
          matchesMetier &&
          matchesSegment &&
          matchesEntrepreneurIndividuel &&
          matchesRefusVisibility &&
          matchesTailleEntreprise
        );
      })
      .sort((a, b) =>
        sortDirection === "asc" ? comparerAsc(a, b) : -comparerAsc(a, b),
      );
  }, [
    prospects,
    search,
    priorityFilter,
    statusFilter,
    metierFilter,
    segmentFilter,
    entrepreneurIndividuelFilter,
    afficherRefuses,
    masquerGrossesEntreprises,
    sortKey,
    sortDirection,
  ]);

  const nombreRefuses = useMemo(
    () => prospects.filter((p) => p.statut_suivi === "perdu").length,
    [prospects],
  );

  function handleExportCsv() {
    const csv = prospectsToCsv(filteredProspects);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `Fiche_utilisateur_psc_${date}.csv`);
  }

  function toggleSortDirection() {
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2">
            <Search className="h-4 w-4 text-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou ville..."
              className="w-full bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as Priorite | "tous")
            }
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground transition-colors hover:border-neon-green/40 focus:border-neon-green/60 focus:outline-none"
          >
            <option value="tous">Toutes priorités</option>
            <option value="tres_elevee">Très élevée</option>
            <option value="elevee">Élevée</option>
            <option value="moyenne">Moyenne</option>
            <option value="faible">Faible</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatutSuivi | "tous")
            }
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground transition-colors hover:border-neon-green/40 focus:border-neon-green/60 focus:outline-none"
          >
            <option value="tous">Tous statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="contacte">Contacté</option>
            <option value="sans_reponse">Pas de réponse</option>
            <option value="en_negociation">En négociation</option>
            <option value="converti">Converti</option>
            <option value="perdu">Perdu</option>
          </select>

          <select
            value={metierFilter}
            onChange={(e) => setMetierFilter(e.target.value)}
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground transition-colors hover:border-neon-green/40 focus:border-neon-green/60 focus:outline-none"
          >
            <option value="tous">Tous métiers</option>
            {metiers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={segmentFilter}
            onChange={(e) =>
              setSegmentFilter(e.target.value as ProspectSegment | "tous")
            }
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground transition-colors hover:border-neon-green/40 focus:border-neon-green/60 focus:outline-none"
          >
            <option value="tous">Tous segments</option>
            <option value="fort_potentiel">Fort potentiel</option>
            <option value="a_developper">À développer</option>
            <option value="stable">Stable</option>
            <option value="a_risque">À risque</option>
          </select>

          <select
            value={entrepreneurIndividuelFilter}
            onChange={(e) =>
              setEntrepreneurIndividuelFilter(
                e.target.value as "tous" | "oui" | "non",
              )
            }
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground transition-colors hover:border-neon-green/40 focus:border-neon-green/60 focus:outline-none"
          >
            <option value="tous">EI : tous</option>
            <option value="oui">EI uniquement</option>
            <option value="non">Hors EI</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground/70 transition-colors hover:border-neon-green/40">
            <input
              type="checkbox"
              checked={masquerGrossesEntreprises}
              onChange={(e) =>
                setMasquerGrossesEntreprises(e.target.checked)
              }
              className="accent-[#00ff9d]"
            />
            Masquer grosses entreprises (50+ sal.)
          </label>

          <div className="flex items-center gap-1">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-neon-cyan/20 bg-background px-3 py-2 font-sans text-sm text-foreground transition-colors hover:border-neon-cyan/40 focus:border-neon-cyan/60 focus:outline-none"
            >
              <option value="score">Trier par score</option>
              <option value="statut">Trier par statut</option>
              <option value="date">Trier par date</option>
              <option value="nom">Trier par nom</option>
              <option value="ville">Trier par ville</option>
            </select>
            <button
              type="button"
              onClick={toggleSortDirection}
              title={sortDirection === "asc" ? "Croissant" : "Décroissant"}
              className="flex items-center justify-center rounded-md border border-neon-cyan/20 bg-background p-2 text-foreground/60 hover:border-neon-cyan/60 hover:text-neon-cyan"
            >
              {sortDirection === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {nombreRefuses > 0 && (
            <Button
              variant="ghost"
              onClick={() => setAfficherRefuses((v) => !v)}
              title={
                afficherRefuses
                  ? "Masquer les prospects refusés"
                  : "Afficher les prospects refusés"
              }
            >
              {afficherRefuses ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              Refusés ({nombreRefuses})
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleExportCsv}
            disabled={filteredProspects.length === 0}
          >
            <Download className="h-4 w-4" />
            Exporter en CSV
          </Button>
        </div>
      </Card>

      {filteredProspects.length === 0 ? (
        <Card className="text-center text-sm text-foreground/40">
          Aucun prospect ne correspond à ces critères.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredProspects.map((prospect) => (
            <Card
              key={prospect.id}
              onClick={() => router.push(`/prospects/${prospect.id}`)}
              className="clickable group relative flex flex-col gap-3"
            >
              <ProspectHoverPreview prospect={prospect} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-sm font-medium text-foreground hover:text-neon-cyan">
                      {prospect.etablissement.nom}
                    </span>
                    <span className="font-mono text-xs text-foreground/40">
                      {prospect.id}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-foreground/50">
                    {prospect.etablissement.secteur} ·{" "}
                    {prospect.etablissement.ville}
                  </span>
                </Link>

                <div className="flex items-center gap-3">
                  {estEntrepreneurIndividuel(
                    prospect.etablissement.nature_juridique,
                  ) && <EntrepreneurIndividuelBadge />}
                  {prospect.segment && <SegmentBadge segment={prospect.segment} />}
                  {(() => {
                    const nombreOffresEmploi = prospect.etablissement.evenements.filter(
                      (e) => e.type === "recrutement",
                    ).length;
                    return (
                      nombreOffresEmploi > 0 && (
                        <span
                          title="Offres d'emploi actives (approx.)"
                          className="flex items-center gap-1 rounded-md border border-neon-orange/40 bg-neon-orange/10 px-2 py-0.5 font-mono text-xs text-neon-orange"
                        >
                          <Briefcase className="h-3.5 w-3.5" />
                          {nombreOffresEmploi}
                        </span>
                      )
                    );
                  })()}
                  <ProspectStatusBadge status={prospect.statut_suivi} />
                  <PriorityBadge priority={prospect.priorite} />
                  <ScoreBadge score={prospect.score} />
                </div>
              </div>

              {(prospect.etablissement.siret ||
                prospect.etablissement.email ||
                prospect.etablissement.google_place_id) && (
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-foreground/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {prospect.etablissement.siret && (
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      {prospect.etablissement.siret}
                    </span>
                  )}
                  {prospect.etablissement.email && (
                    <a
                      href={`mailto:${prospect.etablissement.email}`}
                      className="flex items-center gap-1 hover:text-neon-cyan hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {prospect.etablissement.email}
                    </a>
                  )}
                  {prospect.etablissement.google_place_id && (
                    <a
                      href={urlFicheGoogleMaps(
                        prospect.etablissement.google_place_id,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-neon-cyan hover:underline"
                    >
                      <MapPinned className="h-3.5 w-3.5" />
                      Fiche Google
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center border-t border-white/10 pt-3">
                <ProspectStatusActions
                  prospectId={prospect.id}
                  statutSuivi={prospect.statut_suivi}
                  onStatusChange={(statut) =>
                    handleStatusChange(prospect.id, statut)
                  }
                  size="sm"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
