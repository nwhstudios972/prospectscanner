"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PickerModal } from "@/components/ui/PickerModal";
import { CATEGORIES_METIERS } from "@/lib/metiers";
import { cn } from "@/lib/utils";

interface MetierIndexe {
  metier: string;
  categorieLabel: string;
}

const INDEX_METIERS: MetierIndexe[] = CATEGORIES_METIERS.flatMap((categorie) =>
  categorie.metiers.map((metier) => ({ metier, categorieLabel: categorie.label })),
);

interface SecteurPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function SecteurPicker({ value, onChange }: SecteurPickerProps) {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [categorieActive, setCategorieActive] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  function ouvrir() {
    setPending(value || null);
    setRecherche("");
    setCategorieActive(null);
    setOpen(true);
  }

  function fermer() {
    setOpen(false);
  }

  function valider() {
    if (!pending) return;
    onChange(pending);
    setOpen(false);
  }

  const rechercheNormalisee = recherche.trim().toLowerCase();

  const resultatsRecherche = useMemo(() => {
    if (!rechercheNormalisee) return [];
    return INDEX_METIERS.filter((m) =>
      m.metier.toLowerCase().includes(rechercheNormalisee),
    );
  }, [rechercheNormalisee]);

  const aucuneCorrespondanceExacte = useMemo(() => {
    if (!rechercheNormalisee) return false;
    return !INDEX_METIERS.some(
      (m) => m.metier.toLowerCase() === rechercheNormalisee,
    );
  }, [rechercheNormalisee]);

  const categorie = categorieActive
    ? CATEGORIES_METIERS.find((c) => c.id === categorieActive)
    : null;

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 text-left font-sans text-sm transition-colors hover:border-neon-green/40 focus:border-neon-green/60 focus:outline-none",
          value ? "text-foreground" : "text-foreground/30",
        )}
      >
        {value || "Choisir un secteur d'activité..."}
        <Layers className="h-4 w-4 shrink-0 text-neon-green/60" />
      </button>

      <PickerModal
        open={open}
        onClose={fermer}
        title="Secteur d'activité"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/50">
              {pending ? (
                <>
                  Sélection : <span className="text-neon-green">{pending}</span>
                </>
              ) : (
                "Aucune sélection"
              )}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={fermer}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!pending}
                onClick={valider}
              >
                <Check className="h-3.5 w-3.5" />
                Valider
              </Button>
            </div>
          </div>
        }
      >
        <div className="mb-4 flex items-center gap-2 rounded-md border border-neon-green/20 bg-background px-3 py-2 focus-within:border-neon-green/60">
          <Search className="h-4 w-4 shrink-0 text-foreground/40" />
          <input
            type="text"
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un métier..."
            className="w-full bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
        </div>

        {rechercheNormalisee ? (
          <div className="flex flex-col gap-1.5">
            {resultatsRecherche.map((m) => (
              <button
                key={m.metier}
                type="button"
                onClick={() => setPending(m.metier)}
                className={cn(
                  "flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors",
                  pending === m.metier
                    ? "border-neon-green/50 bg-neon-green/10"
                    : "border-white/10 hover:border-neon-green/30 hover:bg-white/5",
                )}
              >
                <span className="font-sans text-sm text-foreground">
                  {m.metier}
                </span>
                <span className="font-mono text-[11px] text-foreground/40">
                  {m.categorieLabel}
                </span>
              </button>
            ))}

            {aucuneCorrespondanceExacte && (
              <button
                type="button"
                onClick={() => setPending(recherche.trim())}
                className={cn(
                  "flex flex-col items-start rounded-md border border-dashed px-3 py-2 text-left transition-colors",
                  pending === recherche.trim()
                    ? "border-neon-cyan/50 bg-neon-cyan/10"
                    : "border-white/15 hover:border-neon-cyan/40 hover:bg-white/5",
                )}
              >
                <span className="font-sans text-sm text-neon-cyan">
                  Utiliser « {recherche.trim()} » comme secteur personnalisé
                </span>
                <span className="font-mono text-[11px] text-foreground/40">
                  Ne correspond à aucun métier suggéré
                </span>
              </button>
            )}

            {resultatsRecherche.length === 0 && !aucuneCorrespondanceExacte && (
              <p className="py-6 text-center font-sans text-sm text-foreground/40">
                Aucun résultat.
              </p>
            )}
          </div>
        ) : categorie ? (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setCategorieActive(null)}
              className="mb-2 flex items-center gap-1.5 self-start font-sans text-xs text-foreground/50 hover:text-neon-cyan"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Toutes les catégories
            </button>
            {categorie.metiers.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPending(m)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left font-sans text-sm transition-colors",
                  pending === m
                    ? "border-neon-green/50 bg-neon-green/10 text-foreground"
                    : "border-white/10 text-foreground/80 hover:border-neon-green/30 hover:bg-white/5",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATEGORIES_METIERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategorieActive(c.id)}
                className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-background px-3 py-2.5 text-left font-sans text-sm text-foreground/80 transition-colors hover:border-neon-green/40 hover:text-foreground"
              >
                {c.label}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground/30" />
              </button>
            ))}
          </div>
        )}
      </PickerModal>
    </>
  );
}
