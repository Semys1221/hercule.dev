import type { PitchWizardStepId } from "@/lib/admin/funnels/sales-pitch-wizard";

export type PitchTriptychZone = "do" | "differ" | "help";

export type PitchTriptychContent = {
  do: { label: string; headline: string };
  differ: { label: string; headline: string };
  help: { label: string; headline: string };
};

export const PITCH_TRIPTYCH_ZONE_LABELS: Record<PitchTriptychZone, string> = {
  do: "Ce qu'on fait",
  differ: "Ce qui nous distingue",
  help: "Ce que ça vous apporte",
};

export const PITCH_TRIPTYCH_BY_STEP: Partial<Record<PitchWizardStepId, PitchTriptychContent>> = {
  p0: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On structure votre croissance" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Infrastructure exclusive — pas une campagne",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "{goal6m} en actif cabinet" },
  },
  p2: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On valide que tout le monde est là" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Décision collective, pas de surprise après",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Pas de reprise, pas de perte de temps" },
  },
  p3: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On construit un actif, pas une location" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Zone verrouillée · infra cabinet · 0 % commission",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Ce que vous payez vous appartient" },
  },
  pGuarantee: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On garantit des RDV B2B planifiés" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "20 RDV en 3 mois — contractuel, pas « trafic »",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "{yearOneValue} € valeur année 1" },
  },
  pCgv: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On pose le cadre avant le déploiement" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "1 cabinet / zone · SLA 24 h · activation en session",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Exclusivité protégée dès J0" },
  },
  p4: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "3 piliers : Capture · Engine · Partner" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Système intégré — pas 3 prestataires",
    },
    help: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.help,
      headline: "De {currentSnapshot} → {goal6m}",
    },
  },
  p5: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On intercepte l'intention légale de zone" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Flux INSEE / BODACC — pas Google Ads",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Le dirigeant vous contacte" },
  },
  p7: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On déploie le système en 60 jours" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Fondations d'abord — volume promis à J+60",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Système live → garantie 90 j" },
  },
  p9: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On pilote avec vous, pas pour vous" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Hercule = infra · Cabinet = réponse < 24 h",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Zone {department} verrouillée 12 mois" },
  },
  pRoi: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On contracte un bénéfice mesurable" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "{guaranteeRdv} garantis — pas « leads »",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "{honoraires} → écart {gap} comblé" },
  },
  p11: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On répond avant de choisir" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Pas de surprise post-signature",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Décision éclairée sur {goal6m}" },
  },
  pDashboard: {
    do: { label: PITCH_TRIPTYCH_ZONE_LABELS.do, headline: "On active l'infrastructure" },
    differ: {
      label: PITCH_TRIPTYCH_ZONE_LABELS.differ,
      headline: "Paiement et verrou en session",
    },
    help: { label: PITCH_TRIPTYCH_ZONE_LABELS.help, headline: "Objectif : {goal6m}" },
  },
};

export const PITCH_CGV_COMPACT_HIGHLIGHTS = [
  { title: "Exclusivité", description: "1 cabinet / zone" },
  { title: "SLA", description: "Réponse inbound < 24 h" },
  { title: "Session", description: "Activation pendant l'audit" },
] as const;

export const PITCH_FAQ_COMPACT_ITEMS = [
  {
    id: "payment",
    title: "Paiement",
    body: "Un seul cabinet par zone — sans activation, la zone redevient disponible.",
  },
  {
    id: "partner",
    title: "Associé",
    body: "Horizon couvre {gap} avec {guaranteeRdv} garantis — actif de zone, pas des fiches.",
  },
  {
    id: "think",
    title: "Réflexion",
    body: "Chaque jour sans verrou laisse {department} à un confrère ou à une agence sans garantie.",
  },
] as const;
