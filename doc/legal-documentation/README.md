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
3. **Cold outreach (Mail 1+)** — copy live dans Instantly ; git mirror via `pnpm sequences:export` → `{niche}/sequences/cold-email.md`. Distinct de `subsequence-interested.md` (E1→E3 post-webhook interested).

### Export git mirror

```bash
pnpm sequences:export                      # toutes les niches
pnpm sequences:export --niche=comptable,cif # comptable + CIF uniquement
```

Sources : Supabase (`booking_email_templates`, `instantly_bypass_templates`, `ai_reply_agent_config`) + Instantly campaign steps pour `cold-email.md`. Fallback archive comptable : `archive/email_outreach_copy/comptable`.

## Niches

- `agence/` — agences partenaires (buyer)
- `entreprise/` — entreprises (seller)
- `comptable/` — cabinets EC
- `cif/` — conseillers en gestion de patrimoine

### Séquences live — comptable (`comptable/sequences/`)

| Phase | Slug | Provider |
|-------|------|----------|
| Outreach cold | `cold-email` | Instantly |
| Subsequence E1→E3 | `subsequence-interested` | Instantly bypass |
| Reply agent | `reply-agent` | Hybrid (prompt) |
| Confirmation RDV | `meeting-comptable` | Resend |
| No-show | `no-show` | Instantly bypass |
| Non payé | `close-indecis` | Resend |
| Post-paiement | `payment-welcome` | Resend |
| Onboarding production | `onboarding-sequence` | Resend |

### Séquences live — CIF (`cif/sequences/`)

| Phase | Slug | Provider |
|-------|------|----------|
| Outreach cold | `cold-email` | Instantly |
| Subsequence E1→E3 | `subsequence-interested` | Instantly bypass |
| Reply agent | `reply-agent` | Hybrid (prompt) |
| Confirmation RDV | `meeting-cif` | Resend |
| No-show | `no-show` | Instantly bypass |
| Post-paiement | `payment-welcome` | Resend |
| Onboarding production | `onboarding-sequence` | Resend |

Cross-cutting ops docs remain in `doc/tech-stack/` (`cvg_site-sync.md`, `ai-reply-knowledge-*.md`, etc.).
