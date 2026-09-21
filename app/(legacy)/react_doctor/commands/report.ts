import type { AuditReport, CliOptions } from "../types.js";
import { readLatestCache } from "../lib/cache.js";
import { filterBySurface, resolveEffectiveSurface } from "../lib/surfaces.js";
import { filterByEffort, sortByLeverage } from "../lib/leverage.js";

function countBy<T extends string>(items: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
}

export function buildReport(options: CliOptions): AuditReport {
  const cache = readLatestCache();
  const effectiveSurface = resolveEffectiveSurface(cache.surfaceFilter, options.surface);
  const scoped = filterBySurface(cache.findings, effectiveSurface);
  const findings = sortByLeverage(filterByEffort(scoped, options.effort));

  return {
    commit: cache.commit,
    scores: cache.scores,
    surfaceFilter: effectiveSurface,
    scannedAt: cache.createdAt,
    totalFindings: findings.length,
    totalInCache: cache.findings.length,
    byCategory: countBy(findings.map((f) => f.category)),
    bySurface: countBy(findings.map((f) => f.surface)),
    byLeverage: {
      HIGH: findings.filter((f) => f.leverage === "HIGH").length,
      MEDIUM: findings.filter((f) => f.leverage === "MEDIUM").length,
      LOW: findings.filter((f) => f.leverage === "LOW").length,
    },
    findings,
  };
}

export function formatReportTable(report: AuditReport): string {
  const lines: string[] = [
    `Frontend audit report — commit ${report.commit}`,
    `Scores: full=${report.scores.full ?? "n/a"} design=${report.scores.design ?? "n/a"}`,
    `Surface: ${report.surfaceFilter} | Findings shown: ${report.totalFindings}${report.totalInCache != null ? ` (of ${report.totalInCache} in cache)` : ""}`,
    `By leverage: HIGH=${report.byLeverage.HIGH} MEDIUM=${report.byLeverage.MEDIUM} LOW=${report.byLeverage.LOW}`,
    "",
    "# | Leverage | Surface | Location | Rule | Skill",
    "--|-----------|---------|----------|------|------",
  ];

  report.findings.slice(0, 50).forEach((f, i) => {
    lines.push(
      `${i + 1} | ${f.leverage} | ${f.surface} | ${f.filePath}:${f.line} | ${f.rule} | ${f.skillHint ?? "-"}`,
    );
  });

  if (report.findings.length > 50) {
    lines.push(`\n... and ${report.findings.length - 50} more. Use --json for full list.`);
  }

  return lines.join("\n");
}

export async function runReport(options: CliOptions): Promise<void> {
  const report = buildReport(options);
  const output = options.json ? JSON.stringify(report, null, 2) : formatReportTable(report);

  if (options.out) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(options.out, `${output}\n`, "utf8");
    console.log(`Wrote report to ${options.out}`);
  } else {
    console.log(output);
  }
}
