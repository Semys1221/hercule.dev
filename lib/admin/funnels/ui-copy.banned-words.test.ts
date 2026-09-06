/** Regression guard: banned sales / pitch / funnel wording in user-facing UI. */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const SCAN_ROOTS = [
  "components/internal/funnels",
  "app/internal/funnels",
  "lib/admin/navigation.ts",
  "lib/admin/architecture/types.ts",
  "app/internal/(shell)/page.tsx",
];

const BANNED_PATTERNS: RegExp[] = [
  /\bSales funnel\b/i,
  /\bPitch commercial\b/i,
  /\bFunnel Builder\b/i,
  /\bRéglages du funnel\b/i,
  /\bSidebar pitch\b/i,
  /\bScript commercial\b/i,
  /\bOuvrir le funnel\b/i,
  /\bNew funnel\b/i,
  /\bAucun funnel\b/i,
  /\bCe funnel est déjà\b/i,
  /\bfunnel sales\b/i,
  /\bKPIs funnel\b/i,
  /\bOnboarding funnel\b/i,
  /["'`]Sales["'`]/,
  /["'`]Funnels["'`]/,
  /["'`]Pitch["'`]/,
  /\bPasser au closing\b/,
];

const EXCLUDED_FILES = new Set([
  join(ROOT, "lib/admin/funnels/ui-copy.ts"),
  join(ROOT, "lib/admin/funnels/ui-copy.banned-words.test.ts"),
  join(ROOT, "components/internal/funnels/sales/README.md"),
]);

function collectFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (EXCLUDED_FILES.has(fullPath)) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

function filesToScan(): string[] {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    const fullPath = join(ROOT, root);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (/\.(tsx|ts)$/.test(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

const violations: Array<{ file: string; line: number; text: string; pattern: string }> = [];

for (const file of filesToScan()) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
      continue;
    }
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: file.replace(`${ROOT}/`, ""),
          line: index + 1,
          text: line.trim(),
          pattern: String(pattern),
        });
      }
    }
  }
}

assert.equal(
  violations.length,
  0,
  `Banned UI wording found:\n${violations
    .map((v) => `${v.file}:${v.line} (${v.pattern})\n  ${v.text}`)
    .join("\n")}`,
);

console.log("ui-copy.banned-words.test.ts: ok");
