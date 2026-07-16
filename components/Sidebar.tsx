"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TerminalSquare, LogOut } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";

export function Sidebar({ estAdmin = false }: { estAdmin?: boolean }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminUniquement || estAdmin);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neon-green/15 bg-panel">
      <div className="flex items-center gap-2 border-b border-neon-green/15 px-5 py-5">
        <TerminalSquare className="h-6 w-6 text-neon-green" />
        <div className="flex flex-col leading-tight">
          <span className="font-mono text-sm font-semibold tracking-wide text-neon-green text-glow-green">
            PROSPECT
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide text-neon-cyan">
            SCANNER
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => {
          const isActive = item.matchPrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          );
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 font-sans text-sm transition-all duration-150",
                isActive
                  ? "border-neon-green/40 bg-neon-green/10 text-neon-green shadow-[0_0_10px_0_rgba(0,255,157,0.25)]"
                  : "text-foreground/60 hover:border-neon-green/20 hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive
                    ? "text-neon-green"
                    : "text-foreground/40 group-hover:text-neon-green/70",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neon-green/15 px-3 py-4">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-sans text-sm text-foreground/50 transition-colors duration-150 hover:bg-neon-red/10 hover:text-neon-red"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </form>
        <p className="mt-3 px-3 font-mono text-[10px] text-foreground/30">
          v0.1.0 · local instance
        </p>
      </div>
    </aside>
  );
}
