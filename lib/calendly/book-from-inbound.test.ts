import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bookFromInbound } from "./book-from-inbound";

vi.mock("./availability", () => ({
  getEventTypeUri: vi.fn().mockResolvedValue("https://api.calendly.com/event_types/ABC"),
  findNextAvailableSlotsForEventType: vi.fn().mockResolvedValue([
    new Date("2026-09-16T12:00:00.000Z"),
    new Date("2026-09-17T09:00:00.000Z"),
    new Date("2026-09-18T14:30:00.000Z"),
  ]),
  formatFrenchSlotLabel: vi.fn((date: Date) => `slot-${date.toISOString()}`),
}));

vi.mock("./list-bookings", () => ({
  listUpcomingBookings: vi.fn().mockResolvedValue([]),
}));

vi.mock("./match-inbound-slot", () => ({
  matchInboundSlot: vi.fn(),
}));

vi.mock("./create-invitee", () => ({
  createInvitee: vi.fn(),
}));

import { createInvitee } from "./create-invitee";
import { matchInboundSlot } from "./match-inbound-slot";
import { listUpcomingBookings } from "./list-bookings";

describe("bookFromInbound", () => {
  beforeEach(() => {
    process.env.AI_REPLY_AGENT_CALENDLY_AUTO_BOOK = "true";
    vi.mocked(listUpcomingBookings).mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.AI_REPLY_AGENT_CALENDLY_AUTO_BOOK;
    vi.clearAllMocks();
  });

  it("returns disabled when feature flag is off", async () => {
    process.env.AI_REPLY_AGENT_CALENDLY_AUTO_BOOK = "false";
    const result = await bookFromInbound({
      event: "comptable",
      leadEmail: "cabinet@example.com",
      leadName: "Cabinet",
      inboundText: "mardi 14h",
      mode: "try_book",
    });
    expect(result).toEqual({ status: "disabled" });
  });

  it("returns suggest_slots for phone requests", async () => {
    const result = await bookFromInbound({
      event: "comptable",
      leadEmail: "cabinet@example.com",
      leadName: "Cabinet",
      inboundText: "Appelez-nous par téléphone",
      mode: "suggest_slots",
    });
    expect(result.status).toBe("suggest_slots");
    if (result.status === "suggest_slots") {
      expect(result.slots).toHaveLength(2);
    }
  });

  it("books when slot matches confidently", async () => {
    vi.mocked(matchInboundSlot).mockReturnValue({
      kind: "matched",
      startTime: "2026-09-16T12:00:00.000Z",
      label: "mardi 14h",
    });
    vi.mocked(createInvitee).mockResolvedValue({
      startTime: "2026-09-16T12:00:00.000Z",
      rescheduleUrl: "https://calendly.com/reschedulings/RS",
      cancelUrl: "https://calendly.com/cancellations/CA",
      eventUri: "https://api.calendly.com/scheduled_events/EVT",
    });

    const result = await bookFromInbound({
      event: "comptable",
      leadEmail: "cabinet@example.com",
      leadName: "Cabinet",
      inboundText: "mardi 14h",
      mode: "try_book",
    });

    expect(result).toEqual({
      status: "booked",
      slotLabel: "mardi 14h",
      startTime: "2026-09-16T12:00:00.000Z",
      rescheduleUrl: "https://calendly.com/reschedulings/RS",
      cancelUrl: "https://calendly.com/cancellations/CA",
    });
    expect(createInvitee).toHaveBeenCalledOnce();
  });

  it("returns already_booked when future booking exists", async () => {
    vi.mocked(listUpcomingBookings).mockResolvedValue([
      {
        email: "cabinet@example.com",
        start_time: "2026-09-20T10:00:00.000Z",
        calendly_reschedule_url: "https://calendly.com/reschedulings/EXISTING",
      },
    ] as never);

    const result = await bookFromInbound({
      event: "comptable",
      leadEmail: "cabinet@example.com",
      leadName: "Cabinet",
      inboundText: "mardi 14h",
      mode: "try_book",
    });

    expect(result.status).toBe("already_booked");
    if (result.status === "already_booked") {
      expect(result.rescheduleUrl).toContain("EXISTING");
    }
    expect(createInvitee).not.toHaveBeenCalled();
  });

  it("returns ambiguous when match is unclear", async () => {
    vi.mocked(matchInboundSlot).mockReturnValue({
      kind: "ambiguous",
      suggestions: [
        { startTime: "2026-09-16T12:00:00.000Z", label: "slot-a" },
        { startTime: "2026-09-17T09:00:00.000Z", label: "slot-b" },
      ],
    });

    const result = await bookFromInbound({
      event: "comptable",
      leadEmail: "cabinet@example.com",
      leadName: "Cabinet",
      inboundText: "je suis libre cette semaine",
      mode: "try_book",
    });

    expect(result.status).toBe("ambiguous");
  });
});
