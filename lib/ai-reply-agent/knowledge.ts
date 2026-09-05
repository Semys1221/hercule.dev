import { readFileSync } from "fs";
import { join } from "path";

import { buildLegalKnowledgeMarkdown } from "@/lib/site/legal-content";

import type { AiReplyAgentConfig } from "./types";

const REPO_ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  const filePath = join(REPO_ROOT, relativePath);
  return readFileSync(filePath, "utf-8");
}

function extractEntrepriseFaq(markdown: string): string {
  const start = markdown.indexOf("### Questions entreprise");
  if (start < 0) return "";
  const end = markdown.indexOf("---", start + 1);
  const section = end > start ? markdown.slice(start, end) : markdown.slice(start);
  const rows: string[] = [];
  for (const line of section.split("\n")) {
    const match = line.match(/^\|\s*E\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (match) {
      rows.push(`Q: ${match[1]}\nA: ${match[2]}`);
    }
  }
  return rows.join("\n\n");
}

export function buildKnowledgePack(config: AiReplyAgentConfig): string {
  const legalKnowledge = buildLegalKnowledgeMarkdown();
  const deliverance = readRepoFile("doc/tech-stack/deliverance/front-client.md");
  const overview = readRepoFile("doc/tech-stack/00-overview.md");
  const entrepriseFaq = extractEntrepriseFaq(deliverance);
  const niche = config.niche_metadata ?? {};
  const nicheAngle =
    typeof niche.angle === "string" ? niche.angle : config.niche_preset_id;
  const nicheEffectif =
    typeof niche.effectif_cible === "string" ? niche.effectif_cible : "";

  return [
    "# Knowledge pack (ground truth only — do not invent facts outside this pack)",
    "",
    "## Product overview",
    overview.slice(0, 4000),
    "",
    "## Legal & CGV (ground truth)",
    legalKnowledge,
    "",
    "## Entreprise FAQ (Seller)",
    entrepriseFaq || "Entreprise service is free. No commission. Calendly via email.",
    "",
    "## Niche context",
    `Preset: ${config.niche_preset_id}`,
    `Angle: ${nicheAngle}`,
    nicheEffectif ? `Target size: ${nicheEffectif}` : "",
    `Speaking to: ${config.target_type === "buyer" ? "agence (Buyer)" : "entreprise (Seller)"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
