import { createSalesCallsClient, findLatestSalesCallByComptableId } from "@/lib/sales-calls/supabase";

const MENIAUD_COMPTABLE_ID = "0f304fc7-ac3a-4cfb-a6a5-6a9da927f32b";

async function main() {
  const client = createSalesCallsClient();
  const sc = await findLatestSalesCallByComptableId(client, MENIAUD_COMPTABLE_ID);
  console.log(
    JSON.stringify({
      status: sc?.status ?? null,
      id: sc?.id ?? null,
      comptable_id: sc?.comptable_id ?? null,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
