import { cn } from "@/lib/utils";
import type {
  ProspectPriority,
  ProspectStatus,
  ScanStatus,
} from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

const priorityConfig: Record<
  ProspectPriority,
  { label: string; className: string }
> = {
  tres_elevee: {
    label: "TRÈS ÉLEVÉE",
    className: "border-neon-green/50 text-neon-green bg-neon-green/10",
  },
  elevee: {
    label: "ÉLEVÉE",
    className: "border-neon-green/40 text-neon-green bg-neon-green/5",
  },
  moyenne: {
    label: "MOYENNE",
    className: "border-neon-orange/50 text-neon-orange bg-neon-orange/10",
  },
  faible: {
    label: "FAIBLE",
    className: "border-neon-red/50 text-neon-red bg-neon-red/10",
  },
};

export function PriorityBadge({ priority }: { priority: ProspectPriority }) {
  const config = priorityConfig[priority];
  return <Badge className={config.className}>{config.label}</Badge>;
}

export function ScoreBadge({ score }: { score: number }) {
  const className =
    score >= 75
      ? "border-neon-green/50 text-neon-green bg-neon-green/10"
      : score >= 45
        ? "border-neon-orange/50 text-neon-orange bg-neon-orange/10"
        : "border-neon-red/50 text-neon-red bg-neon-red/10";
  return <Badge className={className}>{score}/100</Badge>;
}

const scanStatusConfig: Record<
  ScanStatus,
  { label: string; className: string }
> = {
  en_attente: {
    label: "EN ATTENTE",
    className: "border-white/20 text-foreground/60 bg-white/5",
  },
  en_cours: {
    label: "EN COURS",
    className: "border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10",
  },
  termine: {
    label: "TERMINÉ",
    className: "border-neon-green/50 text-neon-green bg-neon-green/10",
  },
  erreur: {
    label: "ERREUR",
    className: "border-neon-red/50 text-neon-red bg-neon-red/10",
  },
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const config = scanStatusConfig[status];
  return (
    <Badge className={config.className}>
      {status === "en_cours" && (
        <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-scan-pulse" />
      )}
      {config.label}
    </Badge>
  );
}

const prospectStatusConfig: Record<
  ProspectStatus,
  { label: string; className: string }
> = {
  nouveau: {
    label: "NOUVEAU",
    className: "border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10",
  },
  contacte: {
    label: "CONTACTÉ",
    className: "border-white/20 text-foreground/70 bg-white/5",
  },
  en_negociation: {
    label: "EN NÉGOCIATION",
    className: "border-neon-green/50 text-neon-green bg-neon-green/10",
  },
  perdu: {
    label: "PERDU",
    className: "border-neon-red/50 text-neon-red bg-neon-red/10",
  },
  converti: {
    label: "CONVERTI",
    className: "border-neon-green/60 text-neon-green bg-neon-green/20",
  },
};

export function ProspectStatusBadge({ status }: { status: ProspectStatus }) {
  const config = prospectStatusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
