import { afterEach, describe, expect, it, vi } from "vitest";

import { createSingleUseSchedulingLink } from "./create-single-use-link";

describe("createSingleUseSchedulingLink", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts scheduling_links payload to Calendly", async () => {
    process.env.CALENDLY_API_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          resource: {
            booking_url: "https://calendly.com/d/abc/xyz",
            owner: "https://api.calendly.com/event_types/ABC",
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSingleUseSchedulingLink({
      eventTypeUri: "https://api.calendly.com/event_types/ABC",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.max_event_count).toBe(1);
    expect(body.owner_type).toBe("EventType");
    expect(result.bookingUrl).toContain("calendly.com");
  });
});
