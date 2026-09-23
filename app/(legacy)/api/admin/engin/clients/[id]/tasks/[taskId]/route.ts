import { NextResponse } from "next/server";

import type { ClientOpsTask } from "@/lib/clients/engin-types";
import { createClientsClient } from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ id: string; taskId: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, taskId } = await params;
  const clientId = id.trim();
  const task = taskId.trim();
  if (!clientId || !task) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      title?: unknown;
      status?: unknown;
      dueAt?: unknown;
    };

    const patch: Record<string, unknown> = {};
    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title || title.length > 240) {
        return NextResponse.json({ error: "title required" }, { status: 400 });
      }
      patch.title = title;
    }
    if (body.status === "open" || body.status === "done") {
      patch.status = body.status;
      patch.done_at = body.status === "done" ? new Date().toISOString() : null;
    }
    if (body.dueAt === null) {
      patch.due_at = null;
    } else if (typeof body.dueAt === "string") {
      const parsed = new Date(body.dueAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "dueAt invalid" }, { status: 400 });
      }
      patch.due_at = parsed.toISOString();
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    }

    const supabase = createClientsClient();
    const { data, error } = await supabase
      .from("client_ops_tasks")
      .update(patch)
      .eq("id", task)
      .eq("client_id", clientId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: data as ClientOpsTask });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    console.error("[api/admin/engin/clients/id/tasks/taskId PATCH]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
