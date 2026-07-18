"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TerminalSquare, LogOut, Menu, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";

export function Sidebar({ estAdmin = false }: { estAdmin?: boolean }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminUniquement || estAdmin);
  const [ouvert, setOuvert] = useState(false);

  // Ferme le tiroir mobile à chaque changement de page (sinon il resterait
  // ouvert par-dessus la page suivante).
  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-neon-green/15 bg-panel px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-5 w-5 text-neon-green" />
          <span className="font-mono text-xs font-semibold tracking-wide text-neon-green text-glow-green">
            PROSPECTSCANNER
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-white/5 hover:text-foreground"
        >
          {ouvert ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {ouvert && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOuvert(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-neon-green/15 bg-panel transition-transform duration-200 lg:translate-x-0",
          ouvert ? "translate-x-0" : "-translate-x-full",
        )}
      >
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

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
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
    </>
  );
}
