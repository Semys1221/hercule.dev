import type { ComponentType } from "react";
import {
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calculator,
  Cpu,
  Factory,
  GraduationCap,
  Hammer,
  HardHat,
  HeartPulse,
  Home,
  Package,
  Plane,
  ScanLine,
  Shirt,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Sun,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Waves,
  Zap,
} from "lucide-react";

export type SecteurConfig = {
  icon: ComponentType<{ className?: string }>;
  badgeClass: string;
  iconClass: string;
  iconBoxClass: string;
};

function withIcon(
  icon: ComponentType<{ className?: string }>,
  tone: SecteurConfig,
): SecteurConfig {
  return { ...tone, icon };
}

const TONES: Record<string, SecteurConfig> = {
  amber: {
    icon: Package,
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    iconClass: "text-amber-400",
    iconBoxClass: "border-amber-500/25 bg-amber-500/10",
  },
  indigo: {
    icon: Package,
    badgeClass: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
    iconClass: "text-indigo-400",
    iconBoxClass: "border-indigo-500/25 bg-indigo-500/10",
  },
  yellow: {
    icon: Package,
    badgeClass: "border-yellow-500/25 bg-yellow-500/10 text-yellow-400",
    iconClass: "text-yellow-400",
    iconBoxClass: "border-yellow-500/25 bg-yellow-500/10",
  },
  cyan: {
    icon: Package,
    badgeClass: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
    iconClass: "text-cyan-400",
    iconBoxClass: "border-cyan-500/25 bg-cyan-500/10",
  },
  blue: {
    icon: Package,
    badgeClass: "border-blue-500/25 bg-blue-500/10 text-blue-400",
    iconClass: "text-blue-400",
    iconBoxClass: "border-blue-500/25 bg-blue-500/10",
  },
  orange: {
    icon: Package,
    badgeClass: "border-orange-500/25 bg-orange-500/10 text-orange-400",
    iconClass: "text-orange-400",
    iconBoxClass: "border-orange-500/25 bg-orange-500/10",
  },
  violet: {
    icon: Package,
    badgeClass: "border-violet-500/25 bg-violet-500/10 text-violet-400",
    iconClass: "text-violet-400",
    iconBoxClass: "border-violet-500/25 bg-violet-500/10",
  },
  rose: {
    icon: Package,
    badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-400",
    iconClass: "text-rose-400",
    iconBoxClass: "border-rose-500/25 bg-rose-500/10",
  },
  emerald: {
    icon: Package,
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    iconClass: "text-emerald-400",
    iconBoxClass: "border-emerald-500/25 bg-emerald-500/10",
  },
  pink: {
    icon: Package,
    badgeClass: "border-pink-500/25 bg-pink-500/10 text-pink-400",
    iconClass: "text-pink-400",
    iconBoxClass: "border-pink-500/25 bg-pink-500/10",
  },
  purple: {
    icon: Package,
    badgeClass: "border-purple-500/25 bg-purple-500/10 text-purple-400",
    iconClass: "text-purple-400",
    iconBoxClass: "border-purple-500/25 bg-purple-500/10",
  },
  sky: {
    icon: Package,
    badgeClass: "border-sky-500/25 bg-sky-500/10 text-sky-400",
    iconClass: "text-sky-400",
    iconBoxClass: "border-sky-500/25 bg-sky-500/10",
  },
  slate: {
    icon: Package,
    badgeClass: "border-slate-500/25 bg-slate-500/10 text-slate-400",
    iconClass: "text-slate-400",
    iconBoxClass: "border-slate-500/25 bg-slate-500/10",
  },
};

export const SECTEUR_CONFIG: Record<string, SecteurConfig> = {
  Comptabilité: withIcon(Calculator, TONES.amber),
  "Conseil financier": withIcon(TrendingUp, TONES.indigo),
  Solaire: withIcon(Sun, TONES.yellow),
  "Pompe à chaleur": withIcon(Zap, TONES.cyan),
  Piscines: withIcon(Waves, TONES.blue),
  "Rénovation énergétique": withIcon(Home, TONES.orange),
  "Grossiste emballage": withIcon(Package, TONES.violet),
  "Fournitures médicales": withIcon(Stethoscope, TONES.rose),
  "Distribution professionnelle": withIcon(Truck, TONES.emerald),
  "Santé esthétique": {
    icon: Sparkles,
    badgeClass: "border-zinc-600 bg-zinc-800/80 text-zinc-400",
    iconClass: "text-zinc-400",
    iconBoxClass: "border-zinc-700 bg-zinc-800",
  },
  "Santé libérale": withIcon(Stethoscope, TONES.rose),
  Artisanat: withIcon(Hammer, TONES.amber),
  Restauration: withIcon(UtensilsCrossed, TONES.orange),
  "Ressources humaines": withIcon(Users, TONES.blue),
  Textile: withIcon(Shirt, TONES.pink),
  Conseil: withIcon(Briefcase, TONES.indigo),
  Mode: withIcon(Shirt, TONES.pink),
  Formation: withIcon(GraduationCap, TONES.purple),
  Immobilier: withIcon(Building, TONES.emerald),
  "SaaS B2B": withIcon(Cpu, TONES.indigo),
  Santé: withIcon(HeartPulse, TONES.rose),
  Logistique: withIcon(Truck, TONES.emerald),
  "E-commerce": withIcon(ShoppingCart, TONES.violet),
  Industrie: withIcon(Factory, TONES.slate),
  Éducation: withIcon(GraduationCap, TONES.blue),
  "Services B2B": withIcon(Building2, TONES.cyan),
  "Expertise comptable": withIcon(Calculator, TONES.amber),
  "Clinique dentaire": withIcon(Stethoscope, TONES.rose),
  "BTP / rénovation": withIcon(HardHat, TONES.orange),
  "Transport routier": withIcon(Truck, TONES.emerald),
  "Formation continue": withIcon(BookOpen, TONES.purple),
  "Industrie aéronautique": withIcon(Plane, TONES.sky),
  "Audit patrimoine": withIcon(TrendingUp, TONES.indigo),
  "Promotion immobilière": withIcon(Building, TONES.emerald),
  "Imagerie médicale": withIcon(ScanLine, TONES.rose),
  "Conseil de gestion": withIcon(Briefcase, TONES.indigo),
};

const DEFAULT_MARKETING_CONFIG: SecteurConfig = {
  icon: Package,
  badgeClass: "border-zinc-700 bg-zinc-800 text-zinc-400",
  iconClass: "text-zinc-300",
  iconBoxClass: "border-zinc-700 bg-zinc-800",
};

const DEFAULT_INTERNAL_CONFIG: SecteurConfig = {
  icon: Package,
  badgeClass: "border-border bg-muted text-muted-foreground",
  iconClass: "text-muted-foreground",
  iconBoxClass: "border-border bg-muted",
};

export function getSecteurConfig(
  secteur: string,
  variant: "marketing" | "internal" = "marketing",
): SecteurConfig {
  const config = SECTEUR_CONFIG[secteur];
  if (config) return config;
  return variant === "internal" ? DEFAULT_INTERNAL_CONFIG : DEFAULT_MARKETING_CONFIG;
}
