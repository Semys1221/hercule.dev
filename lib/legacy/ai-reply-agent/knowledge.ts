import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

import jumFaqData from "@/site-content/faq/jum.json";
import { getFaqEntries } from "@/lib/site/faq-data";
import { faqDocumentSchema } from "@/lib/site/faq-types";
import { getAiReplyKnowledgeMarkdown } from "@/lib/site/legal-content";
import { legalAudienceFromNichePreset } from "@/lib/site/niche-preset";

import type { AiReplyAgentConfig } from "./types";

const REPO_ROOT = process.cwd();
const CACHE_TTL_MS = 5 * 60 * 1000;

function readRepoFile(relativePath: string): string {
  const filePath = join(REPO_ROOT, relativePath);
  return readFileSync(filePath, "utf-8");
}

function formatFaq(audience: "entreprise" | "comptable" | "cif" | "assurance"): string {
  return getFaqEntries(audience)
    .map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`)
    .join("\n\n");
}

function formatJumFaq(): string {
  const doc = faqDocumentSchema.parse(jumFaqData);
  return doc.entries.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`).join("\n\n");
}

function speakingToLabel(
  targetType: AiReplyAgentConfig["target_type"],
  audience: "agence" | "comptable" | "cif" | "assurance" | "comptable_delivery",
): string {
  if (audience === "comptable") {
    return targetType === "buyer"
      ? "cabinet EC (Buyer)"
      : "dirigeant TPE (Seller)";
  }
  if (audience === "cif") {
    return targetType === "buyer"
      ? "cabinet CIF (Buyer)"
      : "dirigeant PME (Seller)";
  }
  if (audience === "assurance") {
    return targetType === "buyer"
      ? "cabinet IAS / courtier ORIAS (Buyer)"
      : "dirigeant PME (Seller)";
  }
  if (audience === "comptable_delivery") {
    return "prospect livraison cabinet (restaurant, BTP, dentiste, etc.)";
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
  const audience = legalAudienceFromNichePreset(config.niche_preset_id);
  const packAudience =
    audience === "cif" ||
    audience === "comptable" ||
    audience === "assurance" ||
    audience === "comptable_delivery"
      ? audience
      : "agence";
  const aiReplyKnowledge = getAiReplyKnowledgeMarkdown(packAudience);
  const overview = readRepoFile("app/(legacy)/content/tech/00-overview.md");
  const faqSection =
    packAudience === "comptable_delivery"
      ? formatJumFaq()
      : packAudience === "comptable"
        ? formatFaq("comptable")
        : packAudience === "cif"
          ? formatFaq("cif")
          : packAudience === "assurance"
            ? formatFaq("assurance")
            : formatFaq("entreprise");
  const faqHeading =
    packAudience === "comptable_delivery"
      ? "## FAQ livraison comptable"
      : packAudience === "comptable"
        ? "## FAQ comptable (Buyer/Seller)"
        : packAudience === "cif"
          ? "## FAQ CIF (Buyer/Seller)"
          : packAudience === "assurance"
            ? "## FAQ IAS / assurance (Buyer/Seller)"
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
      (packAudience === "comptable"
        ? "Cabinet > 3 associés. Dirigeant TPE : service gratuit."
        : packAudience === "cif"
          ? "Cabinet CIF min. 2 associés. Dirigeant PME : service gratuit."
          : packAudience === "assurance"
            ? "Cabinet courtage ORIAS. Dirigeant : service gratuit."
            : "Entreprise service is free. No commission. Calendly via email."),
    "",
    "## Niche context",
    `Preset: ${config.niche_preset_id}`,
    `Angle: ${nicheAngle}`,
    nicheEffectif ? `Target size: ${nicheEffectif}` : "",
    `Speaking to: ${speakingToLabel(config.target_type, packAudience)}`,
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

/** Short hash for observability — ties a message to the knowledge pack version. */
export function hashKnowledgePack(pack: string): string {
  return createHash("sha256").update(pack).digest("hex").slice(0, 16);
}
