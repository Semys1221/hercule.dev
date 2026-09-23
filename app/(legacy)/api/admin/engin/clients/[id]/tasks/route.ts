import { NextResponse } from "next/server";

import type { ClientOpsTask } from "@/lib/clients/engin-types";
import { createClientsClient, findClientById } from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const supabase = createClientsClient();
    const { data, error } = await supabase
      .from("client_ops_tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ tasks: (data ?? []) as ClientOpsTask[] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list tasks";
    console.error("[api/admin/engin/clients/id/tasks GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { title?: unknown; dueAt?: unknown };
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 240) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    let dueAt: string | null = null;
    if (typeof body.dueAt === "string" && body.dueAt.trim()) {
      const parsed = new Date(body.dueAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "dueAt invalid" }, { status: 400 });
      }
      dueAt = parsed.toISOString();
    }

    const supabase = createClientsClient();
    const existing = await findClientById(supabase, clientId);
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("client_ops_tasks")
      .insert({
        client_id: clientId,
        title,
        due_at: dueAt,
        status: "open",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create task");
    }

    return NextResponse.json({ task: data as ClientOpsTask });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    console.error("[api/admin/engin/clients/id/tasks POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
