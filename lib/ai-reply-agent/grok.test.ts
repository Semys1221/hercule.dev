import { afterEach, describe, expect, it } from "vitest";

import {
  buildConferenceObjectionRules,
  buildGlobalRules,
  DEFAULT_GROK_TEMPERATURE,
  parseGrokJson,
  resolveGrokTemperature,
} from "./grok";

describe("buildConferenceObjectionRules", () => {
  it("includes 2500 script for comptable preset", () => {
    const rules = buildConferenceObjectionRules("cabinets_expertise_comptable");
    expect(rules).toContain("2 500 €");
    expect(rules).toContain("BNC/BIC/TNS");
    expect(rules).toContain("répondez à ce mail");
    expect(rules).not.toContain("pas d'audit 1:1");
  });

  it("includes 2500 script for CIF preset", () => {
    const rules = buildConferenceObjectionRules("conseillers_gestion_patrimoine");
    expect(rules).toContain("2 500 €");
    expect(rules).toContain("dentistes et vétérinaires");
    expect(rules).toContain("répondez à ce mail");
    expect(rules).not.toContain("pas d'audit 1:1");
  });

  it("returns null for agence preset", () => {
    expect(buildConferenceObjectionRules("agences_web")).toBeNull();
  });
});

describe("buildGlobalRules", () => {
  it("uses maximum sentence count instead of exact count", () => {
    const rules = buildGlobalRules(3);
    expect(rules).toContain(
      "Maximum 3 phrases courtes dans reply_text (hors signature et lien CTA).",
    );
    expect(rules).not.toContain("Écris exactement");
  });

  it("includes tone anti-patterns and drops forced urgency", () => {
    const rules = buildGlobalRules(2);
    expect(rules).toContain("urgence forcée");
    expect(rules).toContain("Merci pour votre message");
    expect(rules).toContain("Je note votre question sur notre identité");
    expect(rules).toContain("groupement d'entrepreneurs dirigé par Evan Sinclair");
    expect(rules).not.toContain("CTA urgent");
    expect(rules).not.toContain("accuser réception →");
  });

  it("embeds conference objection rules for comptable and CIF", () => {
    const comptable = buildGlobalRules(3, "cabinets_expertise_comptable");
    const cif = buildGlobalRules(3, "conseillers_gestion_patrimoine");
    expect(comptable).toContain("Objection conférence (comptable");
    expect(cif).toContain("Objection conférence (CIF");
    expect(comptable).toContain("2 500 € sur-mesure pour objection conférence");
    expect(comptable).not.toContain("pas d'audit 1:1");
  });
});

describe("resolveGrokTemperature", () => {
  const previous = process.env.GROK_TEMPERATURE;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.GROK_TEMPERATURE;
    } else {
      process.env.GROK_TEMPERATURE = previous;
    }
  });

  it("defaults to 0.5", () => {
    delete process.env.GROK_TEMPERATURE;
    expect(resolveGrokTemperature()).toBe(DEFAULT_GROK_TEMPERATURE);
  });

  it("clamps invalid values to default", () => {
    process.env.GROK_TEMPERATURE = "not-a-number";
    expect(resolveGrokTemperature()).toBe(DEFAULT_GROK_TEMPERATURE);
  });

  it("clamps out-of-range values", () => {
    process.env.GROK_TEMPERATURE = "2";
    expect(resolveGrokTemperature()).toBe(1);
    process.env.GROK_TEMPERATURE = "-1";
    expect(resolveGrokTemperature()).toBe(0);
  });
});

describe("parseGrokJson", () => {
  it("parses valid JSON", () => {
    const result = parseGrokJson(
      JSON.stringify({
        should_reply: true,
        reply_text: "Bonjour,\n\nLien ici.",
        reason: "Lead intéressé",
        recovery_confidence: 80,
      }),
    );
    expect(result.should_reply).toBe(true);
    expect(result.reply_text).toContain("Bonjour");
    expect(result.recovery_confidence).toBe(80);
  });

  it("recovers truncated reply_text from malformed JSON", () => {
    const malformed = `{
  "should_reply": true,
  "reply_text": "Je comprends votre demande. Hercule est la dénomination commerciale de notre structure. Voici le lien pour réserver :
`;
    const result = parseGrokJson(malformed);
    expect(result.should_reply).toBe(true);
    expect(result.reply_text).toContain("Hercule est la dénomination commerciale");
  });

  it("extracts reason when reply_text is truncated before reason field", () => {
    const malformed = `{
  "should_reply": false,
  "reply_text": null,
  "reason": "Hors périmètre connaissance",
  "recovery_confidence": 15
}`;
    const result = parseGrokJson(malformed);
    expect(result.should_reply).toBe(false);
    expect(result.reason).toContain("Hors périmètre");
    expect(result.recovery_confidence).toBe(15);
  });
});
