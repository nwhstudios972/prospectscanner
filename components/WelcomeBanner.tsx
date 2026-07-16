"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalSquare } from "lucide-react";

export function WelcomeBanner({ email }: { email: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const apparition = requestAnimationFrame(() => setVisible(true));
    const disparition = setTimeout(() => setVisible(false), 2600);
    const nettoyageUrl = setTimeout(() => {
      router.replace("/dashboard");
    }, 3000);

    return () => {
      cancelAnimationFrame(apparition);
      clearTimeout(disparition);
      clearTimeout(nettoyageUrl);
    };
  }, [router]);

  return (
    <div
      className={`mb-6 flex items-center gap-3 overflow-hidden rounded-lg border border-neon-green/40 bg-neon-green/10 px-5 py-4 shadow-[0_0_20px_0_rgba(0,255,157,0.15)] transition-all duration-500 ease-out ${
        visible
          ? "max-h-24 translate-y-0 opacity-100"
          : "max-h-0 -translate-y-2 border-transparent px-5 py-0 opacity-0"
      }`}
    >
      <TerminalSquare className="h-5 w-5 shrink-0 text-neon-green" />
      <span className="font-sans text-sm text-foreground">
        Bienvenue,{" "}
        <span className="font-mono text-neon-green text-glow-green">
          {email}
        </span>
      </span>
    </div>
  );
}
