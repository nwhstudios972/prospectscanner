import { MapPin, Star, Clock } from "lucide-react";
import { ScoreBadge, SegmentBadge } from "@/components/ui/Badge";
import type { ProspectWithEtablissement } from "@/lib/queries";

function formaterDate(date: Date | string | null): string {
  if (!date) return "Aucune activité détectée";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ProspectHoverPreview({
  prospect,
}: {
  prospect: ProspectWithEtablissement;
}) {
  const plateformesTrouvees = prospect.etablissement.presences.filter(
    (p) => p.trouve,
  );

  const derniereActivite = plateformesTrouvees
    .map((p) => p.derniere_activite)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-full z-20 mt-2 hidden origin-top rounded-lg border border-neon-cyan/30 bg-panel p-4 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-opacity duration-150 group-hover:block group-hover:opacity-100">
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-sm font-semibold text-foreground">
          {prospect.etablissement.nom}
        </span>
        <div className="flex items-center gap-1.5">
          {prospect.segment && <SegmentBadge segment={prospect.segment} />}
          <ScoreBadge score={prospect.score} />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
        <MapPin className="h-3.5 w-3.5 text-neon-cyan" />
        {prospect.etablissement.ville}
      </div>

      {prospect.etablissement.note_google !== null && (
        <div className="mt-1 flex items-center gap-2 text-xs text-foreground/60">
          <Star className="h-3.5 w-3.5 text-neon-cyan" />
          {prospect.etablissement.note_google}/5 (
          {prospect.etablissement.nombre_avis_google} avis)
        </div>
      )}

      <div className="mt-1 flex items-center gap-2 text-xs text-foreground/60">
        <Clock className="h-3.5 w-3.5 text-neon-cyan" />
        Dernière activité : {formaterDate(derniereActivite)}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {plateformesTrouvees.length === 0 ? (
          <span className="font-mono text-[11px] text-foreground/40">
            Aucune plateforme détectée
          </span>
        ) : (
          plateformesTrouvees.map((p) => (
            <span
              key={p.id}
              className="rounded border border-neon-cyan/30 bg-neon-cyan/5 px-1.5 py-0.5 font-mono text-[11px] text-neon-cyan"
            >
              {p.plateforme}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
