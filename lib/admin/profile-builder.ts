import type { Audience } from "@/lib/admin/navigation";

const AGENCE_TIMELINE = [
  "Activation de votre fiche",
  "Qualification des demandes",
  "Première proposition de mise en relation",
  "Rendez-vous planifié",
];

const ENTREPRISE_TIMELINE = [
  "Qualification de votre besoin",
  "Recherche d'agence compatible",
  "Proposition d'agence",
  "Rendez-vous planifié",
];

export type ProfileFormFields = Record<string, unknown>;

const COMPTABLE_TIMELINE = [
  "Activation de votre espace",
  "Qualification des missions",
  "Première proposition PME",
  "Rendez-vous planifié",
];

export function buildDefaultProfile(
  form: ProfileFormFields,
  category: Audience,
): Record<string, unknown> {
  const appliesRetraction = category === "agence" || category === "comptable";
  const keepRetraction =
    appliesRetraction &&
    (form.droit_retractation === undefined || form.droit_retractation === true);
  const retraction = keepRetraction ? 4 : appliesRetraction ? 0 : 0;
  const timeline =
    category === "agence"
      ? AGENCE_TIMELINE
      : category === "comptable"
        ? COMPTABLE_TIMELINE
        : ENTREPRISE_TIMELINE;

  const profileForm = appliesRetraction
    ? { ...form, droit_retractation: keepRetraction }
    : form;

  return {
    form: profileForm,
    communication: {
      delays: {
        base_match_days: 14,
        retraction_days: retraction,
        search_start_offset_days: retraction,
        queue_warmup_days: 15,
        first_match_promise_days: 21,
        first_rdv_promise_days: 35,
        first_u4_promise_days: 21,
        five_u4_promise_days: 35,
        ten_u4_promise_days: 60,
      },
    },
    display: {
      timeline: timeline.map((label) => ({ label })),
    },
    match: { active_rdv: false },
  };
}

export function onboardingTimestamp(): string {
  return new Date().toISOString();
}
