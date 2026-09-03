import {
  Building2,
  Users,
  Euro,
  Cpu,
  Gavel,
  Gauge,
  Briefcase,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ProspectWithDetails } from "@/lib/queries";

type Etablissement = ProspectWithDetails["etablissement"];

const LABELS_CATEGORIE_TECH: Record<string, string> = {
  cms: "CMS",
  ecommerce: "E-commerce",
  crm_marketing: "CRM / marketing",
  analytics: "Analytics",
  paiement: "Paiement",
  autre: "Autre",
};

const LABELS_EVENEMENT: Record<string, string> = {
  depot_comptes: "Dépôt de comptes",
  procedure_collective: "Procédure collective",
  modification: "Modification légale",
  radiation: "Radiation",
  marche_public: "Marché public attribué",
  recrutement: "Offre d'emploi",
};

function formaterDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR");
}

function formaterMontant(montant: number | null): string {
  if (montant === null) return "—";
  return montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function CarteIdentification({ etablissement }: { etablissement: Etablissement }) {
  const champs = [
    ["Forme juridique", etablissement.forme_juridique],
    ["Nom commercial", etablissement.nom_commercial],
    [
      "Date de création",
      etablissement.date_creation_entreprise ? formaterDate(etablissement.date_creation_entreprise) : null,
    ],
    ["Catégorie d'entreprise", etablissement.categorie_entreprise],
    ["TVA intracommunautaire", etablissement.tva_intracommunautaire],
    [
      "Établissements",
      etablissement.nombre_etablissements !== null ? String(etablissement.nombre_etablissements) : null,
    ],
  ] as const;

  const disponibles = champs.filter(([, valeur]) => valeur);

  return (
    <Card className="flex flex-col gap-3">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <Building2 className="h-3.5 w-3.5" />
        Identification
      </span>
      {disponibles.length === 0 ? (
        <p className="text-sm text-foreground/40">Aucune donnée d&apos;identification supplémentaire.</p>
      ) : (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          {disponibles.map(([label, valeur]) => (
            <div key={label} className="flex flex-col">
              <dt className="text-xs text-foreground/40">{label}</dt>
              <dd className="font-mono text-foreground/80">{valeur}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

export function CarteDirigeants({ etablissement }: { etablissement: Etablissement }) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <Users className="h-3.5 w-3.5" />
        Dirigeants
      </span>
      {etablissement.dirigeants.length === 0 ? (
        <p className="text-sm text-foreground/40">Aucun dirigeant identifié.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {etablissement.dirigeants.map((dirigeant) => (
            <li key={dirigeant.id} className="flex flex-col text-sm">
              <span className="text-foreground/80">
                {[dirigeant.prenoms, dirigeant.nom].filter(Boolean).join(" ") ||
                  dirigeant.denomination ||
                  "Personne morale"}
              </span>
              <span className="text-xs text-foreground/40">
                {dirigeant.qualite}
                {dirigeant.annee_naissance ? ` · né(e) en ${dirigeant.annee_naissance}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function CarteFinances({ etablissement }: { etablissement: Etablissement }) {
  return (
    <Card className="flex flex-col gap-3">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <Euro className="h-3.5 w-3.5" />
        Données financières
      </span>
      {etablissement.donneesFinancieres.length === 0 ? (
        <p className="text-sm text-foreground/40">
          Aucun exercice publié disponible via le registre officiel.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-foreground/40">
              <th className="pb-1 font-normal">Exercice</th>
              <th className="pb-1 font-normal">Chiffre d&apos;affaires</th>
              <th className="pb-1 font-normal">Résultat net</th>
            </tr>
          </thead>
          <tbody>
            {etablissement.donneesFinancieres.map((exercice) => (
              <tr key={exercice.id} className="border-t border-white/5">
                <td className="py-1 font-mono text-foreground/70">{exercice.annee}</td>
                <td className="py-1 font-mono text-foreground/70">
                  {formaterMontant(exercice.chiffre_affaires)}
                </td>
                <td className="py-1 font-mono text-foreground/70">
                  {formaterMontant(exercice.resultat_net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export function CarteTechnologies({ etablissement }: { etablissement: Etablissement }) {
  const parCategorie = new Map<string, string[]>();
  for (const tech of etablissement.technologies) {
    const liste = parCategorie.get(tech.categorie) ?? [];
    liste.push(tech.nom);
    parCategorie.set(tech.categorie, liste);
  }

  return (
    <Card className="flex flex-col gap-3">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <Cpu className="h-3.5 w-3.5" />
        Technologies détectées
      </span>
      {parCategorie.size === 0 ? (
        <p className="text-sm text-foreground/40">
          {etablissement.presences.some((p) => p.plateforme === "site_web" && p.trouve)
            ? "Aucune technologie reconnue sur le site."
            : "Pas de site web à analyser."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {Array.from(parCategorie.entries()).map(([categorie, noms]) => (
            <div key={categorie} className="flex flex-wrap items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-foreground/40">
                {LABELS_CATEGORIE_TECH[categorie] ?? categorie}
              </span>
              {noms.map((nom) => (
                <span
                  key={nom}
                  className="rounded-md border border-neon-cyan/20 bg-neon-cyan/5 px-2 py-0.5 font-mono text-xs text-neon-cyan/90"
                >
                  {nom}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CarteSignauxBusiness({ etablissement }: { etablissement: Etablissement }) {
  const nombreOffresEmploi = etablissement.evenements.filter(
    (e) => e.type === "recrutement",
  ).length;

  return (
    <Card className="flex flex-col gap-3">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <Gavel className="h-3.5 w-3.5" />
        Signaux business
      </span>

      <div className="flex items-center gap-2 rounded-md border border-neon-orange/20 bg-neon-orange/5 px-3 py-2 text-sm">
        <Briefcase className="h-4 w-4 shrink-0 text-neon-orange" />
        <span className="text-foreground/80">
          <span className="font-mono font-semibold text-neon-orange">{nombreOffresEmploi}</span>{" "}
          offre{nombreOffresEmploi > 1 ? "s" : ""} d&apos;emploi active{nombreOffresEmploi > 1 ? "s" : ""} (approx.)
        </span>
      </div>

      {etablissement.evenements.length === 0 ? (
        <p className="text-sm text-foreground/40">Aucun évènement légal ou public récent.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {etablissement.evenements.slice(0, 8).map((evenement) => (
            <li key={evenement.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-foreground/80">
                  {evenement.type === "recrutement"
                    ? evenement.titre
                    : LABELS_EVENEMENT[evenement.type] ?? evenement.titre}
                </span>
                {evenement.description && (
                  <span className="text-xs text-foreground/40">{evenement.description}</span>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-foreground/40">
                {formaterDate(evenement.date_evenement)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function CarteWebReputation({ etablissement }: { etablissement: Etablissement }) {
  const historique = etablissement.historiqueReputation;
  const premiereNote = historique[0]?.note_google ?? null;
  const derniereNote = historique[historique.length - 1]?.note_google ?? null;
  const evolution =
    premiereNote !== null && derniereNote !== null && historique.length > 1
      ? derniereNote - premiereNote
      : null;

  return (
    <Card className="flex flex-col gap-3 md:col-span-2">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <Gauge className="h-3.5 w-3.5" />
        Web & réputation
      </span>
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-foreground/40">Performance (approx.)</span>
          <span className="font-mono text-foreground/80">
            {etablissement.score_performance_web !== null
              ? `${etablissement.score_performance_web}/100`
              : "Non analysé"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-foreground/40">SEO (approx.)</span>
          <span className="font-mono text-foreground/80">
            {etablissement.score_seo_web !== null ? `${etablissement.score_seo_web}/100` : "Non analysé"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-foreground/40">Ancienneté du domaine (approx.)</span>
          <span className="font-mono text-foreground/80">
            {etablissement.score_autorite_domaine !== null
              ? `${etablissement.score_autorite_domaine}/100`
              : "Non mesurée"}
          </span>
        </div>
        {evolution !== null && (
          <div className="flex flex-col">
            <span className="text-xs text-foreground/40">Évolution note Google</span>
            <span
              className={
                "flex items-center gap-1 font-mono " +
                (evolution > 0 ? "text-neon-green" : evolution < 0 ? "text-neon-red" : "text-foreground/60")
              }
            >
              {evolution > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : evolution < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
              {evolution > 0 ? "+" : ""}
              {evolution.toFixed(1)}
            </span>
          </div>
        )}
      </div>
      {!etablissement.score_performance_web && !etablissement.score_seo_web && (
        <p className="text-xs text-foreground/30">
          Site non analysé (pas de site web détecté, ou site injoignable).
        </p>
      )}
      {etablissement.score_autorite_domaine === null && (
        <p className="text-xs text-foreground/30">
          Ancienneté du domaine non mesurée (pas de site web, ou domaine introuvable au RDAP).
        </p>
      )}
    </Card>
  );
}

export function CarteCatalogueEcommerce({ etablissement }: { etablissement: Etablissement }) {
  if (etablissement.produitsEcommerce.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3 md:col-span-2">
      <span className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-foreground/50">
        <ShoppingBag className="h-3.5 w-3.5" />
        Catalogue e-commerce (échantillon, {etablissement.produitsEcommerce.length} produit
        {etablissement.produitsEcommerce.length > 1 ? "s" : ""})
      </span>
      <div className="flex flex-wrap gap-2">
        {etablissement.produitsEcommerce.map((produit) => (
          <a
            key={produit.id}
            href={produit.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs hover:border-neon-cyan/40"
          >
            <span className="text-foreground/80">{produit.nom}</span>
            {produit.prix !== null && (
              <span className="font-mono text-neon-cyan/90">
                {produit.prix.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                {produit.devise ? ` ${produit.devise}` : ""}
              </span>
            )}
          </a>
        ))}
      </div>
    </Card>
  );
}
