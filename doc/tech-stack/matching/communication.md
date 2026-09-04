# Matching — Communication (emails Resend)

> Module : [Matching](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Front interne](./front-interne.md)  
> Contexte : [Profile JSON](../02-profile-json.md)

---

## 1. Intro (langage simple)

3 emails clés dans ce module :

1. **Entreprise** — « Nous vous avons trouvé une agence » + lien Calendly Hercule
2. **Entreprise + Agence** — « Votre rendez-vous est confirmé » (après webhook)
3. Variables depuis `profile.form` (besoin, spécialités…)

---

## 2. Architecture développée (pour IA de coding)

### Jobs

| email_type | Trigger | Destinataire |
|------------|---------|--------------|
| `match_proposal_entreprise` | admin link | entreprise |
| `match_booking_confirm_entreprise` | webhook Calendly book | entreprise |
| `match_booking_confirm_agence` | webhook Calendly book | agence |

### Template `match_proposal_entreprise`

Variables :
- `profile.form.besoin`
- `agence.company` (from matched row)
- `calendlyUrl` = `{TRACKING_BASE_URL_ENTREPRISE}/{entreprise.link}` ([`doc/crm-deployment.md`](../../crm-deployment.md))

### Orchestrateur

`startMatchProposalSequence()` on link  
`startMatchBookingConfirmSequence()` on webhook — réutiliser pattern [`orchestrator.ts`](../../../lib/booking-communication/orchestrator.ts)

Cancel deliverance pending jobs on link.

---

## 3. Prompt d'action IA

```
Emails matching (doc/tech-stack/matching/communication.md).

- match_proposal_entreprise avec calendlyUrl + profile.form vars
- match_booking_confirm_* on webhook invitee.created
- cancelDeliveranceFollowUps on link

Réutiliser : orchestrator.ts, doc/crm-deployment.md (tracking URLs), crm/booking_templates.py (ton)

Tests : proposal email contient Calendly link ; confirm emails after webhook
```
