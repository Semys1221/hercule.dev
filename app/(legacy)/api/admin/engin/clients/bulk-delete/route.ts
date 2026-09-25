import { NextResponse } from "next/server";

import {
  deleteConferenceClient,
  type DeleteConferenceClientResult,
} from "@/lib/clients/delete-client";
import { createClientsClient } from "@/lib/clients/supabase";

const MAX_BULK_DELETE = 50;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: unknown };
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 },
      );
    }

    const rawIds = body.ids.filter((id): id is string => typeof id === "string");
    const ids = [...new Set(rawIds.map((id) => id.trim()).filter(Boolean))];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "ids must contain valid client ids" },
        { status: 400 },
      );
    }
    if (ids.length > MAX_BULK_DELETE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BULK_DELETE} clients per request` },
        { status: 400 },
      );
    }

    const supabase = createClientsClient();
    const deleted: DeleteConferenceClientResult[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of ids) {
      try {
        const result = await deleteConferenceClient({ supabase, clientId: id });
        deleted.push(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete client";
        failed.push({ id, error: message });
      }
    }

    if (deleted.length === 0) {
      return NextResponse.json(
        { deleted, failed, error: "No clients were deleted" },
        { status: 400 },
      );
    }

    return NextResponse.json({ deleted, failed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bulk delete clients";
    console.error("[api/admin/engin/clients/bulk-delete]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
