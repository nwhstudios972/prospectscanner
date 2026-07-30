"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PickerModal } from "@/components/ui/PickerModal";
import { cn } from "@/lib/utils";

interface VillePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function VillePicker({ value, onChange }: VillePickerProps) {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [villesSuggerees, setVillesSuggerees] = useState<string[]>([]);
  const [chargee, setChargee] = useState(false);

  useEffect(() => {
    if (!open || chargee) return;
    fetch("/api/villes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) =>
        setVillesSuggerees(Array.isArray(data) ? data : []),
      )
      .catch(() => setVillesSuggerees([]))
      .finally(() => setChargee(true));
  }, [open, chargee]);

  function ouvrir() {
    setPending(value || null);
    setRecherche("");
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

  const resultats = useMemo(() => {
    if (!rechercheNormalisee) return villesSuggerees;
    return villesSuggerees.filter((v) =>
      v.toLowerCase().includes(rechercheNormalisee),
    );
  }, [villesSuggerees, rechercheNormalisee]);

  const aucuneCorrespondanceExacte =
    rechercheNormalisee.length > 0 &&
    !villesSuggerees.some((v) => v.toLowerCase() === rechercheNormalisee);

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
        {value || "Choisir une ville / zone géographique..."}
        <MapPin className="h-4 w-4 shrink-0 text-neon-green/60" />
      </button>

      <PickerModal
        open={open}
        onClose={fermer}
        title="Ville / zone géographique"
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
            placeholder="Rechercher ou saisir une ville..."
            className="w-full bg-transparent font-sans text-sm text-foreground placeholder:text-foreground/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {resultats.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPending(v)}
              className={cn(
                "rounded-md border px-3 py-2 text-left font-sans text-sm transition-colors",
                pending === v
                  ? "border-neon-green/50 bg-neon-green/10 text-foreground"
                  : "border-white/10 text-foreground/80 hover:border-neon-green/30 hover:bg-white/5",
              )}
            >
              {v}
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
                Utiliser « {recherche.trim()} » comme ville
              </span>
              <span className="font-mono text-[11px] text-foreground/40">
                Nouvelle ville, pas encore scannée
              </span>
            </button>
          )}

          {resultats.length === 0 && !aucuneCorrespondanceExacte && (
            <p className="py-6 text-center font-sans text-sm text-foreground/40">
              {rechercheNormalisee
                ? "Aucun résultat."
                : "Aucune ville scannée pour l'instant — tapez un nom de ville."}
            </p>
          )}
        </div>
      </PickerModal>
    </>
  );
}
