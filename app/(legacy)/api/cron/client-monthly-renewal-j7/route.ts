import { NextResponse } from "next/server";

import { runMonthlyRenewalJ7Cron } from "@/lib/clients/workflows/monthly-renewal-j7-cron";

/**
 * Daily job (08:00 Europe/Paris), same registration pattern as onboarding-reminders.
 * Register with `pnpm configure-client-monthly-renewal-j7-cron`.
 */
function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMonthlyRenewalJ7Cron();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron/client-monthly-renewal-j7]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
