import { describe, expect, it } from "vitest";

import { BEATS, SCENE_ORDER } from "./beats";
import { CUES } from "./cues";
import type { SceneId } from "./types";

const EXPECTED_ORDER: SceneId[] = [
  "S01_Intro",
  "S03_5_StartingPoint",
  "S02_WordOfMouth",
  "S03_WOMProblem",
  "S03_6_BuildAudience",
  "S04_ColdLeads",
  "S05_GoogleAds",
  "S06_Reframing",
  "S07_ThreeSolutions",
  "S08_Mechanism",
  "S09_R2Reveal",
  "S10_JohnDemo",
  "S13_HerculeDEC",
  "S14_HerculeCourtage",
  "S11_CaseBrokerage",
  "S11_CaseAccounting",
  "S12_SocialProof",
  "S15_FAQ",
  "S16_Urgency",
  "S17_Close",
  "S18_StaticOffers",
];

function next(scene: SceneId): SceneId | undefined {
  return SCENE_ORDER[SCENE_ORDER.indexOf(scene) + 1];
}

describe("conference deck order", () => {
  it("follows the scripted scene order", () => {
    expect(SCENE_ORDER).toEqual(EXPECTED_ORDER);
  });

  it("opens the word-of-mouth chapter with Point de départ", () => {
    expect(next("S01_Intro")).toBe("S03_5_StartingPoint");
    expect(next("S03_5_StartingPoint")).toBe("S02_WordOfMouth");
  });

  it("goes from the word-of-mouth limits straight to the lead sheet", () => {
    expect(next("S03_WOMProblem")).toBe("S03_6_BuildAudience");
    expect(next("S03_6_BuildAudience")).toBe("S04_ColdLeads");
  });

  it("shows the case studies right after the Courtage ROI", () => {
    expect(next("S14_HerculeCourtage")).toBe("S11_CaseBrokerage");
    expect(next("S11_CaseBrokerage")).toBe("S11_CaseAccounting");
    expect(next("S11_CaseAccounting")).toBe("S12_SocialProof");
    expect(next("S12_SocialProof")).toBe("S15_FAQ");
  });

  it("has exactly one cue per beat of every scene", () => {
    for (const scene of SCENE_ORDER) {
      const steps = BEATS.filter((beat) => beat.scene === scene).length;
      expect({ scene, cues: CUES[scene].length }).toEqual({ scene, cues: steps });
    }
  });

  it("numbers beats contiguously from 1", () => {
    expect(BEATS.map((beat) => beat.id)).toEqual(BEATS.map((_, index) => index + 1));
  });
});
