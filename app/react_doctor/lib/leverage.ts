import type { AuditFinding, Effort, LeverageLevel, Severity } from "../types.js";
import { HOT_PATH_SUFFIXES } from "./constants.js";
import { classifySurface } from "./surfaces.js";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function isHotPath(filePath: string): boolean {
  const rel = normalizePath(filePath);
  return HOT_PATH_SUFFIXES.some((suffix) => rel.endsWith(suffix) || rel.includes(suffix));
}

function baseSeverityScore(severity: Severity): number {
  if (severity === "error") return 100;
  if (severity === "warning") return 60;
  return 20;
}

function categoryBoost(category: string): number {
  const c = category.toLowerCase();
  if (c.includes("bug") || c.includes("security")) return 40;
  if (c.includes("access")) return 35;
  if (c.includes("maintain")) return 15;
  if (c.includes("perform")) return 10;
  return 5;
}

export function computeLeverage(
  filePath: string,
  severity: Severity,
  category: string,
  rule: string,
): { leverage: LeverageLevel; score: number } {
  let score = baseSeverityScore(severity) + categoryBoost(category);

  if (isHotPath(filePath)) score += 50;

  const r = rule.toLowerCase();
  if (r.includes("fetch") && !r.includes("effect")) score += 30;
  if (r.includes("label") || r.includes("aria")) score += 25;
  if (r.startsWith("hercule/")) score += 20;
  if (r.includes("design-no-space")) score += 15;

  if (!isHotPath(filePath) && category.toLowerCase().includes("perform")) {
    score -= 25;
  }

  let leverage: LeverageLevel;
  if (score >= 120) leverage = "HIGH";
  else if (score >= 70) leverage = "MEDIUM";
  else leverage = "LOW";

  return { leverage, score };
}

export function enrichFindingLeverage(finding: AuditFinding): AuditFinding {
  const { leverage, score } = computeLeverage(
    finding.filePath,
    finding.severity,
    finding.category,
    finding.rule,
  );
  return { ...finding, leverage, leverageScore: score };
}

export function filterByEffort(findings: AuditFinding[], effort: Effort): AuditFinding[] {
  if (effort === "deep") return findings;
  if (effort === "quick") {
    return findings.filter((f) => f.leverage === "HIGH");
  }
  return findings.filter((f) => f.leverage !== "LOW");
}

export function sortByLeverage(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => b.leverageScore - a.leverageScore);
}

export function inferCategoryFromRule(rule: string, title?: string): string {
  const text = `${rule} ${title ?? ""}`.toLowerCase();
  if (text.includes("security") || text.includes("xss") || text.includes("dangerously")) {
    return "Security";
  }
  if (text.includes("access") || text.includes("label") || text.includes("aria")) {
    return "Accessibility";
  }
  if (text.includes("fetch") || text.includes("key") || text.includes("effect")) {
    return "Bugs";
  }
  if (text.includes("perf") || text.includes("memo") || text.includes("render")) {
    return "Performance";
  }
  if (text.includes("design") || text.includes("space")) {
    return "Maintainability";
  }
  return "Maintainability";
}

export function relativeFilePath(filePath: string, projectRoot?: string): string {
  const normalized = normalizePath(filePath);
  if (projectRoot) {
    const prefix = normalizePath(projectRoot);
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length).replace(/^\//, "");
    }
  }
  return normalized.replace(/^\.\//, "");
}

export function resolveFindingPath(
  filePath: string,
  normalizedFilePath?: string,
): string {
  if (normalizedFilePath) {
    if (normalizedFilePath.includes("internal/") || normalizedFilePath.includes("components/")) {
      if (normalizedFilePath.startsWith("components/") || normalizedFilePath.startsWith("app/")) {
        return normalizedFilePath;
      }
      return `components/internal/${normalizedFilePath}`;
    }
    return normalizedFilePath;
  }
  return normalizePath(filePath);
}

export function surfaceForPath(filePath: string): ReturnType<typeof classifySurface> {
  return classifySurface(normalizePath(filePath));
}
