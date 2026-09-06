# Post-RDV — Communication (emails Resend)

> Module : [Post-RDV](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Front interne](./front-interne.md) · [Agence commercial](./agence-commercial.md)  
> Contexte : [Profile JSON](../02-profile-json.md)

---

## 1. Intro (langage simple)

**Entreprise SOLD** : 1 email à J+7 (« onboarding s'est bien passé ? ») — répondre par mail. **C'est tout.**

**Agence** : pas d'email renewal auto à SOLD (upsell in-page). Si elle refuse tout → nurturing 60 jours.

---

## 2. Architecture développée (pour IA de coding)

### Jobs — inchangés (pre-survey)

| email_type | Trigger | Destinataire |
|------------|---------|--------------|
| `post_rdv_survey_entreprise` | fin RDV | entreprise |
| `post_rdv_survey_agence` | fin RDV | agence |

### Jobs — entreprise post-SOLD

| email_type | Offset | Contenu |
|------------|--------|---------|
| `entreprise_onboarding_check_j7` | SOLD +7j | « Votre onboarding s'est bien passé ? » — **répondre à cet email** |

**Supprimé / interdit MVP :**
- `mission_complete_entreprise` commercial
- `renewal_*` entreprise
- Email avis client J+14

### Jobs — agence post-decline (nurturing)

Base : `profile.offers.nurturing_started_at` — voir [agence-commercial.md](./agence-commercial.md)

| email_type | Offset | Contenu |
|------------|--------|---------|
| `nurture_agence_1489_j7` | +7j | Proposition 1 489 € |
| `nurture_agence_conseil_j14` | +14j | Conseil + visite site — **sans prix** |
| `nurture_agence_weekly_1` … `_6` | +21j à +56j | 1/semaine (~60 jours) |

**Supprimé :**
- `renewal_agence_1489` déclenché automatiquement à SOLD
- `mission_complete_agence` si redondant avec upsell in-page — remplacer par félicitations **page only**

### Agence SOLD + vente oui

- **Aucun email renewal auto** — CTA 1 489 € sur page survey uniquement
- Admin confirme paiement → email bienvenue nouveau cycle (optionnel, hors MVP)

### Orchestrateur

```typescript
startPostRdvSurveySequence(matchId);        // post_rdv_survey_*
startEntrepriseSoldSequence(entrepriseId);  // onboarding_check_j7 only
startAgenceNurturingSequence(agenceId);     // après decline
// PAS startRenewalOnSold()
```

Variables render depuis `profile` — pas table comms.

Réutiliser [`lib/booking-communication/orchestrator.ts`](../../../lib/booking-communication/orchestrator.ts).

---

## 3. Prompt d'action IA

```
Emails post-RDV (doc/tech-stack/post-rdv/communication.md).

Entreprise SOLD :
- enqueue entreprise_onboarding_check_j7 at +7d ONLY
- NO commercial emails after

Agence :
- NO renewal_agence_1489 on SOLD
- startAgenceNurturingSequence on offer_choice=decline
- nurture jobs: j7 1489, j14 conseil no price, weekly x6

Keep post_rdv_survey_* unchanged.

Réutiliser : orchestrator.ts, schedule.ts, 02-profile-json.md

Tests :
- entreprise SOLD → exactly 1 future job onboarding_check_j7
- agence decline → 8 nurture jobs, zero renewal_agence_1489
- nurture_agence_conseil_j14 body has no price mention
```
