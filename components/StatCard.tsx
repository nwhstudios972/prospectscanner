import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "green" | "cyan" | "orange" | "red";
  hint?: string;
}

const accentClasses = {
  green: "text-neon-green",
  cyan: "text-neon-cyan",
  orange: "text-neon-orange",
  red: "text-neon-red",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "green",
  hint,
}: StatCardProps) {
  return (
    <Card
      variant={accent === "cyan" ? "cyan" : "green"}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs uppercase tracking-wider text-foreground/50">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", accentClasses[accent])} />
      </div>
      <span
        className={cn(
          "font-mono text-3xl font-semibold",
          accentClasses[accent],
        )}
      >
        {value}
      </span>
      {hint && <span className="font-sans text-xs text-foreground/40">{hint}</span>}
    </Card>
  );
}
