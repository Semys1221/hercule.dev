---
name: hercule-nextjs-communication
description: >-
  Hercule.dev booking emails, Resend templates, Instantly bypass, crons, React Email,
  AI reply jobs. Use when editing booking-communication, instantly-bypass, emails/,
  /api/cron, Resend webhook, or email sequence editors.
---

# Next.js Communication

Email orchestration and Instantly bypass. Canon: [doc/tech-stack/07-orchestrators.md](../../doc/tech-stack/07-orchestrators.md), [doc/tech-stack/10-emails.md](../../doc/tech-stack/10-emails.md).

Human reference: [lib/booking-communication/README.md](../../lib/booking-communication/README.md).

## Orchestrator pattern

```
Webhook (Calendly / Instantly) → job row in Supabase → cron processes → send
```

No Inngest/n8n. All crons require `Authorization: Bearer $CRON_SECRET`.

## Booking communication

| File | Role |
|------|------|
| `lib/booking-communication/orchestrator.ts` | Main booking email orchestrator |
| `lib/booking-communication/jobs.ts` | `booking_email_jobs` queue |
| `lib/booking-communication/templates.ts` | Template registry + roles |
| `lib/booking-communication/render-service.ts` | HTML render |
| `lib/booking-communication/threading.ts` | Email thread headers |
| `lib/booking-communication/send-window.ts` | Send window constraints |
| `lib/booking-communication/legacy.ts` | Pre go-live agence legacy |
| `lib/booking-communication/signatures.tsx` | Email signatures |

### APIs

| Route | Purpose |
|-------|---------|
| `/api/booking-communication/templates` | CRUD templates |
| `/api/booking-communication/render` | Preview render |
| `/api/booking-communication/send-once` | Manual legacy send |
| `/api/booking-communication/trigger` | Trigger sequence |
| `/api/booking-communication/role-sequence/start` | Start role sequence |
| `/api/booking/config` | Booking config |

### Go-live cutoff

`BOOKING_GO_LIVE_AT` (ISO UTC): agence bookings before cutoff = legacy manual sends only.

## Instantly bypass (E1–E3)

**Next sends** (LEG-02); Streamlit configures templates.

| File | Role |
|------|------|
| `lib/instantly-bypass/pipeline.ts` | CRM step pipeline |
| `lib/instantly-bypass/send-flow.ts` | Unibox reply sends |
| `lib/instantly-bypass/send-window.ts` | Mon–Fri 8–17 Paris (manual) |
| `lib/instantly-bypass/dispatch-scheduled.ts` | Process scheduled jobs |
| `lib/instantly-bypass/e1-thread-guard.ts` | Prevent duplicate E1 |

Webhooks: `/api/webhooks/instantly` (interested), `/api/webhooks/instantly/reply` (AI reply enqueue)

## Cron routes

| Route | Interval | Purpose |
|-------|----------|---------|
| `/api/cron/booking-emails` | 15 min | Process booking email jobs |
| `/api/cron/instantly-bypass-jobs` | 5–15 min | Send queued bypass emails |
| `/api/cron/instantly-bypass-pipeline` | 5–15 min | Advance bypass pipeline |
| `/api/cron/ai-reply-agent-jobs` | — | Process AI reply queue |
| `/api/cron/calendly-seat-check` | — | Seat onboarding check |
| `/api/cron/onboarding-reminders` | — | Onboarding reminders |
| `/api/cron/post-rdv-surveys` | — | Post-RDV survey tokens |

## React Email

| File | Role |
|------|------|
| `emails/booking-html-email.tsx` | Main booking email component |
| `emails/components/booking-email-layout.tsx` | Layout wrapper |
| `emails/components/email-signature.tsx` | Signature block |

## Sequence editors (internal UI)

- Registry: `lib/admin/email-sequences/registry.ts`
- Adapters: `booking-adapter.ts`, `bypass-adapter.ts`
- Safety: `lib/admin/email-sequences/safety.ts`

## AI reply agent (lib)

- `lib/ai-reply-agent/handler.ts`, `send.ts`, `grok.ts`
- Enqueued via `/api/webhooks/instantly/reply`
- UI in Streamlit reply agent — cross-ref [hercule-streamlit-reply-agent](../hercule-streamlit-reply-agent/SKILL.md)

## Calendly seat onboarding

- `lib/calendly-seat-onboarding/orchestrator.ts`
- Internal UI: `/internal/funnels/agence/emails/calendly-seat-onboarding`

## Public HTML (communication)

- `public/temporary-reservation.html` — legacy relance page
- `public/post-booking-entreprise.html` — entreprise post-booking

## MCP

- **Resend** — send, templates, webhooks (`/api/webhooks/resend`)
- **Instantly** — bypass sends, Unibox replies
- **Supabase** — jobs, templates, bypass config

## Cross-links

- Streamlit subsequence CRM: [hercule-streamlit-subsequence](../hercule-streamlit-subsequence/SKILL.md)
- Streamlit booking Resend UI: [hercule-streamlit-booking-resend](../hercule-streamlit-booking-resend/SKILL.md)
- Calendly webhook entry: [hercule-nextjs-crm](hercule-nextjs-crm/SKILL.md)
