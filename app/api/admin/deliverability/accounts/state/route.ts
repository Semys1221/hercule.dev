import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidateDeliverabilityCache } from "@/lib/admin/deliverability/cache";
import {
  setInstantlyAccountState,
  testAccountVitals,
} from "@/lib/admin/deliverability/instantly-accounts";
import { accountStateActionSchema } from "@/lib/admin/deliverability/types";
import { getInstantlyApiKey } from "@/lib/instantly";

const bodySchema = z.object({
  email: z.string().email(),
  action: accountStateActionSchema,
});

export async function POST(request: Request) {
  let apiKey: string;
  try {
    apiKey = getInstantlyApiKey();
  } catch {
    return NextResponse.json(
      { error: "INSTANTLY_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    payload = bodySchema.parse(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (payload.action === "test_vitals") {
      const vitals = await testAccountVitals(apiKey, [payload.email]);
      invalidateDeliverabilityCache();
      return NextResponse.json({
        ok: true,
        action: payload.action,
        email: payload.email,
        vitals: [...vitals.values()],
      });
    }

    const result = await setInstantlyAccountState(apiKey, payload.email, payload.action);
    invalidateDeliverabilityCache();
    return NextResponse.json({
      ok: true,
      action: payload.action,
      email: payload.email,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
