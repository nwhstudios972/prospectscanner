"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RadarIcon, Globe } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SecteurPicker } from "@/components/SecteurPicker";
import { VillePicker } from "@/components/VillePicker";
import { cn } from "@/lib/utils";

// Doit rester cohérent avec RAYON_SEUIL_MONDIAL_KM dans lib/pipeline/google-places.ts :
// au delà de ce rayon, le scan retire tout biais géographique.
const RAYON_MONDIAL_KM = 20000;
const PALIERS_RAYON = [
  { label: "15 km", valeur: 15 },
  { label: "50 km (ville)", valeur: 50 },
  { label: "200 km (région)", valeur: 200 },
  { label: "1000 km (pays)", valeur: 1000 },
];

export default function NouveauScanPage() {
  const router = useRouter();
  const [secteur, setSecteur] = useState("");
  const [ville, setVille] = useState("");
  const [rayon, setRayon] = useState(15);
  const [rayonMonde, setRayonMonde] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErreur(null);

    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secteur,
          ville,
          rayon_km: rayonMonde ? RAYON_MONDIAL_KM : rayon,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de lancer le scan. Réessaie.");
      }

      const data: { id: string } = await response.json();
      router.push(`/scan/${data.id}`);
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "Erreur inconnue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nouveau scan"
        subtitle="Configurez les critères de recherche pour détecter de nouveaux prospects"
      />

      <Card variant="green">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs uppercase tracking-wider text-foreground/50">
              Secteur d&apos;activité
            </label>
            <SecteurPicker value={secteur} onChange={setSecteur} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs uppercase tracking-wider text-foreground/50">
              Ville / zone géographique
            </label>
            <VillePicker value={ville} onChange={setVille} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-sans text-xs uppercase tracking-wider text-foreground/50">
                Rayon de recherche
              </label>
              <span className="font-mono text-sm text-neon-green">
                {rayonMonde ? "Monde entier" : `${rayon} km`}
              </span>
            </div>

            {!rayonMonde && (
              <input
                type="range"
                min={1}
                max={1000}
                value={rayon}
                onChange={(e) => setRayon(Number(e.target.value))}
                className="accent-[#00ff9d]"
              />
            )}

            <div className="flex flex-wrap gap-2">
              {PALIERS_RAYON.map((palier) => (
                <button
                  key={palier.valeur}
                  type="button"
                  onClick={() => {
                    setRayonMonde(false);
                    setRayon(palier.valeur);
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 font-sans text-xs transition-colors",
                    !rayonMonde && rayon === palier.valeur
                      ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                      : "border-white/15 text-foreground/60 hover:border-neon-green/30",
                  )}
                >
                  {palier.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRayonMonde((v) => !v)}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-3 py-1.5 font-sans text-xs transition-colors",
                  rayonMonde
                    ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                    : "border-white/15 text-foreground/60 hover:border-neon-cyan/30",
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Monde entier
              </button>
            </div>
          </div>

          {erreur && (
            <p className="font-sans text-sm text-neon-red">{erreur}</p>
          )}

          <Button type="submit" disabled={submitting || !ville || !secteur}>
            <RadarIcon className="h-4 w-4" />
            {submitting ? "Lancement du scan..." : "Lancer le scan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
