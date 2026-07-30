"use client";

import { useState, useTransition } from "react";
import { Check, X, Clock, MailQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { StatutSuivi } from "@/types";

const CIBLE_VALIDER: StatutSuivi = "converti";
const CIBLE_NON_CONCLUANT: StatutSuivi = "perdu";
const CIBLE_EN_ATTENTE: StatutSuivi = "en_negociation";
const CIBLE_SANS_REPONSE: StatutSuivi = "sans_reponse";

interface ProspectStatusActionsProps {
  prospectId: string;
  statutSuivi: StatutSuivi;
  onStatusChange: (statut: StatutSuivi) => void;
  size?: "sm" | "md";
}

export function ProspectStatusActions({
  prospectId,
  statutSuivi,
  onStatusChange,
  size = "md",
}: ProspectStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [pendingCible, setPendingCible] = useState<StatutSuivi | null>(null);

  function appliquerStatut(cible: StatutSuivi) {
    setPendingCible(cible);
    setFeedback(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/prospects/${prospectId}/statut`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut_suivi: cible }),
        });

        if (!response.ok) {
          setFeedback("error");
          return;
        }

        onStatusChange(cible);
        setFeedback("success");
      } catch {
        setFeedback("error");
      } finally {
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="primary"
        size={size}
        disabled={isPending || statutSuivi === CIBLE_VALIDER}
        onClick={() => appliquerStatut(CIBLE_VALIDER)}
      >
        <Check className="h-3.5 w-3.5" />
        {isPending && pendingCible === CIBLE_VALIDER ? "..." : "Valider"}
      </Button>
      <Button
        variant="secondary"
        size={size}
        disabled={isPending || statutSuivi === CIBLE_EN_ATTENTE}
        onClick={() => appliquerStatut(CIBLE_EN_ATTENTE)}
      >
        <Clock className="h-3.5 w-3.5" />
        {isPending && pendingCible === CIBLE_EN_ATTENTE ? "..." : "Mettre en attente"}
      </Button>
      <Button
        variant="secondary"
        size={size}
        disabled={isPending || statutSuivi === CIBLE_SANS_REPONSE}
        onClick={() => appliquerStatut(CIBLE_SANS_REPONSE)}
      >
        <MailQuestion className="h-3.5 w-3.5" />
        {isPending && pendingCible === CIBLE_SANS_REPONSE ? "..." : "Pas de réponse"}
      </Button>
      <Button
        variant="danger"
        size={size}
        disabled={isPending || statutSuivi === CIBLE_NON_CONCLUANT}
        onClick={() => appliquerStatut(CIBLE_NON_CONCLUANT)}
      >
        <X className="h-3.5 w-3.5" />
        {isPending && pendingCible === CIBLE_NON_CONCLUANT ? "..." : "Non concluant"}
      </Button>
      {feedback === "success" && (
        <span className="font-mono text-xs text-neon-green">Statut mis à jour ✓</span>
      )}
      {feedback === "error" && (
        <span className="font-mono text-xs text-neon-red">Échec de la mise à jour</span>
      )}
    </div>
  );
}
