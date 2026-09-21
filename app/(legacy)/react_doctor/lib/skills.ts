import path from "node:path";

import type { AuditFinding, Surface } from "../types.js";
import { EXEMPLARS, SKILLS_DIR } from "./constants.js";

const BASE_SKILLS = ["hercule-ui"];

const SURFACE_SKILLS: Record<Surface, string[]> = {
  internal: ["hercule-nextjs-internal", "hercule-forms", "hercule-tables"],
  marketing: ["hercule-nextjs-marketing"],
  dashboard: ["hercule-nextjs-dashboard"],
  other: [],
  excluded: [],
};

function skillPath(name: string): string {
  return path.join(SKILLS_DIR, name, "SKILL.md");
}

export function skillsForSurface(surface: Surface): string[] {
  if (surface === "excluded") return [];
  const names = [...BASE_SKILLS, ...SURFACE_SKILLS[surface]];
  return [...new Set(names)].map(skillPath);
}

export function skillsForFindings(findings: AuditFinding[]): string[] {
  const names = new Set<string>(BASE_SKILLS);
  const auditSkill = path.join(SKILLS_DIR, "hercule-frontend-audit", "SKILL.md");

  for (const finding of findings) {
    for (const skill of skillsForSurface(finding.surface)) {
      names.add(skill);
    }
    if (finding.skillHint) {
      names.add(skillPath(finding.skillHint));
    }
  }

  names.add(auditSkill);
  return [...names];
}

export function skillHintForRule(rule: string, surface: Surface): string | undefined {
  const r = rule.toLowerCase();

  if (
    r.includes("label") ||
    r.includes("field") ||
    r.includes("design-no-space") ||
    r.includes("form")
  ) {
    return "hercule-forms";
  }

  if (r.includes("fetch") || r.includes("table") || r.includes("data-table")) {
    return "hercule-tables";
  }

  if (r.includes("dialog") || r.includes("alt-text") || r.includes("outline")) {
    return "hercule-ui";
  }

  if (r === "hercule/raw-html-primitive") {
    return "hercule-ui";
  }

  if (surface === "internal") return "hercule-nextjs-internal";
  if (surface === "marketing") return "hercule-nextjs-marketing";
  if (surface === "dashboard") return "hercule-nextjs-dashboard";

  return undefined;
}

export function exemplarForFinding(finding: AuditFinding): string | undefined {
  const rule = finding.rule.toLowerCase();

  if (rule.includes("fetch") || rule.includes("table")) {
    return EXEMPLARS["data-table"];
  }
  if (rule.includes("label") || rule.includes("field") || rule.includes("form")) {
    return EXEMPLARS.form;
  }
  if (rule.includes("sidebar")) {
    return EXEMPLARS.sidebar;
  }

  return EXEMPLARS[finding.surface] ?? EXEMPLARS.internal;
}

export function canonicalFixUrl(plugin: string, rule: string): string {
  const pluginSlug = plugin.replace(/^react-doctor$/, "react-doctor");
  const ruleSlug = rule.replace(/^react-doctor\//, "");
  return `https://www.react.doctor/prompts/rules/${pluginSlug}/${ruleSlug}.md`;
}
