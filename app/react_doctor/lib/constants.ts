import path from "node:path";

import type { Surface } from "../types.js";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

export const CACHE_DIR = path.join(REPO_ROOT, "app/react_doctor/.cache");

export const PLANS_DIR = path.join(REPO_ROOT, "react-plans");

export const SKILLS_DIR = path.join(REPO_ROOT, ".cursor/skills");

/** Globs aligned with doctor.config.ts ignore.files */
export const EXCLUDE_GLOBS = [
  "app/streamlit_*/**",
  "emails/**",
  "**/*.py",
];

export const HOT_PATH_SUFFIXES = [
  "components/internal/clients/clients-table.tsx",
  "components/internal/funnels/fiche-form.tsx",
  "components/internal/funnels/bookings/bookings-table.tsx",
  "components/internal/funnels/builder/funnel-editor.tsx",
  "components/internal/funnels/sales/sales-funnel-module.tsx",
  "components/dashboard/dashboard-shell.tsx",
  "components/internal/funnels/email-sequences-table.tsx",
];

export const EXEMPLARS: Record<string, string> = {
  internal: "components/internal/funnels/sales/sales-funnel-module.tsx",
  "data-table": "components/internal/clients/clients-table.tsx",
  form: "components/internal/funnels/fiche-form.tsx",
  sidebar: "components/internal/funnels/sidebar-nav.tsx",
  marketing: "components/agence/scene-accueil.tsx",
  dashboard: "components/dashboard/dashboard-shell.tsx",
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
