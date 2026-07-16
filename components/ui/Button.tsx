import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neon-green/10 text-neon-green border border-neon-green/50 hover:bg-neon-green/20 hover:shadow-[0_0_12px_0_rgba(0,255,157,0.4)]",
  secondary:
    "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/20 hover:shadow-[0_0_12px_0_rgba(0,212,255,0.4)]",
  ghost:
    "bg-transparent text-foreground/70 border border-white/10 hover:border-neon-green/40 hover:text-foreground",
  danger:
    "bg-neon-red/10 text-neon-red border border-neon-red/40 hover:bg-neon-red/20 hover:shadow-[0_0_12px_0_rgba(255,59,59,0.4)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-medium transition-all duration-150",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
