import type { SupabaseClient } from "@supabase/supabase-js";

import { buildPipelineIntroScript } from "@/lib/calendly/pipeline-intro-script";
import type {
  PipelineQualificationInput,
  PipelineQualificationStored,
} from "@/lib/calendly/pipeline-qualification-schema";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadByLink,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import type { LeadLookup } from "@/lib/link-tracking/types";

export type PipelineQualificationLookup = {
  slug: string;
  email: string;
  agenceId: string;
  existingQualification: PipelineQualificationStored | null;
};

function readStoredQualification(
  profile: Record<string, unknown> | null | undefined,
): PipelineQualificationStored | null {
  const pipeline = profile?.pipeline;
  if (!pipeline || typeof pipeline !== "object") {
    return null;
  }
  return pipeline as PipelineQualificationStored;
}

async function resolveAgenceLead(
  client: SupabaseClient,
  params: { slug?: string; email?: string },
): Promise<LeadLookup | null> {
  const slug = params.slug?.trim();
  if (slug) {
    const bySlug = await findLeadByLink(client, slug);
    if (bySlug?.category === "agence") {
      return bySlug;
    }
    return null;
  }

  const email = params.email?.trim();
  if (!email) {
    return null;
  }

  const byEmail = await findLeadByEmail(client, email);
  if (byEmail?.category === "agence") {
    return byEmail;
  }
  return null;
}

export async function loadPipelineQualificationBySlug(
  slug: string,
): Promise<PipelineQualificationLookup | null> {
  const client = createLinkTrackingClient();
  const lookup = await resolveAgenceLead(client, { slug });
  if (!lookup) {
    return null;
  }

  const profile = (lookup.lead.profile ?? {}) as Record<string, unknown>;
  return {
    slug: lookup.lead.slug,
    email: lookup.lead.email,
    agenceId: lookup.lead.id,
    existingQualification: readStoredQualification(profile),
  };
}

export async function savePipelineQualification(
  input: PipelineQualificationInput,
): Promise<{ agenceId: string; slug: string; qualification: PipelineQualificationStored }> {
  const client = createLinkTrackingClient();
  const lookup = await resolveAgenceLead(client, {
    slug: input.slug,
    email: input.email,
  });

  if (!lookup) {
    throw new Error("LEAD_NOT_FOUND");
  }

  if (
    normalizeEmail(lookup.lead.email) !== normalizeEmail(input.email)
  ) {
    throw new Error("EMAIL_MISMATCH");
  }

  const intro_script = buildPipelineIntroScript(input);
  const qualification: PipelineQualificationStored = {
    ...input,
    slug: lookup.lead.slug,
    email: normalizeEmail(input.email),
    intro_script,
    submitted_at: new Date().toISOString(),
  };

  const existingProfile = (lookup.lead.profile ?? {}) as Record<string, unknown>;
  const updatedProfile = {
    ...existingProfile,
    pipeline: qualification,
  };

  const { error } = await client
    .from("agence")
    .update({ profile: updatedProfile })
    .eq("id", lookup.lead.id);

  if (error) {
    throw new Error(`pipeline qualification save failed: ${error.message}`);
  }

  return {
    agenceId: lookup.lead.id,
    slug: lookup.lead.slug,
    qualification,
  };
}
