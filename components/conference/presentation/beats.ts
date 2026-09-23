import { DEC_STEP_COUNT, COURTAGE_STEP_COUNT } from "../scenes/card-deck";
import { S09_STEP_COUNT } from "../scenes/s09-qualification";
import type { Beat, SceneId } from "./types";

type SceneBlock = { scene: SceneId; count: number };

const BLOCKS: SceneBlock[] = [
  { scene: "S01_Intro", count: 3 },
  { scene: "S02_WordOfMouth", count: 3 },
  { scene: "S03_WOMProblem", count: 5 },
  { scene: "S03_5_StartingPoint", count: 1 },
  { scene: "S03_6_BuildAudience", count: 1 },
  { scene: "S04_ColdLeads", count: 3 },
  { scene: "S05_GoogleAds", count: 4 },
  { scene: "S06_Reframing", count: 4 },
  { scene: "S07_ThreeSolutions", count: 3 },
  { scene: "S08_Mechanism", count: 1 },
  { scene: "S09_R2Reveal", count: S09_STEP_COUNT },
  { scene: "S10_JohnDemo", count: 2 },
  { scene: "S13_HerculeDEC", count: DEC_STEP_COUNT },
  { scene: "S14_HerculeCourtage", count: COURTAGE_STEP_COUNT },
  { scene: "S15_FAQ", count: 11 },
  { scene: "S16_Urgency", count: 3 },
  { scene: "S17_Close", count: 1 },
  { scene: "S18_StaticOffers", count: 2 },
];

export const BEATS: Beat[] = (() => {
  const beats: Beat[] = [];
  let id = 1;
  for (const { scene, count } of BLOCKS) {
    for (let step = 0; step < count; step++) {
      beats.push({ id, scene, step });
      id++;
    }
  }
  return beats;
})();

export const TOTAL_BEATS = BEATS.length;

/** Scene order for the audience step counter. One étape = one scene. */
export const SCENE_ORDER: SceneId[] = BLOCKS.map((block) => block.scene);

export const TOTAL_SCENES = SCENE_ORDER.length;
