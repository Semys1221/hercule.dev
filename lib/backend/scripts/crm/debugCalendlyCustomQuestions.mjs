/**
 * Debug: test whether Calendly API accepts custom_questions writes.
 * Logs NDJSON to .cursor/debug-ac3016.log
 */
import { appendFileSync, readFileSync } from "node:fs";

const LOG_PATH = "/Users/evqn/dev/hercule.dev/.cursor/debug-ac3016.log";
const ENDPOINT = "http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d";
const SESSION = "ac3016";
const TARGET_ID = "26bb3452-334a-4492-9032-3ba1d2c3f9d0";
const SOURCE_ID = "db644e0c-cbff-4383-bf53-adebf53e3ba7";

function log(hypothesisId, location, message, data = {}) {
  const entry = {
    sessionId: SESSION,
    runId: "api-probe",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION,
    },
    body: JSON.stringify(entry),
  }).catch(() => {});
}

const token = readFileSync(".env", "utf8").match(/^CALENDLY_API_TOKEN=(.+)$/m)?.[1];
if (!token) throw new Error("CALENDLY_API_TOKEN missing");

async function getEvent(id) {
  const res = await fetch(`https://api.calendly.com/event_types/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return {
    status: res.status,
    questions: json.resource?.custom_questions ?? [],
    names: (json.resource?.custom_questions ?? []).map((q) => q.name),
    updatedAt: json.resource?.updated_at,
  };
}

const source = await getEvent(SOURCE_ID);
const before = await getEvent(TARGET_ID);
log("baseline", "debugCalendlyCustomQuestions.mjs:baseline", "before state", {
  targetCount: before.questions.length,
  targetNames: before.names,
  sourceCount: source.questions.length,
});

const questions = source.questions.map((q, i) => ({
  name: q.name,
  type: q.type,
  position: i,
  enabled: q.enabled,
  required: q.required,
  answer_choices: q.answer_choices ?? [],
  include_other: q.include_other ?? false,
}));

const attempts = [
  {
    id: "A",
    method: "PATCH",
    url: `https://api.calendly.com/event_types/${TARGET_ID}`,
    body: { custom_questions: questions },
  },
  {
    id: "B",
    method: "PATCH",
    url: `https://api.calendly.com/event_types/${TARGET_ID}`,
    body: { update_event_type_request: { custom_questions: questions } },
  },
  {
    id: "C",
    method: "PATCH",
    url: `https://api.calendly.com/event_types/${TARGET_ID}`,
    body: {
      name: "Rendez-vous comptable",
      duration: 30,
      custom_questions: questions,
    },
  },
  {
    id: "D",
    method: "PUT",
    url: `https://api.calendly.com/event_types/${TARGET_ID}`,
    body: { custom_questions: questions },
  },
  {
    id: "E",
    method: "PATCH",
    url: `https://api.calendly.com/event_types/${TARGET_ID}/custom_questions`,
    body: { custom_questions: questions },
  },
  {
    id: "F",
    method: "POST",
    url: `https://api.calendly.com/event_type_custom_questions`,
    body: { event_type: `https://api.calendly.com/event_types/${TARGET_ID}`, questions },
  },
];

for (const attempt of attempts) {
  const res = await fetch(attempt.url, {
    method: attempt.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(attempt.body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text.slice(0, 200) };
  }
  const after = await getEvent(TARGET_ID);
  log(attempt.id, `debugCalendlyCustomQuestions.mjs:${attempt.id}`, "attempt result", {
    method: attempt.method,
    url: attempt.url,
    status: res.status,
    responseQuestionCount: parsed.resource?.custom_questions?.length ?? null,
    targetQuestionCountAfter: after.questions.length,
    targetNamesAfter: after.names,
    updatedAtChanged: after.updatedAt !== before.updatedAt,
    errorTitle: parsed.title ?? null,
  });
}

const final = await getEvent(TARGET_ID);
log(
  "summary",
  "debugCalendlyCustomQuestions.mjs:summary",
  "final state",
  {
    success: final.questions.length >= 10,
    finalCount: final.questions.length,
    finalNames: final.names,
  },
);

console.log(
  JSON.stringify(
    {
      beforeCount: before.questions.length,
      finalCount: final.questions.length,
      success: final.questions.length >= 10,
    },
    null,
    2,
  ),
);
