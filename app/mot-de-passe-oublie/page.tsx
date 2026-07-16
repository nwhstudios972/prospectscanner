"use client";

import { useState } from "react";
import Link from "next/link";
import { TerminalSquare, Mail, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function MotDePasseOublieePage() {
  const [etape, setEtape] = useState<"email" | "reinitialisation" | "termine">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function demanderCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setIsPending(true);
    try {
      await fetch("/api/mot-de-passe-oublie/demander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Réponse volontairement identique que le compte existe ou non.
      setEtape("reinitialisation");
    } finally {
      setIsPending(false);
    }
  }

  async function confirmerReinitialisation(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (nouveau !== confirmation) {
      setErreur("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setIsPending(true);
    try {
      const response = await fetch("/api/mot-de-passe-oublie/confirmer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          nouveau_mot_de_passe: nouveau,
          confirmation,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreur(
          data?.error === "code_invalide"
            ? "Code invalide ou expiré."
            : data?.error === "mot_de_passe_faible"
              ? data.message
              : data?.error === "confirmation_invalide"
                ? "La confirmation ne correspond pas au nouveau mot de passe."
                : "Échec de la réinitialisation.",
        );
        return;
      }

      setEtape("termine");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-neon-green/25 bg-panel p-8 shadow-[0_0_25px_0_rgba(0,255,157,0.08)]">
        <div className="mb-6 flex flex-col items-center gap-2">
          <TerminalSquare className="h-8 w-8 text-neon-green" />
          <h1 className="font-mono text-sm font-semibold tracking-widest text-neon-green text-glow-green">
            PROSPECTSCANNER
          </h1>
          <p className="font-sans text-xs text-foreground/40">
            Mot de passe oublié
          </p>
        </div>

        {etape === "email" && (
          <form onSubmit={demanderCode} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
              <Mail className="h-4 w-4 text-foreground/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full justify-center">
              {isPending ? "Envoi..." : "Recevoir un code par email"}
            </Button>
            <Link
              href="/login"
              className="text-center font-sans text-xs text-foreground/50 hover:text-foreground"
            >
              Retour à la connexion
            </Link>
          </form>
        )}

        {etape === "reinitialisation" && (
          <form onSubmit={confirmerReinitialisation} className="flex flex-col gap-4">
            <p className="font-sans text-xs text-foreground/50">
              Un code a été envoyé à {email} s&apos;il correspond à un compte
              existant. Il est valable 10 minutes.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
              <KeyRound className="h-4 w-4 text-foreground/40" />
              <input
                type="text"
                required
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code à 6 chiffres"
                className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
              <Lock className="h-4 w-4 text-foreground/40" />
              <input
                type="password"
                required
                minLength={10}
                value={nouveau}
                onChange={(e) => setNouveau(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
              <Lock className="h-4 w-4 text-foreground/40" />
              <input
                type="password"
                required
                minLength={10}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
              />
            </div>
            {erreur && (
              <p className="rounded-md border border-neon-red/40 bg-neon-red/10 px-3 py-2 font-sans text-xs text-neon-red">
                {erreur}
              </p>
            )}
            <Button type="submit" disabled={isPending} className="w-full justify-center">
              {isPending ? "Validation..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        )}

        {etape === "termine" && (
          <div className="flex flex-col gap-4">
            <p className="font-sans text-sm text-neon-green">
              Mot de passe réinitialisé avec succès.
            </p>
            <Link href="/login">
              <Button className="w-full justify-center">Se connecter</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
