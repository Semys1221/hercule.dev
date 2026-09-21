import {
  applyPromptLinkVariables,
  resolvePromptLinks,
} from "./lead-links";
import { truncateInboundText } from "./inbound";
import {
  isAssuranceNichePreset,
  isCifNichePreset,
  isComptableNichePreset,
} from "@/lib/site/legal-content";
import {
  inboundLooksLikePartnerDueDiligence,
  inboundLooksLikeProspectQualityObjection,
} from "./inbound-question";

import type { AiReplyTargetType, GroqReplyDecision } from "./types";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const PRIMARY_MODEL = "grok-4-1-fast";
const FALLBACK_MODEL = "grok-build-0.1";
const MAX_OUTPUT_TOKENS = 320;
const DUE_DILIGENCE_MAX_OUTPUT_TOKENS = 1400;
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
    return `Première réponse (intérêt, question, demande RDV / « appelez-moi ») :
- Réponse directe et chaleureuse — PAS d'AER, PAS de 2 500 €, PAS d'option 1:1.
- Pousser l'appel de présentation **ce mercredi 23 septembre à 10h** (heure de Paris) + lien CTA briefing collectif.

Objection conférence EXPLICITE (comptable — reservation-conference.html) — 2e réponse uniquement :
- Déclencheurs : refus clair du format collectif APRÈS invitation au briefing — « pas de visio collective », « je ne fais pas les appels en conférence », « pas intéressé par un appel à plusieurs », etc. — PAS « appelez-moi » seul ni une réponse positive.
- Maximum 4 phrases courtes dans reply_text pour cette objection (hors signature et lien CTA).
- Acknowledge : valider la réaction sans s'excuser (ex. « Je comprends que le format conférence ne soit pas votre habitude. »).
- Explain : un accompagnement Hercule sur-mesure démarre à 2 500 € ; pour proposer une tarification accessible aux cabinets qui souhaitent une solution clé en main pour développer rapidement leur clientèle BNC/BIC/TNS, nous présentons cette offre en appel conférence. Exception pricing : 2 500 € autorisé uniquement pour cette objection.
- Redirect : lien CTA briefing collectif fourni + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- should_reply true — ce n'est PAS une raison d'abstenir ; recovery_confidence ≥ 75 si tag Lead.
- Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc en alternative.`;
  }
  if (isCifNichePreset(nichePresetId ?? "")) {
    return `Première réponse (intérêt, question, demande RDV / « appelez-moi ») :
- Réponse directe et chaleureuse — PAS d'AER, PAS de 2 500 €, PAS d'option 1:1.
- Pousser l'appel de présentation **ce mercredi 23 septembre à 10h** (heure de Paris) + lien CTA briefing collectif.

Objection conférence EXPLICITE (CIF — reservation-conference.html) — 2e réponse uniquement :
- Déclencheurs : refus clair du format collectif APRÈS invitation au briefing — « pas de visio collective », « je ne fais pas les appels en conférence », « pas intéressé par un appel à plusieurs », etc. — PAS « appelez-moi » seul ni une réponse positive.
- Maximum 4 phrases courtes dans reply_text pour cette objection (hors signature et lien CTA).
- Acknowledge : valider la réaction sans s'excuser (ex. « Je comprends que le format conférence ne soit pas votre habitude. »).
- Explain : un accompagnement Hercule sur-mesure démarre à 2 500 € ; pour proposer une tarification accessible aux cabinets qui souhaitent une solution clé en main pour développer rapidement leur clientèle professionnelle (cabinets dentistes et vétérinaires), nous présentons cette offre en appel conférence. Exception pricing : 2 500 € autorisé uniquement pour cette objection.
- Redirect : lien CTA briefing collectif fourni + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- should_reply true — ce n'est PAS une raison d'abstenir ; recovery_confidence ≥ 75 si tag Lead.
- Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc en alternative.`;
  }
  if (isAssuranceNichePreset(nichePresetId ?? "")) {
    return `Première réponse (intérêt, question, demande RDV / « appelez-moi ») :
- Réponse directe et chaleureuse — PAS d'AER, PAS de 2 500 €, PAS d'option 1:1.
- Pousser l'appel de présentation **ce mercredi 23 septembre à 10h** (heure de Paris) + lien CTA briefing collectif.

Objection conférence EXPLICITE (IAS — reservation-conference.html) — 2e réponse uniquement :
- Déclencheurs : refus clair du format collectif APRÈS invitation au briefing — « pas de visio collective », « je ne fais pas les appels en conférence », « pas intéressé par un appel à plusieurs », etc. — PAS « appelez-moi » seul ni une réponse positive.
- Maximum 4 phrases courtes dans reply_text pour cette objection (hors signature et lien CTA).
- Acknowledge : valider la réaction sans s'excuser (ex. « Je comprends que le format conférence ne soit pas votre habitude. »).
- Explain : un accompagnement Hercule sur-mesure démarre à 2 500 € ; pour proposer une tarification accessible aux cabinets qui souhaitent une solution clé en main pour développer rapidement leur clientèle TNS / libéraux, nous présentons cette offre en appel conférence. Exception pricing : 2 500 € autorisé uniquement pour cette objection.
- Redirect : lien CTA briefing collectif fourni + « Si vous souhaitez réserver un appel en 1:1 avec le dirigeant pour discuter d'une solution sur-mesure, répondez à ce mail. »
- should_reply true — ce n'est PAS une raison d'abstenir ; recovery_confidence ≥ 75 si tag Lead.
- Pas de lien Calendly 1:1 ni d'appel téléphonique ad hoc en alternative.`;
  }
  return null;
}

export function buildProspectQualityObjectionRules(): string {
  return `Objection qualité prospects / Pappers / Sirene (R2 — double verrou qualification) :
- should_reply true — ne PAS s'abstenir ; recovery_confidence ≥ 85 si tag Lead.
- NE PAS utiliser AER (sauf paragraphe tarif si demande HT sans RDV dans le même mail — AER tarif léger uniquement sur ce point).
- Rédige 4 à 5 paragraphes courts, sans listes à puces ni numérotées.
- Structure : (1) accusé réception des questions (qualification des dirigeants + tarif si demandé) ; (2) R2 — Pappers/Sirene servent uniquement à repérer des structures ; aucun dirigeant transmis sur un signal seul ; chaque profil passe par un appel téléphonique de qualification, un contrat signé, puis un retour par mail confirmant actifs et besoin — appel + confirmation écrite éliminent le bruit, vous ne recevez que des personnes déjà intéressées ; (3) si tarif HT sans RDV demandé — ne pas chiffrer, conditions au briefing collectif du mercredi 23 septembre à 10h (Paris), renvoi discret hercule.dev/cvg/comptable sans montants ; (4) CTA briefing collectif, lien seul sur sa ligne.
- Interdit : reframe perception (leads, Google Ads, Meta, cold email, « coût supplémentaire »), reconfiguration de statut, machine à cash, tableau lead-gen vs Hercule.
- Ne pas confondre qualification dirigeant (appel téléphonique) et bande passante cabinet (visios qualifiantes).`;
}

export function buildPartnerDueDiligenceRules(): string {
  return `Email questionnaire / due diligence partenaire (prospect intéressé qui demande des précisions) :
- should_reply true — ne PAS s'abstenir ; recovery_confidence ≥ 85 si tag Lead.
- NE PAS utiliser AER. Cette consigne remplace la limite de phrases.
- Rédige 4 à 8 paragraphes thématiques courts, sans listes à puces ni numérotées.
- Structure, dans cet ordre : (1) accusé réception de l'intérêt et des questions ; (2) périmètre de la mission et besoins des dirigeants ; (3) cadre réglementaire et responsabilités — le cabinet porte le conseil, Hercule ne sélectionne ni ne commercialise de produits ; (4) qualification des prospects et organisation des mises en relation (exclusivité, visio dirigeant et cabinet, Calendly/Zoom) ; (5) modèle économique — 0 % de commission, dirigeant ne paie rien, renvoyer vers le site tarifs SANS chiffrer ; (6) CTA briefing collectif, lien seul sur sa ligne. Les documents détaillés (présentation, CGV, convention) sont présentés au briefing du mercredi 23 septembre à 10h (Paris) — ne pas promettre un envoi de convention type par email.
- Ne pas inventer de volume de cabinets, de durée au minute près, ni de produits imposés.`;
}

export function buildInternationalRules(
  nichePresetId?: string,
): string | null {
  if (isComptableNichePreset(nichePresetId ?? "")) {
    return `International BE/CH/CA (DEC — prioritaire sur briefing France si lead BE/CH/CA détecté) :
- Détection : email .be/.ch/.ca, mention Belgique/Suisse/Canada, question scope France/hors France.
- Étape 1 (pas d'acceptation tarifs explicite) : réponse directe — modèle France par défaut ; BE/CH/CA = échange 1:1 dirigeant + infrastructure sur mesure.
- Profils DEC : restaurants +3 salariés en chaos opérationnel (tenue comptable / social-paie).
- Tarifs autorisés en email : 1 499 USD/mois (Hercule) · 400 USD/mois min par profil · 10 profils/mois.
- Redirect étape 1 : « Si vous souhaitez échanger et acceptez ces tarifications, répondez à ce mail — vous recevrez un lien de planification unique. »
- PAS de briefing 23 sept, PAS de {reservation_comptable_link}, PAS de lien Calendly inventé à l'étape 1.
- Gate : « oui » / « avec plaisir » / « je souhaite échanger » sans acceptation tarifs → rappeler montants USD et demander acceptation explicite (anti « je pensais que c'était gratuit »).
- Étape 2 (acceptation tarifs explicite + tarifs déjà exposés dans le fil) : si Contexte Calendly fournit booking_url → l'inclure seul sur sa ligne. should_reply true.`;
  }
  if (isCifNichePreset(nichePresetId ?? "") || isAssuranceNichePreset(nichePresetId ?? "")) {
    return `International BE/CH/CA (IAS + CIF — prioritaire sur briefing France si lead BE/CH/CA détecté) :
- Détection : email .be/.ch/.ca, mention Belgique/Suisse/Canada, question scope France/hors France.
- Étape 1 (pas d'acceptation tarifs explicite) : réponse directe — modèle France par défaut ; BE/CH/CA = échange 1:1 dirigeant + infrastructure sur mesure.
- Profils IAS (courtiers_prevoyance) : TNS/libéraux — passifs sociaux / prévoyance Madelin (COA, pas mandataire).
- Profils CIF (conseillers_gestion_patrimoine) : dentistes et vétérinaires 2+ salariés — trésorerie, pression fiscale, placement avoirs pro/privé.
- Tarifs autorisés en email : 1 499 USD/mois · 400 USD/mois min par profil · 10 profils/mois.
- Redirect étape 1 : « Si vous souhaitez échanger et acceptez ces tarifications, répondez à ce mail — vous recevrez un lien de planification unique. »
- PAS de briefing 23 sept, PAS de {reservation_cif_link}, PAS de lien Calendly inventé à l'étape 1.
- Gate : échange souhaité sans acceptation tarifs → rappeler montants USD et demander acceptation explicite.
- Étape 2 (acceptation tarifs explicite + tarifs déjà exposés dans le fil) : si Contexte Calendly fournit booking_url → l'inclure seul sur sa ligne. should_reply true.`;
  }
  return null;
}

export function buildGlobalRules(
  maxSentences = 3,
  nichePresetId?: string,
  partnerDueDiligence = false,
  prospectQualityObjection = false,
): string {
  const n = Math.max(1, Math.min(10, maxSentences));
  const lengthRule = partnerDueDiligence
    ? buildPartnerDueDiligenceRules()
    : prospectQualityObjection
      ? buildProspectQualityObjectionRules()
      : n === 1
      ? "Maximum 1 phrase courte dans reply_text (hors signature et lien CTA)."
      : `Maximum ${n} phrases courtes dans reply_text (hors signature et lien CTA).`;
  const pricingUrl = isCifNichePreset(nichePresetId ?? "")
    ? "https://hercule.dev/cvg/conseil-financier"
    : isAssuranceNichePreset(nichePresetId ?? "")
      ? "https://hercule.dev/cvg/courtier-assurance"
      : isComptableNichePreset(nichePresetId ?? "")
        ? "https://hercule.dev/cvg/comptable"
        : "https://hercule.dev/cvg";
  const conferenceRules = buildConferenceObjectionRules(nichePresetId);
  const internationalRules = buildInternationalRules(nichePresetId);
  const conferenceSection = conferenceRules
    ? `\n${conferenceRules}\n`
    : "";
  const internationalSection = internationalRules
    ? `\n${internationalRules}\n`
    : "";
  const pricingSecurityRule =
    conferenceRules || internationalRules
      ? "- N'invente jamais de prix, délais, garanties ou fonctionnalités — sauf 2 500 € sur-mesure pour objection conférence (autorisé) et 1 499 USD / 400 USD pour flux international BE/CH/CA (autorisé)."
      : "- N'invente jamais de prix, délais, garanties ou fonctionnalités.";
  return `Tu es Béatrice Meyer, responsable qualification chez Hercule (hercule.dev).

Réponds uniquement en JSON avec les clés : should_reply (boolean), reply_text (string|null), reason (string), recovery_confidence (number 0–100, obligatoire si tag Lead).

Règles quand should_reply est true :
- Texte brut uniquement dans reply_text (pas de HTML, pas de markdown).
- Rédige reply_text en français, vouvoiement, ton professionnel et direct — comme un email humain, pas une FAQ.
- ${lengthRule}
- Structure AER dans reply_text UNIQUEMENT pour les objections (tarif, refus format conférence explicite, bande passante, éligibilité) : (1) Acknowledge — valider l'objection sans céder ; (2) Explain — agiter la douleur / coût de l'inaction ou expliquer le positionnement ; (3) Redirect — lien CTA briefing collectif. Pour réponses positives, neutres ou demandes de RDV → réponse directe et chaleureuse sans AER ; pousser le briefing du mercredi 23 septembre à 10h (Paris).
- Ne recopie pas mot à mot le pack de connaissances ; reformule avec tes mots.
- Sépare le corps, le lien CTA briefing et la clôture par une ligne vide (\\n\\n).
- Mets le lien CTA briefing seul sur sa propre ligne, en URL brute (sera affiché « Réserver » à l'envoi).
- Pour renvoyer vers le site (hors CTA briefing), intègre hercule.dev dans la phrase (ex. « …n'hésitez pas à vous rendre sur notre site internet hercule.dev ») — pas sur une ligne séparée ; utilise ${pricingUrl} si question tarifs.
- Termine par « Cordialement, », puis « Béatrice Meyer », puis « Hercule, Courtage contrat BNC/BIC », chaque élément sur sa propre ligne — sans URL https:// séparée en signature.
${conferenceSection}${internationalSection}
Ton — évite ces formulations :
- « Merci pour votre message » (sauf si le lead partage une info personnelle ou émotionnelle)
- « Je comprends votre préoccupation »
- « Je reste à votre disposition »
- « Je note votre question sur notre identité » (ou toute méta-formulation du type « je note votre question »)
- « réserver cette semaine » ou « réserver un créneau maintenant » (urgence forcée)
- listes à puces ou numérotées dans reply_text

Identité (questions « qui êtes-vous ») :
- Framing : Hercule est un groupement d'entrepreneurs dirigé par Evan Sinclair — réponse directe en une phrase.
- Ne pas mener par la raison sociale EI (Nanguy Evan Gbeho, entrepreneur individuel) sauf si le prospect demande explicitement l'immatriculation ou le RCS.

Contexte fil (historique de conversation) :
- Lis tout l'historique fourni avant de décider should_reply.
- Si l'inbound contient plusieurs questions ou objections, réponds à TOUTES dans reply_text (ne pas en omettre une).
- Si le prospect remercie ou confirme sans nouvelle question APRÈS qu'un rendez-vous Calendly est pris → should_reply false (ne pas renvoyer un rappel conférence).
- Si le prospect remercie pour la proposition sans confirmer ni refuser (« Merci pour cette proposition », « Merci pour votre offre », etc.) et qu'aucun RDV n'est enregistré → should_reply true : relance douce en demandant s'il souhaite prendre rendez-vous pour l'appel de présentation du mercredi 23 septembre à 10h (Paris) + lien CTA briefing.
- Si le prospect dit ne pas avoir saisi / ne pas comprendre (« je n'ai pas saisi », « je n'ai pas compris ») → should_reply true : clarifier en AER qui est Hercule (groupement d'entrepreneurs, Evan Sinclair) et le lien avec son métier — même si le cabinet est hors France.
- Un accusé de réception court qui clôt l'échange (« top merci », « parfait merci ») après réservation ou lien déjà traité ne mérite pas de nouvelle relance — sauf remerciement pour la proposition sans RDV (voir ci-dessus).

Recovery (tag Lead) :
- Toujours renseigner recovery_confidence (0–100) : probabilité que la relance soit rattrapable.
- « Non merci, pas notre cible » / refus définitif → should_reply false, recovery_confidence 10–25.
- « Non mais… » / objection format ou téléphone → should_reply true si rattrapable, recovery_confidence ≥ 75.
- « Je n'ai pas saisi » / incompréhension → should_reply true, recovery_confidence ≥ 80.
- Opt-out explicite (« non merci », « c'est mort », « stop », « ne plus me contacter ») → should_reply false, recovery_confidence 0 — ne pas confondre avec « non mais » ou un simple merci après réservation.
- Tag Interested : recovery_confidence optionnel (ignoré).

Signature :
- Avant « Cordialement, », inclure sur sa propre ligne : Répondez non si vous ne souhaitez plus de messages. (sans italique ni markdown)

Sécurité :
- Si la réponse n'est PAS clairement couverte par le pack de connaissances, mets should_reply à false et explique dans reason (en français). Exceptions : email de due diligence partenaire ou objection qualité prospects (R2) couvert par le pack — should_reply true.
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
  partnerDueDiligence?: boolean;
  prospectQualityObjection?: boolean;
}): string {
  const parts = [
    buildGlobalRules(
      params.maxSentences ?? 3,
      params.nichePresetId,
      params.partnerDueDiligence ?? false,
      params.prospectQualityObjection ?? false,
    ),
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

function isRetryableGrokError(err: unknown): boolean {
  if (isRateLimitError(err)) {
    return true;
  }
  const text = err instanceof Error ? err.message : String(err);
  return /json|unterminated string|unexpected token/i.test(text);
}

function unescapeJsonString(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseRecoveryConfidence(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.min(100, raw));
  }
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(100, parsed));
    }
  }
  return null;
}

function buildGroqDecision(parsed: Partial<GroqReplyDecision>): GroqReplyDecision {
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
    recovery_confidence: parseRecoveryConfidence(parsed.recovery_confidence),
  };
}

function extractJsonStringField(content: string, field: string): string | null {
  const marker = `"${field}"`;
  const index = content.indexOf(marker);
  if (index < 0) {
    return null;
  }
  const colon = content.indexOf(":", index + marker.length);
  if (colon < 0) {
    return null;
  }
  let cursor = colon + 1;
  while (cursor < content.length && /\s/.test(content[cursor] ?? "")) {
    cursor += 1;
  }
  if (content[cursor] !== '"') {
    return null;
  }
  cursor += 1;

  let value = "";
  while (cursor < content.length) {
    const char = content[cursor] ?? "";
    if (char === "\\") {
      const next = content[cursor + 1];
      if (next) {
        value += char + next;
        cursor += 2;
        continue;
      }
    }
    if (char === '"') {
      return unescapeJsonString(value);
    }
    value += char;
    cursor += 1;
  }

  return value.trim() ? unescapeJsonString(value.trim()) : null;
}

function parseGrokJsonLenient(content: string): GroqReplyDecision {
  const shouldReplyMatch = content.match(/"should_reply"\s*:\s*(true|false)/i);
  const shouldReply = shouldReplyMatch?.[1]?.toLowerCase() === "true";
  const replyText = extractJsonStringField(content, "reply_text");
  const reason =
    extractJsonStringField(content, "reason") ?? "Aucune raison fournie (parse partiel)";
  const confidenceMatch = content.match(
    /"recovery_confidence"\s*:\s*(\d+(?:\.\d+)?)/,
  );
  const recoveryConfidence = confidenceMatch
    ? parseRecoveryConfidence(Number(confidenceMatch[1]))
    : null;

  return buildGroqDecision({
    should_reply: shouldReply,
    reply_text: replyText,
    reason,
    recovery_confidence: recoveryConfidence,
  });
}

export function parseGrokJson(content: string): GroqReplyDecision {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : trimmed;
  try {
    const parsed = JSON.parse(raw) as Partial<GroqReplyDecision>;
    return buildGroqDecision(parsed);
  } catch {
    return parseGrokJsonLenient(raw);
  }
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
  maxTokens: number = MAX_OUTPUT_TOKENS,
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
      max_tokens: maxTokens,
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
  let decision: GroqReplyDecision;
  try {
    decision = parseGrokJson(content);
  } catch {
    decision = parseGrokJsonLenient(content);
  }
  return {
    decision,
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
  threadContext?: string | null;
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

  const partnerDueDiligence = inboundLooksLikePartnerDueDiligence(
    params.inboundText,
  );
  const prospectQualityObjection =
    !partnerDueDiligence &&
    inboundLooksLikeProspectQualityObjection(params.inboundText);
  const extendedInbound = partnerDueDiligence || prospectQualityObjection;
  const outputTokens = extendedInbound
    ? DUE_DILIGENCE_MAX_OUTPUT_TOKENS
    : MAX_OUTPUT_TOKENS;

  const systemPrompt = assembleSystemPrompt({
    knowledgePack: params.knowledgePack,
    promptSnapshot,
    maxSentences: params.maxSentences,
    customDirective: params.customDirective,
    nichePresetId: params.nichePresetId,
    bookingContext: params.bookingContext,
    partnerDueDiligence,
    prospectQualityObjection,
  });

  const threadContext = params.threadContext?.trim();
  const userPromptParts = [
    `Email du lead : ${params.leadEmail}`,
    `Tag Instantly du lead : ${interestLabel}`,
    "",
    `Lien CTA (utilise exactement cette URL dans reply_text) : ${promptLinks.primary}`,
  ];
  if (threadContext) {
    userPromptParts.push(
      "",
      "Historique du fil (du plus ancien au plus récent) :",
      threadContext,
    );
  }
  userPromptParts.push(
    "",
    "Réponse entrante à traiter (dernier message du prospect) :",
    truncateInboundText(
      params.inboundText,
      extendedInbound ? 8000 : undefined,
    ),
  );
  const userPrompt = userPromptParts.join("\n");

  const logReplyDecision = (
    decision: GroqReplyDecision,
    model: string,
  ): void => {
    const replyText = decision.reply_text ?? "";
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "713bee",
      },
      body: JSON.stringify({
        sessionId: "713bee",
        runId: "pre-fix",
        hypothesisId: "H1-H5",
        location: "grok.ts:generateReplyDecision",
        message: "reply-agent decision",
        data: {
          model,
          nichePresetId: params.nichePresetId ?? null,
          shouldReply: decision.should_reply,
          inboundPreview: truncateInboundText(params.inboundText).slice(0, 200),
          has2500: replyText.includes("2 500"),
          has1to1: /1:1|1\s*:\s*1/i.test(replyText),
          hasMercredi23: /mercredi 23/i.test(replyText),
          hasConferenceScript: /appel conf[ée]rence/i.test(replyText),
          reason: decision.reason,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  try {
    const primary = await callGrokModel(
      primaryModel,
      systemPrompt,
      userPrompt,
      outputTokens,
    );
    logReplyDecision(primary.decision, primary.model);
    return primary;
  } catch (primaryErr) {
    const primaryMessage =
      primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn("[ai-reply-agent] primary Grok model failed:", primaryMessage);
    if (!fallbackModel || !isRetryableGrokError(primaryErr)) {
      throw primaryErr instanceof Error ? primaryErr : new Error(primaryMessage);
    }
    try {
      const fallback = await callGrokModel(
        fallbackModel,
        systemPrompt,
        userPrompt,
        outputTokens,
      );
      logReplyDecision(fallback.decision, fallback.model);
      return fallback;
    } catch (fallbackErr) {
      const fallbackMessage =
        fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      throw new Error(
        `Primary (${primaryModel}) failed: ${primaryMessage}. Fallback (${fallbackModel}) failed: ${fallbackMessage}`,
      );
    }
  }
}
