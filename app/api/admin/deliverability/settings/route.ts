import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidateDeliverabilityCache } from "@/lib/admin/deliverability/cache";
import {
  getDeliverabilitySettings,
  updateDeliverabilitySettings,
} from "@/lib/admin/deliverability/settings";
import { deliverabilitySettingsSchema } from "@/lib/admin/deliverability/types";

const patchSchema = deliverabilitySettingsSchema.partial();

export async function GET() {
  try {
    const settings = await getDeliverabilitySettings();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let patch: z.infer<typeof patchSchema>;
  try {
    const json = await request.json();
    patch = patchSchema.parse(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const settings = await updateDeliverabilitySettings(patch);
    invalidateDeliverabilityCache();
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
