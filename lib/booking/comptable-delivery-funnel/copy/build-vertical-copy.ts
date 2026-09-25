import type { FunnelRouteSegment, FunnelStepId } from "../schema";
import type { StepCopy, VerticalCopyBundle } from "./types";

export type EntityCopyParams = {
  routeSegment: FunnelRouteSegment;
  brandLabel: string;
  heroCaption: string;
  imagePath: string;
  /** e.g. « votre restaurant », « votre entreprise », « votre cabinet » */
  entityYour: string;
  /** e.g. « restaurant », « entreprise », « cabinet » */
  entityShort: string;
  /** Profit intention option */
  intentionProfitLabel: string;
  /** Invest option */
  investLabel: string;
  visibilityOptions: { value: string; label: string }[];
  meetingPriorityOptions: { value: string; label: string }[];
  educationLead: string;
  educationBlocks: { title: string; body: string }[];
  finalPrepEntityMention: string;
};

function choice(
  stepId: FunnelStepId,
  title: string,
  question: string,
  options: { value: string; label: string }[],
): StepCopy {
  return { stepId, kind: "single_choice", title, question, options };
}

export function buildVerticalCopy(params: EntityCopyParams): VerticalCopyBundle {
  const { entityYour, entityShort } = params;

  const steps: Record<FunnelStepId, StepCopy> = {
    intro: {
      stepId: "intro",
      kind: "intro",
      title: `Avant de choisir votre créneau, quelques questions sur ${entityYour}.`,
      body:
        "Cela nous permet de vérifier si notre accompagnement correspond réellement à votre situation.",
    },
    profitability: choice(
      "profitability",
      "Douleur principale",
      "Aujourd’hui, malgré votre activité, avez-vous le sentiment qu’il vous reste suffisamment de bénéfice à la fin du mois ?",
      [
        { value: "satisfied", label: "Oui, ma rentabilité est satisfaisante" },
        {
          value: "unsure_low",
          label: "Pas vraiment, je travaille beaucoup mais il reste trop peu",
        },
        {
          value: "insufficient",
          label: "Non, ma rentabilité est clairement insuffisante",
        },
        { value: "unknown", label: "Je ne sais pas précisément" },
      ],
    ),
    visibility: choice(
      "visibility",
      "Identification du problème",
      "Sur quel sujet avez-vous aujourd’hui le moins de visibilité ?",
      params.visibilityOptions,
    ),
    accountant_situation: choice(
      "accountant_situation",
      "Situation comptable",
      "Aujourd’hui, concernant votre comptabilité :",
      [
        {
          value: "satisfied_pilot",
          label:
            "Je suis satisfait de mon comptable, mais je souhaite mieux piloter ma rentabilité",
        },
        {
          value: "satisfied_compare",
          label: "Je suis satisfait, mais je souhaite comparer les solutions",
        },
        { value: "unsatisfied", label: "Je ne suis pas satisfait de mon comptable" },
        {
          value: "searching",
          label: "Je cherche actuellement un nouveau comptable",
        },
        { value: "none", label: "Je n’ai pas encore de comptable" },
      ],
    ),
    intention: choice(
      "intention",
      "Intention",
      "Pourquoi souhaitez-vous regarder une autre solution aujourd’hui ?",
      [
        { value: "improve_profit", label: params.intentionProfitLabel },
        { value: "change_accountant", label: "Je souhaite changer de comptable" },
        {
          value: "more_support",
          label: "Je souhaite avoir davantage de suivi et de conseils",
        },
        { value: "comparing", label: "Je compare actuellement plusieurs solutions" },
        {
          value: "understand",
          label: "Je souhaite simplement comprendre ce que vous proposez",
        },
        { value: "curious", label: "Je suis simplement curieux" },
      ],
    ),
    education: {
      stepId: "education",
      kind: "education",
      title: "Mini-éducation",
      lead: "Votre comptabilité ne suffit pas toujours à expliquer votre bénéfice.",
      paragraphs: [
        params.educationLead,
        "Notre accompagnement va au-delà de la comptabilité : nous cherchons où votre marge disparaît et quelles actions peuvent améliorer votre résultat.",
        "Nous pouvons notamment intervenir sur :",
      ],
      blocks: params.educationBlocks,
      closing:
        "L’objectif : vous permettre de conserver davantage de bénéfice à la fin du mois, sans vous demander de faire vous-même toute cette analyse.",
    },
    projection: choice(
      "projection",
      "Projection",
      `Si ${entityYour} conservait davantage de bénéfice chaque mois, qu’est-ce que cela vous permettrait principalement de faire ?`,
      [
        { value: "pay_self", label: "Me verser davantage" },
        { value: "treasury", label: "Constituer davantage de trésorerie" },
        { value: "invest", label: params.investLabel },
        { value: "hire", label: "Recruter ou renforcer mon équipe" },
        { value: "workload", label: "Réduire ma charge de travail" },
        { value: "other", label: "Autre" },
      ],
    ),
    budget: choice(
      "budget",
      "Budget",
      "Pour une prise en charge de votre comptabilité et du pilotage de votre rentabilité, quel niveau d’investissement mensuel pourriez-vous envisager ?",
      [
        { value: "lt_300", label: "Moins de 300 € / mois" },
        { value: "300_500", label: "300 à 500 € / mois" },
        { value: "500_800", label: "500 à 800 € / mois" },
        { value: "800_1200", label: "800 à 1 200 € / mois" },
        { value: "gt_1200", label: "Plus de 1 200 € / mois" },
        { value: "unknown", label: "Je ne sais pas encore" },
      ],
    ),
    engagement: choice(
      "engagement",
      "Engagement",
      `Si nous identifions une solution adaptée à ${entityYour}, seriez-vous prêt à envisager de travailler avec nous ?`,
      [
        {
          value: "yes_if_fit",
          label: "Oui, si la solution correspond à ma situation",
        },
        { value: "active_search", label: "Oui, je recherche activement une solution" },
        {
          value: "understand_first",
          label: "Je souhaite d’abord comprendre ce qui est proposé",
        },
        { value: "info_only", label: "Je souhaite simplement obtenir des informations" },
      ],
    ),
    calendly: {
      stepId: "calendly",
      kind: "calendly",
      title: "Votre situation correspond à notre accompagnement.",
      paragraphs: [
        "L’entretien dure environ 20 minutes.",
        "Nous regarderons votre situation, vos principaux postes de rentabilité et ce que nous pourrions concrètement prendre en charge.",
      ],
      cta: "Choisissez maintenant votre créneau.",
    },
    confirmation: {
      stepId: "confirmation",
      kind: "confirmation",
      title: "Votre rendez-vous est confirmé.",
      body:
        "Nous avons enregistré vos réponses. Avant votre échange, prenez quelques minutes pour préparer les informations qui permettront à notre expert de comprendre rapidement votre situation.",
    },
    annual_revenue: choice(
      "annual_revenue",
      "Préparation du rendez-vous",
      `Quel est approximativement le chiffre d’affaires annuel de ${entityYour} ?`,
      [
        { value: "lt_250k", label: "Moins de 250 000 €" },
        { value: "250_500k", label: "250 000 à 500 000 €" },
        { value: "500k_1m", label: "500 000 à 1 M€" },
        { value: "gt_1m", label: "Plus de 1 M€" },
        { value: "unknown", label: "Je ne sais pas précisément" },
      ],
    ),
    team_size: choice(
      "team_size",
      "Préparation du rendez-vous",
      `Combien de personnes travaillent actuellement dans ${entityYour} ?`,
      [
        { value: "1_3", label: "1 à 3" },
        { value: "4_6", label: "4 à 6" },
        { value: "7_10", label: "7 à 10" },
        { value: "gt_10", label: "Plus de 10" },
      ],
    ),
    meeting_priority: choice(
      "meeting_priority",
      "Préparation du rendez-vous",
      "Parmi les sujets suivants, lequel aimeriez-vous que nous regardions en priorité pendant le rendez-vous ?",
      params.meetingPriorityOptions,
    ),
    free_text_problem: {
      stepId: "free_text_problem",
      kind: "free_text",
      title: "Faire formuler le problème",
      question: `En une phrase, qu’aimeriez-vous principalement améliorer dans ${entityYour} ?`,
      placeholder: "Décrivez en une phrase votre priorité…",
    },
    mental_prep: {
      stepId: "mental_prep",
      kind: "education",
      title: "Ce que nous allons regarder ensemble",
      lead: "Pendant le rendez-vous, nous allons chercher à comprendre :",
      paragraphs: [],
      blocks: [
        {
          title: "1. Où votre marge disparaît",
          body: "Quels postes réduisent actuellement votre bénéfice.",
        },
        {
          title: "2. Ce qui peut être amélioré",
          body: "Quels leviers peuvent concrètement améliorer votre résultat.",
        },
        {
          title: "3. Ce que nous pouvons prendre en charge",
          body: "Ce que notre accompagnement peut gérer pour vous au quotidien.",
        },
      ],
      closing:
        "Vous n’avez pas besoin de réaliser une analyse avant le rendez-vous.",
    },
    final_intention: choice(
      "final_intention",
      "Dernière validation d’intention",
      "Si l’entretien confirme qu’il existe des leviers d’amélioration et que notre accompagnement correspond à votre situation, êtes-vous prêt à envisager de nous confier votre comptabilité et votre pilotage ?",
      [
        { value: "yes", label: "Oui" },
        {
          value: "yes_if_terms",
          label: "Oui, si les conditions correspondent à mes attentes",
        },
        {
          value: "compare",
          label: "Je souhaite d’abord comparer avec d’autres solutions",
        },
        { value: "understand_offer", label: "Je souhaite simplement comprendre l’offre" },
      ],
    ),
    final_prep: {
      stepId: "final_prep",
      kind: "checklist",
      title: "Votre rendez-vous est prêt.",
      body:
        "Votre expert dispose maintenant des informations nécessaires pour préparer votre échange.",
      items: [
        "votre chiffre d’affaires approximatif ;",
        "vos principaux coûts ;",
        "les coordonnées de votre comptable actuel si vous souhaitez comparer les solutions ;",
        params.finalPrepEntityMention,
      ],
      closing:
        "Vous n’avez pas besoin de préparer vos chiffres vous-même : nous les analyserons ensemble pendant l’entretien.",
    },
  };

  return {
    routeSegment: params.routeSegment,
    brandLabel: params.brandLabel,
    heroCaption: params.heroCaption,
    imagePath: params.imagePath,
    steps,
  };
}
