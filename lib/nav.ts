import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  RadarIcon,
  Users,
  Settings,
  UserCog,
  ShieldCheck,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes: string[];
  adminUniquement?: boolean;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
  },
  {
    label: "Nouveau scan",
    href: "/scan/nouveau",
    icon: RadarIcon,
    matchPrefixes: ["/scan"],
  },
  {
    label: "Prospects",
    href: "/prospects",
    icon: Users,
    matchPrefixes: ["/prospects"],
  },
  {
    label: "Paramètres",
    href: "/parametres",
    icon: Settings,
    matchPrefixes: ["/parametres"],
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    icon: UserCog,
    matchPrefixes: ["/utilisateurs"],
    adminUniquement: true,
  },
  {
    label: "Sécurité",
    href: "/securite",
    icon: ShieldCheck,
    matchPrefixes: ["/securite"],
    adminUniquement: true,
  },
];
