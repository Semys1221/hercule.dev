/**
 * Send close-indecis sequence to Meniaud — ONLY after explicit validation.
 *
 * Usage: pnpm send-meniaud-close-indecis -- --confirm
 */

import { startCloseIndecisSequence } from "@/lib/close-indecis-sequence/orchestrator";
import { createSalesCallsClient, findSalesCallById } from "@/lib/sales-calls/supabase";

const MENIAUD_SALES_CALL_ID = "8cfaee20-9a8c-4c5f-b84c-5868e639935b";
const MENIAUD_COMPTABLE_ID = "0f304fc7-ac3a-4cfb-a6a5-6a9da927f32b";

async function main() {
  if (!process.argv.includes("--confirm")) {
    console.error(
      "Blocked: pass --confirm to send close-indecis to Meniaud (email 1 sends immediately).",
    );
    process.exit(1);
  }

  const client = createSalesCallsClient();
  const salesCall = await findSalesCallById(client, MENIAUD_SALES_CALL_ID);
  if (!salesCall) {
    throw new Error(`Sales call ${MENIAUD_SALES_CALL_ID} not found`);
  }

  const result = await startCloseIndecisSequence(
    salesCall,
    MENIAUD_COMPTABLE_ID,
    "comptable",
  );

  console.log("close-indecis started:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
