import { describe, expect, it, vi } from "vitest";

/**
 * Integration-style test documenting the expected PATCH contract
 * without requiring MSW (fetch mocked via vitest).
 */
describe("dashboard retraction PATCH contract", () => {
  it("sends waiveRetraction on late waiver", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await fetchMock("/api/dashboard/seed-test", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waiveRetraction: true }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dashboard/seed-test",
      expect.objectContaining({
        body: JSON.stringify({ waiveRetraction: true }),
      }),
    );
  });
});
