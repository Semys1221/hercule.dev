import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import type { LeadCategory } from "@/lib/link-tracking/types";

export function isModalitesCabinetAudience(audience: LeadCategory): boolean {
  return audience === "entreprise" || audience === "comptable";
}

/** Campaign-only agence prices — do not write to payments.offer_type. */
export const MODALITES_AGENCE_GROWTH_TTC_CENTS = 149_800;
export const MODALITES_AGENCE_LAUNCH_TTC_CENTS = 99_800;

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
        name: "Formule Croissance",
        recommended: true,
        detail: `Hercule — ${missions} missions PME / mois (${growthPrice} TTC) — recommandé pour les cabinets. Garantie ${guaranteeMrr} de MRR à la signature (${missions} lettres de mission × ${mrrPerMission} de MRR par mission, soit ${COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesLabel} d'honoraires annuels / 12).`,
      },
      {
        name: "Hercule Starter",
        detail: `${COMMERCIAL_COMPTABLE.starterMissions} missions PME / mois (${starterPrice} TTC)`,
      },
    ];
  }

  return [
    {
      name: "Formule Croissance",
      detail: `10 contrats PME sécurisés / 60 jours (${formatEurosFromCents(MODALITES_AGENCE_GROWTH_TTC_CENTS)} TTC)`,
    },
    {
      name: "Formule Lancement",
      detail: `5 contrats PME sécurisés / 30 jours (${formatEurosFromCents(MODALITES_AGENCE_LAUNCH_TTC_CENTS)} TTC)`,
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
