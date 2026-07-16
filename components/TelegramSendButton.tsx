"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { envoyerFicheTelegram } from "@/lib/actions/telegram";

export function TelegramSendButton({ prospectId }: { prospectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | undefined>();

  function handleClick() {
    startTransition(async () => {
      const result = await envoyerFicheTelegram(prospectId);
      setStatus(result.success ? "success" : "error");
      setErrorDetail(result.error);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" onClick={handleClick} disabled={isPending}>
        <Send className="h-4 w-4" />
        {isPending ? "Envoi..." : "Envoyer sur Telegram"}
      </Button>
      {status === "success" && (
        <span className="font-mono text-xs text-neon-green">Envoyé ✓</span>
      )}
      {status === "error" && (
        <span className="font-mono text-xs text-neon-red">
          {errorDetail === "missing_config"
            ? "Bot Telegram non configuré (voir /paramètres)"
            : "Échec de l'envoi"}
        </span>
      )}
    </div>
  );
}
