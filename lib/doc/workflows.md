# Workflows

Parcours prospect à travers l'engine. Les modules optionnels sont des **branches**, pas des forks du core.

---

## 1. Workflow global (core obligatoire)

```
[SCRAPING]
  Outscraper → leads bruts → Instantly list
       ↓
[CLEANING]
  MyEmailVerifier → emails valides → campagne Instantly
       ↓
[PROVISIONING]
  Insert lead + slug
  PATCH Instantly: reservation link (Calendly event type du client routé) + statut
       ↓
[SENDING]
  Cold sequence Instantly
       ↓ (lead_interested)
  Bypass E1 → E2 → E3 (Unibox)  [+ AI reply si inbound]
       ↓ (clic CTA)
[BOOKING]
  Page Calendly (org Hercule) → invitee.created
  lead_statut = MEETING_BOOKED
  RDV dans agenda du client destinataire
       ↓
[PRÉ-VENTE]  (automatique, sans humain)
  Page présentation OU wizard (config niche)
  Enrichissement profile
       ↓
  ─── FIN DU CORE ───
```

Une niche **ne peut pas** s'arrêter avant Pré-vente.

---

## 2. Branches optionnelles

Après Pré-vente, la niche active indépendamment :

```
                    ┌─ [POST-BOOKING ON] ── rappels Resend (immediate, H-48, H-24, H-20…)
PRÉ-VENTE ─────────┼─ [POST-PAYMENT ON] ── paiement (Stripe ou signal) → onboarding
                    └─ [NURTURING ON] ───── conditions (acheté / non / no-show / J+n)
```

Règle : un module ultérieur peut être ON même si un intermédiaire optionnel est OFF.

Exemple valide :

| Module | État |
|--------|------|
| Post-booking | OFF |
| Post-payment | OFF |
| Nurturing | ON |

---

## 3. Workflow Sending détaillé

```
Instantly cold send
       ↓
lead_interested webhook
       ↓
Campaign initialized? ──no──→ skip
       ↓ yes
Place pipeline step_0
Schedule E1 (+2 min si auto-send)
       ↓
E1 sent → step_1
  (lien Calendly dans le body)
       ↓
No reply / delay → E2 → step_2
       ↓
E3 → step_3 → Not Interested Instantly (valeur métier)
       ↓
Si reply inbound → AI reply agent OU replies_to_handle
```

**EXISTANT** : `lib/legacy/instantly-bypass/`, crons bypass-jobs / bypass-pipeline.

---

## 4. Workflow Booking + Post-booking

```
Clic reservation_*_link
       ↓
CLICKED (optionnel, link-tracking/click)
       ↓
Calendly book (event type client)
       ↓
invitee.created
       ↓
book-lead → MEETING_BOOKED
       ↓
Post-booking ON?
  ├─ yes → enqueue immediate / h48 / h24 / h20
  │         confirm → CONFIRMED, cancel h24
  │         no confirm → h20 cancel → CANCELLED
  └─ no  → pas de jobs Resend booking
       ↓
Pré-vente page (toujours)
```

**Cancel Calendly** (`invitee.canceled`) :

```
MEETING_BOOKED → NOTBOOKED (ou CANCELLED selon impl)
Cancel pending booking_email_jobs
Sync Instantly statut
```

**No-show** (pas de webhook fiable) :

```
Admin ou client signale no-show
  → sales_call / appointment status
  → si Nurturing ON : no-show sequence
```

---

## 5. Workflow Post-payment

```
Trigger paiement
  ├─ Stripe checkout.session.completed (EXISTANT)
  └─ Signal externe « prospect a payé le client » (À DÉCIDER)
       ↓
Module Post-payment ON?
  ├─ no → stop (paiement peut quand même être loggé ailleurs)
  └─ yes
       ↓
Upsert payments
Transition états product / CRM
Emails onboarding (J0, J1, reminders…)
Calendly seat invite SI client Hercule (EXISTANT agence pattern)
Import CRM Hercule SI destinataire = Hercule (À CONSTRUIRE)
Cancel nurturing conflictuel (close-indecis, etc.)
```

---

## 6. Workflow Nurturing

```
Event (time / status / admin)
       ↓
Nurturing ON + condition match?
  ├─ Prospect n'a pas acheté après RDV
  ├─ Prospect a acheté (upsell / free-trial-started)
  ├─ No-show
  ├─ Échéance J+30 / J+n (À DÉCIDER timing source)
  └─ Réactivation cooloff (SaaS pool)
       ↓
Enqueue sequence emails
Stop on: opt-out, paid, lost, admin stop-all
```

---

## 7. Workflow multi-client (routing)

```
Provisioning time (ou assignation pool)
       ↓
Niche a N clients actifs?
  ├─ 1 client → injecter son calendly_scheduling_url / event type
  └─ N clients → pool router / round-robin / quotas
                 (EXISTANT partiel: client_outreach_slots + pool-router cron)
       ↓
Lead assignment tracée (lead_assignments)
       ↓
Booking tombe dans le calendrier de CE client
```

Détail : [`routing.md`](./routing.md).

---

## 8. Workflow CRM Hercule (hors engine)

```
Prospect booke un event tenu par Hercule
  → RDV commercial Hercule
  → paiement Hercule (Stripe)
  → INSERT/UPSERT table clients (À CONSTRUIRE)
  → pipeline interne (onboarding, deliverance…)

L'engine continue pour d'autres niches / clients sans référence à ce CRM.
```

---

## 9. Cas limites

| Cas | Comportement attendu |
|-----|----------------------|
| Booking sans slug | Role recovery / form untracked (EXISTANT legacy) |
| Double E1 | e1-thread-guard skip |
| Double Stripe webhook | Idempotence session ID |
| Niche PB OFF, cancel RDV | Pas d'emails Resend ; statut lead quand même maj |
| Nur ON après achat + PP ON | PP démarre onboarding ; Nur upsell seulement si config le dit |
| Client churned | capacity_status paused/churned → plus d'assignations |

---

## 10. Séparation Business / Workflow / Tool / DB

| Couche | Exemple |
|--------|---------|
| Business logic | « Ce prospect va chez le client B car quota » |
| Workflow | Trigger book → Condition PB ON → Action enqueue h48 → State CONFIRMED |
| Tool | Calendly, Instantly, Resend, Stripe |
| Database | Persistance `lead_statut`, jobs, payments — pas le moteur métier |
