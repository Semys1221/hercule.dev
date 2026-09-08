---
name: hercule-streamlit-links
description: >-
  Hercule.dev link tracking and Instantly provisioning CRM (app/streamlit_links).
  Use when editing streamlit_links, reservation links, Instantly custom variables,
  agence leads provisioning, Unibox import, or pnpm streamlit-links.
---

# Streamlit Links

Link tracking CRM — leads, Instantly provisioning, Unibox import. Human reference: [app/streamlit_links/README.md](../../app/streamlit_links/README.md).

## Quick start

```bash
pnpm streamlit-links
```

Requires Next.js for status/sequence APIs (`CRM_BACKEND_URL` or `NEXT_PUBLIC_APP_URL`, default `http://localhost:3000`).

Use MCP `user-instantly` for campaign PATCH; `plugin-supabase-supabase` for `agence` table.

## Tabs

| Tab | Purpose |
|-----|---------|
| **Leads** | List + refresh; change statut; MEETING_BOOKED triggers Resend choice |
| **Ajouter** | Manual lead form; duplicate email rejected |
| **Unibox Instantly** | Import replies (skip duplicates) |
| **Provisioning** | Instantly campaign REPLACE of tracking variables |

## Instantly variable REPLACE

Provision these (wipes legacy `{{link}}` / `{{confirm_link}}`):

- `{{reservation_agence_link}}` → `/reservation.html/{slug}`
- `{{reservation_entreprise_link}}` → `/reservation-entreprise.html/{slug}`
- `{{confirmation_agence_link}}` → `/confirm-reservation.html/{slug}?email=`
- `{{post_booking_link}}` → `/post-booking-entreprise.html/{slug}?email=` (entreprise only)
- `statut`

Update Instantly sequence copy to new variable names after provision.

## Partial provision recovery

Large batches commit per chunk (50–100 rows). If Supabase disconnects mid-run:

1. Restart Streamlit (`pnpm streamlit-links`)
2. Re-select same campaign leads → **Provision / re-sync**
3. If Supabase keeps failing → **Instantly only (re-sync)** on visible leads

Tune via env: `SUPABASE_INSERT_BATCH_SIZE` (default 100, auto 50 when >1000), `SUPABASE_BATCH_MAX_RETRIES` (default 4).

## Tracking URLs (Supabase)

- `slug` — 6-char token
- Full links stored in `reservation_agence_link`, `reservation_entreprise_link`, `confirmation_agence_link`, `post_booking_link` (entreprise)

## Cross-links

- Booking sequences: `app/streamlit_booking_resend/` (dedicated Resend tool)
- Copy reference: `doc/emails_booking`
- Subsequence templates use `{{reservation_agence_link}}`

## Do not

- Use `streamlit_links` for Calendly booking observation — use `streamlit_booking_resend`
