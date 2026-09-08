# Booking Communication

Calendly → Resend email orchestration for agence/entreprise bookings.

## AI agents

Before editing, read:

1. [`.cursor/rules/nextjs-hercule.mdc`](../../.cursor/rules/nextjs-hercule.mdc)
2. [`.cursor/skills/hercule-nextjs/SKILL.md`](../../.cursor/skills/hercule-nextjs/SKILL.md) (router)
3. [`.cursor/skills/hercule-nextjs-communication/SKILL.md`](../../.cursor/skills/hercule-nextjs-communication/SKILL.md) (this domain)

Canon: [doc/tech-stack/07-orchestrators.md](../../doc/tech-stack/07-orchestrators.md), [doc/tech-stack/10-emails.md](../../doc/tech-stack/10-emails.md).

## Flow

```
Calendly webhook (invitee.created)
  → orchestrator.ts
  → booking_email_jobs (Supabase)
  → cron /api/cron/booking-emails (every 15 min, CRON_SECRET)
  → Resend send
```

## Key files

| File | Role |
|------|------|
| `orchestrator.ts` | Main entry — start/cancel sequences |
| `jobs.ts` | Job queue read/write |
| `templates.ts` | Template roles (immediate, h48, h24, h20, legacy) |
| `render-service.ts` | HTML rendering |
| `threading.ts` | Email thread headers |
| `send-window.ts` | Send window rules |
| `legacy.ts` | Pre `BOOKING_GO_LIVE_AT` agence bookings |

## Go-live cutoff

`BOOKING_GO_LIVE_AT` (ISO UTC): agence bookings before cutoff use legacy manual flow (Streamlit booking-resend).

## APIs

- `/api/booking-communication/*` — templates, render, send-once, trigger
- `/api/cron/booking-emails` — job processor

## React Email

Templates rendered via `emails/booking-html-email.tsx`. Signatures in `signatures.tsx`.

## Streamlit UI

Operator tool for template editing and legacy sends: `pnpm streamlit-booking-resend` — see [hercule-streamlit-booking-resend](../../.cursor/skills/hercule-streamlit-booking-resend/SKILL.md).
