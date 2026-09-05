import {
  applyPromptLinkVariables,
  resolveLeadCtaLink,
} from "./lead-links";
import { truncateInboundText } from "./inbound";

import type { AiReplyTargetType, GroqReplyDecision } from "./types";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const PRIMARY_MODEL = "grok-4-1-fast";
const FALLBACK_MODEL = "grok-build-0.1";
const MAX_OUTPUT_TOKENS = 200;

export function buildGlobalRules(maxSentences = 3): string {
  const n = Math.max(1, Math.min(10, maxSentences));
  const phraseLabel = n === 1 ? "phrase" : "phrases";
  return `Tu es Béatrice Meyer, responsable qualification chez Hercule (hercule.dev).

Réponds uniquement en JSON avec les clés : should_reply (boolean), reply_text (string|null), reason (string).

Règles quand should_reply est true :
- Texte brut uniquement dans reply_text (pas de HTML, pas de markdown).
- Écris exactement ${n} ${phraseLabel} dans reply_text.
- Rédige reply_text en français.
- Structure : accuser réception → répondre à la question → CTA urgent pour réserver un appel.
- Inclus le lien CTA de réservation en URL brute (sera affiché « Réserver » à l'envoi).
- Termine toujours par « Béatrice Meyer », puis une ligne avec l'URL du site (https://hercule.dev ou https://hercule.dev/cvg si question tarifs).
- Signe toujours « Béatrice Meyer ».
- Ajoute de l'urgence au CTA (réserver cette semaine / réserver un créneau maintenant).

Sécurité :
- Si la réponse n'est PAS clairement couverte par le pack de connaissances, mets should_reply à false et explique dans reason (en français).
- N'invente jamais de prix, délais, garanties ou fonctionnalités.
- Utilise uniquement le lien CTA fourni — n'invente jamais d'URL.`;
}

function assembleSystemPrompt(params: {
  knowledgePack: string;
  promptSnapshot: string;
  maxSentences?: number;
  customDirective?: string;
}): string {
  const parts = [
    buildGlobalRules(params.maxSentences ?? 3),
    "",
    "## Pack de connaissances",
    params.knowledgePack,
    "",
    "## Prompt campagne",
    params.promptSnapshot,
  ];
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
      temperature: 0.2,
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
  maxSentences?: number;
  customDirective?: string;
}): Promise<{
  decision: GroqReplyDecision;
  model: string;
  costUsdTicks: number | null;
}> {
  const primaryModel = resolveModel("GROK_PRIMARY_MODEL", PRIMARY_MODEL);
  const fallbackModel = resolveModel("GROK_FALLBACK_MODEL", FALLBACK_MODEL);

  const ctaLink = await resolveLeadCtaLink(params.leadEmail, params.targetType);
  const promptSnapshot = applyPromptLinkVariables(
    params.promptSnapshot,
    ctaLink,
    params.targetType,
  );

  const systemPrompt = assembleSystemPrompt({
    knowledgePack: params.knowledgePack,
    promptSnapshot,
    maxSentences: params.maxSentences,
    customDirective: params.customDirective,
  });

  const userPrompt = [
    `Email du lead : ${params.leadEmail}`,
    "",
    `Lien CTA (utilise exactement cette URL dans reply_text) : ${ctaLink}`,
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
