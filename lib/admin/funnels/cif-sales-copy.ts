import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatEurosFromCents(cents: number): string {
  return `${euroFormatter.format(cents / 100)} €`;
}

/** Unités légales actives suivies (ordre de grandeur Sirene). */
export const CIF_ENTERPRISES_MONITORED_LABEL = "4 M+";

export const CIF_TYPICAL_ANNUAL_HONORAIRES_LABEL =
  COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesLabel;

export const CIF_TYPICAL_MONTHLY_HONORAIRES_CENTS =
  COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents;

export function formatCifTypicalMonthlyHonoraires(): string {
  return `${formatEurosFromCents(CIF_TYPICAL_MONTHLY_HONORAIRES_CENTS)} / mois`;
}

export type CifSignal = {
  id: string;
  label: string;
  paperwork: string;
};

/** Signaux = événements patrimoniaux / trésorerie = mandat pour un cabinet CIF/CGP. */
export const CIF_SIGNALS: CifSignal[] = [
  {
    id: "creation",
    label: "création / transmission de patrimoine",
    paperwork: "ouverture PER, clause bénéficiaire, structuration",
  },
  {
    id: "dirigeant",
    label: "cession / transmission d'entreprise",
    paperwork: "pacte Dutreil, holding, plus-value",
  },
  {
    id: "regime",
    label: "optimisation IS / IR et trésorerie d'entreprise",
    paperwork: "épargne, placement, ingénierie fiscale",
  },
  {
    id: "embauche",
    label: "besoin de cash-flow / placement de trésorerie",
    paperwork: "compte-titres, contrat de capitalisation",
  },
  {
    id: "statuts",
    label: "retraite / prévoyance du dirigeant",
    paperwork: "PER, Madelin, assurance-vie",
  },
];

export const CIF_PRESENTATION_PARAGRAPHS = [
  "Hercule CIF capte en temps réel les changements d'entreprise sur plus de 4 M d'unités légales, via l'API Pappers et les sources ouvertes (INSEE Sirene, BODACC, data.gouv.fr).",
  `Cinq signaux produisent un mandat de conseil patrimonial, fiscal ou trésorerie : ${CIF_SIGNALS.map((signal) => signal.label).join(", ")}.`,
  "Chaque demande est ensuite qualifiée par Live Qualification. Nous provisionnons Calendly Pro et Zoom Pro pour vos RDV, et attribuons jusqu'à 10 missions PME par mois en Hercule Starter — sans commission sur vos honoraires.",
] as const;

export const CIF_MODEL_HIGHLIGHTS = [
  {
    title: "3 000 €",
    description:
      "de revenus récurrents garantis en Hercule Starter après 10 missions — mandats signés, pas une promesse de volume seul.",
  },
  {
    title: CIF_ENTERPRISES_MONITORED_LABEL,
    description:
      "d'entreprises suivies via Pappers et Sirene — signaux patrimoniaux et trésorerie en temps réel.",
  },
  {
    title: "0 %",
    description: "de commission sur vos honoraires — vous facturez à vos tarifs.",
  },
] as const;

export const CIF_Q21_PROMPT =
  "La plupart des dirigeants {clientSegment} ont déjà une banque privée ou un CGP. Sur quels points votre cabinet est-il réellement meilleur qu'un interlocuteur déjà en place ?";

export const CIF_Q21_DESCRIPTION =
  "Sélectionnez jusqu'à 3 réponses. C'est ce que le dirigeant entendra en RDV — pas un argument prix.";

export const CIF_DIFFERENTIATOR_OPTIONS = [
  {
    id: "architecture_ouverte",
    label: "Architecture ouverte — pas de contrat lié à un seul assureur ou banque",
    helpTitle: "Architecture ouverte",
    helpText:
      "Le dirigeant compare les solutions du marché, pas un catalogue captif d'un réseau.",
  },
  {
    id: "acces_associe",
    label: "Accès direct à un associé ou conseiller senior (réponse sous 48 h)",
    helpTitle: "Accès direct",
    helpText:
      "Motif n°1 de changement : interlocuteur injoignable ou junior sans décision.",
  },
  {
    id: "reporting_patrimonial",
    label: "Reporting patrimonial consolidé (encours, liquidités, objectifs)",
    helpTitle: "Reporting",
    helpText:
      "Vision globale patrimoine + trésorerie d'entreprise, pas seulement un relevé produit.",
  },
  {
    id: "remuneration_lisible",
    label: "Rémunération lisible — honoraires et commissions explicités dans le mandat",
    helpTitle: "Transparence",
    helpText:
      "Pas de frais cachés ni de produits imposés sans lien avec l'objectif du dirigeant.",
  },
  {
    id: "specialisation_dirigeant",
    label: "Spécialisation dirigeant / trésorerie d'entreprise (pas seulement épargne personnelle)",
  },
  {
    id: "transmission",
    label: "Ingénierie transmission — Dutreil, holding, cession structurée",
    helpTitle: "Transmission",
    helpText:
      "Accompagnement structuré sur la cession ou la transmission, pas un simple arbitrage produit.",
  },
  {
    id: "secteur",
    label: "Spécialisation sectorielle (dirigeants BTP, professions libérales, e-commerce…)",
  },
] as const;

export const CIF_PERFORMANCE_REPORTING_RULE = {
  title: "Reporting des performances",
  description:
    "Signaler l'issue de chaque RDV dirigeant {clientSegment} (honoré, no-show, mandat signé, refus) pour le même suivi que les autres niches Hercule.",
} as const;

export const CIF_PERFORMANCE_REPORTING_INTRO =
  "Hercule suit déjà ces taux sur les développeurs, designers, SEO et conseillers financiers. Le reporting CIF s'aligne sur le même cadre.";

export const CIF_NICHE_BENCHMARK = {
  disadvantages: {
    title: "Contraintes de la niche",
    items: [
      "Concurrence forte des banques privées et réseaux — le dirigeant compare avant de changer.",
      `Honoraires modérés : ~${formatCifTypicalMonthlyHonoraires()} de conseil dirigeant (${CIF_TYPICAL_ANNUAL_HONORAIRES_LABEL} / an).`,
      "Cycle de décision plus long qu'une obligation comptable — le mandat se construit en RDV.",
    ],
  },
  advantages: {
    title: "Atouts — pourquoi le mandat se signe",
    items: [
      "Signaux patrimoniaux concrets (cession, trésorerie, transmission) — le dirigeant arrive avec un besoin identifié.",
      "Besoin réel de structuration (Dutreil, holding, retraite) — pas un achat d'image comme une identité visuelle.",
      "Peu de conviction préalable à construire sur l'utilité du conseil : l'enjeu du RDV est le changement d'interlocuteur, pas la justification du recours à un CIF.",
    ],
  },
} as const;
