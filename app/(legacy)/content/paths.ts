import { join } from "node:path";

export const LEGACY_CONTENT_ROOT = join(process.cwd(), "app", "(legacy)", "content");

export const FUNNELS_ROOT = join(LEGACY_CONTENT_ROOT, "funnels");

export const PROPOSITIONS_ROOT = join(LEGACY_CONTENT_ROOT, "propositions");

export const ARCHIVE_ROOT = join(LEGACY_CONTENT_ROOT, "archive");

/** AI reply agent knowledge + internal architecture notes. */
export const LEGACY_TECH_DIR = join(LEGACY_CONTENT_ROOT, "tech");

export const FUNNELS_SYSTEM_DIR = join(FUNNELS_ROOT, "_system");
