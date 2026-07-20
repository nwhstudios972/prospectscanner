import { redirect } from "next/navigation";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChangerMotDePasseForm } from "@/components/ChangerMotDePasseForm";
import { mockApiKeys } from "@/lib/mock-data";

export default async function ParametresPage() {
  const session = await auth();
  if (!session?.user?.est_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Paramètres"
        subtitle="Configuration des clés API utilisées par les scans"
      />

      <div className="flex flex-col gap-4">
        <ChangerMotDePasseForm />

        {mockApiKeys.map((api) => (
          <Card key={api.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-neon-green" />
                <div>
                  <h3 className="font-sans text-sm font-medium text-foreground">
                    {api.label}
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-foreground/50">
                    {api.description}
                  </p>
                </div>
              </div>

              {api.configured ? (
                <span className="flex items-center gap-1.5 font-mono text-xs text-neon-green">
                  <CheckCircle2 className="h-4 w-4" />
                  Configurée
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-mono text-xs text-neon-red">
                  <XCircle className="h-4 w-4" />
                  Non configurée
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="password"
                placeholder={api.envVar}
                defaultValue={api.configured ? "••••••••••••••••" : ""}
                className="flex-1 rounded-md border border-neon-green/20 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground/30 focus:border-neon-green/60 focus:outline-none"
              />
              <Button variant="secondary" size="sm">
                Enregistrer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
