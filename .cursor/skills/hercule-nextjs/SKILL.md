---
name: hercule-nextjs
description: >-
  Hercule.dev Next.js app — pages, API routes, lib orchestrators, internal admin,
  marketing, sales funnel, client dashboard, CRM, booking communication, Resend,
  Stripe. Use when editing app/, components/, lib/, emails/, content/, or pnpm dev.
---

# Hercule Next.js

Router for the Next.js codebase. Read this first, then the domain sub-skill. **Skills do not override** [doc/tech-stack](../../doc/tech-stack/) decisions.

## Mandatory canon

Before non-trivial changes, follow [doc/README.md](../../doc/README.md) reading order:
`00-decisions` → `02-state-machines` → `03-data-model` → current roadmap step in `13-implementation-roadmap.md`.

## Domain router

| Domain skill | Primary paths | Registry domains | MCP |
|--------------|---------------|------------------|-----|
| [hercule-nextjs-internal](hercule-nextjs-internal/SKILL.md) | `app/internal/**`, `components/internal/**`, `lib/admin/**`, `/api/admin/*` | `dashboard_internal`, `onboarding_funnel` | shadcn, Supabase |
| [hercule-nextjs-marketing](hercule-nextjs-marketing/SKILL.md) | `app/page.tsx`, `app/entreprise`, legal pages, `components/agence/**`, `lib/site/**` | `marketing` | Supabase |
| [hercule-nextjs-sales-funnel](hercule-nextjs-sales-funnel/SKILL.md) | `content/funnels/**`, funnel builder, sales session, `public/reservation*.html` | `sales_funnel` | Calendly, Supabase |
| [hercule-nextjs-dashboard](hercule-nextjs-dashboard/SKILL.md) | `app/dashboard/**`, `app/survey/**`, `components/dashboard/**` | `dashboard_client` | Supabase |
| [hercule-nextjs-crm](hercule-nextjs-crm/SKILL.md) | `lib/link-tracking/**`, `/api/link-tracking/**`, Calendly/Instantly webhooks | `crm` | Instantly, Calendly, Supabase |
| [hercule-nextjs-communication](hercule-nextjs-communication/SKILL.md) | `lib/booking-communication/**`, `lib/instantly-bypass/**`, `emails/**`, `/api/cron/**` | `communication` | Resend, Instantly, Supabase |
| [hercule-nextjs-product](hercule-nextjs-product/SKILL.md) | `lib/matching/**`, `lib/deliverance/**`, `lib/payments/**`, Stripe webhook | roadmap NEW | Stripe, Supabase |

## API route quick map

| Prefix | Skill |
|--------|-------|
| `/api/admin/*` | internal (+ product for matching/deliverance) |
| `/api/cron/*` | communication |
| `/api/webhooks/*` | crm + communication + product |
| `/api/booking-communication/*` | communication |
| `/api/link-tracking/*` | crm |
| `/api/dashboard/*`, `/api/survey/*` | dashboard |
| `/api/payments/*` | product |
| `/api/calendly/*` | sales-funnel |

## Cross-stack

- Streamlit ops: [hercule-streamlit](../hercule-streamlit/SKILL.md)
- Component registry UI: `/internal/components`
- Database registry UI: `/internal/database`
- Live registry: [lib/admin/architecture/components-registry.ts](../../lib/admin/architecture/components-registry.ts)

## Shared conventions

- **Internal security:** no app-level auth on `/internal` — deployment restriction only
- **Marketing vs internal:** marketing keeps inline `#09090B`; internal uses semantic tokens (`.internal`)
- **Jobs:** `CRON_SECRET` on all `/api/cron/*`; webhooks verify provider signatures
- **Orchestrator pattern:** webhook → job table → cron (no Inngest/n8n)
- **Planned not built:** `/onboarding/*`, `/suivi/*` — do not implement ahead of roadmap step

## Do not

- Use personal `scrapping` or `smartlead` skills
- Double-send Instantly from Next + Streamlit (LEG-02)
- Rewrite `public/reservation*.html` to Next before parity (SUR-02)
- Add admin login to `/internal`
