import { NextResponse } from "next/server";
import { z } from "zod";

import { submitSurvey } from "@/lib/matching/orchestrator";
import { findMatchBySurveyToken } from "@/lib/matching/store";

type RouteParams = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  try {
    const match = await findMatchBySurveyToken(token);
    if (!match) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    const audience = match.agence_survey_token === token ? "agence" : "entreprise";
    return NextResponse.json({ audience, matchId: match.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "survey lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const postSchema = z.object({
  saleMade: z.boolean().optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await submitSurvey({ token, saleMade: parsed.data.saleMade });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "survey submit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
