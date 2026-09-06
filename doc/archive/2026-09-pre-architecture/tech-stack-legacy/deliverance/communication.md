# Deliverance — Communication (emails Resend)

> Module : [Deliverance](./README.md) · Lignes : [DB](./db.md) · [Front client](./front-client.md) · [Front interne](./front-interne.md)  
> Contexte : [Profile JSON](../02-profile-json.md) · [Capacity](../capacity/README.md)

---

## 1. Intro (langage simple)

Emails « recherche lancée », « ça avance », etc. Les **dates** viennent de `profile.communication.delays` — pas d'une table comms séparée.

Exemple : rétractation 4j → premier mail « recherche commencée » à J+4, pas J+0.

Si le client est en **file d'attente** (`profile.capacity.queue_status !== "none"`), **ne pas** envoyer `deliverance_search_started` — envoyer un email waitlist (template futur) avec `estimated_activation_at`.

---

## 2. Architecture développée (pour IA de coding)

### Init séquence (post promote)

```typescript
const offset = profile.communication.delays.search_start_offset_days;
if (profile.capacity?.queue_status && profile.capacity.queue_status !== "none") {
  // deliverance_waitlist_notice — scheduled at signature or queue enter
  return;
}
insertJob({ emailType: 'deliverance_search_started', scheduledFor: addDays(startedAt, offset) });
insertJob({ emailType: 'deliverance_d7_update', scheduledFor: addDays(startedAt, 7 + offset) });
```

### Types email

| email_type | Quand |
|------------|-------|
| `deliverance_search_started` | startedAt + search_start_offset_days |
| `deliverance_d7_update` | +7j (+ offset) |
| `deliverance_step_milestone` | ADVANCE_STEP immédiat |

Variables render : `profile.form.*`, `step_label` from `profile.display.timeline[step-1]`

### Cron

Extension `/api/cron/booking-emails` — [`orchestrator.ts`](../../../lib/booking-communication/orchestrator.ts)

---

## 3. Prompt d'action IA

```
Emails deliverance — dates from profile.communication.delays.

- initDeliveranceSequence() après promote
- deliverance_search_started scheduled avec search_start_offset_days
- Templates vars from profile.form + display.timeline

Réutiliser : orchestrator.ts, schedule.ts, cron booking-emails

Tests : retraction 4j → search_started job à +4j ; vars profile dans body email
```
