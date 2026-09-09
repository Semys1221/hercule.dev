import { z } from "zod";

import { createBypassClient } from "@/lib/instantly-bypass/supabase";

import {
  DEFAULT_DELIVERABILITY_SETTINGS,
  deliverabilitySettingsSchema,
  type DeliverabilitySettings,
} from "@/lib/admin/deliverability/types";

const SETTINGS_ROW_ID = 1;

const patchSettingsSchema = deliverabilitySettingsSchema.partial();

export type DeliverabilitySettingsPatch = z.infer<typeof patchSettingsSchema>;

function rowToSettings(row: {
  health_score_warn_below: number;
  inbox_rate_warn_below: number | string;
  refresh_minutes: number;
  excluded_emails: string[] | null;
  auto_pause_on_alert: boolean;
}): DeliverabilitySettings {
  return deliverabilitySettingsSchema.parse({
    health_score_warn_below: row.health_score_warn_below,
    inbox_rate_warn_below: Number(row.inbox_rate_warn_below),
    refresh_minutes: row.refresh_minutes,
    excluded_emails: row.excluded_emails ?? [],
    auto_pause_on_alert: row.auto_pause_on_alert,
  });
}

export async function getDeliverabilitySettings(): Promise<DeliverabilitySettings> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("deliverability_settings")
    .select(
      "health_score_warn_below, inbox_rate_warn_below, refresh_minutes, excluded_emails, auto_pause_on_alert",
    )
    .eq("id", SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    if (/deliverability_settings|schema cache|does not exist/i.test(error.message)) {
      return DEFAULT_DELIVERABILITY_SETTINGS;
    }
    throw new Error(`Failed to load deliverability settings: ${error.message}`);
  }

  if (!data) {
    return DEFAULT_DELIVERABILITY_SETTINGS;
  }

  return rowToSettings(data);
}

export async function updateDeliverabilitySettings(
  patch: DeliverabilitySettingsPatch,
): Promise<DeliverabilitySettings> {
  const parsedPatch = patchSettingsSchema.parse(patch);
  const current = await getDeliverabilitySettings();
  const next = deliverabilitySettingsSchema.parse({ ...current, ...parsedPatch });

  const client = createBypassClient();
  const { error } = await client.from("deliverability_settings").upsert(
    {
      id: SETTINGS_ROW_ID,
      health_score_warn_below: next.health_score_warn_below,
      inbox_rate_warn_below: next.inbox_rate_warn_below,
      refresh_minutes: next.refresh_minutes,
      excluded_emails: next.excluded_emails,
      auto_pause_on_alert: next.auto_pause_on_alert,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    if (/deliverability_settings|schema cache|does not exist/i.test(error.message)) {
      throw new Error(
        "Table deliverability_settings absente — lancez pnpm apply-deliverability-settings-migration",
      );
    }
    throw new Error(`Failed to save deliverability settings: ${error.message}`);
  }

  return next;
}

export function parseExcludedEmailsText(value: string): string[] {
  const emailSchema = z.string().email();
  const unique = new Set<string>();

  for (const raw of value.split(/[\n,;]+/)) {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) continue;
    const parsed = emailSchema.safeParse(trimmed);
    if (parsed.success) {
      unique.add(parsed.data);
    }
  }

  return [...unique];
}

export function formatExcludedEmailsText(emails: string[]): string {
  return emails.join("\n");
}
