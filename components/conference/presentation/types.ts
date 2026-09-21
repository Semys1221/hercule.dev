export type SceneId =
  | "S01_Intro"
  | "S02_WordOfMouth"
  | "S03_WOMProblem"
  | "S04_ColdLeads"
  | "S05_GoogleAds"
  | "S06_Reframing"
  | "S07_ThreeSolutions"
  | "S08_Mechanism"
  | "S09_R2Reveal"
  | "S10_JohnDemo"
  | "S11_Installation"
  | "S12_OffersTransition"
  | "S13_HerculeDEC"
  | "S14_HerculeCourtage"
  | "S15_FAQ"
  | "S16_Urgency"
  | "S17_Close"
  | "S18_StaticOffers";

export type Beat = {
  id: number;
  scene: SceneId;
  step: number;
};

export type SceneProps = {
  step: number;
};

export const SCENE_LABELS: Record<SceneId, string> = {
  S01_Intro: "Introduction",
  S02_WordOfMouth: "Bouche-à-oreille",
  S03_WOMProblem: "Problème BAO",
  S04_ColdLeads: "Leads froids",
  S05_GoogleAds: "Google Ads",
  S06_Reframing: "Reframing",
  S07_ThreeSolutions: "Trois solutions",
  S08_Mechanism: "Mécanisme",
  S09_R2Reveal: "HERCULE R2",
  S10_JohnDemo: "Démo John",
  S11_Installation: "Installation",
  S12_OffersTransition: "Transition offres",
  S13_HerculeDEC: "Hercule DEC",
  S14_HerculeCourtage: "Hercule Courtage",
  S15_FAQ: "FAQ",
  S16_Urgency: "Urgence",
  S17_Close: "Close",
  S18_StaticOffers: "Offres finales",
};
