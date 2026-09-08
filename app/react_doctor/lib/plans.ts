import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { AuditFinding, Effort } from "../types.js";
import { PLANS_DIR, REPO_ROOT } from "./constants.js";
import { filterByEffort, sortByLeverage } from "./leverage.js";
import { gitShortHead } from "./git.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function nextPlanNumber(): number {
  mkdirSync(PLANS_DIR, { recursive: true });
  const existing = readdirSync(PLANS_DIR)
    .map((name) => /^(\d{3})-/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match![1]));

  if (existing.length === 0) return 2;
  return Math.max(...existing) + 1;
}

async function fetchCanonicalFix(rule: AuditFinding): Promise<string> {
  if (!findingHasUrl(rule)) return rule.help ?? rule.message;
  const url = rule.canonicalFixUrl!;
  try {
    const response = await fetch(url, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) {
      return `Canonical fix unavailable (${response.status}). See ${url}`;
    }
    const text = await response.text();
    const fixSection = text.match(/## Fix prompt[\s\S]*?(?=\n## |\n$)/);
    if (fixSection) return fixSection[0].trim();
    return text.slice(0, 2000);
  } catch {
    return `Fetch failed. See ${url}`;
  }
}

function findingHasUrl(finding: AuditFinding): boolean {
  return Boolean(finding.canonicalFixUrl);
}

export async function writePlanForFinding(
  finding: AuditFinding,
  planNumber: number,
): Promise<string> {
  const slug = slugify(`${finding.rule}-${path.basename(finding.filePath)}`);
  const fileName = `${String(planNumber).padStart(3, "0")}-${slug}.md`;
  const filePath = path.join(PLANS_DIR, fileName);
  const commit = gitShortHead();
  const canonical = await fetchCanonicalFix(finding);

  const content = `# ${String(planNumber).padStart(3, "0")} — Fix ${finding.rule} in ${finding.filePath}

- **Status**: TODO
- **Commit**: ${commit}
- **Severity**: ${finding.leverage}
- **Category**: ${finding.category}
- **Rule**: ${finding.plugin}/${finding.rule}
- **Estimated scope**: 1 file

## Problem

Location: \`${finding.filePath}:${finding.line}\`

${finding.message}

Surface: **${finding.surface}** | Source: ${finding.source}

## Target

Follow the canonical fix recipe:

${canonical}

## Repo conventions to follow

- Skill: \`${finding.skillHint ?? "hercule-ui"}\`
- Exemplar: \`${finding.exemplar ?? "components/internal/clients/clients-table.tsx"}\`
- Semantic tokens only in internal UI — see \`.cursor/skills/hercule-ui/SKILL.md\`

## Steps

1. Open \`${finding.filePath}\` at line ${finding.line}.
2. Apply the canonical fix without changing unrelated code.
3. Run verification commands below.

## Boundaries

- Do NOT change public component APIs unless required by the fix.
- Do NOT refactor marketing inline styles unless this file is internal/dashboard.
- STOP if the file has drifted from commit ${commit}; re-run \`pnpm frontend-audit scan\`.

## Verification

- **Mechanical**: \`pnpm doctor\` — targeted diagnostic cleared, score not regressed.
- **Lint**: \`pnpm lint\`
- **Visual** (if UI changed): \`pnpm e2e:visual\` for affected surface.
- **Done when**: diagnostic at \`${finding.filePath}:${finding.line}\` is resolved.
`;

  writeFileSync(filePath, content, "utf8");
  return path.relative(REPO_ROOT, filePath);
}

export async function writePlans(
  findings: AuditFinding[],
  effort: Effort,
  top: number,
): Promise<string[]> {
  const filtered = sortByLeverage(filterByEffort(findings, effort)).slice(0, top);
  const written: string[] = [];
  let planNumber = nextPlanNumber();

  for (const finding of filtered) {
    const rel = await writePlanForFinding(finding, planNumber);
    written.push(rel);
    planNumber += 1;
  }

  updatePlansReadme(written, effort);
  return written;
}

export function updatePlansReadme(newPlans: string[], effort: Effort): void {
  const readmePath = path.join(PLANS_DIR, "README.md");
  mkdirSync(PLANS_DIR, { recursive: true });

  let readme = "";
  try {
    readme = readFileSync(readmePath, "utf8");
  } catch {
    readme = `# React improvement plans (improve-react)

Read-only audits from \`improve-react\` and \`frontend-audit\` become executable plans here.

## Status

| # | Plan | Status | Leverage |
|---|------|--------|----------|
| 001 | [internal-quick-audit](./001-internal-quick-audit.md) | OPEN | Baseline scan |

## Execution order

1. Execute OPEN plans by number.
2. Ratchet \`REACT_DOCTOR_MIN_SCORE\` after each batch.

## Verify after any plan

\`\`\`bash
pnpm doctor
pnpm lint
pnpm frontend-audit verify
\`\`\`
`;
  }

  const rows = newPlans.map((planPath) => {
    const base = path.basename(planPath, ".md");
    const num = base.slice(0, 3);
    return `| ${num} | [${base}](./${path.basename(planPath)}) | OPEN | frontend-audit (${effort}) |`;
  });

  if (readme.includes("## Status") && rows.length > 0) {
    const tableEnd = readme.indexOf("\n\n## Execution");
    if (tableEnd > -1) {
      const before = readme.slice(0, tableEnd);
      readme = `${before}\n${rows.join("\n")}${readme.slice(tableEnd)}`;
    }
  }

  writeFileSync(readmePath, readme, "utf8");
}
