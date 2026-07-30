"use client";

import { useState } from "react";
import Link from "next/link";
import { TerminalSquare, Lock, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authenticate } from "@/lib/actions/auth";

type Etape = "identifiants" | "code";

export default function LoginPage() {
  const [etape, setEtape] = useState<Etape>("identifiants");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [messageInfo, setMessageInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function soumettreIdentifiants(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessageInfo(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/verifier-identifiants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreur(
          data?.error === "trop_de_tentatives"
            ? "Trop de tentatives récentes. Réessayez dans quelques minutes."
            : "Email ou mot de passe incorrect.",
        );
        return;
      }

      setCode("");
      setEtape("code");
      setMessageInfo(`Un code de vérification a été envoyé à ${email}.`);
    } catch {
      setErreur("Erreur réseau. Réessayez.");
    } finally {
      setIsPending(false);
    }
  }

  async function renvoyerCode() {
    setErreur(null);
    setMessageInfo(null);
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/verifier-identifiants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreur(
          data?.error === "trop_de_tentatives"
            ? "Trop de tentatives récentes. Réessayez dans quelques minutes."
            : "Impossible de renvoyer un code. Reconnectez-vous.",
        );
        return;
      }

      setCode("");
      setMessageInfo(`Nouveau code envoyé à ${email}.`);
    } catch {
      setErreur("Erreur réseau. Réessayez.");
    } finally {
      setIsPending(false);
    }
  }

  async function soumettreCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessageInfo(null);
    setIsPending(true);
    try {
      // Le code est vérifié atomiquement côté serveur au moment où la
      // session est créée. Une requête directe à NextAuth ne peut donc pas
      // contourner cette seconde étape.
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("code", code);
      const erreurFinale = await authenticate(undefined, formData);
      if (erreurFinale) {
        setErreur(erreurFinale);
      }
    } catch {
      setErreur("Erreur réseau. Réessayez.");
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
            {etape === "identifiants"
              ? "Accès restreint — instance personnelle"
              : "Vérification en deux étapes"}
          </p>
        </div>

        {etape === "identifiants" && (
          <form onSubmit={soumettreIdentifiants} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-wider text-foreground/50">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
                <Mail className="h-4 w-4 text-foreground/40" />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-xs uppercase tracking-wider text-foreground/50">
                Mot de passe
              </label>
              <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
                <Lock className="h-4 w-4 text-foreground/40" />
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
                />
              </div>
            </div>

            {erreur && (
              <p className="rounded-md border border-neon-red/40 bg-neon-red/10 px-3 py-2 font-sans text-xs text-neon-red">
                {erreur}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 w-full justify-center"
            >
              {isPending ? "Vérification..." : "Se connecter"}
            </Button>

            <Link
              href="/mot-de-passe-oublie"
              className="text-center font-sans text-xs text-foreground/50 hover:text-foreground"
            >
              Mot de passe oublié ?
            </Link>
          </form>
        )}

        {etape === "code" && (
          <form onSubmit={soumettreCode} className="flex flex-col gap-4">
            <p className="font-sans text-xs text-foreground/50">
              Un code à 6 chiffres a été envoyé à <span className="text-foreground/80">{email}</span>.
              Il est valable 5 minutes.
            </p>

            <div className="flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
              <KeyRound className="h-4 w-4 text-foreground/40" />
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Code à 6 chiffres"
                className="w-full bg-transparent font-mono text-sm tracking-[0.3em] text-foreground placeholder:text-foreground/30 placeholder:tracking-normal focus:outline-none"
              />
            </div>

            {messageInfo && (
              <p className="rounded-md border border-neon-cyan/30 bg-neon-cyan/5 px-3 py-2 font-sans text-xs text-neon-cyan">
                {messageInfo}
              </p>
            )}
            {erreur && (
              <p className="rounded-md border border-neon-red/40 bg-neon-red/10 px-3 py-2 font-sans text-xs text-neon-red">
                {erreur}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending || code.length !== 6}
              className="w-full justify-center"
            >
              {isPending ? "Validation..." : "Valider le code"}
            </Button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setEtape("identifiants");
                  setErreur(null);
                  setMessageInfo(null);
                }}
                className="font-sans text-xs text-foreground/50 hover:text-foreground"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={renvoyerCode}
                disabled={isPending}
                className="font-sans text-xs text-neon-cyan hover:text-glow-cyan disabled:opacity-40"
              >
                Renvoyer un code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
