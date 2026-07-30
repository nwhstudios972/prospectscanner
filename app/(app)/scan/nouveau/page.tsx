"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RadarIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SecteurPicker } from "@/components/SecteurPicker";
import { VillePicker } from "@/components/VillePicker";

export default function NouveauScanPage() {
  const router = useRouter();
  const [secteur, setSecteur] = useState("");
  const [ville, setVille] = useState("");
  const [rayon, setRayon] = useState(15);
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
        body: JSON.stringify({ secteur, ville, rayon_km: rayon }),
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
                {rayon} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={rayon}
              onChange={(e) => setRayon(Number(e.target.value))}
              className="accent-[#00ff9d]"
            />
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
