/**
 * Audit booking_email_templates + instantly_bypass_templates for empty copy,
 * deprecated variables, and stale entreprise/agence wording.
 *
 * Usage: pnpm audit-email-templates
 */

import { writeFileSync } from "node:fs";
import path from "node:path";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { isStaleAgenceCopyOnEntreprise } from "@/lib/booking-communication/template-store";

type BookingRow = {
  category: string;
  email_type: string;
  subject: string;
  body: string;
};

type BypassRow = {
  campaign_id: string;
  template_key: string;
  subject: string;
  body_html: string;
};

type Finding = {
  table: "booking_email_templates" | "instantly_bypass_templates";
  id: string;
  issue: string;
  severity: "error" | "warn";
};

const DEPRECATED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\{\{confirmUrl\}\}/, label: "deprecated {{confirmUrl}}" },
  { pattern: /\{\{link\}\}/, label: "legacy {{link}}" },
  { pattern: /\{\{confirm_link\}\}/, label: "legacy {{confirm_link}}" },
  { pattern: /\{\{tracking_url\}\}/, label: "legacy {{tracking_url}}" },
  { pattern: /\{\{firstName\}\}/, label: "camelCase {{firstName}} (use {{first_name}} in bypass)" },
  { pattern: /\b898\b/, label: "forbidden 898 pricing" },
  { pattern: /1500\s*€|1\s*500\s*€/, label: "deprecated 1500 € entry price" },
  { pattern: /4\s+jours?\s+de\s+rétractation/i, label: "forbidden 4-day retraction" },
];

const UNREPLACED_PLACEHOLDER = /\{\{(\w+)\}\}/g;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function auditBookingRow(row: BookingRow): Finding[] {
  const findings: Finding[] = [];
  const id = `${row.category}/${row.email_type}`;
  const body = row.body?.trim() ?? "";
  const subject = row.subject?.trim() ?? "";

  if (!subject || !body) {
    findings.push({
      table: "booking_email_templates",
      id,
      issue: "empty subject or body",
      severity: "error",
    });
  } else if (body.length < 40) {
    findings.push({
      table: "booking_email_templates",
      id,
      issue: `very short body (${body.length} chars)`,
      severity: "warn",
    });
  }

  for (const { pattern, label } of DEPRECATED_PATTERNS) {
    if (pattern.test(subject) || pattern.test(body)) {
      findings.push({
        table: "booking_email_templates",
        id,
        issue: label,
        severity: "error",
      });
    }
  }

  if (
    isStaleAgenceCopyOnEntreprise(row.category, row.email_type, row.subject, row.body)
  ) {
    findings.push({
      table: "booking_email_templates",
      id,
      issue: "stale agence copy on entreprise template",
      severity: "error",
    });
  }

  const unreplaced = [...`${subject}\n${body}`.matchAll(UNREPLACED_PLACEHOLDER)].map(
    (m) => m[0],
  );
  const allowedAtRest = new Set([
    "{{firstNameLine}}",
    "{{date}}",
    "{{heure}}",
    "{{confirmation_agence_link}}",
    "{{confirmLink}}",
    "{{post_booking_link}}",
    "{{dashboardLink}}",
    "{{reservation_agence_link}}",
    "{{email}}",
    "{{estimatedFirstBookingDate}}",
    "{{agenceInfo}}",
    "{{entrepriseInfo}}",
    "{{calendlyLink}}",
    "{{surveyLink}}",
    "{{company}}",
  ]);
  for (const token of unreplaced) {
    if (!allowedAtRest.has(token)) {
      findings.push({
        table: "booking_email_templates",
        id,
        issue: `unknown placeholder ${token}`,
        severity: "warn",
      });
    }
  }

  return findings;
}

function auditBypassRow(row: BypassRow): Finding[] {
  const findings: Finding[] = [];
  const id = `${row.campaign_id}/${row.template_key}`;
  const plain = stripHtml(row.body_html ?? "");
  const subject = row.subject?.trim() ?? "";

  if (!plain && !subject) {
    findings.push({
      table: "instantly_bypass_templates",
      id,
      issue: "empty subject and body",
      severity: "error",
    });
  } else if (!plain) {
    findings.push({
      table: "instantly_bypass_templates",
      id,
      issue: "empty body_html",
      severity: "error",
    });
  }

  const combined = `${subject}\n${row.body_html ?? ""}`;
  for (const { pattern, label } of DEPRECATED_PATTERNS) {
    if (pattern.test(combined)) {
      findings.push({
        table: "instantly_bypass_templates",
        id,
        issue: label,
        severity: "error",
      });
    }
  }

  if (/du 8 au 27 septembre/i.test(combined)) {
    findings.push({
      table: "instantly_bypass_templates",
      id,
      issue: "date-specific September window copy",
      severity: "warn",
    });
  }

  return findings;
}

async function main() {
  const client = createLinkTrackingClient();

  const { data: bookingRows, error: bookingError } = await client
    .from("booking_email_templates")
    .select("category, email_type, subject, body");

  if (bookingError) {
    throw new Error(`booking_email_templates: ${bookingError.message}`);
  }

  const { data: bypassRows, error: bypassError } = await client
    .from("instantly_bypass_templates")
    .select("campaign_id, template_key, subject, body_html");

  if (bypassError) {
    throw new Error(`instantly_bypass_templates: ${bypassError.message}`);
  }

  const findings: Finding[] = [];
  for (const row of (bookingRows ?? []) as BookingRow[]) {
    findings.push(...auditBookingRow(row));
  }
  for (const row of (bypassRows ?? []) as BypassRow[]) {
    findings.push(...auditBypassRow(row));
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");

  const report = {
    generatedAt: new Date().toISOString(),
    bookingTemplateCount: bookingRows?.length ?? 0,
    bypassTemplateCount: bypassRows?.length ?? 0,
    errorCount: errors.length,
    warnCount: warns.length,
    findings,
  };

  const outPath = path.join(
    process.cwd(),
    "scripts/audit/email-template-audit-report.json",
  );
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Audit complete: ${errors.length} errors, ${warns.length} warnings`);
  console.log(`Report: ${outPath}`);
  for (const finding of findings) {
    console.log(`[${finding.severity}] ${finding.table} ${finding.id}: ${finding.issue}`);
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
