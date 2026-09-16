import { NextResponse } from "next/server";

import { savePipelineQualification } from "@/lib/agence/pipeline-qualification-store";
import { pipelineQualificationSchema } from "@/lib/calendly/pipeline-qualification-schema";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pipelineQualificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!parsed.data.slug?.trim()) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  try {
    const result = await savePipelineQualification(parsed.data);
    return NextResponse.json({
      ok: true,
      slug: result.slug,
      agenceId: result.agenceId,
      intro_script: result.qualification.intro_script,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "save failed";
    if (message === "LEAD_NOT_FOUND") {
      return NextResponse.json({ error: "Lead agence introuvable" }, { status: 404 });
    }
    if (message === "EMAIL_MISMATCH") {
      return NextResponse.json(
        { error: "L'email ne correspond pas au lead sélectionné" },
        { status: 403 },
      );
    }
    console.error("[admin/agence/pipeline-qualification]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
