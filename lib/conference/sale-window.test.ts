import { describe, expect, it } from "vitest";

import { CONFERENCE_CARDS } from "@/lib/commercial/conference-pricing";

import {
  CONFERENCE_INSCRIPTION_MESSAGES,
  fakeConferenceSeatsTaken,
  isConferenceCheckoutOpen,
  toPublicSaleWindow,
  type ConferenceSaleWindowRow,
} from "./sale-window";

const startedAt = new Date("2026-09-21T10:00:00.000Z");

function row(
  patch: Partial<ConferenceSaleWindowRow> = {},
): ConferenceSaleWindowRow {
  return {
    id: "window",
    status: "open",
    started_at: startedAt.toISOString(),
    ends_at: null,
    duration_seconds: 300,
    ...patch,
  };
}

describe("isConferenceCheckoutOpen", () => {
  it("is open only when status is open", () => {
    expect(isConferenceCheckoutOpen(row({ status: "open" }))).toBe(true);
    expect(isConferenceCheckoutOpen(row({ status: "closed" }))).toBe(false);
    expect(isConferenceCheckoutOpen(row({ status: "idle" }))).toBe(false);
  });
});

describe("fakeConferenceSeatsTaken", () => {
  it("starts at 0 before enable", () => {
    expect(
      fakeConferenceSeatsTaken(CONFERENCE_CARDS.dec, null, startedAt),
    ).toBe(0);
  });

  it("takes the first DEC seat at 30 seconds", () => {
    expect(
      fakeConferenceSeatsTaken(
        CONFERENCE_CARDS.dec,
        startedAt,
        new Date(startedAt.getTime() + 30_000),
      ),
    ).toBe(1);
    expect(
      fakeConferenceSeatsTaken(
        CONFERENCE_CARDS.courtage,
        startedAt,
        new Date(startedAt.getTime() + 30_000),
      ),
    ).toBe(0);
  });

  it("leaves one seat on each offer at 4:16 and never takes the fourth", () => {
    const atFourSixteen = new Date(startedAt.getTime() + 256_000);
    expect(
      fakeConferenceSeatsTaken(CONFERENCE_CARDS.dec, startedAt, atFourSixteen),
    ).toBe(3);
    expect(
      fakeConferenceSeatsTaken(
        CONFERENCE_CARDS.courtage,
        startedAt,
        atFourSixteen,
      ),
    ).toBe(3);
    expect(
      fakeConferenceSeatsTaken(
        CONFERENCE_CARDS.dec,
        startedAt,
        new Date(startedAt.getTime() + 600_000),
      ),
    ).toBe(3);
  });
});

describe("toPublicSaleWindow", () => {
  it("shows the waiting message while idle", () => {
    const publicWindow = toPublicSaleWindow(
      row({ status: "idle", started_at: null }),
      startedAt,
    );
    expect(publicWindow.phase).toBe("waiting");
    expect(publicWindow.checkoutOpen).toBe(false);
    expect(publicWindow.inactiveMessage).toBe(
      CONFERENCE_INSCRIPTION_MESSAGES.waiting,
    );
  });

  it("opens checkout when status is open", () => {
    const publicWindow = toPublicSaleWindow(row(), startedAt);
    expect(publicWindow.phase).toBe("open");
    expect(publicWindow.checkoutOpen).toBe(true);
    expect(publicWindow.inactiveMessage).toBe(
      CONFERENCE_INSCRIPTION_MESSAGES.open,
    );
  });

  it("keeps checkout open after three seats are taken", () => {
    const publicWindow = toPublicSaleWindow(
      row(),
      new Date(startedAt.getTime() + 256_000),
    );
    expect(publicWindow.decTaken).toBe(3);
    expect(publicWindow.courtageTaken).toBe(3);
    expect(publicWindow.checkoutOpen).toBe(true);
    expect(publicWindow.startedAt).toBe(startedAt.toISOString());
  });

  it("shows the closed message when status is closed", () => {
    const publicWindow = toPublicSaleWindow(
      row({ status: "closed", started_at: null }),
      startedAt,
    );
    expect(publicWindow.phase).toBe("closed");
    expect(publicWindow.checkoutOpen).toBe(false);
    expect(publicWindow.inactiveMessage).toBe(
      CONFERENCE_INSCRIPTION_MESSAGES.closed,
    );
  });
});
