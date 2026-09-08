---
name: hercule-nextjs-dashboard
description: >-
  Hercule.dev client dashboard and post-RDV survey. Use when editing /dashboard,
  /survey, components/dashboard, onboarding steps, no-show dialog, or
  /api/dashboard routes.
---

# Next.js Client Dashboard

Client-facing surfaces without login — auth via slug or survey token.

## Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/[slug]` | Client onboarding + delivery tracking |
| `/survey/[token]` | Post-RDV survey |

Layouts: `app/dashboard/layout.tsx`

## Components

| Component | Role |
|-----------|------|
| `components/dashboard/onboarding-form-modal.tsx` | Onboarding form |
| `components/dashboard/onboarding-form-fields.tsx` | Form fields |
| `components/dashboard/steps/*` | Step screens (FAQ, pricing, screen-share) |
| `components/dashboard/noshow-dialog.tsx` | No-show reporting |
| `components/dashboard/rdv-status-card.tsx` | RDV status display |
| `components/dashboard/delivery-details-card.tsx` | Delivery info |
| `components/dashboard/brand-header.tsx` | Header |

## APIs

| Route | Purpose |
|-------|---------|
| `GET/PATCH /api/dashboard/[slug]` | Dashboard state |
| `POST /api/dashboard/[slug]/noshow` | Client reports no-show |
| `POST /api/dashboard/[slug]/dev-skip-payment` | Dev-only payment skip |
| `GET/POST /api/survey/[token]` | Survey fetch + submit |

## Auth model

- **No client login** — slug in URL identifies agence/entreprise row
- Survey uses one-time token in URL
- Validate slug/token server-side on every API call

## State machines

Follow [doc/tech-stack/02-state-machines.md](../../doc/tech-stack/02-state-machines.md) — 4 state layers (do not unify into single `lead_statut`).

## Developer mode

- Enabled via sales test session — see [hercule-nextjs-sales-funnel](hercule-nextjs-sales-funnel/SKILL.md)
- `lib/dashboard/developer-mode.ts`, `lib/dashboard/resolve-preview-form.ts`

## Lib

- `lib/dashboard/copy.ts` — client-facing copy
- `lib/product/transitions.ts` — product state transitions

## MCP

- **Supabase** — agence/entreprise rows, survey tokens, appointments

## Planned (not built)

`/suivi/agence/[slug]`, `/suivi/entreprise/[slug]` — do not implement ahead of roadmap step 9.

## Cross-links

- Booking sequences → [hercule-nextjs-communication](hercule-nextjs-communication/SKILL.md)
- Matching/deliverance → [hercule-nextjs-product](hercule-nextjs-product/SKILL.md)
