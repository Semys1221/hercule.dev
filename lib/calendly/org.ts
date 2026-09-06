import { getCalendlyApiToken } from "@/lib/calendly";
import { normalizeEmail } from "@/lib/link-tracking/supabase";

const CALENDLY_API = "https://api.calendly.com";

export type CalendlyInvitationStatus = "pending" | "accepted" | "declined";

export type CalendlySeatStatus = {
  invitationStatus: CalendlyInvitationStatus | null;
  isMember: boolean;
};

type CalendlyListPayload = {
  collection?: Array<Record<string, unknown>>;
};

async function calendlyGet(path: string, params?: Record<string, string>): Promise<CalendlyListPayload> {
  const token = getCalendlyApiToken();
  const url = new URL(`${CALENDLY_API}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Calendly ${response.status}: ${body}`);
  }

  return (await response.json()) as CalendlyListPayload;
}

function extractOrgUuid(orgUri: string): string {
  const trimmed = orgUri.trim().replace(/\/$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] ?? "";
}

export async function getCurrentOrganizationUri(): Promise<string> {
  const payload = await calendlyGet("/users/me");
  const resource = (payload as { resource?: Record<string, unknown> }).resource ?? {};
  const uri = String(resource.current_organization ?? "").trim();
  if (!uri) {
    throw new Error("Calendly /users/me returned no current_organization");
  }
  return uri;
}

function parseInvitationStatus(value: unknown): CalendlyInvitationStatus | null {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "pending" || status === "accepted" || status === "declined") {
    return status;
  }
  return null;
}

export async function getCalendlySeatStatus(email: string): Promise<CalendlySeatStatus> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { invitationStatus: null, isMember: false };
  }

  const orgUri = await getCurrentOrganizationUri();
  const orgUuid = extractOrgUuid(orgUri);

  const memberships = await calendlyGet("/organization_memberships", {
    email: normalized,
    organization: orgUri,
    count: "10",
  });

  const isMember = (memberships.collection ?? []).length > 0;
  if (isMember) {
    return { invitationStatus: "accepted", isMember: true };
  }

  const invitations = await calendlyGet(`/organizations/${orgUuid}/invitations`, {
    email: normalized,
    count: "10",
  });

  let invitationStatus: CalendlyInvitationStatus | null = null;
  for (const row of invitations.collection ?? []) {
    const status = parseInvitationStatus(row.status);
    if (!status) {
      continue;
    }
    if (status === "accepted") {
      return { invitationStatus: "accepted", isMember: false };
    }
    if (status === "pending") {
      invitationStatus = "pending";
    } else if (status === "declined" && invitationStatus !== "pending") {
      invitationStatus = "declined";
    }
  }

  return { invitationStatus, isMember: false };
}
