import {
  applyPromptLinkVariables,
  resolvePromptLinks,
} from "./lead-links";
import { truncateInboundText } from "./inbound";
import { isComptableNichePreset } from "@/lib/site/legal-content";

import type { AiReplyTargetType, GroqReplyDecision } from "./types";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const PRIMARY_MODEL = "grok-4-1-fast";
const FALLBACK_MODEL = "grok-build-0.1";
const MAX_OUTPUT_TOKENS = 200;
export const DEFAULT_GROK_TEMPERATURE = 0.5;

export function resolveGrokTemperature(): number {
  const raw = process.env.GROK_TEMPERATURE?.trim();
  if (!raw) {
    return DEFAULT_GROK_TEMPERATURE;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return DEFAULT_GROK_TEMPERATURE;
  }
  return Math.max(0, Math.min(1, value));
}

export function buildGlobalRules(
  maxSentences = 3,
  nichePresetId?: string,
): string {
  const n = Math.max(1, Math.min(10, maxSentences));
  const lengthRule =
    n === 1
      ? "Maximum 1 phrase courte dans reply_text (hors signature et lien CTA)."
      : `Maximum ${n} phrases courtes dans reply_text (hors signature et lien CTA).`;
  const pricingUrl = isComptableNichePreset(nichePresetId ?? "")
    ? "https://hercule.dev/cvg/comptable"
    : "https://hercule.dev/cvg";
  return `Tu es Béatrice Meyer, responsable qualification chez Hercule (hercule.dev).

Réponds uniquement en JSON avec les clés : should_reply (boolean), reply_text (string|null), reason (string).

Règles quand should_reply est true :
- Texte brut uniquement dans reply_text (pas de HTML, pas de markdown).
- Rédige reply_text en français, vouvoiement, ton professionnel et direct — comme un email humain, pas une FAQ.
- ${lengthRule}
- Réponds d'abord à la question ou l'objection du lead ; n'accuse réception que si le message du lead le justifie.
- Ne recopie pas mot à mot le pack de connaissances ; reformule avec tes mots.
- Propose le lien CTA seulement si le prospect est prêt à avancer ou si le prompt campagne le demande — pas d'urgence artificielle.
- Sépare le corps, le lien CTA et la signature par une ligne vide (\\n\\n).
- Mets le lien CTA seul sur sa propre ligne, en URL brute (sera affiché « Réserver » à l'envoi).
- Termine par « Béatrice Meyer », puis une nouvelle ligne avec l'URL du site (https://hercule.dev ou ${pricingUrl} si question tarifs).

Ton — évite ces formulations :
- « Merci pour votre message » (sauf si le lead partage une info personnelle ou émotionnelle)
- « Je comprends votre préoccupation »
- « N'hésitez pas à »
- « Je reste à votre disposition »
- « réserver cette semaine » ou « réserver un créneau maintenant » (urgence forcée)
- listes à puces ou numérotées dans reply_text

Sécurité :
- Si le tag Instantly du lead est « Not interested », mets should_reply à false et indique dans reason que le lead a été marqué non intéressé — ne jamais relancer une conversation.
- Si la réponse n'est PAS clairement couverte par le pack de connaissances, mets should_reply à false et explique dans reason (en français).
- N'invente jamais de prix, délais, garanties ou fonctionnalités.
- Utilise uniquement le lien CTA fourni — n'invente jamais d'URL.`;
}

const NOT_INTERESTED_LABEL = "Not interested";

export function interestLabelFromStatus(status: number | null | undefined): string {
  if (status === 1) return "Interested";
  if (status === -1) return NOT_INTERESTED_LABEL;
  if (status === -4) return "No show";
  return "Lead";
}

function assembleSystemPrompt(params: {
  knowledgePack: string;
  promptSnapshot: string;
  maxSentences?: number;
  customDirective?: string;
  nichePresetId?: string;
  bookingContext?: string | null;
}): string {
  const parts = [
    buildGlobalRules(params.maxSentences ?? 3, params.nichePresetId),
    "",
    "## Pack de connaissances",
    params.knowledgePack,
    "",
    "## Prompt campagne",
    params.promptSnapshot,
  ];
  const bookingContext = params.bookingContext?.trim();
  if (bookingContext) {
    parts.push(
      "",
      "## Contexte Calendly (ne pas inventer)",
      bookingContext,
    );
  }
  const directive = params.customDirective?.trim();
  if (directive) {
    parts.push("", "## Directive custom (opérateur)", directive);
  }
  return parts.join("\n");
}

function getGrokApiKey(): string {
  const key =
    process.env.GROK_API_KEY?.trim() || process.env.XAI_API_KEY?.trim();
  if (!key) throw new Error("GROK_API_KEY is not set");
  return key;
}

function resolveModel(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function isRateLimitError(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return text.includes("429") || /rate limit/i.test(text);
}

function parseGrokJson(content: string): GroqReplyDecision {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : trimmed;
  const parsed = JSON.parse(raw) as Partial<GroqReplyDecision>;
  const shouldReply = Boolean(parsed.should_reply);
  const replyText =
    typeof parsed.reply_text === "string" && parsed.reply_text.trim()
      ? parsed.reply_text.trim()
      : null;
  const reason =
    typeof parsed.reason === "string" ? parsed.reason.trim() : "Aucune raison fournie";
  return {
    should_reply: shouldReply && Boolean(replyText),
    reply_text: shouldReply && replyText ? replyText : null,
    reason,
  };
}

function parseCostUsdTicks(data: {
  usage?: { cost_in_usd_ticks?: number | string | null };
}): number | null {
  const raw = data.usage?.cost_in_usd_ticks;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function callGrokModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ decision: GroqReplyDecision; model: string; costUsdTicks: number | null }> {
  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGrokApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: resolveGrokTemperature(),
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Grok ${model} failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { cost_in_usd_ticks?: number | string | null };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error(`Grok ${model} returned empty content`);
  }
  return {
    decision: parseGrokJson(content),
    model,
    costUsdTicks: parseCostUsdTicks(data),
  };
}

export async function generateReplyDecision(params: {
  knowledgePack: string;
  promptSnapshot: string;
  inboundText: string;
  leadEmail: string;
  targetType: AiReplyTargetType;
  nichePresetId?: string;
  maxSentences?: number;
  customDirective?: string;
  interestLabel?: string | null;
  bookingContext?: string | null;
}): Promise<{
  decision: GroqReplyDecision;
  model: string;
  costUsdTicks: number | null;
}> {
  const interestLabel = (params.interestLabel ?? "Lead").trim() || "Lead";
  if (interestLabel === NOT_INTERESTED_LABEL) {
    return {
      decision: {
        should_reply: false,
        reply_text: null,
        reason:
          "Lead marqué Not interested dans Instantly — ne pas relancer.",
      },
      model: "skipped-not-interested",
      costUsdTicks: null,
    };
  }

  const primaryModel = resolveModel("GROK_PRIMARY_MODEL", PRIMARY_MODEL);
  const fallbackModel = resolveModel("GROK_FALLBACK_MODEL", FALLBACK_MODEL);

  const promptLinks = await resolvePromptLinks(
    params.leadEmail,
    params.targetType,
  );
  const promptSnapshot = applyPromptLinkVariables(
    params.promptSnapshot,
    promptLinks.primary,
    params.targetType,
    promptLinks,
  );

  const systemPrompt = assembleSystemPrompt({
    knowledgePack: params.knowledgePack,
    promptSnapshot,
    maxSentences: params.maxSentences,
    customDirective: params.customDirective,
    nichePresetId: params.nichePresetId,
    bookingContext: params.bookingContext,
  });

  const userPrompt = [
    `Email du lead : ${params.leadEmail}`,
    `Tag Instantly du lead : ${interestLabel}`,
    "",
    `Lien CTA (utilise exactement cette URL dans reply_text) : ${promptLinks.primary}`,
    "",
    "Réponse entrante à traiter :",
    truncateInboundText(params.inboundText),
  ].join("\n");

  try {
    return await callGrokModel(primaryModel, systemPrompt, userPrompt);
  } catch (primaryErr) {
    const primaryMessage =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn("[ai-reply-agent] primary Grok model failed:", primaryMessage);
    if (!fallbackModel || !isRateLimitError(primaryErr)) {
      throw primaryErr instanceof Error ? primaryErr : new Error(primaryMessage);
    }
    try {
      return await callGrokModel(fallbackModel, systemPrompt, userPrompt);
    } catch (fallbackErr) {
      const fallbackMessage =
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      throw new Error(
        `Primary (${primaryModel}) failed: ${primaryMessage}. Fallback (${fallbackModel}) failed: ${fallbackMessage}`,
      );
    }
  }
}
