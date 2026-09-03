import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const DEFAULT_PROJECT_REF = "sgituxpzobtucbsmwsmr";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, "../..");
const MIGRATIONS_DIR = path.join(REPO_ROOT, "supabase/migrations");

export function loadEnvFiles(): void {
  for (const file of [".env", ".env.local", "crm/.env"]) {
    const envPath = path.join(REPO_ROOT, file);
    if (!fs.existsSync(envPath)) continue;

    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
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
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export function migrationPath(filename: string): string {
  return path.join(MIGRATIONS_DIR, filename);
}

export function readMigration(filename: string): string {
  return fs.readFileSync(migrationPath(filename), "utf8");
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        "Create a personal access token at https://supabase.com/dashboard/account/tokens\n" +
        "then add to .env:\n" +
        "SUPABASE_ACCESS_TOKEN=sbp_...",
    );
  }
  return value;
}

export function projectRefFromEnv(): string {
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

export async function applyViaManagementApi(query: string): Promise<void> {
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

export function isBenignAlreadyExists(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /already exists|duplicate|23505/i.test(message);
}

export async function applyMigrationFiles(filenames: string[]): Promise<void> {
  loadEnvFiles();

  for (const file of filenames) {
    const query = readMigration(file);
    console.log(`Applying ${file}...`);
    try {
      await applyViaManagementApi(query);
    } catch (err) {
      if (!isBenignAlreadyExists(err)) {
        throw err;
      }
      console.log("Migration objects already present.");
    }
  }
  console.log("Done.");
}
