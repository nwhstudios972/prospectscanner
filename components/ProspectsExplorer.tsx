"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  PriorityBadge,
  ProspectStatusBadge,
  ScoreBadge,
} from "@/components/ui/Badge";
import { ProspectStatusActions } from "@/components/ProspectStatusActions";
import { ProspectHoverPreview } from "@/components/ProspectHoverPreview";
import type { ProspectWithEtablissement } from "@/lib/queries";
import type { Priorite, StatutSuivi } from "@/types";
import { downloadCsv, prospectsToCsv } from "@/lib/csv";

type SortKey = "score" | "nom" | "date" | "statut";
type SortDirection = "asc" | "desc";

const ORDRE_STATUT: Record<StatutSuivi, number> = {
  nouveau: 0,
  contacte: 1,
  en_negociation: 2,
  converti: 3,
  perdu: 4,
};

export function ProspectsExplorer({
  prospects: prospectsInitiaux,
}: {
  prospects: ProspectWithEtablissement[];
}) {
  const [prospects, setProspects] = useState(prospectsInitiaux);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priorite | "tous">(
    "tous",
  );
  const [statusFilter, setStatusFilter] = useState<StatutSuivi | "tous">(
    "tous",
  );
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
        return matchesSearch && matchesPriority && matchesStatus;
      })
      .sort((a, b) =>
        sortDirection === "asc" ? comparerAsc(a, b) : -comparerAsc(a, b),
      );
  }, [prospects, search, priorityFilter, statusFilter, sortKey, sortDirection]);

  function handleExportCsv() {
    const csv = prospectsToCsv(filteredProspects);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `prospects_${date}.csv`);
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
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground focus:border-neon-green/60 focus:outline-none"
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
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-sans text-sm text-foreground focus:border-neon-green/60 focus:outline-none"
          >
            <option value="tous">Tous statuts</option>
            <option value="nouveau">Nouveau</option>
            <option value="contacte">Contacté</option>
            <option value="en_negociation">En négociation</option>
            <option value="converti">Converti</option>
            <option value="perdu">Perdu</option>
          </select>

          <div className="flex items-center gap-1">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-md border border-neon-cyan/20 bg-background px-3 py-2 font-sans text-sm text-foreground focus:border-neon-cyan/60 focus:outline-none"
            >
              <option value="score">Trier par score</option>
              <option value="statut">Trier par statut</option>
              <option value="date">Trier par date</option>
              <option value="nom">Trier par nom</option>
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
              className="group relative flex flex-col gap-3"
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
                  <ProspectStatusBadge status={prospect.statut_suivi} />
                  <PriorityBadge priority={prospect.priorite} />
                  <ScoreBadge score={prospect.score} />
                </div>
              </div>

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
