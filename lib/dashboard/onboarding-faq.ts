import {
  interpolateBleed,
  type BleedTrack,
} from "@/lib/admin/funnels/sales-bleed-track";
import type { DashboardBleedContext } from "@/lib/dashboard/bleed-context";
import type { DashboardFaqAudience } from "@/lib/dashboard/types";

export type OnboardingFaqItem = {
  id: string;
  q: string;
  a: string;
};

export type OnboardingFaqConfig = {
  subtitle: string;
  items: OnboardingFaqItem[];
  tieDown: string;
};

export type OnboardingFaqContext = DashboardBleedContext | undefined;

export type HesitationSlide = {
  id: string;
  title: string;
  body: string;
  alert?: string;
};

const OBJ_PAYMENT_Q =
  "Pourquoi l'activation et le paiement se font-ils pendant notre session d'audit ?";

const OBJ_ASSOCIE_Q =
  "Je dois en parler à mon associé avant de décider. Comment faire ?";

const OBJ_REFLECHIR_Q =
  "Je souhaite y réfléchir — est-ce que je peux attendre ?";

const OBJ_CABINET_ASSOCIE_Q =
  "Le cabinet doit en parler à un associé avant de décider. Comment faire ?";

const OBJ_CABINET_REFLECHIR_Q =
  "Le cabinet souhaite y réfléchir — peut-il attendre ?";

const HONORAIRES_FORMATTER = new Intl.NumberFormat("fr-FR");

function formatHonoraires(bleed: BleedTrack): string {
  if (typeof bleed.honorairesAnnual !== "number") {
    return "—";
  }
  return HONORAIRES_FORMATTER.format(bleed.honorairesAnnual);
}

export function interpolateDashboardCopy(
  template: string,
  context?: OnboardingFaqContext,
): string {
  if (!context) {
    return template;
  }

  const { bleed, firstName, zone } = context;
  let result = interpolateBleed(template, bleed);
  result = result.replace(/\{honoraires\}/g, formatHonoraires(bleed));
  result = result.replace(/\{departement\}/g, zone?.trim() || "—");
  result = result.replace(/\{prenom\}/g, firstName?.trim() || "");
  return result;
}

function buildPreventiveObjections(
  audience: DashboardFaqAudience,
  context?: OnboardingFaqContext,
): OnboardingFaqItem[] {
  if (audience === "entreprise") {
    return [];
  }

  if (audience === "agence") {
    return [
      {
        id: "obj-payment",
        q: OBJ_PAYMENT_Q,
        a: interpolateDashboardCopy(
          "Hercule attribue les contrats PME en exclusivité. Les créneaux et la zone sont provisionnés à la validation. Sans activation pendant la session, le pipeline ne démarre pas et la place peut être réattribuée.",
          context,
        ),
      },
      {
        id: "obj-associe",
        q: OBJ_ASSOCIE_Q,
        a: interpolateDashboardCopy(
          "L'écart {gap} est documenté pendant l'audit. Hercule Starter est couvert par une garantie contractuelle de revenus récurrents cumulés. Le risque financier de {business} est mathématiquement limité. L'associé valide un ROI contractuel, pas un caprice. On active l'onboarding et le double du contrat est envoyé pour validation associé.",
          context,
        ),
      },
      {
        id: "obj-reflechir",
        q: OBJ_REFLECHIR_Q,
        a: interpolateDashboardCopy(
          "La réflexion est légitime. Mais sur quoi ? Si {business} a besoin de traiter {cause} et que l'écart {gap} est réel, chaque jour de statu quo laisse les dossiers de la zone à un confrère. Le contrat garantit le résultat — le coût de l'attente, c'est l'écart inchangé.",
          context,
        ),
      },
    ];
  }

  const cabinetNoun = audience === "cif" ? "cabinet CIF" : "cabinet";

  return [
    {
      id: "obj-payment",
      q: OBJ_PAYMENT_Q,
      a: interpolateDashboardCopy(
        "Foundation s'appuie sur une bande passante réelle sur les flux légaux de l'État. Pour garantir l'exclusivité, **un seul cabinet** est connecté par zone économique.\n\nLa zone **{departement}** est ouverte à l'issue de cet audit. À la validation, le verrou est posé et le déploiement démarre.\n\nSans activation pendant la session, la zone redevient disponible pour d'autres cabinets en cours d'audit sur ce secteur. L'attribution est alors réouverte pour **12 mois**.\n\nChez Hercule, nous ne relançons pas par email : c'est pour cela que la décision se prend ensemble, maintenant.",
        context,
      ),
    },
    {
      id: "obj-associe",
      q: OBJ_CABINET_ASSOCIE_Q,
      a: interpolateDashboardCopy(
        `C'est une démarche courante — et c'est précisément l'objet de cet audit.\n\nLe cabinet a posé un cadre clair : **{honoraires} €/an** d'honoraires et un écart de **{gap}**. Hercule Horizon inclut une garantie contractuelle de **5 000 €** de récurrent cumulé sur **90 jours**.\n\nL'associé ne valide pas une campagne marketing : il valide un **actif de zone** avec un ROI contractuel.\n\nL'onboarding démarre ensemble ; le double du contrat part pour validation associé dans la foulée.`,
        context,
      ),
    },
    {
      id: "obj-reflechir",
      q: OBJ_CABINET_REFLECHIR_Q,
      a: interpolateDashboardCopy(
        `**Bien sûr.** Prendre du recul à ce stade est normal — surtout sur un investissement structurant.\n\nPour avancer sereinement, il peut être utile de préciser **sur quoi** porte la réflexion : le déploiement, le calendrier, l'associé, ou autre chose ?\n\nCe que nous avons cadré ensemble : le ${cabinetNoun} cherche à traiter **{cause}**, avec un écart estimé à **{gap}**. Foundation est conçu pour structurer cette dynamique sur la zone **{departement}**.\n\nCôté marché : **une licence par secteur**. D'autres cabinets passent un audit sur cette zone cette semaine. La première activation verrouille le secteur pour **12 mois** — ce n'est pas une pression commerciale, c'est le fonctionnement de l'exclusivité.\n\nCôté contrat : la garantie **5 000 € / 90 jours** limite l'exposition financière pendant la montée en charge.\n\nEn résumé : le cabinet peut prendre le temps de réfléchir — et sécuriser la zone tant qu'elle est disponible, avec un cadre contractuel clair.`,
        context,
      ),
    },
  ];
}

const AGENCE_BASE_ITEMS: OnboardingFaqItem[] = [
  {
    id: "ag-contrat-facture",
    q: "Quel contrat signé-je et comment suis-je facturé ?",
    a: "Votre souscription est régie par nos [Conditions générales de vente](/cvg). En validant votre commande, vous acceptez ce contrat. Vous recevrez une facture au nom de votre société (raison sociale, SIRET et adresse que vous indiquez lors de l'onboarding). Le montant affiché est le montant net — TVA non applicable, art. 293 B du CGI.",
  },
  {
    id: "ag-accompagnement",
    q: "Qui m'accompagne une fois le lancement effectué ?",
    a: "Hercule est un groupement d'entreprises dirigé par Evan, développeur senior. Evan vous accompagne personnellement lors de l'activation de votre compte et reste votre interlocuteur privilégié tout au long du service. L'équipe Hercule (qualification, produit, opérations) intervient en support au quotidien.",
  },
  {
    id: "ag-mise-en-relation",
    q: "Comment fonctionne la mise en relation ?",
    a: "Hercule vous attribue des contrats PME qualifiés selon vos critères d'éligibilité. Attribution exclusive. 0 % de commission sur vos ventes — vous facturez à vos tarifs.",
  },
  {
    id: "ag-paiement",
    q: "Comment se passe le paiement ?",
    a: "Paiement en deux fois : 50 % à la commande, 50 % à la livraison de votre compte de contrats PME sécurisés. Paiement sécurisé par Stripe.",
  },
  {
    id: "ag-delai-rdv",
    q: "Combien de temps avant mon premier RDV ?",
    a: "Premier RDV planifié sous 30 jours (paiement en 2 fois) ou sous 8 jours ouvrés (paiement intégral), dès validation de votre profil.",
  },
  {
    id: "ag-retard-livraison",
    q: "Que se passe-t-il si je n'ai pas le compte de rendez-vous prévu ?",
    a: "Selon nos [Conditions générales de vente](/cvg) (article 9), vous nous accordez un délai supplémentaire de **7 jours** en cas de retard de livraison (notamment en phase de montée en charge). Au-delà, nous vous invitons à nous écrire à contact@hercule.dev et à ne pas initier de dispute sur Stripe sans nous avoir contactés au préalable. Un règlement à l'amiable pourra être envisagé au cas par cas.",
  },
  {
    id: "ag-retractation",
    q: "Ai-je un délai de rétractation ?",
    a: "Oui. Après souscription, vous disposez de 4 jours calendaires pour vous rétracter par email à contact@hercule.dev, tant que votre service n'a pas encore démarré (Activation non effectuée). Passé ce délai ou après Activation, la commande est ferme. Détail : [CGV §8](/cvg).",
  },
  {
    id: "ag-noshow",
    q: "Mon prospect ne s'est pas présenté (no-show) — que se passe-t-il ?",
    a: "L'attribution n'est pas consommée. Signalez le no-show sous 48 h : un remplacement est planifié sous 14 jours ouvrés.",
  },
  {
    id: "ag-criteres",
    q: "Puis-je modifier mes critères d'éligibilité ?",
    a: "Oui. Contactez Evan ou l'équipe Hercule pour ajuster votre profil (spécialités, zone, capacité, tickets minimum) à tout moment.",
  },
];

const COMPTABLE_BASE_ITEMS: OnboardingFaqItem[] = [
  {
    id: "cp-contrat-facture",
    q: "Quel contrat signe le cabinet et comment est-il facturé ?",
    a: "La souscription du cabinet est régie par les [Conditions générales de vente Hercule Comptable](/cvg/comptable). Une facture est émise au nom du cabinet (raison sociale, SIRET et adresse indiqués lors de l'onboarding). Montant selon la formule choisie.",
  },
  {
    id: "cp-accompagnement",
    q: "Qui accompagne le cabinet une fois le lancement effectué ?",
    a: "Hercule Comptable est porté par le groupement Hercule, dirigé par Evan, développeur senior. Evan accompagne le cabinet lors de l'activation (Calendly Pro, Zoom Pro, premières missions) et reste disponible pour les points techniques. L'équipe intervient sur la qualification des demandes TPE et le suivi opérationnel.",
  },
  {
    id: "cp-mise-en-relation",
    q: "Comment fonctionne la mise en relation ?",
    a: "Hercule attribue au cabinet des missions TPE qualifiées (tenue, fiscal, obligations administratives). Attribution exclusive. 0 % de commission sur les honoraires signés.",
  },
  {
    id: "cp-paiement",
    q: "Comment se passe le paiement ?",
    a: "Abonnement mensuel via Stripe pour Hercule Lite (1 799 €/mois) et Hercule Starter (2 199 €/mois), ou paiement unique pour le Pack 3 mois Starter (5 277,60 €). La commande est ferme dès acceptation des CGV et réception du paiement.",
  },
  {
    id: "cp-delai-rdv",
    q: "Combien de temps avant le premier RDV dirigeant TPE ?",
    a: "Le déploiement Foundation prend 60 jours. Aucun premier RDV n'est promis pendant cette phase — le système est mis en place pour capter les flux inbound au nom du cabinet.",
  },
  {
    id: "cp-retard-livraison",
    q: "Que se passe-t-il si le compte de rendez-vous n'est pas livré dans les délais ?",
    a: "Selon nos [Conditions générales de vente Hercule Comptable](/cvg/comptable) (article 9), le cabinet accorde un délai supplémentaire de **7 jours** en cas de retard de livraison. Au-delà, écrire à contact@hercule.dev et ne pas initier de dispute sur Stripe sans contact préalable. Un règlement à l'amiable pourra être envisagé au cas par cas.",
  },
  {
    id: "cp-retractation",
    q: "Le cabinet dispose-t-il d'un délai de rétractation ?",
    a: "Oui. Après souscription, le cabinet dispose de 4 jours calendaires pour se rétracter par email à contact@hercule.dev, tant que le service n'a pas encore démarré (Activation non effectuée). Le cabinet peut renoncer à ce délai lors de l'onboarding ou à tout moment depuis le dashboard pour lancer la recherche immédiatement. Passé ce délai ou après Activation, la commande est ferme. Détail : [CGV Comptable §8](/cvg/comptable).",
  },
  {
    id: "cp-garantie-mrr",
    q: "Y a-t-il une garantie si le cabinet ne signe pas de lettres de mission ?",
    a: "Hercule Horizon inclut une garantie contractuelle : 5 000 € de revenus récurrents cumulés sur 90 jours d'activation. Si le palier n'est pas atteint, Hercule maintient l'infrastructure à ses frais jusqu'à l'objectif.",
  },
  {
    id: "cp-noshow",
    q: "Le dirigeant ne s'est pas présenté (no-show) — que se passe-t-il ?",
    a: "L'attribution n'est pas consommée. Remplacement planifié sous 14 jours ouvrés après signalement sous 48 h.",
  },
];

const CIF_BASE_ITEMS: OnboardingFaqItem[] = COMPTABLE_BASE_ITEMS.map((item) => {
  if (item.id === "cp-contrat-facture") {
    return {
      ...item,
      a: "La souscription du cabinet est régie par les [Conditions générales de vente Hercule CIF](/cvg/conseil-financier). Une facture est émise au nom du cabinet (raison sociale, SIRET et adresse indiqués lors de l'onboarding). Montant selon la formule choisie.",
    };
  }
  if (item.id === "cp-accompagnement") {
    return {
      ...item,
      a: "Hercule CIF est porté par le groupement Hercule, dirigé par Evan, développeur senior. Evan accompagne le cabinet lors de l'activation (Calendly Pro, Zoom Pro, premiers mandats) et reste disponible pour les points techniques. L'équipe intervient sur la qualification des demandes patrimoniales et le suivi opérationnel.",
    };
  }
  if (item.id === "cp-mise-en-relation") {
    return {
      ...item,
      a: "Hercule attribue au cabinet des mandats patrimoniaux qualifiés (optimisation fiscale, trésorerie, ingénierie patrimoniale). Attribution exclusive. 0 % de commission sur les honoraires signés.",
    };
  }
  if (item.id === "cp-delai-rdv") {
    return {
      ...item,
      q: "Combien de temps avant le premier RDV dirigeant ?",
      a: "Le déploiement Foundation prend 60 jours. Aucun premier RDV n'est promis pendant cette phase — le système est mis en place pour capter les flux inbound au nom du cabinet.",
    };
  }
  if (item.id === "cp-garantie-mrr") {
    return {
      ...item,
      q: "Y a-t-il une garantie si le cabinet ne signe pas de mandats ?",
      a: "Hercule Horizon inclut une garantie contractuelle : 5 000 € de revenus récurrents cumulés sur 90 jours d'activation. Si le palier n'est pas atteint, Hercule maintient l'infrastructure à ses frais jusqu'à l'objectif.",
    };
  }
  if (item.id === "cp-retractation") {
    return {
      ...item,
      a: item.a.replace("/cvg/comptable)", "/cvg/conseil-financier)").replace("CGV Comptable", "CGV CIF"),
    };
  }
  if (item.id === "cp-retard-livraison") {
    return {
      ...item,
      a: item.a.replace("/cvg/comptable)", "/cvg/conseil-financier)"),
    };
  }
  return item;
});

const ENTREPRISE_FAQ: OnboardingFaqConfig = {
  subtitle: "Ce que les dirigeants nous demandent avant de poursuivre leur recherche d'agence.",
  items: [
    {
      id: "en-gratuit",
      q: "Ce service est-il vraiment gratuit pour mon entreprise ?",
      a: "Oui. La qualification de votre besoin et la mise en relation avec une agence adaptée sont 100 % gratuites pour vous. Les agences partenaires financent le service Hercule. Hercule ne vous facture rien et ne prélève aucune commission.",
    },
    {
      id: "en-cadre",
      q: "Quel cadre encadre la mise en relation ?",
      a: "La mise en relation est encadrée par nos [Conditions générales](/cvg) entreprise. En poursuivant, vous autorisez Hercule à vous proposer une agence compatible avec votre besoin qualifié. Aucun engagement financier envers Hercule.",
    },
    {
      id: "en-accompagnement",
      q: "Qui m'accompagne dans ma recherche d'agence ?",
      a: "Hercule est un groupement d'entreprises dirigé par Evan. Votre besoin est d'abord qualifié par téléphone par l'équipe Hercule ; Evan supervise la compatibilité agence-projet. Vous gardez contact@hercule.dev pour toute question.",
    },
    {
      id: "en-selection",
      q: "Comment Hercule sélectionne mon agence ?",
      a: "Hercule évalue la compatibilité sur cinq critères : prestations, secteur, taille, tarifs et positionnement. Votre projet est validé en Live Qualification avant toute proposition d'agence.",
    },
    {
      id: "en-commission",
      q: "Dois-je payer une commission à Hercule après mon RDV ?",
      a: "Non. Aucun upsell, aucune commission, aucun frais caché. La négociation et la facturation se font directement avec l'agence que vous rencontrez.",
    },
    {
      id: "en-rdv",
      q: "Comment réserver mon RDV avec l'agence proposée ?",
      a: "Lorsqu'une agence compatible vous est proposée, vous recevez un email avec un lien Calendly pour choisir votre créneau. La réservation se fait depuis cet email.",
    },
  ],
  tieDown:
    "J'ai compris que le service Hercule est gratuit pour mon entreprise, je souhaite poursuivre ma recherche d'agence.",
};

const TIE_DOWN_AGENCE =
  "J'ai pris connaissance des [Conditions générales de vente](/cvg), je comprends que l'activation et le paiement (carte bancaire ou SEPA) se font **pendant cette session d'audit**, et je souhaite lancer le service — pas « pour voir ».";

const TIE_DOWN_CABINET =
  "Le cabinet confirme avoir pris connaissance des [Conditions générales de vente](/cvg/comptable), comprend que l'activation et le paiement se font **pendant cette session d'audit**, pour **déployer Hercule Foundation sur la zone du cabinet**.";

const TIE_DOWN_CIF = TIE_DOWN_CABINET.replace("/cvg/comptable)", "/cvg/conseil-financier)");

function buildFaqConfig(
  audience: DashboardFaqAudience,
  baseItems: OnboardingFaqItem[],
  subtitle: string,
  tieDown: string,
  context?: OnboardingFaqContext,
): OnboardingFaqConfig {
  const objections = buildPreventiveObjections(audience, context);
  return {
    subtitle,
    items: [...objections, ...baseItems],
    tieDown,
  };
}

const FAQ_BY_AUDIENCE: Record<
  DashboardFaqAudience,
  (context?: OnboardingFaqContext) => OnboardingFaqConfig
> = {
  agence: (context) =>
    buildFaqConfig(
      "agence",
      AGENCE_BASE_ITEMS,
      "Ce que nos partenaires agences nous demandent le plus souvent.",
      TIE_DOWN_AGENCE,
      context,
    ),
  comptable: (context) =>
    buildFaqConfig(
      "comptable",
      COMPTABLE_BASE_ITEMS,
      "Ce que nos cabinets partenaires nous demandent le plus souvent.",
      TIE_DOWN_CABINET,
      context,
    ),
  cif: (context) =>
    buildFaqConfig(
      "cif",
      CIF_BASE_ITEMS,
      "Ce que nos cabinets CIF partenaires nous demandent le plus souvent.",
      TIE_DOWN_CIF,
      context,
    ),
  entreprise: () => ENTREPRISE_FAQ,
};

export function getOnboardingFaq(
  audience: DashboardFaqAudience,
  context?: OnboardingFaqContext,
): OnboardingFaqConfig {
  return FAQ_BY_AUDIENCE[audience](context);
}

export function onboardingFaqToDashboardItems(
  config: OnboardingFaqConfig,
): { q: string; a: string }[] {
  return config.items.map((item) => ({ q: item.q, a: item.a }));
}

export type ClosingFitLevel = "fits" | "partial" | "mismatch";

export type ClosingFitOption = {
  level: ClosingFitLevel;
  label: string;
  hint: string;
};

export type ClosingCommitLevel = "launch" | "hesitate";

export type ClosingCommitOption = {
  level: ClosingCommitLevel;
  label: string;
  description: string;
};

export const CLOSING_FIT_MIN_WHY_LENGTH = 20;

export function getClosingFitOptions(): ClosingFitOption[] {
  return [
    {
      level: "fits",
      label: "Ce fonctionnement me convient",
      hint: "Je comprends comment Foundation s'installe sur ma zone.",
    },
    {
      level: "partial",
      label: "Je vois le principe, un point reste à clarifier",
      hint: "Le cadre est clair ; un détail mérite d'être échangé.",
    },
    {
      level: "mismatch",
      label: "Ce n'est pas encore aligné pour moi",
      hint: "J'ai besoin d'exprimer ce qui ne colle pas encore.",
    },
  ];
}

export function getClosingCommitOptions(): ClosingCommitOption[] {
  return [
    {
      level: "launch",
      label: "Je me lance",
      description: "Je valide la formule et j'active le déploiement sur ma zone.",
    },
    {
      level: "hesitate",
      label: "J'hésite encore",
      description: "J'aimerais reprendre ce qui me convient et ce qui me retient avant de décider.",
    },
  ];
}

export type FinalCommitCta = {
  label: string;
  description: string;
};

export function getFinalCommitCta(context?: OnboardingFaqContext): FinalCommitCta {
  return {
    label: "Prêt pour démarrer",
    description: interpolateDashboardCopy(
      "L'écart **{gap}** et la zone **{departement}** ne restent pas en attente indéfiniment — l'infrastructure se déploie dès l'activation.",
      context,
    ),
  };
}

export function isClosingFitWhyValid(why: string): boolean {
  return why.trim().length >= CLOSING_FIT_MIN_WHY_LENGTH;
}

export type IntentionOption = {
  level: "strong" | "moderate" | "hesitate";
  label: string;
  description: string;
};

export function getIntentionOptions(audience: DashboardFaqAudience): IntentionOption[] {
  if (audience === "agence") {
    return [
      {
        level: "strong",
        label: "Je suis 100 % partant",
        description: "Formule Starter pré-sélectionnée — on active maintenant.",
      },
      {
        level: "moderate",
        label: "Cela me plaît",
        description: "Même grille, on prend le temps de valider ensemble.",
      },
      {
        level: "hesitate",
        label: "J'hésite encore",
        description: "On ouvre la grille avec un rappel produit et risque.",
      },
    ];
  }

  return [
    {
      level: "strong",
      label: "Je sécurise la zone",
      description: "Horizon pré-sélectionné — verrou de zone immédiat.",
    },
    {
      level: "moderate",
      label: "Le déploiement me convient",
      description: "Même grille, validation posée avant activation.",
    },
    {
      level: "hesitate",
      label: "Je veux voir le détail avant de verrouiller",
      description: "Grille + rappels produit, société, risque et zone.",
    },
  ];
}

export function getHesitationSlides(
  audience: DashboardFaqAudience,
  context?: OnboardingFaqContext,
): HesitationSlide[] {
  if (audience === "agence") {
    return [
      {
        id: "produit",
        title: "Le produit",
        body: interpolateDashboardCopy(
          "Le produit s'attaque à **{cause}** : data Pappers/INSEE, besoin légal avéré. Si le produit est bon, qu'est-ce qui retient {business} ?",
          context,
        ),
      },
      {
        id: "societe",
        title: "La société",
        body:
          "La vraie question n'est pas la personne — c'est le cadre. Hercule gère déjà des flux pour développeurs, designers, conseillers. Même rigueur pour le secteur des agences. Support France.",
      },
      {
        id: "risque",
        title: "Le risque",
        body: interpolateDashboardCopy(
          "Investissement Starter. Garantie contractuelle de récurrent cumulé. Maths vs écart {gap}. L'associé valide un ROI contractuel.",
          context,
        ),
      },
    ];
  }

  const slides: HesitationSlide[] = [
    {
      id: "produit",
      title: "Le produit",
      body: interpolateDashboardCopy(
        "Foundation structure la réponse à **{cause}** : événement légal, capture au nom du cabinet, le dirigeant initie. Ce n'est pas du SEO. Si le cadre convient au cabinet, nous pouvons préciser ensemble ce qui reste à valider.",
        context,
      ),
    },
    {
      id: "societe",
      title: "La société",
      body:
        "Le cadre, pas la personne. Même exigence d'ingénierie que sur les autres verticales Hercule. Support France.",
    },
    {
      id: "risque",
      title: "Le risque",
      body: interpolateDashboardCopy(
        "Horizon 2 399 €/mois. Garantie **5 000 €** sur **90 jours** (7 197 € investis → 60 000 € année 1). Calcul vs écart {gap} et honoraires {honoraires}. L'associé valide un ROI d'actif, pas une campagne.",
        context,
      ),
    },
    {
      id: "zone",
      title: "Urgence zone",
      alert: interpolateDashboardCopy(
        "Statut de la zone **{departement}** : en cours d'attribution — **1 seule licence** disponible.",
        context,
      ),
      body: interpolateDashboardCopy(
        "{prenom}, prendre du recul est tout à fait légitime. Voici simplement comment fonctionne l'allocation : **un cabinet par zone**, bande passante limitée sur les flux légaux.\n\nLa zone est ouverte aujourd'hui. Une activation pose le verrou pour **12 mois**. D'autres cabinets sont en audit sur ce secteur cette semaine.\n\nNotre proposition : sécuriser l'infrastructure tant que la zone est disponible — avec un contrat qui encadre le déploiement et la garantie **5 000 € / 90 jours**. On avance ensemble ?",
        context,
      ),
    },
  ];

  return slides;
}
