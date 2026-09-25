import { createBypassClient } from "@/lib/legacy/instantly-bypass/supabase";
import { isMissingRelationError } from "@/lib/legacy/link-tracking/supabase";

export async function recordRestaurantE1EligibilityClick(): Promise<void> {
  const client = createBypassClient();
  const { error } = await client.from("restaurant_e1_eligibility_clicks").insert({});

  if (error) {
    if (isMissingRelationError(error)) {
      throw new Error(
        "restaurant_e1_eligibility_clicks table is missing — apply Supabase migration",
      );
    }
    throw new Error(`Failed to record eligibility click: ${error.message}`);
  }
}
