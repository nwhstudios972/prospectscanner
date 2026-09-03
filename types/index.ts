export type {
  StatutScan,
  Plateforme,
  Priorite,
  StatutSuivi,
  Segment,
  CategorieTechnologie,
  TypeEvenementBusiness,
} from "@/lib/generated/prisma/enums";

import type {
  StatutScan,
  Priorite,
  StatutSuivi,
  Segment,
} from "@/lib/generated/prisma/enums";

// Alias conservés pour la lisibilité des composants UI génériques.
export type ScanStatus = StatutScan;
export type ProspectPriority = Priorite;
export type ProspectStatus = StatutSuivi;
export type ProspectSegment = Segment;

export interface SocialLink {
  platform: import("@/lib/generated/prisma/enums").Plateforme;
  url?: string;
  followers?: number;
  lastActivity?: string;
}

export interface DashboardStats {
  totalScans: number;
  scansEnCours: number;
  totalProspects: number;
  prospectsExcellents: number;
  tauxConversion: number;
}

export interface ApiKeyConfig {
  id: string;
  label: string;
  description: string;
  envVar: string;
  configured: boolean;
}
