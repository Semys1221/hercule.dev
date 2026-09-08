---
name: hercule-nextjs-internal
description: >-
  Hercule.dev internal admin UI and /api/admin routes. Use when editing /internal,
  funnel builder, clients cockpit, onboarding fiche, architecture registry,
  components/internal, or lib/admin.
---

# Next.js Internal Admin

Internal operator UI under `/internal`. Human reference: [app/internal/README.md](../../app/internal/README.md).

## Access policy (critical)

- **No app-level auth** on `/internal` — no login, no `verifyAdminRequest`, no admin session cookies
- Security = deployment (URL non publique, équipe restreinte) + `robots: noindex`
- `/api/admin/*` called without auth from internal UI — still validate all inputs
- **Do not** add middleware protecting `/internal` or `POST /api/admin/session`

## Layout and theme

- `app/internal/layout.tsx` applies `className="internal"`
- Semantic tokens only: `bg-background`, `border-border`, etc. — see [internal-design.mdc](../../rules/internal-design.mdc)
- **UI composition:** read [hercule-ui](../hercule-ui/SKILL.md) for tokens, exemplars, motion rules; shadcn plugin skill for Field/Card/Dialog patterns
- shadcn MCP mandatory for all UI changes

## Navigation

| File | Role |
|------|------|
| `lib/admin/navigation.ts` | Nav tree, breadcrumbs, hub detection |
| `lib/admin/funnels/routing.ts` | Workspace path parsing (hub, leaf, funnel editor, email sequences) |
| `app/internal/(app-shell)/funnels/[audience]/(workspace)/[[...path]]/page.tsx` | Catch-all workspace |

## Key surfaces

| Surface | Path / component |
|---------|------------------|
| Home | `/internal` |
| Clients cockpit | `/internal/clients`, `lib/admin/clients/load-cockpit.ts` |
| Component registry | `/internal/components` — mirrors `components-registry.ts` |
| Database registry | `/internal/database` |
| Funnel builder | `components/internal/funnels/builder/funnel-editor.tsx` |
| Email sequences | `components/internal/funnels/email-sequences-table.tsx` |
| Bookings table | `components/internal/funnels/bookings/` |
| Onboarding fiche | `components/internal/funnels/fiche-form.tsx` |

## Admin APIs (`/api/admin/*`)

| Route group | Purpose |
|-------------|---------|
| `/api/admin/funnels/*` | Funnel CRUD + publish |
| `/api/admin/onboarding/[category]` | Create agence/entreprise row + slug |
| `/api/admin/clients/*` | Cockpit CRUD, timeline, email, statut |
| `/api/admin/bookings/*` | Workflow actions, templates, no-show |
| `/api/admin/faq`, `/pricing`, `/legal` | Filesystem content editors |
| `/api/admin/demandes` | Carousel demandes |
| `/api/admin/instantly-bypass/[campaignId]/templates` | Bypass template API |
| `/api/admin/calendly/bookings` | Booking list for admin |

Product-domain admin routes (matching, deliverance, appointments) → [hercule-nextjs-product](hercule-nextjs-product/SKILL.md).

## Architecture registry

- Source of truth: [lib/admin/architecture/components-registry.ts](../../lib/admin/architecture/components-registry.ts)
- UI: `/internal/components` — keep registry in sync when adding components
- Canon: [doc/tech-stack/06-components.md](../../doc/tech-stack/06-components.md)

## MCP

- **shadcn** — all UI work
- **Supabase** — client data, bookings, templates

## Cross-links

- Sales live session is **not** workspace catch-all → [hercule-nextjs-sales-funnel](hercule-nextjs-sales-funnel/SKILL.md)
- Streamlit tools for heavy ops → [hercule-streamlit](../hercule-streamlit/SKILL.md)
