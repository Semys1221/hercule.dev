import { readFileSync } from "fs";
import { join } from "path";

import { getAiReplyKnowledgeMarkdown } from "@/lib/site/legal-content";

import type { AiReplyAgentConfig } from "./types";

const REPO_ROOT = process.cwd();
const CACHE_TTL_MS = 5 * 60 * 1000;

function readRepoFile(relativePath: string): string {
  const filePath = join(REPO_ROOT, relativePath);
  return readFileSync(filePath, "utf-8");
}

function extractEntrepriseFaq(markdown: string): string {
  const start = markdown.indexOf("### Questions entreprise");
  if (start < 0) return "";
  const afterStart = markdown.slice(start);
  const hrMatch = afterStart.match(/\n---\n/);
  const section = hrMatch?.index != null ? afterStart.slice(0, hrMatch.index) : afterStart;
  const rows: string[] = [];
  for (const line of section.split("\n")) {
    const match = line.match(/^\|\s*E\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (match) {
      rows.push(`Q: ${match[1]}\nA: ${match[2]}`);
    }
  }
  return rows.join("\n\n");
}

type CacheEntry = { pack: string; expiresAt: number };
const packCache = new Map<string, CacheEntry>();

function knowledgeCacheKey(config: AiReplyAgentConfig): string {
  const nicheMeta = JSON.stringify(config.niche_metadata ?? {});
  return `${config.niche_preset_id}|${config.target_type}|${nicheMeta}`;
}

function buildKnowledgePackUncached(config: AiReplyAgentConfig): string {
  const aiReplyKnowledge = getAiReplyKnowledgeMarkdown();
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
    "## Reply-safe facts (condensed)",
    aiReplyKnowledge,
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

export function buildKnowledgePack(config: AiReplyAgentConfig): string {
  const key = knowledgeCacheKey(config);
  const now = Date.now();
  const cached = packCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.pack;
  }
  const pack = buildKnowledgePackUncached(config);
  packCache.set(key, { pack, expiresAt: now + CACHE_TTL_MS });
  return pack;
}

/** Test helper — bypass cache. */
export function buildKnowledgePackFresh(config: AiReplyAgentConfig): string {
  return buildKnowledgePackUncached(config);
}
