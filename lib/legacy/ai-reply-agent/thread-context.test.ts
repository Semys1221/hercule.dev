import { describe, expect, it } from "vitest";

import { formatThreadForGrok, stripQuotedReply } from "./thread-context";

describe("stripQuotedReply", () => {
  it("strips outlook-style quoted headers", () => {
    const text = `Je n'ai pas saisi.

De : Béatrice Meyer <beatrice@hercule.dev>
Envoyé : vendredi 11 septembre 2026 14:15
À : Achraf <achraf@duxcompta.be>
Objet : RE: question clients

Parfait. Proposez votre cabinet.`;
    expect(stripQuotedReply(text)).toBe("Je n'ai pas saisi.");
  });
});

describe("formatThreadForGrok", () => {
  it("formats chronological messages for grok", () => {
    const formatted = formatThreadForGrok([
      {
        direction: "sent",
        timestamp: "2026-09-11T12:00:00Z",
        subject: "question clients",
        body: "Parfait. Proposez votre cabinet.",
      },
      {
        direction: "received",
        timestamp: "2026-09-18T12:00:00Z",
        subject: "RE: question clients",
        body: "Je n'ai pas saisi.",
      },
    ]);
    expect(formatted).toContain("[Hercule — question clients]");
    expect(formatted).toContain("[Prospect — RE: question clients]");
    expect(formatted).toContain("Je n'ai pas saisi.");
  });
});
