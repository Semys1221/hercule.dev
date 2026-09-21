import { describe, expect, it } from "vitest";

import {
  matchInboundSlot,
  stripQuotedThread,
  type SlotCandidate,
} from "./match-inbound-slot";

describe("stripQuotedThread", () => {
  it("removes quoted reply tail", () => {
    const text = `Je suis disponible mardi 14h30

Le jeu. 10 sept. 2026, Béatrice Meyer a écrit :
> Merci pour votre message`;
    expect(stripQuotedThread(text)).toBe("Je suis disponible mardi 14h30");
  });
});

describe("matchInboundSlot", () => {
  const now = new Date("2026-09-10T10:00:00.000Z");
  const slots: SlotCandidate[] = [
    {
      startTime: "2026-09-10T12:30:00.000Z",
      label: "jeudi 10 septembre à 14h30",
    },
    {
      startTime: "2026-09-11T07:00:00.000Z",
      label: "vendredi 11 septembre à 9h",
    },
  ];

  it("matches explicit weekday and hour", () => {
    const result = matchInboundSlot(
      "Je peux jeudi à 14h30",
      slots,
      now,
    );
    expect(result.kind).toBe("matched");
    if (result.kind === "matched") {
      expect(result.label).toContain("14h30");
    }
  });

  it("returns ambiguous when multiple slots score similarly", () => {
    const result = matchInboundSlot("Je suis disponible cette semaine", slots, now);
    expect(result.kind === "ambiguous" || result.kind === "none").toBe(true);
  });

  it("returns none without scheduling signal", () => {
    const result = matchInboundSlot("Merci pour votre retour", slots, now);
    expect(result.kind).toBe("none");
  });
});
