import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { AuditFinding, Severity } from "../types.js";
import { REPO_ROOT, TSX_SCAN_ROOTS } from "./constants.js";
import { enrichFindingLeverage, inferCategoryFromRule } from "./leverage.js";
import { canonicalFixUrl, exemplarForFinding, skillHintForRule } from "./skills.js";
import { classifySurface, isExcludedPath } from "./surfaces.js";

type StaticRule = {
  id: string;
  pattern: RegExp;
  message: string;
  surfaces?: Array<"internal" | "marketing" | "dashboard" | "other">;
  internalOnly?: boolean;
  severity: Severity;
  category: string;
};

const RAW_HTML_PATTERN = /<(?:button|input|select|table|dialog)(?:\s|>|\/)/g;
const SPACE_PATTERN = /\bspace-[xy]-\d+/g;
const INTERNAL_TOKEN_PATTERN = /\b(?:zinc-\d+|#09090B|bg-blue-500)\b/gi;

const STATIC_RULES: StaticRule[] = [
  {
    id: "hercule/raw-html-primitive",
    pattern: RAW_HTML_PATTERN,
    message: "Use shadcn components from @/components/ui/* instead of raw HTML primitives",
    surfaces: ["internal", "dashboard", "marketing", "other"],
    severity: "warning",
    category: "Maintainability",
  },
  {
    id: "hercule/space-axis-in-internal",
    pattern: SPACE_PATTERN,
    message: "Use flex with gap-* instead of space-y-* / space-x-* (hercule-ui)",
    internalOnly: true,
    severity: "warning",
    category: "Maintainability",
  },
  {
    id: "hercule/internal-hardcoded-token",
    pattern: INTERNAL_TOKEN_PATTERN,
    message: "Use semantic tokens (bg-background, text-muted-foreground) in internal UI",
    internalOnly: true,
    severity: "warning",
    category: "Maintainability",
  },
];

function walkTsxFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".cache") continue;
      walkTsxFiles(full, acc);
      continue;
    }

    if (/\.(tsx|jsx)$/.test(entry)) {
      acc.push(full);
    }
  }

  return acc;
}

export function collectTsxFiles(): string[] {
  const files: string[] = [];
  for (const root of TSX_SCAN_ROOTS) {
    walkTsxFiles(path.join(REPO_ROOT, root), files);
  }
  return files;
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function runRuleOnFile(
  relPath: string,
  content: string,
  rule: StaticRule,
): AuditFinding[] {
  const surface = classifySurface(relPath);
  if (surface === "excluded") return [];
  if (rule.internalOnly && surface !== "internal") return [];
  if (rule.surfaces && !rule.surfaces.includes(surface)) return [];

  const findings: AuditFinding[] = [];
  const pattern = rule.pattern;

  for (const match of content.matchAll(pattern)) {
    if (match.index === undefined) continue;
    const line = lineNumberAt(content, match.index);
    const plugin = "hercule";
    const base: AuditFinding = {
      id: `${relPath}:${line}:${rule.id}`,
      filePath: relPath,
      line,
      rule: rule.id,
      plugin,
      severity: rule.severity,
      category: rule.category,
      title: rule.id,
      message: rule.message,
      surface,
      source: "hercule-static",
      leverage: "LOW",
      leverageScore: 0,
      skillHint: skillHintForRule(rule.id, surface),
      exemplar: exemplarForFinding({
        filePath: relPath,
        rule: rule.id,
        surface,
        plugin,
        id: "",
        line,
        severity: rule.severity,
        category: rule.category,
        title: rule.id,
        message: rule.message,
        source: "hercule-static",
        leverage: "LOW",
        leverageScore: 0,
      }),
      canonicalFixUrl: canonicalFixUrl(plugin, rule.id.replace("hercule/", "")),
    };
    findings.push(enrichFindingLeverage(base));
  }

  return findings;
}

export function runHerculeStaticChecks(): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const absPath of collectTsxFiles()) {
    const rel = path.relative(REPO_ROOT, absPath).replace(/\\/g, "/");
    if (isExcludedPath(rel)) continue;

    let content: string;
    try {
      content = readFileSync(absPath, "utf8");
    } catch {
      continue;
    }

    for (const rule of STATIC_RULES) {
      findings.push(...runRuleOnFile(rel, content, rule));
    }
  }

  return findings;
}
