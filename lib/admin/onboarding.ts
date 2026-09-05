import type { SupabaseClient } from "@supabase/supabase-js";

import type { Audience } from "@/lib/admin/navigation";
import {
  buildDefaultProfile,
  onboardingTimestamp,
  type ProfileFormFields,
} from "@/lib/admin/profile-builder";
import { generateUniqueSlug } from "@/lib/admin/slug";
import { buildLeadUrls } from "@/lib/link-tracking/urls";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Un lead existe déjà pour ${email}`);
    this.name = "DuplicateEmailError";
  }
}

export class OnboardingInsertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingInsertError";
  }
}

export async function profileColumnsSupported(
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from("agence")
      .select("profile, onboarding_completed_at")
      .limit(1);

    if (error) {
      return false;
    }
    return data !== null;
  } catch {
    return false;
  }
}

async function insertLead(
  client: SupabaseClient,
  category: LeadCategory,
  params: {
    email: string;
    slug: string;
    firstName: string;
    company: string;
    statut?: LinkTrackingLead["statut"];
    profile?: Record<string, unknown>;
    onboardingCompletedAt?: string;
  },
): Promise<LinkTrackingLead> {
  const normalized = normalizeEmail(params.email);
  const urls = buildLeadUrls(params.slug, normalized);

  const row: Record<string, unknown> = {
    email: normalized,
    statut: params.statut ?? "ONBOARDED",
    slug: params.slug,
    ...urls,
    instantly_lead_id: null,
    instantly_campaign_id: null,
    first_name: params.firstName.trim(),
    company: params.company.trim(),
    calendly_questions: {},
    scheduled_at: null,
    calendly_invitee_uri: null,
    calendly_payload: null,
  };

  if (params.profile) {
    row.profile = params.profile;
  }
  if (params.onboardingCompletedAt) {
    row.onboarding_completed_at = params.onboardingCompletedAt;
  }

  const { data, error } = await client
    .from(category)
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new OnboardingInsertError(error.message);
  }

  return data as LinkTrackingLead;
}

export async function createOnboardingFiche(params: {
  category: Audience;
  email: string;
  firstName: string;
  company: string;
  formFields: ProfileFormFields;
}): Promise<LinkTrackingLead> {
  const client = createLinkTrackingClient();
  const existing = await findLeadByEmail(client, params.email);
  if (existing) {
    throw new DuplicateEmailError(normalizeEmail(params.email));
  }

  const profileSupported = await profileColumnsSupported(client);
  const slug = await generateUniqueSlug(client);

  if (!profileSupported) {
    return insertLead(client, params.category, {
      email: params.email,
      slug,
      firstName: params.firstName,
      company: params.company,
      statut: "NOTBOOKED",
    });
  }

  const profile = buildDefaultProfile(params.formFields, params.category);
  return insertLead(client, params.category, {
    email: params.email,
    slug,
    firstName: params.firstName,
    company: params.company,
    profile,
    onboardingCompletedAt: onboardingTimestamp(),
  });
}
