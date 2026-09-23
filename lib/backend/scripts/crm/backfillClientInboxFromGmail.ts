import { backfillClientInboxFromGmail } from "@/lib/engin/client-inbox/sync-backfill";

async function main() {
  const result = await backfillClientInboxFromGmail();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
