---
name: hercule-tech-spec
description: >-
  Hercule product/tech canon formerly in doc/tech-stack. State machines, data
  model decisions, commercial constants, legal export paths. Use before non-trivial
  Next.js CRM/payments/matching work. Replaces doc/README.md reading order.
---

# Hercule tech spec (post-`/doc` migration)

**Editorial master (commercial/legal):** Notion [Hercule Canon](https://app.notion.com/p/3e130179aa978187a2d9c4f2bc4733fc)  
**Runtime legal copy:** `content/legal-documentation/`  
**Commercial cents:** `lib/commercial/constants.ts`  
**Canon pricing v3:** DEC Mercantile **1 499 €/mois** (engagement 3 mois) · Hercule Hubris **4 000 €** flat / **1 800 €/mois × 3**  
**Validate:** `pnpm legal:validate` · `pnpm legal:export`

## Verticales canon

| Code | Marketing | Offre v3 | Ops niche key |
|------|-----------|----------|---------------|
| **DEC** | Expert-Comptable / `/comptable` | Hercule Mercantile | `comptable` + ops alias **`jum`** |
| **IAS** | Courtier assurance / `/courtier-assurance` | via **Hercule Hubris** | assurance |
| **CIF** | Conseil financier / `/conseil-financier` | via **Hercule Hubris** | `cif` |

Do **not** treat JUM as a fourth vertical. Keep `jum` as code/DB alias for DEC ops.

IAS and CIF are **not** sold as standalone packs (1 999 €/mois and 3 499 €/90j are obsolete). Use `COMMERCIAL_HERCULE_HUBRIS`.

## Interdits globaux

- Offer **898 €**, pack **5 attributions à 1 489 €** as entry, prix d'entrée **1 500 €**
- Lite **1 799 €**, Starter **2 199 €**, garantie **MRR 3 000 €**
- Standalone **IAS 1 999 €/mois** or **CIF 3 499 €/90j** as active offers
- Promettre RDV régionaux / hors visioconférence nationale
- Garantir signature / MRR / commissions upfront
- Parser CGV markdown au runtime pour les cents — lire `lib/commercial/constants.ts`
- Clerk / n8n / Inngest
- Self-checkout Stripe sur dashboard client
- Matching et RDV vente Hercule sur le **même** événement Calendly
- Une seule colonne `lead_statut` pour clic Instantly + paiement + livraison

## Ordre de lecture agent (remplace doc/README)

1. This skill + Notion Offres / Règles transversales
2. `lib/commercial/constants.ts` + `content/legal-documentation/_shared/cgv.md`
3. Domain sub-skill under `hercule-nextjs*`
4. For CRM: `lib/link-tracking/*`, Instantly/Calendly webhooks
5. State/data: existing migrations under `supabase/migrations/` — do not invent PAID/MEETING_n on `lead_statut`

## Machines d'état (résumé)

Quatre couches distinctes (ne pas fusionner) :

1. **Lead outreach** — Instantly / bypass (`lead_statut` outreach only)
2. **Product** — `product_statut` (ONBOARDED, …)
3. **Payments** — table `payments` + Stripe offer_type
4. **Matches / appointments / sales_calls** — tables dédiées

## CGV website

- Unique page `/cvg` with anchors `#dec` · `#hubris`
- Redirects: `/cvg/comptable` → `#dec`, `/cvg/conseil-financier` → `#hubris`, `/cvg/courtier-assurance` → `#hubris`
- Source: `content/legal-documentation/_shared/cgv.md`

## Export Notion → git

```bash
pnpm legal:export    # asserts content/ mirrors canon v3
pnpm legal:validate  # prices ↔ constants
```

## Legacy

- Agence / entreprise copy: archived under Notion 99 Legacy + `content/legal-documentation/{agence,entreprise}` stubs
- Former `doc/tech-stack/*` removed — this skill + domain skills are the replacement
- `COMMERCIAL_IAS` / `COMMERCIAL_CIF` marked `@deprecated` — prefer `COMMERCIAL_HERCULE_HUBRIS`
