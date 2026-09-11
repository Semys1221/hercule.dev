/**
 * Writes link-tracking webhook SQL to a file (includes vault secret — delete after apply).
 * Usage: pnpm exec tsx scripts/crm/generateSupabaseLinkTrackingWebhookSql.ts /tmp/webhook.sql
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LEAD_TABLES = ["agence", "comptable", "entreprise", "cif"] as const;
type LeadTable = (typeof LEAD_TABLES)[number];

function loadEnvFile(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
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
      tables.push(argv[index + 1] as LeadTable);
      index += 1;
    }
  }
  return tables.length > 0 ? tables : ["comptable"];
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function triggerSql(table: LeadTable, url: string): string {
  const functionName = `notify_link_tracking_webhook_${table}`;
  const triggerName = `${table}_link_tracking_webhook`;

  return `
CREATE OR REPLACE FUNCTION public.${functionName}()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions, vault
AS $$
DECLARE
  bearer TEXT;
BEGIN
  IF (NEW.statut IN ('BOOKED', 'MEETING_BOOKED'))
     AND NOT (OLD.statut IN ('BOOKED', 'MEETING_BOOKED')) THEN
    SELECT decrypted_secret
    INTO bearer
    FROM vault.decrypted_secrets
    WHERE name = 'link_tracking_webhook_bearer'
    LIMIT 1;

    IF bearer IS NULL OR length(trim(bearer)) = 0 THEN
      RAISE WARNING 'link_tracking_webhook_bearer missing in vault';
      RETURN NEW;
    END IF;

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
        'Authorization', bearer
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

function main(): void {
  const outPath = process.argv[2];
  if (!outPath) {
    throw new Error("Usage: tsx generateSupabaseLinkTrackingWebhookSql.ts <output.sql>");
  }

  const fileEnv = loadEnvFile();
  const secret =
    process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    fileEnv.LINK_TRACKING_WEBHOOK_SECRET ||
    fileEnv.CRON_SECRET;
  if (!secret) {
    throw new Error("Set LINK_TRACKING_WEBHOOK_SECRET or CRON_SECRET");
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    fileEnv.NEXT_PUBLIC_APP_URL ||
    "https://www.hercule.dev";
  const targetUrl = `${appUrl.replace(/\/$/, "")}/api/webhooks/supabase-link-tracking`;
  const tables = parseTables(process.argv.slice(3));

  const parts = [
    "CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;",
    `SELECT vault.create_secret(${sqlLiteral(`Bearer ${secret}`)}, 'link_tracking_webhook_bearer', 'Authorization header for link-tracking webhook');`,
    ...tables.map((table) => triggerSql(table, targetUrl)),
  ];

  writeFileSync(outPath, parts.join("\n"), { mode: 0o600 });
  console.log(`Wrote ${outPath} for tables: ${tables.join(", ")}`);
}

main();
