import { NextResponse } from "next/server";
import { z } from "zod";

import { CLIENT_CGV_VERSION } from "@/lib/clients/cgv-onboarding";
import { CLIENT_VIDEO_CONFERENCE_OPTIONS } from "@/lib/clients/video-conference";
import { loadClientDashboard } from "@/lib/clients/load-client-dashboard";
import {
  completeClientOnboarding,
  updateClientFirstName,
  waiveClientRetraction,
} from "@/lib/clients/onboarding-complete";
import {
  createClientsClient,
  findClientBySlug,
} from "@/lib/clients/supabase";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const row = await findClientBySlug(client, normalizedSlug);
    if (!row) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data = await loadClientDashboard(client, row);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    console.error("[api/clients/slug GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const patchSchema = z.object({
  firstName: z.string().min(1).max(120).optional(),
  videoConference: z.enum(CLIENT_VIDEO_CONFERENCE_OPTIONS).optional(),
  unavailability: z.string().min(1).max(2000).optional(),
  completeOnboarding: z.boolean().optional(),
  cgvVersion: z.string().min(1).max(32).optional(),
  waiveRetraction: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const row = await findClientBySlug(client, normalizedSlug);
    if (!row) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (parsed.data.waiveRetraction && !parsed.data.completeOnboarding) {
      await waiveClientRetraction({ client, row });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.firstName && !parsed.data.completeOnboarding) {
      await updateClientFirstName({
        client,
        row,
        firstName: parsed.data.firstName,
      });
      return NextResponse.json({ ok: true });
    }

    if (parsed.data.completeOnboarding) {
      const firstName = parsed.data.firstName?.trim() || row.first_name?.trim();
      if (!firstName) {
        return NextResponse.json({ error: "firstName required" }, { status: 400 });
      }

      const cgvVersion = parsed.data.cgvVersion?.trim();
      if (!cgvVersion || cgvVersion !== CLIENT_CGV_VERSION) {
        return NextResponse.json(
          { error: "cgvVersion required", expected: CLIENT_CGV_VERSION },
          { status: 400 },
        );
      }

      if (!parsed.data.videoConference) {
        return NextResponse.json({ error: "videoConference required" }, { status: 400 });
      }

      const unavailability = parsed.data.unavailability?.trim();
      if (!unavailability) {
        return NextResponse.json({ error: "unavailability required" }, { status: 400 });
      }

      const { hasSucceededClientPayment } = await import(
        "@/lib/clients/load-client-dashboard"
      );
      const isPaid = await hasSucceededClientPayment(client, row.id);
      if (!isPaid) {
        return NextResponse.json({ error: "Payment required" }, { status: 403 });
      }

      await completeClientOnboarding({
        client,
        row,
        firstName,
        videoConference: parsed.data.videoConference,
        unavailability,
        cgvVersion,
        waiveRetraction: parsed.data.waiveRetraction,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "No changes" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    console.error("[api/clients/slug PATCH]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
