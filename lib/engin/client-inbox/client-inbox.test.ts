import { describe, expect, it } from "vitest";

import { resolveClientForEmail } from "@/lib/engin/client-inbox/client-email-index";
import { matchMessageToClient, messageDirection } from "@/lib/engin/client-inbox/match-message";
import { computeNeedsReply, isUnreadEngin } from "@/lib/engin/client-inbox/needs-reply";
import {
  normalizeEmailAddress,
  parseAddressListHeader,
  parseFromHeader,
} from "@/lib/engin/client-inbox/normalize-email";
import type { ParsedGmailMessage } from "@/lib/engin/client-inbox/types";

describe("normalize-email", () => {
  it("parses display names", () => {
    expect(parseFromHeader("Camille Dupont <camille@example.com>")).toBe(
      "camille@example.com",
    );
    expect(normalizeEmailAddress("  CAMILLE@Example.COM ")).toBe("camille@example.com");
  });

  it("parses address lists", () => {
    expect(parseAddressListHeader("A <a@test.com>, b@test.com")).toEqual([
      "a@test.com",
      "b@test.com",
    ]);
  });
});

describe("match-message", () => {
  const index = new Map([
    [
      "client@example.com",
      [
        { clientId: "older", createdAt: "2020-01-01T00:00:00Z" },
        { clientId: "newer", createdAt: "2026-01-01T00:00:00Z" },
      ],
    ],
  ]);

  const baseMessage = (overrides: Partial<ParsedGmailMessage>): ParsedGmailMessage => ({
    gmailMessageId: "m1",
    gmailThreadId: "t1",
    fromEmail: "client@example.com",
    toEmails: ["thomas@hercule.dev"],
    subject: "Hello",
    bodyText: "Hi",
    bodyHtml: null,
    sentAt: new Date(),
    headers: {},
    snippet: "Hi",
    ...overrides,
  });

  it("matches inbound from client", () => {
    process.env.GMAIL_MAILBOX = "thomas@hercule.dev";
    const hit = matchMessageToClient(index, baseMessage({}));
    expect(hit?.clientId).toBe("newer");
    expect(hit?.ambiguous).toBe(true);
    expect(messageDirection(baseMessage({}))).toBe("in");
  });

  it("matches outbound to client", () => {
    process.env.GMAIL_MAILBOX = "thomas@hercule.dev";
    const msg = baseMessage({
      fromEmail: "thomas@hercule.dev",
      toEmails: ["client@example.com"],
    });
    expect(messageDirection(msg)).toBe("out");
    expect(matchMessageToClient(index, msg)?.clientId).toBe("newer");
  });

  it("resolveClientForEmail picks newest", () => {
    expect(resolveClientForEmail(index, "client@example.com")?.clientId).toBe(
      "newer",
    );
  });
});

describe("needs-reply", () => {
  it("needs reply when last message is inbound", () => {
    expect(
      computeNeedsReply({
        lastDirection: "in",
        state: null,
      }),
    ).toBe(true);
    expect(
      computeNeedsReply({
        lastDirection: "out",
        state: null,
      }),
    ).toBe(false);
  });

  it("respects resolved and snooze", () => {
    expect(
      computeNeedsReply({
        lastDirection: "in",
        state: { resolved_at: new Date().toISOString(), snoozed_until: null },
      }),
    ).toBe(false);
    expect(
      computeNeedsReply({
        lastDirection: "in",
        state: {
          resolved_at: null,
          snoozed_until: new Date(Date.now() + 60_000).toISOString(),
        },
      }),
    ).toBe(false);
  });

  it("detects unread", () => {
    expect(isUnreadEngin(null)).toBe(true);
    expect(isUnreadEngin({ read_at: new Date().toISOString() })).toBe(false);
  });
});
