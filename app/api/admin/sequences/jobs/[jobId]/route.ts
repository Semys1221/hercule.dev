import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getInstantlyJobDetail,
  getResendJobDetail,
} from "@/lib/admin/sequences/sequence-history";

const querySchema = z.object({
  provider: z.enum(["resend", "instantly"]).default("resend"),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    provider: searchParams.get("provider") ?? "resend",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const job =
      parsed.data.provider === "instantly"
        ? await getInstantlyJobDetail(jobId)
        : await getResendJobDetail(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ provider: parsed.data.provider, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
