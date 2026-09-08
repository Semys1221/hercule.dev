import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AuditFinding, Severity } from "../types.js";
import { CACHE_DIR, REPO_ROOT } from "./constants.js";
import { enrichFindingLeverage, inferCategoryFromRule, resolveFindingPath, surfaceForPath } from "./leverage.js";
import { canonicalFixUrl, exemplarForFinding, skillHintForRule } from "./skills.js";

type DoctorDiagnostic = {
  filePath?: string;
  normalizedFilePath?: string;
  plugin?: string;
  rule?: string;
  severity?: string;
  title?: string;
  message?: string;
  help?: string;
  line?: number;
  column?: number;
  category?: string;
  id?: string;
  fixGroupId?: string;
};

type DoctorProject = {
  rootDir?: string;
  diagnostics?: DoctorDiagnostic[];
  summary?: { score?: number };
};

type DoctorReport = {
  schemaVersion?: number;
  ok?: boolean;
  summary?: { score?: number };
  projects?: DoctorProject[];
};

function mapSeverity(value?: string): Severity {
  if (value === "error") return "error";
  if (value === "info") return "info";
  return "warning";
}

function parseDoctorReport(
  reportPath: string,
  source: "react-doctor" | "react-doctor-design",
): { score: number | null; findings: AuditFinding[] } {
  const raw = readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw) as DoctorReport;

  const score =
    report.summary?.score ??
    report.projects?.[0]?.summary?.score ??
    null;

  const findings: AuditFinding[] = [];

  for (const project of report.projects ?? []) {
    const projectRoot = project.rootDir ?? REPO_ROOT;
    for (const diag of project.diagnostics ?? []) {
      const rule = diag.rule ?? "unknown";
      const plugin = diag.plugin ?? "react-doctor";
      const relPath = resolveFindingPath(
        diag.filePath ?? "",
        diag.normalizedFilePath,
      );
      const surface = surfaceForPath(relPath);

      if (surface === "excluded") continue;

      const base: AuditFinding = {
        id: diag.id ?? `${relPath}:${diag.line}:${rule}`,
        filePath: relPath,
        line: diag.line ?? 1,
        column: diag.column,
        rule,
        plugin,
        severity: mapSeverity(diag.severity),
        category: diag.category ?? inferCategoryFromRule(rule, diag.title),
        title: diag.title ?? rule,
        message: diag.message ?? "",
        help: diag.help,
        surface,
        source,
        leverage: "LOW",
        leverageScore: 0,
        fixGroupId: diag.fixGroupId,
      };

      const enriched = enrichFindingLeverage({
        ...base,
        skillHint: skillHintForRule(rule, surface),
        exemplar: exemplarForFinding(base),
        canonicalFixUrl: canonicalFixUrl(plugin, rule),
      });

      findings.push(enriched);
    }
  }

  return { score, findings };
}

export function runReactDoctorScan(
  label: "full" | "design",
  commit: string,
): { reportPath: string; score: number | null; findings: AuditFinding[] } {
  const reportPath = path.join(CACHE_DIR, `doctor-${label}-${commit}.json`);
  const args = [
    "npx",
    "react-doctor@latest",
    ...(label === "design" ? ["design"] : []),
    "--scope",
    "full",
    "--json",
    "--json-out",
    reportPath,
    "-y",
    REPO_ROOT,
  ];

  try {
    execSync(args.join(" "), {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch {
    // react-doctor may exit non-zero with findings; report file still written
  }

  let reportExists = true;
  try {
    readFileSync(reportPath, "utf8");
  } catch {
    reportExists = false;
  }

  if (!reportExists) {
    writeFileSync(
      reportPath,
      JSON.stringify({
        schemaVersion: 3,
        ok: true,
        summary: { score: null },
        projects: [{ diagnostics: [], summary: { score: null } }],
      }),
      "utf8",
    );
  }

  const source = label === "design" ? "react-doctor-design" : "react-doctor";
  const { score, findings } = parseDoctorReport(reportPath, source);
  return { reportPath, score, findings };
}

export function dedupeFindings(findings: AuditFinding[]): AuditFinding[] {
  const seen = new Set<string>();
  const result: AuditFinding[] = [];

  for (const finding of findings) {
    const key = `${finding.filePath}:${finding.line}:${finding.rule}:${finding.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(finding);
  }

  return result;
}
