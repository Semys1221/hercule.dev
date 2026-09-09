import { COMMERCIAL, COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { FaqAudience } from "@/lib/site/faq-types";

export function isModalitesCabinetAudience(audience: LeadCategory): boolean {
  return audience === "entreprise" || audience === "comptable";
}

export function modalitesFaqAudience(category: LeadCategory): FaqAudience {
  return category === "agence" ? "agence" : "comptable";
}

/** @deprecated Use COMMERCIAL.growth1498PriceCents / starter998PriceCents */
export const MODALITES_AGENCE_GROWTH_TTC_CENTS = COMMERCIAL.growth1498PriceCents;
/** @deprecated Use COMMERCIAL.starter998PriceCents */
export const MODALITES_AGENCE_LAUNCH_TTC_CENTS = COMMERCIAL.starter998PriceCents;

export const MODALITES_SUBJECT = "Modalités d'Hercule";
export const MODALITES_CONFIRM_BUTTON_LABEL = "Confirmer le rendez-vous";
export const SEND_ALL_CONFIRM_PHRASE = "ENVOYER";

export type ModalitesFormula = {
  name: string;
  detail: string;
  recommended?: boolean;
};

function formatEurosFromCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function modalitesFormulas(audience: LeadCategory): ModalitesFormula[] {
  if (isModalitesCabinetAudience(audience)) {
    const growthPrice = formatEurosFromCents(
      COMMERCIAL_COMPTABLE.growthMonthlyPriceCents,
    );
    const starterPrice = formatEurosFromCents(
      COMMERCIAL_COMPTABLE.starterPriceCents,
    );
    const guaranteeMrr = formatEurosFromCents(
      COMMERCIAL_COMPTABLE.growthGuaranteeMrrCents,
    );
    const mrrPerMission = formatEurosFromCents(
      COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents,
    );
    const missions = COMMERCIAL_COMPTABLE.growthMissionsPerMonth;
    return [
      {
        name: "Hercule Starter",
        recommended: true,
        detail: `Hercule — ${missions} missions PME/TPE/indépendants / mois (${growthPrice}/mois) — recommandé pour les cabinets. Garantie ${guaranteeMrr} de MRR à la signature (${missions} lettres de mission × ${mrrPerMission} de MRR par mission, soit ${COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesLabel} d'honoraires annuels / 12).`,
      },
      {
        name: "Hercule Lite",
        detail: `${COMMERCIAL_COMPTABLE.starterMissions} missions PME (${starterPrice} TTC)`,
      },
    ];
  }

  return [
    {
      name: "Hercule Growth",
      recommended: true,
      detail: `10 contrats PME sécurisés / 60 jours (${formatEurosFromCents(COMMERCIAL.growth1498PriceCents)} TTC) — 50 % à la commande, 50 % à la livraison.`,
    },
    {
      name: "Hercule Starter",
      detail: `5 contrats PME sécurisés / 30 jours (${formatEurosFromCents(COMMERCIAL.starter998PriceCents)} TTC) — 50 % à la commande, 50 % à la livraison.`,
    },
  ];
}

export function modalitesIntro(_audience: LeadCategory): string {
  return "Pour valider notre prochain échange visio, nous devons nous assurer que nos modalités commerciales correspondent à vos objectifs de croissance.";
}

function modalitesProgramLine(audience: LeadCategory): string {
  if (isModalitesCabinetAudience(audience)) {
    return "Notre programme d'apport de missions fonctionne exclusivement via deux formules :";
  }
  return "Notre programme d'apport d'affaires fonctionne exclusivement via deux formules d'attribution :";
}

function formulasAsPlainText(audience: LeadCategory): string {
  return modalitesFormulas(audience)
    .map((formula) => {
      const mark = formula.recommended ? " — recommandé" : "";
      return `${formula.name}${mark} : ${formula.detail}`;
    })
    .join("\n");
}

export function modalitesAskBody(audience: LeadCategory): string {
  return `{{firstNameLine}}

${modalitesIntro(audience)}

${modalitesProgramLine(audience)}

${formulasAsPlainText(audience)}

Afin de sécuriser votre créneau et confirmer votre intérêt pour ces modalités payantes, merci de cliquer ci-dessous :
{{confirmation_agence_link}}

Attention : Sans confirmation avant votre rendez-vous, celui-ci sera automatiquement annulé une heure avant l'horaire prévu.

Cordialement,`;
}

export function modalitesCancelBody(): string {
  return `{{firstNameLine}}

Sans confirmation de votre part, votre rendez-vous va être annulé sous peu.

{{confirmation_agence_link}}

Cordialement,`;
}
