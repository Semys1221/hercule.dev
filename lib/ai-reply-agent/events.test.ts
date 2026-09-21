import { describe, expect, it } from "vitest";

import {
  isCalendlySystemEmail,
  isCaptchaOrBounceEmail,
} from "./events";

describe("isCalendlySystemEmail", () => {
  it("detects Calendly booking notification", () => {
    expect(
      isCalendlySystemEmail(
        "Calendly\nHi Hercule,\nA new event has been scheduled.\nEvent Type: Briefing",
      ),
    ).toBe(true);
  });

  it("detects invite acceptance", () => {
    expect(
      isCalendlySystemEmail(
        "(null) a accepté votre invitation à l'évènement DABIN Alexandre et Hercule",
      ),
    ).toBe(true);
  });

  it("ignores normal prospect replies", () => {
    expect(isCalendlySystemEmail("Oui, mon cabinet est compatible")).toBe(false);
  });
});

describe("isCaptchaOrBounceEmail", () => {
  it("detects captcha non-delivery", () => {
    expect(
      isCaptchaOrBounceEmail("Message de non-délivrance technique (Captcha)"),
    ).toBe(true);
  });
});
