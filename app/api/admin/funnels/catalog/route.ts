import { NextResponse } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/auth";
import { captureDesignTokens } from "@/lib/admin/funnels/tokens";
import { getPresetsCatalog } from "@/lib/admin/funnels/catalog";

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const catalog = getPresetsCatalog();
    const designTokens = captureDesignTokens();
    return NextResponse.json({ catalog, designTokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
