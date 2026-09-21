import { afterEach, describe, expect, it, vi } from "vitest";

import { createInvitee } from "./create-invitee";

describe("createInvitee", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts invitee payload to Calendly", async () => {
    process.env.CALENDLY_API_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          resource: {
            uri: "https://api.calendly.com/scheduled_events/EVT/invitees/INV",
            event: "https://api.calendly.com/scheduled_events/EVT",
            start_time: "2026-09-10T12:30:00.000Z",
            reschedule_url: "https://calendly.com/reschedulings/RS",
            cancel_url: "https://calendly.com/cancellations/CA",
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createInvitee({
      eventTypeUri: "https://api.calendly.com/event_types/ABC",
      startTime: "2026-09-10T12:30:00.000Z",
      inviteeEmail: "cabinet@example.com",
      inviteeName: "Jean Dupont",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.event_type).toContain("event_types");
    expect(body.invitee.email).toBe("cabinet@example.com");
    expect(result.rescheduleUrl).toContain("reschedulings");
  });
});
