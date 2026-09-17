import { stopAllLeadRelances } from "@/lib/lead-relances/stop-all";

function parseArgs(): {
  email: string;
  campaignId?: string;
  execute: boolean;
} {
  const argv = process.argv.slice(2);
  let email = "";
  let campaignId: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith("--email=")) {
      email = arg.slice("--email=".length).trim();
    } else if (arg.startsWith("--campaign-id=")) {
      campaignId = arg.slice("--campaign-id=".length).trim();
    }
  }
  return {
    email,
    campaignId,
    execute: argv.includes("--execute"),
  };
}

async function main(): Promise<void> {
  const { email, campaignId, execute } = parseArgs();
  if (!email) {
    console.error("Usage: pnpm stop-lead-relances -- --email=lead@example.com [--campaign-id=UUID] [--execute]");
    process.exit(1);
  }

  const result = await stopAllLeadRelances({
    leadEmail: email,
    campaignId,
    reason: "manual stop-lead-relances",
    dryRun: !execute,
  });

  console.log(JSON.stringify(result, null, 2));
  if (!execute) {
    console.log("Dry-run only. Re-run with --execute to apply.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
