/**
 * Seed fake agence / entreprise clients for the internal cockpit.
 *
 *   pnpm seed-fake-clients
 */

import { seedFakeClients } from "@/lib/admin/clients/seed";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

async function main() {
  const client = createLinkTrackingClient();
  const { slugs } = await seedFakeClients(client);

  console.log("Seeded fake clients:");
  for (const slug of slugs) {
    console.log(`  ${slug}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
