import type { Beat, SceneId } from "./types";

type SceneBlock = { scene: SceneId; count: number };

const BLOCKS: SceneBlock[] = [
  { scene: "S01_Intro", count: 7 },          // beats 1-7
  { scene: "S02_WordOfMouth", count: 4 },    // beats 8-11
  { scene: "S03_WOMProblem", count: 7 },     // beats 12-18
  { scene: "S04_ColdLeads", count: 5 },      // beats 19-23
  { scene: "S05_GoogleAds", count: 6 },      // beats 24-29
  { scene: "S06_Reframing", count: 5 },      // beats 30-34
  { scene: "S07_ThreeSolutions", count: 3 }, // beats 35-37
  { scene: "S08_Mechanism", count: 2 },      // beats 38-39
  { scene: "S09_R2Reveal", count: 16 },      // beats 40-55
  { scene: "S10_JohnDemo", count: 24 },      // beats 56-79
  { scene: "S11_Installation", count: 10 },  // beats 80-89
  { scene: "S12_OffersTransition", count: 2 },// beats 90-91
  { scene: "S13_HerculeDEC", count: 12 },    // beats 92-103
  { scene: "S14_HerculeCourtage", count: 13 },// beats 104-116
  { scene: "S15_FAQ", count: 5 },            // beats 117-121
  { scene: "S16_Urgency", count: 1 },        // beat 122
  { scene: "S17_Close", count: 4 },          // beats 123-126
  { scene: "S18_StaticOffers", count: 2 },   // beats 127-128
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

export const TOTAL_BEATS = BEATS.length; // 128

/** Scene order for the audience step counter. One étape = one scene. */
export const SCENE_ORDER: SceneId[] = BLOCKS.map((block) => block.scene);

export const TOTAL_SCENES = SCENE_ORDER.length;
