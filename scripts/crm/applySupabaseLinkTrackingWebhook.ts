/**
 * Apply link-tracking webhook triggers via Supabase Management API.
 * Reads secrets from env — never prints them.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const LEAD_TABLES = ["agence", "comptable", "entreprise"] as const;
type LeadTable = (typeof LEAD_TABLES)[number];

function loadEnvFile(): Record<string, string> {
  const path = resolve(process.cwd(), ".env");
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
  return env;
}

function parseTables(argv: string[]): LeadTable[] {
  const tables: LeadTable[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--table" && argv[index + 1]) {
      const value = argv[index + 1]?.trim();
      if (!LEAD_TABLES.includes(value as LeadTable)) {
        throw new Error(`Invalid table: ${value}`);
      }
      tables.push(value as LeadTable);
      index += 1;
    }
  }
  return tables.length > 0 ? tables : ["comptable"];
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function triggerSql(table: LeadTable, url: string, secret: string): string {
  const functionName = `notify_link_tracking_webhook_${table}`;
  const triggerName = `${table}_link_tracking_webhook`;

  return `
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.${functionName}()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
BEGIN
  IF (NEW.statut IN ('BOOKED', 'MEETING_BOOKED'))
     AND NOT (OLD.statut IN ('BOOKED', 'MEETING_BOOKED')) THEN
    PERFORM net.http_post(
      url := ${sqlLiteral(url)},
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', ${sqlLiteral(table)},
        'record', to_jsonb(NEW),
        'old_record', to_jsonb(OLD)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', ${sqlLiteral(`Bearer ${secret}`)}
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ${triggerName} ON public.${table};
CREATE TRIGGER ${triggerName}
  AFTER UPDATE ON public.${table}
  FOR EACH ROW
  EXECUTE FUNCTION public.${functionName}();
`;
}

async function runQuery(projectRef: string, accessToken: string, query: string): Promise<void> {
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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase query failed (${response.status}): ${text}`);
  }
}

async function main(): Promise<void> {
  const fileEnv = loadEnvFile();
  const secret =
    process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    fileEnv.LINK_TRACKING_WEBHOOK_SECRET ||
    fileEnv.CRON_SECRET;
  if (!secret) {
    throw new Error("Set LINK_TRACKING_WEBHOOK_SECRET or CRON_SECRET");
  }

  const accessToken =
    process.env.SUPABASE_ACCESS_TOKEN?.trim() || fileEnv.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Set SUPABASE_ACCESS_TOKEN (Supabase PAT with database:write)");
  }

  const projectRef =
    process.env.SUPABASE_PROJECT_ID?.trim() ||
    fileEnv.SUPABASE_PROJECT_ID ||
    "sgituxpzobtucbsmwsmr";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    fileEnv.NEXT_PUBLIC_APP_URL ||
    "https://www.hercule.dev";
  const targetUrl = `${appUrl.replace(/\/$/, "")}/api/webhooks/supabase-link-tracking`;
  const tables = parseTables(process.argv.slice(2));

  for (const table of tables) {
    await runQuery(projectRef, accessToken, triggerSql(table, targetUrl, secret));
    console.log(`Configured link-tracking webhook on public.${table} → ${targetUrl}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
