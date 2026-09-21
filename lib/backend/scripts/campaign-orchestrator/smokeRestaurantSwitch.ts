/**
 * Dry-run smoke for campaign-restaurant-switch cron endpoint.
 *
 * Usage:
 *   pnpm smoke-campaign-restaurant-switch
 */

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const cronSecret = requireEnv("CRON_SECRET");
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000";
  const url = `${base}/api/cron/campaign-restaurant-switch?dryRun=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep raw text
  }

  if (!response.ok) {
    throw new Error(
      `Smoke failed (${response.status}): ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`,
    );
  }

  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
