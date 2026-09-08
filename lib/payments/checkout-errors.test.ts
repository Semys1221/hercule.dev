import { describe, expect, it, vi, afterEach } from "vitest";

import { checkoutErrorResponse } from "./checkout-errors";

describe("checkoutErrorResponse", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the real error message in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const { body, status } = checkoutErrorResponse(
      new Error("STRIPE_SECRET_KEY is not set"),
      "payments/checkout",
    );
    expect(status).toBe(500);
    expect(body.error).toBe("STRIPE_SECRET_KEY is not set");
  });

  it("masks internal errors in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { body, status } = checkoutErrorResponse(
      new Error("STRIPE_SECRET_KEY is not set"),
      "payments/checkout",
    );
    expect(status).toBe(500);
    expect(body.error).toBe("Paiement indisponible");
  });
});
