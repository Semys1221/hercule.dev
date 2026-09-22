import { describe, expect, it } from "vitest";

import {
  formatQuestionsBlock,
  hostEmailsFromScheduledEvent,
  questionsFromPairs,
} from "./format";

describe("hostEmailsFromScheduledEvent", () => {
  it("collects unique host emails", () => {
    expect(
      hostEmailsFromScheduledEvent({
        event_memberships: [
          { user_email: "Host@Cabinet.fr" },
          { user_email: "host@cabinet.fr" },
          { user_email: "" },
        ],
      }),
    ).toEqual(["host@cabinet.fr"]);
  });
});

describe("formatQuestionsBlock", () => {
  it("renders Q/A pairs", () => {
    expect(
      formatQuestionsBlock(
        questionsFromPairs([
          { question: "Société", answer: "Duplex" },
          { question: "Tél", answer: "" },
        ]),
      ),
    ).toContain("Société");
  });
});
