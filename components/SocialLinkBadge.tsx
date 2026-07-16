import {
  Share2,
  Camera,
  Music2,
  Briefcase,
  MonitorPlay,
  AtSign,
  BookOpenText,
  CalendarCheck,
  Compass,
  Home,
  Globe,
} from "lucide-react";
import type { SocialLink } from "@/types";

const platformConfig: Record<
  SocialLink["platform"],
  { label: string; icon: typeof Share2 }
> = {
  facebook: { label: "Facebook", icon: Share2 },
  instagram: { label: "Instagram", icon: Camera },
  tiktok: { label: "TikTok", icon: Music2 },
  linkedin: { label: "LinkedIn", icon: Briefcase },
  youtube: { label: "YouTube", icon: MonitorPlay },
  x: { label: "X", icon: AtSign },
  pagesjaunes: { label: "PagesJaunes", icon: BookOpenText },
  booking: { label: "Booking.com", icon: CalendarCheck },
  tripadvisor: { label: "TripAdvisor", icon: Compass },
  airbnb: { label: "Airbnb", icon: Home },
  site_web: { label: "Site web", icon: Globe },
};

export function SocialLinkBadge({ link }: { link: SocialLink }) {
  const config = platformConfig[link.platform];
  const Icon = config.icon;

  if (!link.url) {
    return (
      <span className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground/40">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-sans">{config.label}</span>
        <span className="font-mono">non trouvé</span>
      </span>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan"
    >
      <Icon className="h-3.5 w-3.5 text-neon-cyan" />
      <span className="font-sans">{config.label}</span>
      {link.followers !== undefined && (
        <span className="font-mono text-neon-cyan/80">
          {link.followers.toLocaleString("fr-FR")}
        </span>
      )}
    </a>
  );
}
