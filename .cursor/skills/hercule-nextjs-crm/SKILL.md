---
name: hercule-nextjs-crm
description: >-
  Hercule.dev CRM link tracking and inbound webhooks. Use when editing link-tracking,
  slug provisioning, Calendly webhook, Instantly interested webhook, click tracking,
  or lib/link-tracking.
---

# Next.js CRM

Link tracking + inbound webhooks for lead lifecycle. Human reference: [app/crm/doc.md](../../app/crm/doc.md).

## Link tracking lib

| File | Role |
|------|------|
| `lib/link-tracking/supabase.ts` | Agence/entreprise row access |
| `lib/link-tracking/book-lead.ts` | Book lead on Calendly event |
| `lib/link-tracking/instantly.ts` | Instantly PATCH for custom variables |
| `lib/link-tracking/provision-role-recovery-lead.ts` | Role recovery provisioning |
| `lib/link-tracking/types.ts` | Shared types |

## API routes

| Route | Purpose |
|-------|---------|
| `POST /api/link-tracking/click` | Record click → `CLICKED` statut |
| `POST /api/link-tracking/confirm` | Email confirmation page backend |
| `POST /api/link-tracking/sync-status` | Sync statut from Streamlit/Instantly |
| `GET /api/link-tracking/calendly-links` | Resolve Calendly URLs for slug |

## Webhooks

| Route | Trigger | Skill overlap |
|-------|---------|---------------|
| `POST /api/webhooks/calendly` | `invitee.created` | Starts booking sequence → communication |
| `POST /api/webhooks/instantly` | `lead_interested` | Bypass E1 scheduling → communication |
| `POST /api/webhooks/supabase-link-tracking` | DB changes | Sync side effects |

## Instantly custom variables

Provisioned via Streamlit links (not Next):

- `{{reservation_agence_link}}` → `/reservation.html/{slug}`
- `{{reservation_entreprise_link}}` → `/reservation-entreprise.html/{slug}`
- `{{confirmation_agence_link}}` → `/confirm-reservation.html/{slug}?email=`
- `statut`

Wipe legacy `{{link}}` / `{{confirm_link}}` on provision.

## Public HTML (CRM-adjacent)

| File | Role |
|------|------|
| `public/confirm-reservation.html` | Presence confirmation |
| `public/reservation.html` | Calendly embed (sales-funnel owns vente family) |

## Calendly lib (read-only for admin)

- `lib/calendly/list-bookings.ts`, `fetch-enriched-bookings.ts`
- `lib/calendly/booking-row-actions.ts` — admin UI actions
- Not orchestration — that lives in communication skill

## MCP

- **Instantly** — lead status, custom variables
- **Calendly** — webhook payload, event types
- **Supabase** — `agence`, `entreprise` tables

## Cross-links

- Provision leads: [hercule-streamlit-links](../hercule-streamlit-links/SKILL.md)
- Booking emails after Calendly: [hercule-nextjs-communication](hercule-nextjs-communication/SKILL.md)

## Do not

- Double-send Instantly from Next + Streamlit (LEG-02)
- Re-provision Instantly variables from Next when Streamlit links tool exists
