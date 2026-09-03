"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ReenrichirButton({ prospectId }: { prospectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);

  function relancer() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/prospects/${prospectId}/enrichir`, {
          method: "POST",
        });

        if (!response.ok) {
          setFeedback("error");
          return;
        }

        setFeedback("success");
        router.refresh();
      } catch {
        setFeedback("error");
      } finally {
        setTimeout(() => setFeedback(null), 2500);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" disabled={isPending} onClick={relancer}>
        <RefreshCw className={isPending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {isPending ? "Ré-enrichissement..." : "Réenrichir"}
      </Button>
      {feedback === "success" && (
        <span className="font-mono text-xs text-neon-green">Données à jour ✓</span>
      )}
      {feedback === "error" && (
        <span className="font-mono text-xs text-neon-red">Échec du ré-enrichissement</span>
      )}
    </div>
  );
}
