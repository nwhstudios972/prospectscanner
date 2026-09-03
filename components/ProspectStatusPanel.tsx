"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProspectStatusBadge } from "@/components/ui/Badge";
import { ProspectStatusActions } from "@/components/ProspectStatusActions";
import type { StatutSuivi } from "@/types";

interface ScoresDetailles {
  scoreCroissance: number | null;
  scoreDigital: number | null;
  scoreTechnologique: number | null;
  scoreRecrutement: number | null;
  scoreIntention: number | null;
}

interface ProspectStatusPanelProps {
  prospectId: string;
  statutInitial: StatutSuivi;
  aSiteWeb: boolean;
  analyseCommerciale: string | null;
  scoresDetailles?: ScoresDetailles;
}

const LABELS_SCORE: Record<keyof ScoresDetailles, string> = {
  scoreCroissance: "Croissance",
  scoreDigital: "Digital",
  scoreTechnologique: "Technologique",
  scoreRecrutement: "Recrutement",
  scoreIntention: "Intention",
};

export function ProspectStatusPanel({
  prospectId,
  statutInitial,
  aSiteWeb,
  analyseCommerciale,
  scoresDetailles,
}: ProspectStatusPanelProps) {
  const [statut, setStatut] = useState(statutInitial);

  const scoresRenseignes = scoresDetailles
    ? (Object.keys(LABELS_SCORE) as (keyof ScoresDetailles)[]).filter(
        (cle) => scoresDetailles[cle] !== null,
      )
    : [];

  return (
    <Card variant="green" className="flex flex-col gap-3 md:col-span-2">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
          Statut
        </span>
        <ProspectStatusBadge status={statut} />
      </div>
      <div className="flex items-center gap-2 text-sm text-foreground/70">
        <Globe2 className="h-4 w-4 text-neon-red" />
        {aSiteWeb ? "Site web détecté" : "Aucun site web détecté"}
      </div>
      {analyseCommerciale && (
        <p className="border-t border-white/10 pt-3 text-sm text-foreground/70">
          {analyseCommerciale}
        </p>
      )}
      {scoresRenseignes.length > 0 && (
        <div className="flex flex-wrap gap-4 border-t border-white/10 pt-3">
          {scoresRenseignes.map((cle) => (
            <div key={cle} className="flex flex-col">
              <span className="text-xs text-foreground/40">{LABELS_SCORE[cle]}</span>
              <span className="font-mono text-sm text-foreground/80">
                {scoresDetailles![cle]}/100
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
        <ProspectStatusActions
          prospectId={prospectId}
          statutSuivi={statut}
          onStatusChange={setStatut}
        />
      </div>
    </Card>
  );
}
