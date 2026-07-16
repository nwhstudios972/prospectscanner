"use client";

import { useState, useTransition } from "react";
import { UserPlus, ShieldCheck, Ban, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Utilisateur {
  id: string;
  email: string;
  est_admin: boolean;
  actif: boolean;
  date_creation: Date;
}

export function UtilisateursManager({
  utilisateursInitiaux,
  idUtilisateurCourant,
}: {
  utilisateursInitiaux: Utilisateur[];
  idUtilisateurCourant: string;
}) {
  const [utilisateurs, setUtilisateurs] = useState(utilisateursInitiaux);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estAdmin, setEstAdmin] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreurCreation, setErreurCreation] = useState<string | null>(null);
  const [erreursToggle, setErreursToggle] = useState<Record<string, string>>({});

  function creerUtilisateur(e: React.FormEvent) {
    e.preventDefault();
    setErreurCreation(null);
    startTransition(async () => {
      const response = await fetch("/api/utilisateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, est_admin: estAdmin }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreurCreation(
          data?.error === "email_deja_utilise"
            ? "Cet email est déjà utilisé."
            : data?.error === "parametres_invalides"
              ? "Email requis, mot de passe d'au moins 8 caractères."
              : "Échec de la création.",
        );
        return;
      }

      const nouvelUtilisateur: Utilisateur = await response.json();
      setUtilisateurs((precedents) => [...precedents, nouvelUtilisateur]);
      setEmail("");
      setPassword("");
      setEstAdmin(false);
    });
  }

  function toggleActif(id: string, actifActuel: boolean) {
    setErreursToggle((precedents) => ({ ...precedents, [id]: "" }));
    startTransition(async () => {
      const response = await fetch(`/api/utilisateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif: !actifActuel }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErreursToggle((precedents) => ({
          ...precedents,
          [id]:
            data?.error === "dernier_admin_actif"
              ? "Impossible : dernier administrateur actif."
              : data?.error === "auto_desactivation_interdite"
                ? "Vous ne pouvez pas désactiver votre propre compte."
                : "Échec de la mise à jour.",
        }));
        return;
      }

      setUtilisateurs((precedents) =>
        precedents.map((u) => (u.id === id ? { ...u, actif: !actifActuel } : u)),
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
          Créer un utilisateur
        </span>
        <form onSubmit={creerUtilisateur} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (8 caractères min.)"
            className="rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
          />
          <label className="flex items-center gap-2 font-sans text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={estAdmin}
              onChange={(e) => setEstAdmin(e.target.checked)}
              className="h-4 w-4 accent-neon-green"
            />
            Administrateur
          </label>
          {erreurCreation && (
            <p className="font-mono text-xs text-neon-red">{erreurCreation}</p>
          )}
          <Button type="submit" disabled={isPending} className="self-start">
            <UserPlus className="h-4 w-4" />
            {isPending ? "Création..." : "Créer l'utilisateur"}
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {utilisateurs.map((utilisateur) => (
          <Card
            key={utilisateur.id}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-medium text-foreground">
                  {utilisateur.email}
                </span>
                {utilisateur.id === idUtilisateurCourant && (
                  <span className="font-mono text-[10px] text-foreground/40">
                    (vous)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {utilisateur.est_admin && (
                  <Badge className="border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan">
                    <ShieldCheck className="h-3 w-3" />
                    Administrateur
                  </Badge>
                )}
                {utilisateur.actif ? (
                  <Badge className="border-neon-green/40 bg-neon-green/10 text-neon-green">
                    Actif
                  </Badge>
                ) : (
                  <Badge className="border-neon-red/40 bg-neon-red/10 text-neon-red">
                    Désactivé
                  </Badge>
                )}
              </div>
              {erreursToggle[utilisateur.id] && (
                <p className="font-mono text-xs text-neon-red">
                  {erreursToggle[utilisateur.id]}
                </p>
              )}
            </div>

            <Button
              variant={utilisateur.actif ? "danger" : "primary"}
              size="sm"
              disabled={isPending || utilisateur.id === idUtilisateurCourant}
              onClick={() => toggleActif(utilisateur.id, utilisateur.actif)}
            >
              {utilisateur.actif ? (
                <>
                  <Ban className="h-3.5 w-3.5" />
                  Désactiver
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Réactiver
                </>
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
