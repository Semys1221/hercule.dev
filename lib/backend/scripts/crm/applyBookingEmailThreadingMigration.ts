import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const MIGRATION_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../supabase/migrations/20260907100000_booking_email_threading.sql",
);

const DEFAULT_PROJECT_REF = "sgituxpzobtucbsmwsmr";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function projectRefFromEnv(): string {
  const url =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url) {
    try {
      const ref = new URL(url).hostname.split(".")[0];
      if (ref) return ref;
    } catch {
      // fall through
    }
  }
  return process.env.SUPABASE_PROJECT_ID?.trim() || DEFAULT_PROJECT_REF;
}

async function applyViaManagementApi(query: string): Promise<void> {
  const accessToken = requireEnv("SUPABASE_ACCESS_TOKEN");
  const projectRef = projectRefFromEnv();

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Management API HTTP ${response.status}: ${body}`);
  }
}

function isBenignAlreadyExists(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /already exists|duplicate|23505/i.test(message);
}

async function main(): Promise<void> {
  const query = fs.readFileSync(MIGRATION_FILE, "utf8");
  console.log(`Applying ${path.basename(MIGRATION_FILE)}...`);
  try {
    await applyViaManagementApi(query);
  } catch (err) {
    if (!isBenignAlreadyExists(err)) {
      throw err;
    }
    console.log("Migration objects already present.");
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
