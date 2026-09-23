export type SceneId =
  | "S01_Intro"
  | "S02_WordOfMouth"
  | "S03_WOMProblem"
  | "S03_5_StartingPoint"
  | "S03_6_BuildAudience"
  | "S04_ColdLeads"
  | "S05_GoogleAds"
  | "S06_Reframing"
  | "S07_ThreeSolutions"
  | "S08_Mechanism"
  | "S09_R2Reveal"
  | "S11_CaseBrokerage"
  | "S11_CaseAccounting"
  | "S12_SocialProof"
  | "S10_JohnDemo"
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
  S03_WOMProblem: "Limites du bouche-à-oreille",
  S03_5_StartingPoint: "Point de départ",
  S03_6_BuildAudience: "Construire une audience",
  S04_ColdLeads: "Prospection froide",
  S05_GoogleAds: "Google Ads",
  S06_Reframing: "Recadrage",
  S07_ThreeSolutions: "Trois solutions",
  S08_Mechanism: "Mécanisme",
  S09_R2Reveal: "Dispositif Hercule",
  S11_CaseBrokerage: "Cas conseil",
  S11_CaseAccounting: "Cas comptable",
  S12_SocialProof: "Preuve sociale",
  S10_JohnDemo: "Cas pratique",
  S13_HerculeDEC: "Hercule DEC",
  S14_HerculeCourtage: "Hercule Courtage",
  S15_FAQ: "FAQ",
  S16_Urgency: "Inscription",
  S17_Close: "Conclusion",
  S18_StaticOffers: "Formules",
};
