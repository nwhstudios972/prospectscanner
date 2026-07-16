"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProspectStatusBadge } from "@/components/ui/Badge";
import { ProspectStatusActions } from "@/components/ProspectStatusActions";
import type { StatutSuivi } from "@/types";

interface ProspectStatusPanelProps {
  prospectId: string;
  statutInitial: StatutSuivi;
  aSiteWeb: boolean;
  analyseCommerciale: string | null;
}

export function ProspectStatusPanel({
  prospectId,
  statutInitial,
  aSiteWeb,
  analyseCommerciale,
}: ProspectStatusPanelProps) {
  const [statut, setStatut] = useState(statutInitial);

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
