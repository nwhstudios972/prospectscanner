"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ChangerMotDePasseForm() {
  const [etape, setEtape] = useState<"formulaire" | "code">("formulaire");
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [isPending, startTransition] = useTransition();

  function demanderCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (nouveau !== confirmation) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/compte/mot-de-passe/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ancien_mot_de_passe: ancien }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreur(
          data?.error === "ancien_mot_de_passe_incorrect"
            ? "Ancien mot de passe incorrect."
            : "Échec de l'envoi du code.",
        );
        return;
      }

      setEtape("code");
    });
  }

  function confirmerChangement(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);

    startTransition(async () => {
      const response = await fetch("/api/compte/mot-de-passe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ancien_mot_de_passe: ancien,
          nouveau_mot_de_passe: nouveau,
          confirmation,
          code,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreur(
          data?.error === "ancien_mot_de_passe_incorrect"
            ? "Ancien mot de passe incorrect."
            : data?.error === "code_invalide"
              ? "Code invalide ou expiré."
              : data?.error === "mot_de_passe_faible"
                ? data.message
                : data?.error === "confirmation_invalide"
                  ? "La confirmation ne correspond pas au nouveau mot de passe."
                  : "Échec du changement de mot de passe.",
        );
        return;
      }

      setSucces(true);
      setAncien("");
      setNouveau("");
      setConfirmation("");
      setCode("");
      setEtape("formulaire");
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-neon-green" />
        <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
          Sécurité du compte
        </span>
      </div>

      {etape === "formulaire" && (
        <form onSubmit={demanderCode} className="flex flex-col gap-3">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={ancien}
            onChange={(e) => setAncien(e.target.value)}
            placeholder="Mot de passe actuel"
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            placeholder="Nouveau mot de passe (10 car. min., majuscules + minuscules + chiffres)"
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Confirmer le nouveau mot de passe"
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
          />

          {erreur && <p className="font-mono text-xs text-neon-red">{erreur}</p>}

          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? "Envoi..." : "Recevoir le code de confirmation"}
          </Button>
        </form>
      )}

      {etape === "code" && (
        <form onSubmit={confirmerChangement} className="flex flex-col gap-3">
          <p className="font-mono text-xs text-foreground/50">
            Un code a été envoyé à votre adresse email. Il est valable 10 minutes.
          </p>
          <input
            type="text"
            required
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
          />

          {erreur && <p className="font-mono text-xs text-neon-red">{erreur}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="self-start">
              {isPending ? "Validation..." : "Confirmer le changement"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              className="self-start"
              onClick={() => {
                setEtape("formulaire");
                setCode("");
                setErreur(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}

      {succes && (
        <p className="font-mono text-xs text-neon-green">
          Mot de passe mis à jour. Un email de confirmation vous a été envoyé.
        </p>
      )}
    </Card>
  );
}
