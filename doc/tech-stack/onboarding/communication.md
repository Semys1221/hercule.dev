# Onboarding — Communication (emails Resend)

> Module : [Onboarding](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Front interne](./front-interne.md)  
> Contexte : [Profile JSON](../02-profile-json.md)

---

## 1. Intro (langage simple)

Email immédiat « On a bien reçu ta demande » avec récap des infos du formulaire (lues depuis `profile.form`).

---

## 2. Architecture développée (pour IA de coding)

### Trigger

Insert onboarding réussi → `startOnboardingSequence()`

### Job

- `email_type = 'onboarding_confirm'`
- `scheduled_for = NOW()`
- Variables render : `profile.form.*`, `profile.display.timeline[0].label`, `suivi_url`

### Pas de config email séparée

Template dans `booking_email_templates` ; personnalisation via **profile**, pas une table comms.

Réutiliser [`lib/booking-communication/orchestrator.ts`](../../../lib/booking-communication/orchestrator.ts).

---

## 3. Prompt d'action IA

```
Email onboarding_confirm (doc/tech-stack/onboarding/communication.md).

- startOnboardingSequence() + job immédiat
- renderEmailFromStore lit profile.form pour variables
- Variants agence / entreprise

Réutiliser : lib/booking-communication/send.ts, template-store.ts

Tests : variables profile.form dans email rendu
```
