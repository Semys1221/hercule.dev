import path from "node:path";

import type { Surface } from "../types.js";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

export const CACHE_DIR = path.join(REPO_ROOT, "app/(legacy)/react_doctor/.cache");

export const PLANS_DIR = path.join(REPO_ROOT, "app/(legacy)/react_doctor/plans");

export const SKILLS_DIR = path.join(REPO_ROOT, ".cursor/skills");

/** Globs aligned with doctor.config.ts ignore.files */
export const EXCLUDE_GLOBS = [
  "lib/backend/streamlit_*/**",
  "lib/emails/**",
  "**/*.py",
];

export const HOT_PATH_SUFFIXES = [
  "components/legacy/internal/clients/clients-table.tsx",
  "components/legacy/internal/funnels/fiche-form.tsx",
  "components/legacy/internal/funnels/bookings/bookings-table.tsx",
  "components/legacy/internal/funnels/builder/funnel-editor.tsx",
  "components/legacy/internal/funnels/sales/sales-funnel-module.tsx",
  "components/legacy/dashboard/dashboard-shell.tsx",
  "components/legacy/internal/funnels/email-sequences-table.tsx",
];

export const EXEMPLARS: Record<string, string> = {
  internal: "components/legacy/internal/funnels/sales/sales-funnel-module.tsx",
  "data-table": "components/legacy/internal/clients/clients-table.tsx",
  form: "components/legacy/internal/funnels/fiche-form.tsx",
  sidebar: "components/legacy/internal/funnels/sidebar-nav.tsx",
  marketing: "app/(marketing)/(site)/page.tsx",
  dashboard: "components/legacy/dashboard/dashboard-shell.tsx",
};

export const VISUAL_ROUTES: Record<Exclude<Surface, "excluded" | "other">, string[]> = {
  internal: ["/internal", "/internal/funnels/agence/clients"],
  marketing: ["/"],
  dashboard: ["/dashboard"],
};

export const MCP_WORKFLOW = [
  "plugin-shadcn-shadcn: search_items_in_registries — find block or primitive",
  "plugin-shadcn-shadcn: get_item_examples_from_registries — compose from official examples",
  "plugin-shadcn-shadcn: get_add_command_for_items if primitive missing",
  "plugin-shadcn-shadcn: get_audit_checklist after building",
];

export const VERIFY_COMMANDS = [
  "pnpm doctor",
  "pnpm doctor:design",
  "pnpm lint",
  "pnpm doctor:score",
  "pnpm frontend-audit verify",
];

export const TSX_SCAN_ROOTS = ["app", "components"];
