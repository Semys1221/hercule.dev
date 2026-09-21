import { describe, expect, it } from "vitest";

import {
  extractAlternateEmailFromText,
  isAutomatedSenderEmail,
  resolveReplyFromFromPayload,
} from "./reply-from-email";

describe("isAutomatedSenderEmail", () => {
  it("flags calendly and noreply senders", () => {
    expect(isAutomatedSenderEmail("notifications@calendly.com")).toBe(true);
    expect(isAutomatedSenderEmail("noreply@example.com")).toBe(true);
  });

  it("accepts human reply addresses", () => {
    expect(isAutomatedSenderEmail("eric.plasse@wis-patrimoine.com")).toBe(false);
    expect(isAutomatedSenderEmail("skem.immobilier@gmail.com")).toBe(false);
  });
});

describe("resolveReplyFromFromPayload", () => {
  it("reads explicit reply_from_email from webhook payload", () => {
    expect(
      resolveReplyFromFromPayload({
        reply_from_email: "john@cabinet.fr",
      }),
    ).toBe("john@cabinet.fr");
  });
});

describe("extractAlternateEmailFromText", () => {
  it("extracts signature email different from lead email", () => {
    const text = `Bonjour,
Cordialement,
Mesut AKBAS
✉️ assurestexpertise@gmail.com`;

    expect(
      extractAlternateEmailFromText(text, "contact.assurest@gmail.com"),
    ).toBe("assurestexpertise@gmail.com");
  });

  it("ignores the lead email when repeated in body", () => {
    const text = "Merci, contact@cabinet.fr";
    expect(extractAlternateEmailFromText(text, "contact@cabinet.fr")).toBeNull();
  });
});
