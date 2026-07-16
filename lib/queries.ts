import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { DashboardStats } from "@/types";

export type ProspectWithEtablissement = Prisma.ProspectGetPayload<{
  include: { etablissement: { include: { presences: true } } };
}>;

export type ProspectWithDetails = Prisma.ProspectGetPayload<{
  include: {
    etablissement: {
      include: { presences: true; scan: true };
    };
  };
}>;

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalScans, scansEnCours, totalProspects, prospectsExcellents, convertis] =
    await Promise.all([
      prisma.scan.count(),
      prisma.scan.count({ where: { statut: "en_cours" } }),
      prisma.prospect.count(),
      prisma.prospect.count({ where: { priorite: "tres_elevee" } }),
      prisma.prospect.count({ where: { statut_suivi: "converti" } }),
    ]);

  return {
    totalScans,
    scansEnCours,
    totalProspects,
    prospectsExcellents,
    tauxConversion:
      totalProspects > 0 ? Math.round((convertis / totalProspects) * 100) : 0,
  };
}

export async function getRecentScans(limit = 10) {
  return prisma.scan.findMany({
    orderBy: { date_creation: "desc" },
    take: limit,
  });
}

export async function getAllProspects(): Promise<ProspectWithEtablissement[]> {
  return prisma.prospect.findMany({
    include: { etablissement: { include: { presences: true } } },
    orderBy: { score: "desc" },
  });
}

export async function getProspectDetail(
  id: string,
): Promise<ProspectWithDetails | null> {
  return prisma.prospect.findUnique({
    where: { id },
    include: {
      etablissement: {
        include: { presences: true, scan: true },
      },
    },
  });
}

export type ScanWithEtablissements = Prisma.ScanGetPayload<{
  include: {
    etablissements: {
      include: { presences: true; prospect: true };
    };
  };
}>;

export async function getScanDetail(
  id: string,
): Promise<ScanWithEtablissements | null> {
  return prisma.scan.findUnique({
    where: { id },
    include: {
      etablissements: {
        include: { presences: true, prospect: true },
        orderBy: { date_creation: "asc" },
      },
    },
  });
}

export async function getUtilisateurs() {
  return prisma.utilisateur.findMany({
    select: {
      id: true,
      email: true,
      est_admin: true,
      actif: true,
      date_creation: true,
    },
    orderBy: { date_creation: "asc" },
  });
}

export async function getJournalConnexions() {
  return prisma.journalConnexion.findMany({
    orderBy: { connecte_a: "desc" },
  });
}

export interface InfosBienvenue {
  derniereConnexion: Date | null;
  nouveauxProspects: number;
}

// Le journal de connexion enregistre déjà la connexion en cours au moment
// où le dashboard est affiché : la connexion précédente est donc la 2e plus
// récente, pas la 1re.
export async function getInfosBienvenue(email: string): Promise<InfosBienvenue> {
  const connexions = await prisma.journalConnexion.findMany({
    where: { email, type_evenement: "connexion" },
    orderBy: { connecte_a: "desc" },
    take: 2,
    select: { connecte_a: true },
  });

  const derniereConnexion = connexions[1]?.connecte_a ?? null;

  const nouveauxProspects = derniereConnexion
    ? await prisma.prospect.count({
        where: { date_calcul: { gt: derniereConnexion } },
      })
    : 0;

  return { derniereConnexion, nouveauxProspects };
}
