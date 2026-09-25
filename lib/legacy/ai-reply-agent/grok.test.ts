import { afterEach, describe, expect, it } from "vitest";

import {
  buildConferenceObjectionRules,
  buildGlobalRules,
  buildInternationalRules,
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
    expect(rules).toContain("mercredi 23 septembre");
    expect(rules).toContain("PAS d'option 1:1");
    expect(rules).not.toContain("pas d'audit 1:1");
  });

  it("returns null for agence preset", () => {
    expect(buildConferenceObjectionRules("agences_web")).toBeNull();
  });
});

describe("buildInternationalRules", () => {
  it("includes DEC international script for comptable preset", () => {
    const rules = buildInternationalRules("cabinets_expertise_comptable");
    expect(rules).toContain("International BE/CH/CA (DEC");
    expect(rules).toContain("1 499 USD/mois");
    expect(rules).toContain("400 USD/mois");
    expect(rules).not.toContain("France uniquement");
  });

  it("includes IAS/CIF international script for CIF presets", () => {
    const cif = buildInternationalRules("conseillers_gestion_patrimoine");
    const ias = buildInternationalRules("courtiers_prevoyance_b2b");
    expect(cif).toContain("IAS + CIF");
    expect(ias).toContain("passifs sociaux");
    expect(cif).toContain("dentistes et vétérinaires");
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

  it("includes conversation thread rules for should_reply", () => {
    const rules = buildGlobalRules(2);
    expect(rules).toContain("Contexte fil (historique de conversation)");
    expect(rules).toContain("je n'ai pas saisi");
    expect(rules).toContain("top merci");
  });

  it("embeds conference objection rules for comptable and CIF", () => {
    const comptable = buildGlobalRules(3, "cabinets_expertise_comptable");
    const cif = buildGlobalRules(3, "conseillers_gestion_patrimoine");
    expect(comptable).toContain("Objection conférence EXPLICITE (comptable");
    expect(cif).toContain("Objection conférence EXPLICITE (CIF");
    expect(comptable).toContain("mercredi 23 septembre");
    expect(cif).toContain("PAS d'option 1:1");
    expect(comptable).toContain("2 500 € sur-mesure pour objection conférence");
    expect(comptable).not.toContain("pas d'audit 1:1");
    expect(comptable).toContain("International BE/CH/CA (DEC");
    expect(comptable).toContain("1 499 USD");
  });

  it("uses R2 prospect quality rules without perception reframe", () => {
    const r2 = buildGlobalRules(3, "cabinets_expertise_comptable", false, true);
    expect(r2).toContain("double verrou");
    expect(r2).toContain("appel téléphonique");
    expect(r2).toContain("retour par mail");
    expect(r2).toContain("contrat signé");
    expect(r2).toContain("4 à 5 paragraphes");
    expect(r2).toContain("Interdit : reframe perception");
  });

  it("uses JUM rules for comptable delivery presets (no Hercule)", () => {
    const rules = buildGlobalRules(3, "restaurants_independants");
    expect(rules).toContain("JUM Advisory");
    expect(rules).toContain("Secrétaire Comptable JUM — jum-advisory.com");
    expect(rules).toContain("Ne mentionne jamais Hercule");
    expect(rules).not.toContain("groupement d'entrepreneurs dirigé par Evan Sinclair");
    expect(rules).not.toContain("mercredi 23 septembre");
  });

  it("uses IAS conference rules and thematic paragraphs for due diligence", () => {
    const ias = buildGlobalRules(3, "courtiers_prevoyance_b2b");
    expect(ias).toContain("Objection conférence EXPLICITE (IAS");
    expect(ias).toContain("https://hercule.dev/cvg/courtier-assurance");
    const dueDiligence = buildGlobalRules(
      2,
      "conseillers_gestion_patrimoine",
      true,
    );
    expect(dueDiligence).toContain("4 à 8 paragraphes");
    expect(dueDiligence).toContain("recovery_confidence ≥ 85");
    expect(dueDiligence).not.toContain(
      "Maximum 2 phrases courtes dans reply_text",
    );
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
