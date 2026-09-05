import {
  applyPromptLinkVariables,
  resolveLeadCtaLink,
} from "./lead-links";

import type { AiReplyTargetType, GroqReplyDecision } from "./types";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const PRIMARY_MODEL = "grok-4-1-fast-reasoning";
const FALLBACK_MODEL = "grok-build-0.1";

const GLOBAL_RULES = `You are Béatrice Meyer, qualification lead at Hercule (hercule.dev).

Output JSON only with keys: should_reply (boolean), reply_text (string|null), reason (string).

Reply rules when should_reply is true:
- Plain text only in reply_text (no HTML, no markdown).
- 2 to 3 sentences maximum.
- Structure: acknowledge → address the question → redirect with urgent CTA to book a call.
- Always sign off as "Béatrice Meyer".
- Add urgency to the CTA (book this week / reserve a slot now).

Safety:
- If the answer is NOT clearly supported by the knowledge pack, set should_reply to false and explain in reason.
- Never invent prices, SLAs, guarantees, or product features.
- Use only the CTA link provided below — never invent URLs.`;

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
    typeof parsed.reason === "string" ? parsed.reason.trim() : "No reason provided";
  return {
    should_reply: shouldReply && Boolean(replyText),
    reply_text: shouldReply && replyText ? replyText : null,
    reason,
  };
}

async function callGrokModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ decision: GroqReplyDecision; model: string }> {
  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGrokApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 400,
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
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error(`Grok ${model} returned empty content`);
  }
  return { decision: parseGrokJson(content), model };
}

export async function generateReplyDecision(params: {
  knowledgePack: string;
  promptSnapshot: string;
  inboundText: string;
  leadEmail: string;
  targetType: AiReplyTargetType;
}): Promise<{ decision: GroqReplyDecision; model: string }> {
  const primaryModel = resolveModel("GROK_PRIMARY_MODEL", PRIMARY_MODEL);
  const fallbackModel = resolveModel("GROK_FALLBACK_MODEL", FALLBACK_MODEL);

  const ctaLink = await resolveLeadCtaLink(params.leadEmail, params.targetType);
  const promptSnapshot = applyPromptLinkVariables(
    params.promptSnapshot,
    ctaLink,
    params.targetType,
  );

  const systemPrompt = [
    GLOBAL_RULES,
    "",
    "## Knowledge pack",
    params.knowledgePack,
    "",
    "## Campaign prompt",
    promptSnapshot,
  ].join("\n");

  const userPrompt = [
    `Lead email: ${params.leadEmail}`,
    "",
    `CTA link (use this exact URL in reply_text): ${ctaLink}`,
    "",
    "Inbound reply to answer:",
    params.inboundText,
  ].join("\n");

  try {
    return await callGrokModel(primaryModel, systemPrompt, userPrompt);
  } catch (primaryErr) {
    const primaryMessage =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn("[ai-reply-agent] primary Grok model failed:", primaryMessage);
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
