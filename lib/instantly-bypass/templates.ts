import { createBypassClient } from "./supabase";

import type { BypassConfig, BypassTemplate, BypassTemplateKey, TemplateVariables } from "./types";

const EMAIL_SIGNATURE = "Béatrice Meyer";
const RESERVATION_LINK_PLACEHOLDER = "{{reservation_agence_link}}";

export function templateRequiresReservationLink(bodyHtml: string): boolean {
  return bodyHtml.includes(RESERVATION_LINK_PLACEHOLDER);
}

export function isTemplateBodyEmpty(bodyHtml: string | null | undefined): boolean {
  return !bodyHtml?.trim();
}

export async function loadTemplate(
  campaignId: string,
  templateKey: BypassTemplateKey,
): Promise<BypassTemplate> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_templates")
    .select("campaign_id, template_key, subject, body_html")
    .eq("campaign_id", campaignId)
    .eq("template_key", templateKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load template ${templateKey}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Template not found: ${templateKey} for campaign ${campaignId}`);
  }

  return data as BypassTemplate;
}

export async function saveTemplate(
  campaignId: string,
  templateKey: BypassTemplateKey,
  subject: string,
  bodyHtml: string,
): Promise<void> {
  const client = createBypassClient();
  const { error } = await client.from("instantly_bypass_templates").upsert(
    {
      campaign_id: campaignId,
      template_key: templateKey,
      subject,
      body_html: bodyHtml,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id,template_key" },
  );

  if (error) {
    throw new Error(`Failed to save template ${templateKey}: ${error.message}`);
  }
}

export async function listAllTemplates(campaignId: string): Promise<BypassTemplate[]> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_templates")
    .select("campaign_id, template_key, subject, body_html")
    .eq("campaign_id", campaignId)
    .order("template_key");

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`);
  }
  return (data ?? []) as BypassTemplate[];
}

function replaceVariables(text: string, vars: TemplateVariables): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out.replaceAll("{{accountSignature}}", EMAIL_SIGNATURE);
}

export function renderTemplate(
  template: BypassTemplate,
  vars: TemplateVariables,
): { subject: string; html: string } {
  return {
    subject: replaceVariables(template.subject, vars),
    html: replaceVariables(template.body_html, vars),
  };
}

export function buildTemplateVariables(
  payload: Record<string, unknown>,
  lead?: {
    first_name?: string | null;
    company_name?: string | null;
    payload?: Record<string, unknown> | null;
  },
): TemplateVariables {
  const leadPayload = lead?.payload ?? {};
  const read = (key: string, alt?: string): string => {
    const fromPayload = payload[key] ?? payload[alt ?? ""];
    if (typeof fromPayload === "string" && fromPayload.trim()) return fromPayload.trim();
    const fromLead = leadPayload[key] ?? leadPayload[alt ?? ""];
    if (typeof fromLead === "string" && fromLead.trim()) return fromLead.trim();
    if (key === "first_name" && lead?.first_name) return lead.first_name;
    if (key === "company_name" && lead?.company_name) return lead.company_name;
    return "";
  };

  return {
    first_name: read("first_name", "firstName") || "there",
    last_name: read("last_name", "lastName"),
    company_name: read("company_name", "companyName"),
    subject: read("subject", "reply_subject") || "your message",
    reservation_agence_link: read("reservation_agence_link"),
  };
}

export async function loadBypassConfig(campaignId: string): Promise<BypassConfig | null> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_config")
    .select("*")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load bypass config: ${error.message}`);
  }
  return (data as BypassConfig | null) ?? null;
}

export async function saveBypassConfig(config: BypassConfig): Promise<void> {
  const client = createBypassClient();
  const payload: Record<string, unknown> = {
    campaign_id: config.campaign_id,
    updated_at: new Date().toISOString(),
  };
  if (config.campaign_name !== undefined) payload.campaign_name = config.campaign_name;
  if (config.webhook_id !== undefined) payload.webhook_id = config.webhook_id;
  if (config.webhook_auto_send_enabled !== undefined) {
    payload.webhook_auto_send_enabled = config.webhook_auto_send_enabled;
  }
  if (config.pipeline_auto_advance_enabled !== undefined) {
    payload.pipeline_auto_advance_enabled = config.pipeline_auto_advance_enabled;
  }
  if (config.initialized_at !== undefined) payload.initialized_at = config.initialized_at;

  const { error } = await client.from("instantly_bypass_config").upsert(
    payload,
    { onConflict: "campaign_id" },
  );
  if (error) {
    throw new Error(`Failed to save bypass config: ${error.message}`);
  }
}

export async function listBypassConfigs(): Promise<BypassConfig[]> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_config")
    .select("*")
    .order("campaign_name");

  if (error) {
    throw new Error(`Failed to list bypass configs: ${error.message}`);
  }
  return (data ?? []) as BypassConfig[];
}

export function waitingForReplyInterestValue(): number | null {
  const raw = process.env.INSTANTLY_WAITING_FOR_REPLY_INTEREST_VALUE?.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
