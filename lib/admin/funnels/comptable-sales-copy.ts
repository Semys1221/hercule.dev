import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatEurosFromCents(cents: number): string {
  return `${euroFormatter.format(cents / 100)} €`;
}

/** Unités légales actives suivies (ordre de grandeur Sirene). */
export const COMPTABLE_ENTERPRISES_MONITORED_LABEL = "4 M+";

export const COMPTABLE_TYPICAL_ANNUAL_HONORAIRES_LABEL =
  COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesLabel;

export const COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS =
  COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents;

export function formatComptableTypicalMonthlyHonoraires(): string {
  return `${formatEurosFromCents(COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS)} / mois`;
}

export type ComptableSignal = {
  id: string;
  label: string;
  paperwork: string;
};

/** Signaux = formalités / obligations = dossier pour un cabinet. */
export const COMPTABLE_SIGNALS: ComptableSignal[] = [
  {
    id: "creation",
    label: "création / immatriculation Sirene",
    paperwork: "première lettre de mission, choix du régime, immatriculation",
  },
  {
    id: "dirigeant",
    label: "changement de dirigeant",
    paperwork: "PV, formalités greffe, souvent une nouvelle lettre de mission",
  },
  {
    id: "regime",
    label: "sortie de micro / assujettissement TVA / passage au réel",
    paperwork: "tenue, liasse, déclarations de TVA",
  },
  {
    id: "embauche",
    label: "première embauche ou franchissement du seuil de 11 salariés",
    paperwork: "DPAE, DSN, paie, DUE",
  },
  {
    id: "statuts",
    label: "modification statutaire (siège, objet, capital, cession de parts)",
    paperwork: "formalités greffe et impacts fiscaux",
  },
];

export const COMPTABLE_PRESENTATION_PARAGRAPHS = [
  "Hercule Comptable capte en temps réel les changements d'entreprise sur plus de 4 M d'unités légales, via l'API Pappers et les sources ouvertes (INSEE Sirene, BODACC, data.gouv.fr).",
  `Cinq signaux produisent du papier — et donc un dossier de tenue, de social ou de formalités : ${COMPTABLE_SIGNALS.map((signal) => signal.label).join(", ")}.`,
  "Chaque demande est ensuite qualifiée par Live Qualification. Nous provisionnons Calendly Pro et Zoom Pro pour vos RDV, et attribuons jusqu'à 10 missions TPE par mois en Hercule Starter — sans commission sur vos honoraires.",
] as const;

export const COMPTABLE_MODEL_HIGHLIGHTS = [
  {
    title: "3 000 €",
    description:
      "de revenus récurrents garantis en Hercule Starter après 10 missions — lettres de mission signées, pas une promesse de volume seul.",
  },
  {
    title: COMPTABLE_ENTERPRISES_MONITORED_LABEL,
    description:
      "d'entreprises suivies via Pappers et Sirene — signaux de formalités en temps réel.",
  },
  {
    title: "0 %",
    description: "de commission sur vos honoraires — vous facturez à vos tarifs.",
  },
] as const;

export const COMPTABLE_Q21_PROMPT =
  "La plupart des dirigeants {clientSegment} ont déjà un expert-comptable. Sur quels points votre cabinet est-il réellement meilleur qu'un cabinet déjà en place ?";

export const COMPTABLE_Q21_DESCRIPTION =
  "Sélectionnez jusqu'à 3 réponses. C'est ce que le dirigeant entendra en RDV — pas un argument prix.";

export const COMPTABLE_DIFFERENTIATOR_OPTIONS = [
  {
    id: "reactivite",
    label: "Accès direct au collaborateur (réponse sous 48 h, y compris hors clôture)",
    helpTitle: "Réactivité",
    helpText:
      "Le motif n°1 de changement de cabinet : un collaborateur injoignable hors période fiscale.",
  },
  {
    id: "outils",
    label: "Espace client / flux de pièces (Pennylane, ACD, etc.) plutôt que le carton à J-15",
    helpTitle: "Outils",
    helpText:
      "Pièces justificatives en flux continu, pas un carton déposé à la clôture.",
  },
  {
    id: "pilotage",
    label: "Tableaux de bord, TVA, trésorerie — pas seulement la liasse",
  },
  {
    id: "social_integre",
    label: "Paie / DSN dans la même lettre, un seul interlocuteur",
  },
  {
    id: "formalites",
    label: "Création et modifications (statuts, siège, capital) sans tout renvoyer chez l'avocat",
    helpTitle: "Formalités",
    helpText:
      "Formalités courantes (statuts, siège, capital). Les dossiers contentieux restent chez l'avocat.",
  },
  {
    id: "honoraires_lisibles",
    label: "Lettre de mission claire, pas de régularisation surprise en N+1",
  },
  {
    id: "secteur",
    label: "Spécialisation sectorielle (e-com, BNC, artisanat…)",
  },
] as const;

export const COMPTABLE_PERFORMANCE_REPORTING_RULE = {
  title: "Reporting des performances",
  description:
    "Signaler l'issue de chaque RDV dirigeant {clientSegment} (honoré, no-show, lettre signée, refus) pour le même suivi que les autres niches Hercule.",
} as const;

export const COMPTABLE_PERFORMANCE_REPORTING_INTRO =
  "Hercule suit déjà ces taux sur les développeurs, designers, SEO et conseillers financiers. Le reporting comptable s'aligne sur le même cadre.";

export const COMPTABLE_NICHE_BENCHMARK = {
  disadvantages: {
    title: "Contraintes de la niche",
    items: [
      "Service perçu comme interchangeable : faible projection aspirationnelle en vente.",
      `Honoraires modérés : ~${formatComptableTypicalMonthlyHonoraires()} de tenue TPE (${COMPTABLE_TYPICAL_ANNUAL_HONORAIRES_LABEL} / an).`,
      "Moins de marge argumentaire qu'en designer ou en SEO.",
    ],
  },
  advantages: {
    title: "Atouts — pourquoi la lettre se signe",
    items: [
      "Niche à la conversion la plus directe chez Hercule : démarche administrative plutôt que vente relationnelle.",
      "Besoin réglementaire avéré (comptabilité, TVA, paie) — pas un achat d'image comme une identité visuelle.",
      "Peu de conviction préalable à construire : le dirigeant considère l'expertise comme une obligation légale. L'enjeu du RDV est le changement de cabinet, pas la justification du recours à un expert-comptable.",
    ],
  },
} as const;
