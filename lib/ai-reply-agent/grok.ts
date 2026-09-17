import {
  applyPromptLinkVariables,
  resolvePromptLinks,
} from "./lead-links";
import { truncateInboundText } from "./inbound";
import {
  isCifNichePreset,
  isComptableNichePreset,
} from "@/lib/site/legal-content";

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

export function buildConferenceObjectionRules(
  nichePresetId?: string,
): string | null {
  if (isComptableNichePreset(nichePresetId ?? "")) {
    return `Objection conférence (comptable — reservation-conference.html) :
- Déclencheurs : « conférence », « appel à plusieurs », « appelez-moi », « pas de visio collective », « je ne fais pas les appels en conférence », etc.
- Maximum 4 phrases courtes dans reply_text pour cette objection (hors signature et lien CTA).
- Acknowledge : valider la réaction sans s'excuser (ex. « Je comprends que le format conférence ne soit pas votre habitude. »).
- Explain : un accompagnement Hercule sur-mesure démarre à 2 500 € ; pour proposer une tarification accessible aux cabinets qui souhaitent une solution clé en main pour développer rapidement leur clientèle BNC/BIC/TNS, nous présentons cette offre en appel conférence. Exception pricing : 2 500 € autorisé uniquement pour cette objection.
- Redirect : lien CTA briefing collectif fourni + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- should_reply true — ce n'est PAS une raison d'abstenir ; recovery_confidence ≥ 75 si tag Lead / Not interested.
- Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc en alternative.`;
  }
  if (isCifNichePreset(nichePresetId ?? "")) {
    return `Objection conférence (CIF — reservation-conference.html) :
- Déclencheurs : « conférence », « appel à plusieurs », « appelez-moi », « pas de visio collective », « je ne fais pas les appels en conférence », etc.
- Maximum 4 phrases courtes dans reply_text pour cette objection (hors signature et lien CTA).
- Acknowledge : valider la réaction sans s'excuser (ex. « Je comprends que le format conférence ne soit pas votre habitude. »).
- Explain : un accompagnement Hercule sur-mesure démarre à 2 500 € ; pour proposer une tarification accessible aux cabinets qui souhaitent une solution clé en main pour développer rapidement leur clientèle professionnelle (cabinets dentistes et vétérinaires), nous présentons cette offre en appel conférence. Exception pricing : 2 500 € autorisé uniquement pour cette objection.
- Redirect : lien CTA briefing collectif fourni + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- should_reply true — ce n'est PAS une raison d'abstenir ; recovery_confidence ≥ 75 si tag Lead / Not interested.
- Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc en alternative.`;
  }
  return null;
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
  const pricingUrl = isCifNichePreset(nichePresetId ?? "")
    ? "https://hercule.dev/cvg/conseil-financier"
    : isComptableNichePreset(nichePresetId ?? "")
      ? "https://hercule.dev/cvg/comptable"
      : "https://hercule.dev/cvg";
  const conferenceRules = buildConferenceObjectionRules(nichePresetId);
  const conferenceSection = conferenceRules
    ? `\n${conferenceRules}\n`
    : "";
  const pricingSecurityRule = conferenceRules
    ? "- N'invente jamais de prix, délais, garanties ou fonctionnalités — sauf 2 500 € sur-mesure pour objection conférence (autorisé)."
    : "- N'invente jamais de prix, délais, garanties ou fonctionnalités.";
  return `Tu es Béatrice Meyer, responsable qualification chez Hercule (hercule.dev).

Réponds uniquement en JSON avec les clés : should_reply (boolean), reply_text (string|null), reason (string), recovery_confidence (number 0–100, obligatoire si tag Lead ou Not interested).

Règles quand should_reply est true :
- Texte brut uniquement dans reply_text (pas de HTML, pas de markdown).
- Rédige reply_text en français, vouvoiement, ton professionnel et direct — comme un email humain, pas une FAQ.
- ${lengthRule}
- Structure AER obligatoire dans reply_text : (1) Acknowledge — valider l'objection sans céder ; (2) Explain — agiter la douleur / coût de l'inaction ou expliquer le positionnement conférence ; (3) Redirect — lien CTA briefing collectif fourni.
- Ne recopie pas mot à mot le pack de connaissances ; reformule avec tes mots.
- Sépare le corps, le lien CTA et la signature par une ligne vide (\\n\\n).
- Mets le lien CTA seul sur sa propre ligne, en URL brute (sera affiché « Réserver » à l'envoi).
- Termine par « Béatrice Meyer », puis « hercule.dev Courtage contrat BNC/BIC », puis l'URL du site (https://hercule.dev ou ${pricingUrl} si question tarifs), chaque élément sur sa propre ligne.
${conferenceSection}
Ton — évite ces formulations :
- « Merci pour votre message » (sauf si le lead partage une info personnelle ou émotionnelle)
- « Je comprends votre préoccupation »
- « N'hésitez pas à »
- « Je reste à votre disposition »
- « réserver cette semaine » ou « réserver un créneau maintenant » (urgence forcée)
- listes à puces ou numérotées dans reply_text

Recovery (tags Lead ou Not interested) :
- Toujours renseigner recovery_confidence (0–100) : probabilité que la relance soit rattrapable.
- « Non merci, pas notre cible » / refus définitif → should_reply false, recovery_confidence 10–25.
- « Non mais… » / objection format ou téléphone → should_reply true si rattrapable, recovery_confidence ≥ 75.
- Opt-out explicite (« non merci », « c'est mort », « stop », « ne plus me contacter ») → should_reply false, recovery_confidence 0 — ne pas confondre avec « non mais ».
- Tag Interested : recovery_confidence optionnel (ignoré).

Signature :
- Avant la signature Béatrice Meyer, inclure sur sa propre ligne : _Répondez non si vous ne souhaitez plus de messages._

Sécurité :
- Si la réponse n'est PAS clairement couverte par le pack de connaissances, mets should_reply à false et explique dans reason (en français).
${pricingSecurityRule}
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
  let recoveryConfidence: number | null = null;
  const rawConfidence = parsed.recovery_confidence;
  if (typeof rawConfidence === "number" && Number.isFinite(rawConfidence)) {
    recoveryConfidence = Math.max(0, Math.min(100, rawConfidence));
  } else if (typeof rawConfidence === "string" && rawConfidence.trim()) {
    const parsedConfidence = Number(rawConfidence);
    if (Number.isFinite(parsedConfidence)) {
      recoveryConfidence = Math.max(0, Math.min(100, parsedConfidence));
    }
  }
  return {
    should_reply: shouldReply && Boolean(replyText),
    reply_text: shouldReply && replyText ? replyText : null,
    reason,
    recovery_confidence: recoveryConfidence,
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
