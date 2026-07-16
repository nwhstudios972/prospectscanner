"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalSquare, History, Radar } from "lucide-react";

function formaterDerniereConnexion(date: Date): string {
  const formatee = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
  return formatee;
}

interface WelcomeBannerProps {
  email: string;
  derniereConnexion: Date | null;
  nouveauxProspects: number;
}

export function WelcomeBanner({
  email,
  derniereConnexion,
  nouveauxProspects,
}: WelcomeBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const apparition = requestAnimationFrame(() => setVisible(true));
    const disparition = setTimeout(() => setVisible(false), 4300);
    const nettoyageUrl = setTimeout(() => {
      router.replace("/dashboard");
    }, 4700);

    return () => {
      cancelAnimationFrame(apparition);
      clearTimeout(disparition);
      clearTimeout(nettoyageUrl);
    };
  }, [router]);

  return (
    <div
      className={`mb-6 overflow-hidden rounded-lg border border-neon-green/40 bg-neon-green/10 shadow-[0_0_20px_0_rgba(0,255,157,0.15)] transition-all duration-500 ease-out ${
        visible
          ? "max-h-40 translate-y-0 opacity-100"
          : "max-h-0 -translate-y-2 border-transparent opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <TerminalSquare className="mt-0.5 h-5 w-5 shrink-0 text-neon-green" />
        <div className="flex flex-col gap-1.5">
          <span className="font-sans text-sm text-foreground">
            Bienvenue,{" "}
            <span className="font-mono text-neon-green text-glow-green">
              {email}
            </span>
          </span>

          {derniereConnexion ? (
            <span className="flex items-center gap-1.5 font-mono text-xs text-foreground/50">
              <History className="h-3.5 w-3.5 text-neon-cyan" />
              Dernière connexion : {formaterDerniereConnexion(derniereConnexion)}
            </span>
          ) : (
            <span className="font-mono text-xs text-foreground/50">
              Première connexion enregistrée sur cette instance.
            </span>
          )}

          {derniereConnexion && (
            <span className="flex items-center gap-1.5 font-mono text-xs text-foreground/50">
              <Radar className="h-3.5 w-3.5 text-neon-cyan" />
              {nouveauxProspects === 0
                ? "Aucun nouveau prospect depuis votre dernière visite."
                : nouveauxProspects === 1
                  ? "1 nouveau prospect depuis votre dernière visite."
                  : `${nouveauxProspects} nouveaux prospects depuis votre dernière visite.`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
