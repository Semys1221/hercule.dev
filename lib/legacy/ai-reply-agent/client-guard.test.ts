import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isReplyAgentProtectedClient,
  REPLY_AGENT_CLIENT_SKIP_REASON,
} from "./client-guard";

const findClientByEmail = vi.fn();

vi.mock("@/lib/clients/appointments/find-host", () => ({
  findClientByEmail: (...args: unknown[]) => findClientByEmail(...args),
}));

describe("isReplyAgentProtectedClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for empty email", async () => {
    await expect(isReplyAgentProtectedClient("")).resolves.toBe(false);
    expect(findClientByEmail).not.toHaveBeenCalled();
  });

  it("returns true when email exists in public.clients", async () => {
    findClientByEmail.mockResolvedValue({ id: "client-1", email: "lead@example.com" });

    await expect(isReplyAgentProtectedClient("lead@example.com")).resolves.toBe(true);
    expect(findClientByEmail).toHaveBeenCalledWith("lead@example.com");
  });

  it("returns false when email is not a paying client", async () => {
    findClientByEmail.mockResolvedValue(null);

    await expect(isReplyAgentProtectedClient("lead@example.com")).resolves.toBe(false);
  });

  it("exposes a stable skip reason", () => {
    expect(REPLY_AGENT_CLIENT_SKIP_REASON).toBe(
      "Paying client (public.clients) — reply agent disabled",
    );
  });
});
