---
name: hercule-nextjs-marketing
description: >-
  Hercule.dev public marketing pages and site content. Use when editing landing
  agence/entreprise, FAQ, CGV, legal pages, components/agence, components/entreprise,
  lib/site, or agence_demandes carousel.
---

# Next.js Marketing

Public marketing surfaces. Canon: [doc/tech-stack/09-surfaces.md](../../doc/tech-stack/09-surfaces.md).

## Pages

| Route | File |
|-------|------|
| `/` | `app/page.tsx` |
| `/entreprise` | `app/entreprise/page.tsx` |
| `/faq` | `app/faq/page.tsx` |
| `/cvg` | `app/cvg/page.tsx` |
| `/a-propos` | `app/a-propos/page.tsx` |
| `/mentions-legales` | `app/mentions-legales/page.tsx` |
| `/confidentialite` | `app/confidentialite/page.tsx` |

## Components

| Dir | Purpose |
|-----|---------|
| `components/agence/*` | Landing agence sections (scene, audit, CRM preview, carousel) |
| `components/entreprise/*` | Landing entreprise |
| `components/site/*` | Shared markdown document renderer |
| `components/demandes/*` | Carousel flip cards (`demande-flip-card.tsx`) |

## Content libs

| File | Purpose |
|------|------|
| `lib/site/faq.ts`, `lib/site/faq-server.ts` | FAQ data |
| `lib/site/legal-content.ts`, `lib/site/legal-server.ts` | CGV, mentions, confidentialité |
| `lib/site/pricing.ts`, `lib/site/pricing-server.ts` | Pricing display |
| `lib/site/cvg-content.ts` | CGV page content |
| `lib/site/agence-faq.ts` | Agence-specific FAQ |

## Carousel demandes

- Display: `components/agence/bande-projets.tsx` reads `agence_demandes` (visible rows)
- Admin edit: `/api/admin/demandes` or Streamlit `pnpm streamlit-demands`

## Styling rules

- Marketing keeps **inline `#09090B`** and existing agence/entreprise styles
- **Do not** refactor marketing to internal `.internal` tokens
- **UI polish:** read [hercule-ui](../hercule-ui/SKILL.md) — Magic UI (`@magicui` via shadcn MCP) and framer-motion for marketing only
- shadcn still applies where components use `components/ui/*`

## MCP

- **Supabase** — `agence_demandes` reads/writes

## Do not

- Unify marketing Calendly pages with match/delivery event types (SUR-01)
- Implement `/onboarding/*` or `/suivi/*` ahead of roadmap step
