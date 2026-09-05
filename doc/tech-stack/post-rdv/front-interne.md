# Post-RDV — Front interne (Streamlit)

> Module : [Post-RDV](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Communication](./communication.md) · [Agence commercial](./agence-commercial.md)

---

## 1. Intro (langage simple)

Tu vois les matchs en attente de survey, les offres agence (898€ encore éligible ou non), et le statut nurturing.

Tu peux **forcer SOLD** ou confirmer un **paiement 1489€ / 898€** reçu offline.

---

## 2. Architecture développée (pour IA de coding)

### Panel Post-RDV

Filtres : `POST_RDV_SURVEY`, `SOLD`, agences en nurturing

Colonnes :
- match_id, agence, entreprise
- `profile.survey.sale_made` / `profile.survey.embarked`
- `profile.offers.discount_898_eligible`
- `profile.offers.nurturing_started_at`
- Jobs nurturing pending (count)

### Boutons admin

| Bouton | API |
|--------|-----|
| Forcer SOLD | `POST /api/post-rdv/admin/force-sold` |
| Paiement 1489€ confirmé | `POST /api/post-rdv/admin/payment-confirmed` `{ amount: 1489 }` |
| Paiement 898€ confirmé | `POST /api/post-rdv/admin/payment-confirmed` `{ amount: 898 }` |
| Renvoyer survey | `POST /api/post-rdv/admin/resend-survey` |
| Continuer recherche (entreprise) | `POST /api/post-rdv/admin/continue-search` |

Paiement confirmé → `statut = ONBOARDED` (nouveau cycle) + cancel nurture jobs pending.

Via [`crm/crm_api.py`](../../../crm/crm_api.py) `post_json`.

---

## 3. Prompt d'action IA

```
Panel Post-RDV Streamlit (doc/tech-stack/post-rdv/front-interne.md).

- Colonnes profile.survey.*, profile.offers.*
- Boutons force-sold, payment-confirmed 1489/898, resend-survey
- payment-confirmed → ONBOARDED + cancel nurture jobs

Réutiliser : app/streamlit_links/app.py, crm/crm_api.py

Tests :
- payment 898 → ONBOARDED, nurture jobs cancelled
- preview discount_898_eligible=false after decline
```
