# Post-RDV — Database

> Module : [Post-RDV](./README.md) · Lignes : [Front client](./front-client.md) · [Front interne](./front-interne.md) · [Communication](./communication.md) · [Agence commercial](./agence-commercial.md)  
> Prérequis : [Matching](../matching/README.md)

---

## 1. Intro (langage simple)

Après le RDV match, chaque partie reçoit un **lien survey tokenisé**.

- **Entreprise** : « Embarqué avec l'agence ? » → SOLD → 1 email J+7 onboarding. **Aucun upsell.**
- **Agence** : « Avez-vous fait la vente ? » → upsell **in-page** 1489€ ou 898€ exclusif → ou nurturing 60j.

Deux logiques **distinctes** — voir [agence-commercial.md](./agence-commercial.md).

---

## 2. Architecture développée (pour IA de coding)

### Triggers

| Event | Action |
|-------|--------|
| Webhook Calendly fin RDV | `POST_RDV_SURVEY` + tokens survey (agence + entreprise) |
| `POST /api/post-rdv/survey` | Update `profile.survey.*` + `profile.offers.*` (agence) |
| Admin payment confirmed | Relance parcours après 1489€ / 898€ |

### POST body différencié

```typescript
// Agence
{ token, sale_made: boolean, offer_choice?: "1489" | "898" | "decline" }

// Entreprise
{ token, embarked: boolean, continue_search?: boolean }
```

### Logique entreprise

```typescript
if (category === "entreprise") {
  if (embarked === true || paymentConfirmed) {
    // both rows SOLD when match complete
    setStatutBoth("SOLD");
    enqueue("entreprise_onboarding_check_j7", addDays(now(), 7));
    // PAS d'autre email commercial
  }
  if (continue_search === true) {
    entreprise → IN_DELIVERANCE, unlink match;
    agence → IN_DELIVERANCE, profile.match.active_rdv = false;
  }
}
```

### Logique agence

```typescript
if (category === "agence") {
  if (sale_made === true) {
    setStatutBoth("SOLD");
    // Upsell 1489 in-page — PAS renewal_agence_1489 email auto
    if (offer_choice === "1489") { /* await admin payment */ }
  }
  if (sale_made === false) {
    if (offer_choice === "898") { /* await admin payment 898 */ }
    if (offer_choice === "decline") {
      profile.offers.discount_898_eligible = false;
      profile.offers.nurturing_started_at = now();
      startAgenceNurturingSequence(leadId);
      // statut peut rester POST_RDV_SURVEY ou IN_DELIVERANCE selon match
    }
  }
}
```

### SOLD (commun)

- Both rows `statut = SOLD` quand mission accomplie (vente agence ou embarquement entreprise)
- `profile.match.active_rdv = false`

### Table survey_tokens

```sql
CREATE TABLE IF NOT EXISTS public.survey_tokens (
  token TEXT PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_category TEXT NOT NULL CHECK (lead_category IN ('agence', 'entreprise')),
  match_id UUID REFERENCES public.matches(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
```

### Admin routes

| Route | Rôle |
|-------|------|
| `POST /api/post-rdv/admin/force-sold` | Paiement offline confirmé |
| `POST /api/post-rdv/admin/payment-confirmed` | 1489€ ou 898€ reçu → ONBOARDED nouveau cycle |

---

## 3. Prompt d'action IA

```
Post-RDV DB — 2 parcours (doc/tech-stack/post-rdv/db.md + agence-commercial.md).

1. POST survey différencié agence vs entreprise
2. Entreprise embarked → SOLD + entreprise_onboarding_check_j7 only
3. Agence sale_made → SOLD + upsell in-page, NO renewal_agence_1489 auto
4. Agence decline → offers + nurturing jobs
5. survey_tokens + enum POST_RDV_SURVEY, SOLD

Réutiliser : lib/link-tracking/book-lead.ts, 02-profile-json.md

Tests :
- entreprise SOLD → 1 job J+7, zero commercial after
- agence decline → nurturing 8 jobs, discount_898_eligible false
- agence sale yes → no renewal email queued
```
