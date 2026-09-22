import type { SceneId } from "./types";

/** Audience-facing scene titles — distinct from HUD SCENE_LABELS. */
export const SCENE_TITLES: Record<SceneId, string> = {
  S01_Intro: "BNC/BIC/TNS",
  S02_WordOfMouth: "La confiance qui se transfère",
  S03_WOMProblem: "Ce que le bouche-à-oreille ne pilote pas",
  S04_ColdLeads: "Des noms sans demande",
  S05_GoogleAds: "Quand c’est vous le filtre",
  S06_Reframing: "Volume, qualité, intérêt — ensemble",
  S07_ThreeSolutions: "Chaque canal a une limite",
  S08_Mechanism: "Ce qui tient les trois",
  S09_R2Reveal: "Des demandes qualifiées à vous",
  S10_JohnDemo: "Le flux qualifié dans l’agenda",
  S12_OffersTransition: "Les infrastructures Hercule",
  S13_HerculeDEC: "Hercule DEC",
  S14_HerculeCourtage: "Hercule Courtage",
  S15_FAQ: "Questions",
  S16_Urgency: "Modalités d'inscription",
  S17_Close: "Les décisions de demain",
  S18_StaticOffers: "Choisissez votre formule",
};

/** Ghost cube behind the card during the R2 reveal, after the lockup. */
export function s09GhostCubeAngle(scene: SceneId, step: number): number | null {
  if (scene !== "S09_R2Reveal" || step < 2 || step >= 14) return null;
  if (step >= 10) return 180;
  if (step >= 6) return 90;
  return 0;
}

/**
 * Faint unlabeled ghost (terrain de jeu).
 */
export function ghostCubeAngle(scene: SceneId, step: number): number | null {
  if (scene === "S09_R2Reveal") return s09GhostCubeAngle(scene, step);
  return null;
}
