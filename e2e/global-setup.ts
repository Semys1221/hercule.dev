import { readFileSync } from "node:fs";
import { join } from "node:path";

import { E2E_RESEND_FROM } from "./test-identity";

function parseEnvFile(path: string): Record<string, string> {
  const values: Record<string, string> = {};
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  } catch {
    // optional file
  }
  return values;
}

function applyEnv(values: Record<string, string>, override = false): void {
  for (const [key, value] of Object.entries(values)) {
    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function firstStripeTestSecret(): string | undefined {
  try {
    const content = readFileSync(join(process.cwd(), ".env"), "utf8");
    const match = content.match(/sk_test_[A-Za-z0-9]+/);
    return match?.[0];
  } catch {
    return undefined;
  }
}

function preferStripeTestMode(): void {
  const rootEnv = parseEnvFile(join(process.cwd(), ".env"));
  const testSecret = firstStripeTestSecret();
  const publishable =
    rootEnv.STRIPE_PUBLISHABLE_KEY ??
    rootEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (testSecret && publishable?.startsWith("pk_test_")) {
    process.env.STRIPE_SECRET_KEY = testSecret;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = publishable;
  }
}

function preferResendTestFrom(): void {
  process.env.BOOKING_RESEND_FROM = E2E_RESEND_FROM;
  process.env.RESEND_FROM = E2E_RESEND_FROM;
}

export default async function globalSetup(): Promise<void> {
  applyEnv(parseEnvFile(join(process.cwd(), ".env")));
  applyEnv(parseEnvFile(join(process.cwd(), ".env.local")), true);
  preferStripeTestMode();
  preferResendTestFrom();
}
