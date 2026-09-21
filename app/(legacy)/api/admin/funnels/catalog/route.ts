import { NextResponse } from "next/server";

import { captureDesignTokens } from "@/lib/legacy/admin/funnels/tokens";
import { getPresetsCatalog } from "@/lib/legacy/admin/funnels/catalog";

export async function GET(request: Request) {
  try {
    const catalog = getPresetsCatalog();
    const designTokens = captureDesignTokens();
    return NextResponse.json({ catalog, designTokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
