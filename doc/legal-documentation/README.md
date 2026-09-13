# Legal documentation (source of truth)

Human-editable copy for CGV, pricing grids, FAQ, and booking email sequences — organized by niche.

## Hierarchy

| Layer | Location | Purpose |
|-------|----------|---------|
| Contract (CGV) | `{niche}/cgv.md` | Legal terms, guarantees in prose |
| Marketing pricing | `{niche}/pricing.json` | Public pricing grid UI (`PricingCard`) |
| FAQ | `{niche}/faq.json` | Public FAQ pages |
| Shared legal | `_shared/mentions-legales.md`, `_shared/confidentialite.md` | Global pages |
| Email sequences | `{niche}/sequences/{slug}.md` | Git mirror of Bookings → Séquences (dual-write with Supabase) |
| Checkout amounts | `lib/commercial/constants.ts` | Machine-readable cents / `offer_type` |

Run `pnpm legal:validate` after edits to check alignment between CGV, pricing JSON, and commercial constants.

## Edit workflow

1. **CGV / mentions / confidentialité / FAQ / pricing** — edit files here, commit, deploy.
2. **Booking sequences** — edit in **Bookings → Séquences** (writes Supabase + these `.md` files) or edit `.md` locally then run `pnpm sequences:import` if added later.
3. **Cold outreach E1** — still in Instantly UI (not in this tree).

## Niches

- `agence/` — agences partenaires (buyer)
- `entreprise/` — entreprises (seller)
- `comptable/` — cabinets EC
- `cif/` — conseillers en gestion de patrimoine

Cross-cutting ops docs remain in `doc/tech-stack/` (`cvg_site-sync.md`, `ai-reply-knowledge-*.md`, etc.).
