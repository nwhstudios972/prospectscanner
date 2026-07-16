"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface EntreeJournal {
  id: string;
  email: string;
  adresse_ip: string;
  type_evenement: "connexion" | "activite_suspecte";
  connecte_a: Date;
  deconnecte_a: Date | null;
  type_deconnexion: "manuelle" | "inactivite" | null;
}

const MAX_INACTIVITE_MS = 5 * 60 * 1000;

function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(date);
}

function formaterHeure(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);
}

function formaterDuree(ms: number): string {
  const secondesTotales = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(secondesTotales / 60);
  const secondes = secondesTotales % 60;
  return `${minutes}m ${secondes.toString().padStart(2, "0")}s`;
}

// Une session sans deconnecte_a n'a pas forcément été fermée par un event
// signOut (ex : onglet fermé sans requête ultérieure) : au-delà des 5 min
// d'inactivité maximales de la session, on la considère expirée et on
// plafonne la durée affichée à cette limite plutôt que de compter indéfiniment.
function calculerDuree(
  connecteA: Date,
  deconnecteA: Date | null,
): { texte: string; enCours: boolean } {
  if (deconnecteA) {
    return {
      texte: formaterDuree(deconnecteA.getTime() - connecteA.getTime()),
      enCours: false,
    };
  }
  const ecoule = Date.now() - connecteA.getTime();
  if (ecoule >= MAX_INACTIVITE_MS) {
    return { texte: `${formaterDuree(MAX_INACTIVITE_MS)} (expirée)`, enCours: false };
  }
  return { texte: `${formaterDuree(ecoule)}`, enCours: true };
}

export function JournalConnexionsTable({
  entrees,
}: {
  entrees: EntreeJournal[];
}) {
  const [filtreEmail, setFiltreEmail] = useState("tous");

  const emails = useMemo(() => {
    return Array.from(new Set(entrees.map((e) => e.email))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [entrees]);

  const entreesFiltrees = useMemo(
    () =>
      filtreEmail === "tous"
        ? entrees
        : entrees.filter((e) => e.email === filtreEmail),
    [entrees, filtreEmail],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="font-sans text-xs uppercase tracking-wider text-foreground/50">
          Filtrer par utilisateur
        </label>
        <select
          value={filtreEmail}
          onChange={(e) => setFiltreEmail(e.target.value)}
          className="rounded-md border border-neon-green/20 bg-background px-3 py-1.5 font-mono text-xs text-foreground focus:border-neon-green/60 focus:outline-none"
        >
          <option value="tous">Tous ({entrees.length})</option>
          {emails.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-neon-green/15 text-left text-foreground/50">
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Heure</th>
              <th className="px-4 py-3 font-normal">Durée</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">Adresse IP</th>
            </tr>
          </thead>
          <tbody>
            {entreesFiltrees.map((entree) => {
              if (entree.type_evenement === "activite_suspecte") {
                return (
                  <tr
                    key={entree.id}
                    className="border-b border-white/5 bg-neon-red/5 text-foreground/80"
                  >
                    <td className="px-4 py-3">{entree.email}</td>
                    <td className="px-4 py-3">{formaterDate(entree.connecte_a)}</td>
                    <td className="px-4 py-3">{formaterHeure(entree.connecte_a)}</td>
                    <td className="px-4 py-3 text-foreground/40">—</td>
                    <td className="px-4 py-3">
                      <Badge className="border-neon-red/40 bg-neon-red/10 text-neon-red">
                        🚨 Activité suspecte
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{entree.adresse_ip}</td>
                  </tr>
                );
              }

              const duree = calculerDuree(entree.connecte_a, entree.deconnecte_a);
              return (
                <tr
                  key={entree.id}
                  className="border-b border-white/5 text-foreground/80"
                >
                  <td className="px-4 py-3">{entree.email}</td>
                  <td className="px-4 py-3">{formaterDate(entree.connecte_a)}</td>
                  <td className="px-4 py-3">{formaterHeure(entree.connecte_a)}</td>
                  <td className="px-4 py-3">
                    {duree.enCours ? (
                      <span className="flex items-center gap-1.5 text-neon-cyan">
                        <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-scan-pulse" />
                        {duree.texte}
                      </span>
                    ) : (
                      duree.texte
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entree.type_deconnexion === "manuelle" && (
                      <Badge className="border-neon-green/40 bg-neon-green/10 text-neon-green">
                        Manuelle
                      </Badge>
                    )}
                    {entree.type_deconnexion === "inactivite" && (
                      <Badge className="border-neon-orange/40 bg-neon-orange/10 text-neon-orange">
                        Inactivité
                      </Badge>
                    )}
                    {!entree.type_deconnexion && (
                      <Badge className="border-white/20 bg-white/5 text-foreground/50">
                        —
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{entree.adresse_ip}</td>
                </tr>
              );
            })}
            {entreesFiltrees.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-foreground/40"
                >
                  Aucune connexion enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
