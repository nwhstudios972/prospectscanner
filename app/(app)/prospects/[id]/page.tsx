import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin, Hash, ArrowLeft, Star, MapPinned } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { PriorityBadge, ScoreBadge } from "@/components/ui/Badge";
import { SocialLinkBadge } from "@/components/SocialLinkBadge";
import { TelegramSendButton } from "@/components/TelegramSendButton";
import { ProspectStatusPanel } from "@/components/ProspectStatusPanel";
import { getProspectDetail } from "@/lib/queries";
import { urlFicheGoogleMaps } from "@/lib/utils";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospect = await getProspectDetail(id);

  if (!prospect) {
    notFound();
  }

  const { etablissement } = prospect;

  return (
    <div className="max-w-3xl">
      <Link
        href="/prospects"
        className="mb-4 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/50 hover:text-neon-cyan"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux prospects
      </Link>

      <PageHeader
        title={etablissement.nom}
        subtitle={`${etablissement.secteur} · ${etablissement.ville}`}
        action={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={prospect.priorite} />
            <ScoreBadge score={prospect.score} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ProspectStatusPanel
          prospectId={prospect.id}
          statutInitial={prospect.statut_suivi}
          aSiteWeb={prospect.a_site_web}
          analyseCommerciale={prospect.analyse_commerciale}
        />

        <Card className="flex flex-col gap-3">
          <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
            Coordonnées
          </span>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <MapPin className="h-4 w-4 text-neon-cyan shrink-0" />
            {etablissement.adresse}
          </div>
          {etablissement.telephone && (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Phone className="h-4 w-4 text-neon-cyan shrink-0" />
              <span className="font-mono">{etablissement.telephone}</span>
            </div>
          )}
          {etablissement.email && (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Mail className="h-4 w-4 text-neon-cyan shrink-0" />
              <a
                href={`mailto:${etablissement.email}`}
                className="font-mono hover:text-neon-cyan hover:underline"
              >
                {etablissement.email}
              </a>
            </div>
          )}
          {etablissement.siret && (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Hash className="h-4 w-4 text-neon-cyan shrink-0" />
              <span className="font-mono">{etablissement.siret}</span>
            </div>
          )}
          {etablissement.note_google !== null && (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Star className="h-4 w-4 text-neon-cyan shrink-0" />
              <span className="font-mono">
                {etablissement.note_google}/5 ({etablissement.nombre_avis_google}{" "}
                avis)
              </span>
            </div>
          )}
          {etablissement.google_place_id && (
            <a
              href={urlFicheGoogleMaps(etablissement.google_place_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-2 text-sm text-neon-cyan hover:underline"
            >
              <MapPinned className="h-4 w-4 shrink-0" />
              Voir la fiche Google (avis, horaires, photos)
            </a>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
            Présence en ligne
          </span>
          <div className="flex flex-wrap gap-2">
            {etablissement.presences.map((presence) => (
              <SocialLinkBadge
                key={presence.id}
                link={{
                  platform: presence.plateforme,
                  url: presence.url ?? undefined,
                  followers: presence.nombre_abonnes ?? undefined,
                }}
              />
            ))}
          </div>
        </Card>

        <Card variant="cyan" className="flex flex-col gap-2 md:col-span-2">
          <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
            Origine
          </span>
          <Link
            href={`/scan/${etablissement.scan.id}`}
            className="font-mono text-sm text-neon-cyan hover:text-glow-cyan"
          >
            Issu du scan {etablissement.scan.id} — {etablissement.scan.secteur} (
            {etablissement.scan.ville})
          </Link>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TelegramSendButton prospectId={prospect.id} />
      </div>
    </div>
  );
}
