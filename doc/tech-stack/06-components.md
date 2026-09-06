# 06 — Registre composants

```
status: canonical
audience: coding-agent
depends_on: 01-product.md, 09-surfaces.md
decisions: COMP-01 COMP-02 UI-01 ENG-11 ENG-17 ADM-01
do_not:
  - Inventer un type de bloc funnel depuis l’UI
  - Second design system
  - HTML brut button/input/select/table/dialog dans Next (shadcn)
```

Rôle : `recipient` · `trigger` · `edition`.  
Domaine : `marketing` · `sales` · `onboarding` · `delivery` · `internal` · `ops-streamlit`.

`/internal/components` reflète cette liste.

---

## Live

| ID | Surface | Domaine | Rôle |
|----|---------|---------|------|
| mkt-home | `/` | marketing | recipient + trigger |
| mkt-entreprise | `/entreprise` | marketing | recipient |
| mkt-faq | `/faq` | marketing | recipient |
| mkt-cvg | `/cvg` | marketing | recipient |
| mkt-legal | légal / a-propos | marketing | recipient |
| sales-res-html | `public/reservation*.html` | sales | trigger Calendly **vente** |
| int-home | `/internal` | internal | recipient |
| int-funnels | `/internal/funnels` | internal | edition (fichiers → CMS étape 10) |
| int-components | `/internal/components` | internal | recipient |
| int-database | `/internal/database` | internal | recipient |
| ui-* | `components/ui/*` | shared | primitives shadcn |

---

## NEW (ordre roadmap)

| ID | Surface | Rôle | Étape |
|----|---------|------|-------|
| int-leads | `/internal/leads` | recipient + trigger | 4 |
| int-lead-detail | `/internal/leads/[id]` | recipient + trigger | 4 |
| int-pay-link | bouton Stripe | trigger | 4–5 |
| int-appointments | `/internal/appointments` | trigger | 4 / 8 |
| int-match | Mettre en lien | trigger | 7 |
| int-templates | emails booking | edition | 10 |
| int-docs | CGV markdown | edition | 4 |
| int-sales | `/internal/sales` | edition | 10 |
| onb-form | `/onboarding/[category]` | trigger | 5 |
| deliv-agence | `/suivi/agence/[slug]` | recipient + no-show | 9 |
| deliv-entreprise | `/suivi/entreprise/[slug]` | recipient | 9 |
| survey | `/survey/[token]` | trigger | 8 |

Writes client : `onb-form`, `survey`, no-show `deliv-agence` uniquement.

Catalogue funnel **fermé** (COMP-02).
