---
name: hercule-nextjs-sales-funnel
description: >-
  Hercule.dev sales funnel builder and live client session. Use when editing
  funnel.json, funnel editor, sales session, content/funnels, reservation HTML,
  Calendly availability, or sales funnel settings.
---

# Next.js Sales Funnel

Sales funnel CMS + live client session. Canon: [doc/tech-stack/modules/cms-funnels.md](../../doc/tech-stack/modules/cms-funnels.md).

## Two distinct flows

### 1. Funnel builder (admin edition)

- Editor: `components/internal/funnels/builder/funnel-editor.tsx`
- Content FS: `content/funnels/{audience}/**`
- Publish: `POST /api/admin/funnels/[slug]/publish`
- CRUD: `/api/admin/funnels/*`, `/api/admin/funnels/catalog`
- Presets: `content/funnels/_system/presets-catalog.json`, `layouts-catalog.json`

### 2. Live sales session (client-facing, in-meeting)

**Separate from workspace catch-all.** Human reference: [components/internal/funnels/sales/README.md](../../components/internal/funnels/sales/README.md).

| Item | Value |
|------|-------|
| Route | `/internal/funnels/{audience}/sales/funnel` |
| Layout | `app/internal/funnels/[audience]/sales/funnel/layout.tsx` |
| Entry | Hub Session → **Ouvrir la session** (not in admin nav) |
| Shell | `sales-funnel-module.tsx`, `sales-funnel-sidebar.tsx` |
| Steps config | `sales-funnel-sections.ts` |

**Do not** wire live session via `leaf-content` or workspace `[[...path]]`.

## Session settings

- `content/funnels/agence/sales/session-settings.json`
- `content/funnels/entreprise/sales/session-settings.json`
- API: `/api/admin/sales-session-settings/[audience]`

## Public Calendly embeds (vente family)

Per SUR-02: **keep as HTML**, do not rewrite to Next before parity.

| File | Audience |
|------|----------|
| `public/reservation.html` | Agence vente |
| `public/reservation-entreprise.html` | Entreprise vente |

Slug tracking via `utm_content`. Separate from delivery/match Calendly event types.

## Calendly availability

- API: `/api/calendly/availability`
- Lib: `lib/calendly/availability.test.ts`, `lib/calendly/org.ts`

## Related editors (filesystem)

| Editor | API |
|--------|-----|
| FAQ | `/api/admin/faq/[audience]` |
| Pricing | `/api/admin/pricing/[audience]` |
| Legal | `/api/admin/legal/[audience]/[docType]` |

## Test session (developer mode)

On **Rendez-vous** step: **Test** button provisions `seed-sales-session` lead — see sales README.

## MCP

- **Calendly** — availability, event types
- **Supabase** — sales calls, qualification data

## Cross-links

- Internal admin shell → [hercule-nextjs-internal](hercule-nextjs-internal/SKILL.md)
- Client dashboard after sale → [hercule-nextjs-dashboard](hercule-nextjs-dashboard/SKILL.md)
