---
name: hercule-streamlit-booking-resend
description: >-
  Hercule.dev Calendly booking and Resend email sequences (app/streamlit_booking_resend).
  Use when editing booking resend, Calendly reservations, booking_email_jobs,
  role_seq templates, agence legacy, or pnpm streamlit-booking-resend.
---

# Streamlit Booking Resend

Calendly reservations and Resend email sequences. Human reference: [app/streamlit_booking_resend/README.md](../../app/streamlit_booking_resend/README.md).

## Quick start

```bash
pnpm streamlit-booking-resend
pnpm smoke-streamlit-booking-resend-schedule
```

Requires `pnpm dev` for preview/send-once/tests (`CRM_BACKEND_URL=http://localhost:3000`).

Use MCP `plugin-resend-resend` for template/send ops; `plugin-calendly-calendly` for bookings; `plugin-supabase-supabase` for jobs and templates.

## Tabs

| Tab | Purpose |
|-----|---------|
| **Séquences** | Edit Resend templates (single source of truth) |
| **Réservations Agence** | Post go-live bookings — observation + emergency cancel |
| **Agence Legacy** | Pre go-live bookings — manual send only |
| **Réservations Entreprise** | Observe immediate auto email |
| **Historique** | All `booking_email_jobs` (auto + manual legacy) |

## Resend template roles

| Role | Audience | Timing |
|------|----------|--------|
| `immediate` | Agence + Entreprise | On booking |
| `h48_confirm` | Agence | H-48 |
| `h24_confirm` | Agence | H-24 |
| `h20_confirm` | Agence | H-20 |
| `role_seq_48` | Legacy agence | Intro Hercule |
| `role_seq_24` | Legacy agence | Relance page temporaire |

Legacy standard relance reuses H-48 (`h48_confirm`).

## Go-live cutoff

`BOOKING_GO_LIVE_AT` (ISO UTC):

- Agence bookings **before** cutoff → **Agence Legacy** tab (no auto sequence)
- Agence bookings **after** cutoff → auto sequence via webhook + cron

## Architecture

```
Calendly webhook → skip if agence legacy
                 → lun–mer recovery (role_seq_48/24) / jeu–sam full sequence
                 → startSequenceForBookedLead → booking_email_jobs → cron
Streamlit Legacy → /api/booking-communication/send-once (email_type)
Streamlit Séquences → templates Supabase
```

Cron: `GET /api/cron/booking-emails` every 15 min (`CRON_SECRET`).

## Environment

| Variable | Usage |
|----------|-------|
| `CALENDLY_API_TOKEN` | Fetch reservations |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Database |
| `RESEND_API_KEY` | Send test emails |
| `BOOKING_RESEND_FROM` / `RESEND_FROM` | Sender address |
| `CRM_BACKEND_URL` | Next.js backend |
| `BOOKING_GO_LIVE_AT` | Auto vs legacy cutoff |

## Smoke tests

```bash
pnpm smoke-streamlit-booking-resend-schedule
pnpm smoke-booking-legacy
pnpm smoke-booking-email-render
```

## Cross-links

- Link provisioning: `streamlit_links` (Instantly variables)
- Copy: `doc/emails_booking`
- Webhook: `POST /api/webhooks/calendly`
