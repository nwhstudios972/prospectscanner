import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type CardVariant = "green" | "cyan" | "neutral";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  green: "border-neon-green/20 hover:border-neon-green/40",
  cyan: "border-neon-cyan/20 hover:border-neon-cyan/40",
  neutral: "border-neon-green/10 hover:border-neon-green/25",
};

export function Card({
  className,
  variant = "neutral",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-panel p-5 transition-colors duration-150",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
