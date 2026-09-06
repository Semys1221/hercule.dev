# 04 — Matrice de transitions

```
status: canonical
audience: coding-agent
depends_on: 02-state-machines.md, 03-data-model.md
decisions: ENG-06 FND-03 FND-04 FND-07 ORCH-01 ORCH-03
do_not:
  - Coder une transition dans un Client Component
  - Enchaîner délivrance sans payments.status=succeeded
```

Toute transition passe par un **service serveur** unique (ex. `lib/product/transitions.ts`). React appelle une route ; la route appelle le service.

Acteurs : `ops` = `/internal` · `client` = slug/token · `stripe` · `calendly` · `system`.

---

## Livraison (`product_statut`)

| from | to | acteur | trigger | side-effects |
|------|-----|--------|---------|--------------|
| `NONE` | `ONBOARDED` | `client` ou `ops` | POST onboarding | email `product_onboarding_received` ; **pas** IN_DELIVERANCE |
| `ONBOARDED` | `IN_DELIVERANCE` | `stripe` ou `ops` | `payments.succeeded` (auto) ou override ops | emails délivrance ; `deliverance_started_at` |
| `IN_DELIVERANCE` | `MATCH_PROPOSED` | `ops` | Mettre en lien | INSERT `matches` ; email Calendly entreprise ; 1 match ouvert / agence |
| `MATCH_PROPOSED` | `MEETING_BOOKED` | `calendly` | webhook invitee.created **event type livraison** | les **deux** rows ; INSERT `appointments` ; email + suivi agence ; −1 crédit |
| `MEETING_BOOKED` | `POST_RDV_SURVEY` | `ops` ou `client` | « RDV fait » | jobs survey |
| `MEETING_BOOKED` | `IN_DELIVERANCE` | `ops` ou `client` | no-show entreprise | recrédit ; job remplacement 14 j |
| `POST_RDV_SURVEY` | `IN_DELIVERANCE` | `client` | survey oui | `matches.outcome=sold` ; CTA optionnel in-page ; email entreprise J+7 |
| `POST_RDV_SURVEY` | `IN_DELIVERANCE` | `client` | survey non, continue | unlink **pas** auto |
| entreprise `POST_RDV_SURVEY` | `ARCHIVED` | `client` | refuse relance | stop emails cette fiche |
| any | `CANCELLED` | `ops` | résiliation | forclose crédits sauf appointments `scheduled` |

**Stop if :** un second `matches` `open` pour la même agence.

---

## Paiement

| from | to | acteur | side-effects |
|------|-----|--------|--------------|
| — | `pending` | `ops` | Stripe Checkout/Payment Link ; n’écrit pas `product_statut` |
| `pending` | `succeeded` | `stripe` | si `ONBOARDED` → `IN_DELIVERANCE` ; cancel nurturing |
| `pending` | `failed` | `stripe` | nurturing continue si `sales_calls.not_paid` |

---

## Sales call

| from | to | acteur | side-effects |
|------|-----|--------|--------------|
| — | `scheduled` | `calendly` vente | CRM `MEETING_BOOKED` **et** row `sales_calls` |
| `scheduled` | `not_paid` | `ops` | enqueue nurturing plein tarif |
| `not_paid` | `paid` | `stripe` | cancel nurturing immédiat |

---

## CRM `lead_statut`

Ne pas reculer `CONFIRMED` vers `NOTBOOKED` depuis un writer produit.
