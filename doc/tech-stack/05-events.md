# 05 — Événements métier

```
status: canonical
audience: coding-agent
depends_on: 04-transitions.md, 10-emails.md
decisions: SOT-01 ORCH-01 EML-01
do_not:
  - Traiter invitee.created vente comme un book livraison
  - Émettre product_statut depuis Instantly
```

Chaque événement a **un** writer. Les jobs email sont des *conséquences*, pas la vérité.

| ID | Émetteur | Écrit | Jobs |
|----|----------|-------|------|
| `lead.clicked` | link-tracking | `statut=CLICKED` | — |
| `sales.booked` | webhook Calendly **vente** | `statut=MEETING_BOOKED`, `sales_calls.scheduled` | famille vente existante |
| `sales.marked_not_paid` | ops | `sales_calls.not_paid` | nurturing plein tarif |
| `onboarding.submitted` | POST onboarding | `product_statut=ONBOARDED`, `profile.form` | `product_onboarding_received` |
| `payment.succeeded` | webhook Stripe | `payments.succeeded` | cancel nurture ; auto IN_DELIVERANCE |
| `deliverance.started` | transition | `IN_DELIVERANCE` | emails timeline produit |
| `match.opened` | ops | `matches.open` | `product_match_proposal` |
| `delivery.booked` | webhook Calendly **livraison** | `appointments.scheduled`, les deux `MEETING_BOOKED` | `product_meeting_booked_agence` |
| `delivery.completed` | ops/client | `appointments.completed`, `POST_RDV_SURVEY` | `product_survey_invite` |
| `delivery.no_show_entreprise` | ops/client | recrédit | remplacement 14 j |
| `survey.sold` | token | `matches.outcome=sold` | `product_entreprise_j7` à J+7 |
| `survey.continue` | token | retour IN_DELIVERANCE | — |
| `entreprise.archived` | token/ops | `ARCHIVED` | cancel jobs cette fiche |
| `timeline.advanced` / `timeline.delayed` | ops | dates profile + jobs | reschedule jobs |

Idempotence : clé naturelle = `stripe_event_id`, `calendly_invitee_uri`, `idempotency_key` jobs.
