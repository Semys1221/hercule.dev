import { readFileSync } from "fs";
import { join } from "path";

import { getFaqEntries } from "@/lib/site/faq-data";
import {
  getAiReplyKnowledgeMarkdown,
  isComptableNichePreset,
} from "@/lib/site/legal-content";

import type { AiReplyAgentConfig } from "./types";

const REPO_ROOT = process.cwd();
const CACHE_TTL_MS = 5 * 60 * 1000;

function readRepoFile(relativePath: string): string {
  const filePath = join(REPO_ROOT, relativePath);
  return readFileSync(filePath, "utf-8");
}

function formatFaq(audience: "entreprise" | "comptable"): string {
  return getFaqEntries(audience)
    .map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`)
    .join("\n\n");
}

function speakingToLabel(
  targetType: AiReplyAgentConfig["target_type"],
  comptable: boolean,
): string {
  if (comptable) {
    return targetType === "buyer"
      ? "cabinet EC (Buyer)"
      : "dirigeant TPE (Seller)";
  }
  return targetType === "buyer" ? "agence (Buyer)" : "entreprise (Seller)";
}

type CacheEntry = { pack: string; expiresAt: number };
const packCache = new Map<string, CacheEntry>();

function knowledgeCacheKey(config: AiReplyAgentConfig): string {
  const nicheMeta = JSON.stringify(config.niche_metadata ?? {});
  return `${config.niche_preset_id}|${config.target_type}|${nicheMeta}`;
}

function buildKnowledgePackUncached(config: AiReplyAgentConfig): string {
  const comptable = isComptableNichePreset(config.niche_preset_id);
  const aiReplyKnowledge = getAiReplyKnowledgeMarkdown(
    comptable ? "comptable" : "agence",
  );
  const overview = readRepoFile("doc/tech-stack/00-overview.md");
  const faqSection = comptable
    ? formatFaq("comptable")
    : formatFaq("entreprise");
  const faqHeading = comptable
    ? "## FAQ comptable (Buyer/Seller)"
    : "## Entreprise FAQ (Seller)";
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
    faqHeading,
    faqSection ||
      (comptable
        ? "Cabinet > 3 associés. Dirigeant TPE : service gratuit."
        : "Entreprise service is free. No commission. Calendly via email."),
    "",
    "## Niche context",
    `Preset: ${config.niche_preset_id}`,
    `Angle: ${nicheAngle}`,
    nicheEffectif ? `Target size: ${nicheEffectif}` : "",
    `Speaking to: ${speakingToLabel(config.target_type, comptable)}`,
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
