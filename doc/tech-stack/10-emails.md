# 10 — Emails (deux familles, un moteur)

```
status: canonical
audience: coding-agent
depends_on: 05-events.md, constants-commercial.md
decisions: EML-01 EML-02 EML-03 EML-04 EML-05 ORCH-02 ORCH-03 ENG-01 ENG-02 ENG-16
do_not:
  - Resend depuis Streamlit pour du travail nouveau
  - Nurturing à prix cassé / 898
  - Email auto « rachète 1489 » à SOLD
  - Upsell entreprise
  - Contredire les délais CGV
```

Moteur : `booking_email_jobs` + `booking_email_templates` + cron. Pas de table `communications`.

Catalogue UI : [`lib/admin/email-sequences/registry.ts`](../lib/admin/email-sequences/registry.ts) (19 séquences).

---

## Famille VENTE (live)

Types : `immediate`, `h48_confirm`, `h24_relance`, `h20_cancel`, `role_seq_48`, `role_seq_24`.  
Déclencheur : Calendly **vente**. Délais **en code**.  
SoT copy : `booking_email_templates` + défauts [`lib/booking-communication/templates.ts`](../lib/booking-communication/templates.ts).

Copy Instantly outreach : Instantly UI + `archive/email_outreach_copy/` (EML-04).  
Subsequence interested E1–E3 : `instantly_bypass_templates` (Instantly reply-to-thread).

---

## Famille PRODUIT / CLOSE (built — Resend)

Tous les types ci-dessous passent par `booking_email_jobs` + `booking_email_templates` (EML-01).  
Déclencheurs dans [`lib/booking-communication/types.ts`](../lib/booking-communication/types.ts) (`SequenceTriggeredBy`).

| Séquence (registry slug) | email_type | Quand | Stop |
|--------------------------|------------|-------|------|
| `payment-welcome` | `product_payment_welcome` | Stripe `checkout.session.completed` | — |
| `calendly-seat-onboarding` | `product_calendly_welcome`, `product_calendly_reminder` | Onboarding complete ; relance +24h | invitation acceptée |
| `upsell` | `upsell_email_1`, `_2`, `_3` | `sales_call_completed` | paiement |
| `close-indecis` | `close_indecis_1`, `_2`, `_3` | `sales_call_not_paid` | paiement |
| `sales-call-no-show` | `no_show_indecis_1`, `_2`, `_3` | `sales_call_no_show` | reprise parcours |
| `onboarding-sequence` | `onboarding_j0`, `j0_bis`, `j1`, `onboarding_reminder_m10/m5/p5` | `onboarding_complete` (+ cron rappels) | — |
| `deliverance` | `deliverance_search_started`, `d7_update`, `milestone`, `waitlist` | promote / ADVANCE / queue | delay admin |
| `matching-proposal` | `match_proposal`, `match_proposal_followup` | admin match | match cancelled |
| `matching-booking` | `match_booking_agence` | webhook Calendly book | — |
| `post-rdv-survey` | `survey_rdv_entreprise*`, `survey_rdv_agence*` | cron fin RDV | survey submitted |
| `entreprise-sold-check` | `sold_check_j7` | SOLD +7j (`cron_sold_check`) | un seul ; wording CPY-02 |
| `notification-payment` | `payment_notification_client` | Stripe notification | — |

### Nurturing long (non implémenté)

L'arc `nurture_agence_1489_j7`, `nurture_agence_conseil_j14`, `nurture_agence_weekly_1…6` (~8 emails / 60 j) **n'est pas dans le code**.  
Remplacé au MVP par :

- **`upsell`** (3 emails, appel concluant → `completed`)
- **`close-indecis`** (3 emails, `not_paid`)

Prix nurturing / upsell : **1 489 € / mois** ou **989 € × 3 = 2 967 €** (15 Attributions). Pas d'étape 898.

---

## Instantly bypass (built)

| Séquence | template_key | Exécution |
|----------|--------------|-----------|
| `subsequence-interested` | `interested_email1/2/3` | Webhook + Next `send-flow.ts` |
| `no-show` | `no_show_email1/2` + réutilise `interested_email3` | Streamlit subsequence (ops) |

SoT copy : `instantly_bypass_templates` par campagne.

---

## Tests & garde-fous copy

- Sujets/corps **sans** `898`, `4 jours` de rétractation, `1500 €` d'entrée, `MEETING_10` (voir `constants-commercial.md`).
- Audit live : `pnpm audit-email-templates` → `scripts/audit/email-template-audit-report.json`.
- Render produit : `pnpm smoke-product-email-render`.
- Stale copy entreprise : `pnpm test-booking-email-resolve`.
