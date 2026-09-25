/**
 * Export rows before Supabase cleanup (agence stack, demandes, temporary_leads).
 * Writes CSV under doc/supabase/archive/pre-drop-<date>/ (gitignored via .gitignore).
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

import { loadEnvFiles } from "./migrationUtils";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, "../../../..");
const ARCHIVE_DIR = path.join(
  REPO_ROOT,
  "doc/supabase/archive",
  `pre-drop-${new Date().toISOString().slice(0, 10)}`,
);

const PAGE_SIZE = 1000;

const TABLE_EXPORTS: { table: string; orderBy?: string }[] = [
  { table: "agence", orderBy: "created_at" },
  { table: "entreprise", orderBy: "created_at" },
  { table: "matches", orderBy: "created_at" },
  { table: "appointments", orderBy: "created_at" },
  { table: "agence_demandes", orderBy: "id" },
  { table: "comptable_demandes", orderBy: "id" },
  { table: "cif_demandes", orderBy: "id" },
  { table: "temporary_leads", orderBy: "migrated_at" },
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function exportTable(
  client: ReturnType<typeof createClient>,
  table: string,
  orderBy?: string,
): Promise<number> {
  const all: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    let query = client.from(table).select("*");
    if (orderBy) {
      query = query.order(orderBy, { ascending: true });
    }
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
    const batch = (data ?? []) as Record<string, unknown>[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    process.stdout.write(`  ${table}: ${all.length} rows...\n`);
  }

  const outPath = path.join(ARCHIVE_DIR, `${table}.csv`);
  fs.writeFileSync(outPath, rowsToCsv(all), "utf8");
  return all.length;
}

async function exportFiltered(
  client: ReturnType<typeof createClient>,
  filename: string,
  table: string,
  filter: (q: ReturnType<typeof client.from>) => ReturnType<typeof client.from>,
): Promise<number> {
  const { data, error } = await filter(client.from(table).select("*"));
  if (error) throw new Error(`${filename}: ${error.message}`);
  const rows = (data ?? []) as Record<string, unknown>[];
  fs.writeFileSync(
    path.join(ARCHIVE_DIR, `${filename}.csv`),
    rowsToCsv(rows),
    "utf8",
  );
  return rows.length;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }

  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const manifest: Record<string, number> = {};

  for (const { table, orderBy } of TABLE_EXPORTS) {
    console.log(`Exporting ${table}...`);
    manifest[table] = await exportTable(client, table, orderBy);
    console.log(`  → ${manifest[table]} rows`);
  }

  console.log("Exporting related payments / sales_calls / booking jobs / recipients...");
  manifest.payments_agence_or_entreprise = await exportFiltered(
    client,
    "payments_agence_or_entreprise",
    "payments",
    (q) => q.or("agence_id.not.is.null,entreprise_id.not.is.null"),
  );
  manifest.sales_calls_agence_or_entreprise = await exportFiltered(
    client,
    "sales_calls_agence_or_entreprise",
    "sales_calls",
    (q) => q.or("agence_id.not.is.null,entreprise_id.not.is.null"),
  );
  manifest.booking_email_jobs_agence_entreprise = await exportFiltered(
    client,
    "booking_email_jobs_agence_entreprise",
    "booking_email_jobs",
    (q) => q.in("lead_category", ["agence", "entreprise"]),
  );
  manifest.email_sequence_recipients_agence_entreprise = await exportFiltered(
    client,
    "email_sequence_recipients_agence_entreprise",
    "email_sequence_recipients",
    (q) => q.in("lead_category", ["agence", "entreprise"]),
  );

  fs.writeFileSync(
    path.join(ARCHIVE_DIR, "manifest.json"),
    `${JSON.stringify({ exportedAt: new Date().toISOString(), counts: manifest }, null, 2)}\n`,
    "utf8",
  );

  console.log(`\nArchive written to ${ARCHIVE_DIR}`);
  console.log(manifest);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
