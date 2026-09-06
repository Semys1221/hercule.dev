import {
  Building2,
  Cpu,
  Gem,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { AgencyPresetId } from "@/lib/admin/funnels/sales-preset-scoring";

export type PresetOpportunityCard = {
  id: string;
  secteur: string;
  zone: string;
  prestation: string;
  budget: string;
  taille: string;
  companyNameBlurred: string;
  domainBlurred: string;
  minDaysOffset: number;
  maxDaysOffset: number;
};

export type AgencyPreset = {
  id: AgencyPresetId;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  cards: PresetOpportunityCard[];
};

export const AGENCY_PRESETS: Record<AgencyPresetId, AgencyPreset> = {
  serial: {
    id: "serial",
    name: "Serial",
    tagline: "Volume élevé, livraison standardisée, tickets accessibles.",
    description:
      "Vous êtes une agence à forte capacité de livraison, avec des processus documentés et un volume de projets élevé. Les opportunités les plus adaptées sont des mandats PME récurrents, à budget cadré et démarrage rapide.",
    icon: Layers,
    cards: [
      {
        id: "serial-1",
        secteur: "Artisanat",
        zone: "Île-de-France",
        prestation: "Site vitrine + maintenance mensuelle",
        budget: "1 800 €",
        taille: "TPE — 4 salariés",
        companyNameBlurred: "Sarl ****",
        domainBlurred: "****.fr",
        minDaysOffset: 8,
        maxDaysOffset: 15,
      },
      {
        id: "serial-2",
        secteur: "Restauration",
        zone: "Lyon",
        prestation: "Refonte site + module de réservation",
        budget: "2 500 €",
        taille: "PME — 18 salariés",
        companyNameBlurred: "SAS ****",
        domainBlurred: "****.com",
        minDaysOffset: 12,
        maxDaysOffset: 20,
      },
      {
        id: "serial-3",
        secteur: "Ressources humaines",
        zone: "Nantes",
        prestation: "Landing page + Google Ads récurrent",
        budget: "1 800 € / mois",
        taille: "TPE — 8 salariés",
        companyNameBlurred: "Cabinet ****",
        domainBlurred: "****.fr",
        minDaysOffset: 10,
        maxDaysOffset: 18,
      },
      {
        id: "serial-4",
        secteur: "Textile",
        zone: "Lille",
        prestation: "Maintenance e-commerce + SEO",
        budget: "1 500 € / mois",
        taille: "PME — 22 salariés",
        companyNameBlurred: "**** Studio",
        domainBlurred: "****.shop",
        minDaysOffset: 15,
        maxDaysOffset: 25,
      },
      {
        id: "serial-5",
        secteur: "Conseil",
        zone: "Bordeaux",
        prestation: "Site one-page + contenu",
        budget: "1 800 €",
        taille: "Indépendant",
        companyNameBlurred: "**** Conseil",
        domainBlurred: "****.io",
        minDaysOffset: 20,
        maxDaysOffset: 30,
      },
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "Acquisition payante et organique, contrats récurrents.",
    description:
      "Vous êtes une agence d'acquisition. Paid Ads, SEO et récurrence forment votre cœur de métier. Les opportunités ciblées sont des budgets mensuels stables, avec un besoin de performance mesurable.",
    icon: TrendingUp,
    cards: [
      {
        id: "growth-1",
        secteur: "Mode",
        zone: "Paris",
        prestation: "Meta Ads e-commerce — rétention + acquisition",
        budget: "2 200 € / mois",
        taille: "PME — 35 salariés",
        companyNameBlurred: "**** Paris",
        domainBlurred: "****.co",
        minDaysOffset: 9,
        maxDaysOffset: 16,
      },
      {
        id: "growth-2",
        secteur: "Formation",
        zone: "Remote",
        prestation: "Google Ads + tracking conversions",
        budget: "2 000 € / mois",
        taille: "TPE — 9 salariés",
        companyNameBlurred: "**** Academy",
        domainBlurred: "****.fr",
        minDaysOffset: 11,
        maxDaysOffset: 19,
      },
      {
        id: "growth-3",
        secteur: "Immobilier",
        zone: "Marseille",
        prestation: "SEO local + contenus organiques",
        budget: "1 900 € / mois",
        taille: "PME — 14 salariés",
        companyNameBlurred: "Agence ****",
        domainBlurred: "****.immo",
        minDaysOffset: 14,
        maxDaysOffset: 22,
      },
      {
        id: "growth-4",
        secteur: "SaaS B2B",
        zone: "Remote",
        prestation: "LinkedIn Ads + landing pages",
        budget: "2 500 € / mois",
        taille: "PME — 40 salariés",
        companyNameBlurred: "**** Labs",
        domainBlurred: "****.io",
        minDaysOffset: 8,
        maxDaysOffset: 18,
      },
      {
        id: "growth-5",
        secteur: "Santé",
        zone: "Toulouse",
        prestation: "Acquisition multi-sites + reporting",
        budget: "1 800 € / mois",
        taille: "Réseau — 6 établissements",
        companyNameBlurred: "Groupe ****",
        domainBlurred: "****.sante",
        minDaysOffset: 18,
        maxDaysOffset: 28,
      },
    ],
  },
  architect: {
    id: "architect",
    name: "Architect",
    tagline: "Développement, no-code et intégrations techniques.",
    description:
      "Vous êtes une agence technique. Front, back, Shopify ou automatisation : vous livrez des systèmes, pas seulement des pages. Les opportunités ciblées demandent un interlocuteur capable de concevoir et d'intégrer.",
    icon: Cpu,
    cards: [
      {
        id: "architect-1",
        secteur: "Logistique",
        zone: "Île-de-France",
        prestation: "Portail client + intégration ERP",
        budget: "8 500 €",
        taille: "PME — 45 salariés",
        companyNameBlurred: "**** Logistics",
        domainBlurred: "****.eu",
        minDaysOffset: 10,
        maxDaysOffset: 21,
      },
      {
        id: "architect-2",
        secteur: "E-commerce",
        zone: "Lille",
        prestation: "Migration Shopify + automatisations",
        budget: "6 200 €",
        taille: "PME — 28 salariés",
        companyNameBlurred: "Maison ****",
        domainBlurred: "****.shop",
        minDaysOffset: 13,
        maxDaysOffset: 24,
      },
      {
        id: "architect-3",
        secteur: "Industrie",
        zone: "Grenoble",
        prestation: "Refonte technique + espace client",
        budget: "7 000 €",
        taille: "PME — 60 salariés",
        companyNameBlurred: "**** Industrie",
        domainBlurred: "****.com",
        minDaysOffset: 16,
        maxDaysOffset: 26,
      },
      {
        id: "architect-4",
        secteur: "Éducation",
        zone: "Remote",
        prestation: "Webflow + automatisation inscriptions",
        budget: "4 800 €",
        taille: "TPE — 12 salariés",
        companyNameBlurred: "École ****",
        domainBlurred: "****.edu",
        minDaysOffset: 8,
        maxDaysOffset: 17,
      },
      {
        id: "architect-5",
        secteur: "Services B2B",
        zone: "Lyon",
        prestation: "App métier légère + API",
        budget: "9 000 €",
        taille: "PME — 32 salariés",
        companyNameBlurred: "**** Partners",
        domainBlurred: "****.io",
        minDaysOffset: 20,
        maxDaysOffset: 30,
      },
    ],
  },
  specialist: {
    id: "specialist",
    name: "Specialist",
    tagline: "Expertise étroite, projets complexes, tickets premium.",
    description:
      "Vous êtes une agence spécialisée. Peu de verticales, un haut niveau d'exigence, des tickets plus élevés. Les opportunités ciblées sont des dossiers à forte composante métier, trop spécifiques pour une agence généraliste.",
    icon: Building2,
    cards: [
      {
        id: "specialist-1",
        secteur: "Expertise comptable",
        zone: "Paris",
        prestation: "Plateforme de recrutement clients + SEO métier",
        budget: "4 500 €",
        taille: "Cabinet — 25 associés",
        companyNameBlurred: "Cabinet ****",
        domainBlurred: "****.expert",
        minDaysOffset: 9,
        maxDaysOffset: 18,
      },
      {
        id: "specialist-2",
        secteur: "Clinique dentaire",
        zone: "Nice",
        prestation: "Parcours patient + campagnes locales",
        budget: "3 800 € / mois",
        taille: "Groupe — 3 cliniques",
        companyNameBlurred: "Clinique ****",
        domainBlurred: "****.dental",
        minDaysOffset: 12,
        maxDaysOffset: 22,
      },
      {
        id: "specialist-3",
        secteur: "BTP / rénovation",
        zone: "Lyon",
        prestation: "Tunnel devis + CRM chantier",
        budget: "5 200 €",
        taille: "PME — 40 salariés",
        companyNameBlurred: "**** Bâtiment",
        domainBlurred: "****.fr",
        minDaysOffset: 15,
        maxDaysOffset: 25,
      },
      {
        id: "specialist-4",
        secteur: "Transport routier",
        zone: "Strasbourg",
        prestation: "Site + génération de leads B2B",
        budget: "3 600 €",
        taille: "PME — 55 salariés",
        companyNameBlurred: "Transports ****",
        domainBlurred: "****.log",
        minDaysOffset: 11,
        maxDaysOffset: 20,
      },
      {
        id: "specialist-5",
        secteur: "Formation continue",
        zone: "Remote",
        prestation: "Refonte catalogue + tracking OPCO",
        budget: "4 200 €",
        taille: "Organisme — 18 formateurs",
        companyNameBlurred: "**** Formation",
        domainBlurred: "****.org",
        minDaysOffset: 18,
        maxDaysOffset: 29,
      },
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Faible volume, haute valeur, grandes structures.",
    description:
      "Vous êtes une agence à faible volume et tickets élevés. Vous sélectionnez vos mandats. Les opportunités ciblées sont des ETI / grandes entreprises, avec un besoin stratégique et un budget à la hauteur.",
    icon: Gem,
    cards: [
      {
        id: "premium-1",
        secteur: "Industrie aéronautique",
        zone: "Toulouse",
        prestation: "Refonte corporate + espace fournisseurs",
        budget: "18 000 €",
        taille: "ETI — 280 salariés",
        companyNameBlurred: "**** Aéro",
        domainBlurred: "****.aero",
        minDaysOffset: 14,
        maxDaysOffset: 26,
      },
      {
        id: "premium-2",
        secteur: "Audit patrimoine",
        zone: "Paris",
        prestation: "Plateforme de leads HNW + branding",
        budget: "12 000 €",
        taille: "Cabinet — 40 collaborateurs",
        companyNameBlurred: "**** Patrimoine",
        domainBlurred: "****.private",
        minDaysOffset: 10,
        maxDaysOffset: 21,
      },
      {
        id: "premium-3",
        secteur: "Promotion immobilière",
        zone: "Lyon",
        prestation: "Sites programmes + acquisition premium",
        budget: "8 500 € / mois",
        taille: "Groupe — 120 salariés",
        companyNameBlurred: "Groupe ****",
        domainBlurred: "****.immo",
        minDaysOffset: 16,
        maxDaysOffset: 28,
      },
      {
        id: "premium-4",
        secteur: "Imagerie médicale",
        zone: "Île-de-France",
        prestation: "Parcours patient multi-sites + CRM",
        budget: "14 000 €",
        taille: "Réseau — 8 centres",
        companyNameBlurred: "**** Imagerie",
        domainBlurred: "****.med",
        minDaysOffset: 8,
        maxDaysOffset: 19,
      },
      {
        id: "premium-5",
        secteur: "Conseil de gestion",
        zone: "Remote / Paris",
        prestation: "Refonte institutionnelle + inbound B2B",
        budget: "9 500 € / mois",
        taille: "ETI — 90 consultants",
        companyNameBlurred: "**** Advisory",
        domainBlurred: "****.consulting",
        minDaysOffset: 20,
        maxDaysOffset: 30,
      },
    ],
  },
};

export function getAgencyPreset(id: AgencyPresetId): AgencyPreset {
  return AGENCY_PRESETS[id];
}

export function getPresetCards(id: AgencyPresetId): PresetOpportunityCard[] {
  return AGENCY_PRESETS[id].cards;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export function formatContractWindow(
  card: Pick<PresetOpportunityCard, "minDaysOffset" | "maxDaysOffset">,
  from: Date = new Date(),
): string {
  const min = new Date(from);
  min.setDate(min.getDate() + card.minDaysOffset);
  const max = new Date(from);
  max.setDate(max.getDate() + card.maxDaysOffset);
  return `Prêt pour contrat entre ${dateFormatter.format(min)} et ${dateFormatter.format(max)}`;
}
