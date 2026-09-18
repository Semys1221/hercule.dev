import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatPendingBookingConfirmationContext,
  inboundNeedsBookingConfirmation,
  resolveBookingContext,
} from "./booking-context";
import { INTERESTED_STATUS } from "./reply-gate";

vi.mock("@/lib/link-tracking/provision-campaign-lead", () => ({
  resolveCategoryForCampaign: vi.fn().mockResolvedValue("cif"),
}));

vi.mock("@/lib/calendly/book-from-inbound", () => ({
  bookFromInbound: vi.fn().mockResolvedValue({ status: "disabled" }),
  formatBookingContextForGrok: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/calendly/list-bookings", () => ({
  isCalendlyBookingCanceled: vi.fn().mockReturnValue(false),
  listUpcomingBookings: vi.fn().mockResolvedValue([]),
}));

import { listUpcomingBookings } from "@/lib/calendly/list-bookings";

const AURELIA_REPLY = `D'accord, effectivement j'ai des cabinets médicaux dans mes clients.
Avec plaisir pour échanger sur le sujet.
Bonne journée`;

describe("inboundNeedsBookingConfirmation", () => {
  it("detects soft interest without booking claim", () => {
    expect(inboundNeedsBookingConfirmation(AURELIA_REPLY)).toBe(true);
  });

  it("returns false when lead claims they booked", () => {
    expect(
      inboundNeedsBookingConfirmation(
        "D'accord, j'ai réservé un créneau pour demain matin.",
      ),
    ).toBe(false);
  });

  it("returns false for scheduling answers", () => {
    expect(inboundNeedsBookingConfirmation("Je suis disponible jeudi 14h")).toBe(
      false,
    );
  });
});

describe("resolveBookingContext", () => {
  beforeEach(() => {
    vi.mocked(listUpcomingBookings).mockResolvedValue([]);
  });

  it("returns pending booking context for Interested CIF leads", async () => {
    const context = await resolveBookingContext({
      campaignId: "camp-1",
      inboundText: AURELIA_REPLY,
      leadEmail: "contact@aurelia-patrimoine.fr",
      leadName: "Aurelia Poher",
      interestStatus: INTERESTED_STATUS,
    });

    expect(context).toBe(formatPendingBookingConfirmationContext());
  });

  it("returns null when a Calendly booking already exists", async () => {
    vi.mocked(listUpcomingBookings).mockResolvedValue([
      {
        email: "contact@aurelia-patrimoine.fr",
        calendly_reschedule_url: "https://calendly.com/reschedulings/ABC",
      },
    ] as never);

    const context = await resolveBookingContext({
      campaignId: "camp-1",
      inboundText: AURELIA_REPLY,
      leadEmail: "contact@aurelia-patrimoine.fr",
      leadName: "Aurelia Poher",
      interestStatus: INTERESTED_STATUS,
    });

    expect(context).toBeNull();
  });

  it("returns null for Lead tag recovery replies", async () => {
    const context = await resolveBookingContext({
      campaignId: "camp-1",
      inboundText: AURELIA_REPLY,
      leadEmail: "contact@aurelia-patrimoine.fr",
      leadName: "Aurelia Poher",
      interestStatus: 0,
    });

    expect(context).toBeNull();
  });
});
