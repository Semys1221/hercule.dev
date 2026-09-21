# Events

Format canonique :

```
Event → Trigger → Condition → Action → New state → Next module
```

Seuls les événements **trouvés dans le repo** ou **nécessaires au modèle** sont listés. Hypothèses marquées **À DÉCIDER**.

---

## 1. Outreach / Instantly

### E1 — `lead_interested`

| | |
|--|--|
| **Trigger** | Webhook Instantly → `POST /api/webhooks/instantly` |
| **Condition** | Campaign in `instantly_bypass_config`, auto-send enabled, not paused |
| **Action** | Place `step_0`, schedule E1 (~2 min), send Unibox reply |
| **New state** | Pipeline `step_1` après send ; event row `instantly_bypass_events` |
| **Next** | Sending (E2/E3) ou Booking (clic lien) |
| **Statut** | EXISTANT |

### E2 — Instantly reply (inbound)

| | |
|--|--|
| **Trigger** | `POST /api/webhooks/instantly/reply` |
| **Condition** | AI reply config active, not blocklisted, not unsafe/OOO |
| **Action** | Enqueue `ai_reply_agent_jobs` ou auto-reply |
| **New state** | `ai_reply_agent_messages.ai_status` |
| **Next** | Sending / Booking |
| **Statut** | EXISTANT |

### E3 — Bypass job due

| | |
|--|--|
| **Trigger** | Cron `GET /api/cron/instantly-bypass-jobs` |
| **Condition** | `instantly_bypass_jobs.status=pending` && `scheduled_for <= now` |
| **Action** | Send Unibox template |
| **New state** | job `sent` / `failed` |
| **Next** | Sending |
| **Statut** | EXISTANT |

### E4 — Pipeline advance

| | |
|--|--|
| **Trigger** | Cron `instantly-bypass-pipeline` |
| **Condition** | Auto-advance enabled, delays respected |
| **Action** | Schedule next E2/E3 or close |
| **New state** | `step_2` / `step_3` |
| **Next** | Sending |
| **Statut** | EXISTANT |

### E5 — Link click

| | |
|--|--|
| **Trigger** | `POST /api/link-tracking/click` |
| **Condition** | Valid slug |
| **Action** | Mark clicked, optional Instantly sync |
| **New state** | `lead_statut=CLICKED` |
| **Next** | Booking |
| **Statut** | EXISTANT |

---

## 2. Calendly / Booking

### E6 — `invitee.created`

| | |
|--|--|
| **Trigger** | `POST /api/webhooks/calendly` |
| **Condition** | Signature valid ; slug/`utm_content` résolu |
| **Action** | `book-lead` ; sync Instantly ; start booking jobs if PB ON |
| **New state** | `MEETING_BOOKED` ; `sales_calls` upsert |
| **Next** | Pré-vente ; Post-booking |
| **Statut** | EXISTANT |

### E7 — `invitee.canceled`

| | |
|--|--|
| **Trigger** | Webhook Calendly cancel |
| **Condition** | Lead trouvé |
| **Action** | Cancel pending email jobs ; Instantly sync |
| **New state** | `NOTBOOKED` ou `CANCELLED` (impl actuelle à vérifier par catégorie) |
| **Next** | Nurturing (si ON) |
| **Statut** | EXISTANT |

### E8 — Presence confirm

| | |
|--|--|
| **Trigger** | `POST /api/link-tracking/confirm` |
| **Condition** | Lead MEETING_BOOKED |
| **Action** | Cancel h24_relance ; sync Instantly confirmed |
| **New state** | `CONFIRMED` |
| **Next** | Post-booking done / Pré-vente |
| **Statut** | EXISTANT |

### E9 — No-show reported

| | |
|--|--|
| **Trigger** | Admin `workflow-action` ou `POST /api/dashboard/[slug]/noshow` |
| **Condition** | RDV passé ; report ≤ fenêtre métier |
| **Action** | Mark no_show ; optional no-show sequence |
| **New state** | `sales_calls.status=no_show` / appointment no_show_* |
| **Next** | Nurturing |
| **Statut** | EXISTANT (humain — pas de webhook Calendly fiable) |

---

## 3. Payments / Stripe

### E10 — `checkout.session.completed`

| | |
|--|--|
| **Trigger** | `POST /api/webhooks/stripe` |
| **Condition** | Signature valid ; offer_type connu ; owner lead résolu |
| **Action** | Upsert `payments` ; product transitions ; start onboarding / seat ; cancel conflict sequences |
| **New state** | payment succeeded ; `PAID_PENDING_ONBOARDING` / `ONBOARDED` selon flow |
| **Next** | Post-payment ; CRM Hercule (si destinataire Hercule) |
| **Statut** | EXISTANT |

### E11 — Subscription events

| | |
|--|--|
| **Trigger** | Stripe subscription webhooks (handlers `stripe-webhook-*.ts`) |
| **Condition** | Sub ID lié payment |
| **Action** | Update subscription fields ; capacity slot activate (SaaS) |
| **New state** | payments / client_outreach_slots |
| **Next** | Post-payment / capacity |
| **Statut** | EXISTANT partiel |

### E12 — External payment signal

| | |
|--|--|
| **Trigger** | À DÉCIDER (webhook client ? admin mark paid ?) |
| **Condition** | Niche Post-payment ON + mode « paie le client » |
| **Action** | Même famille d'effets que E10 sans Stripe |
| **New state** | À DÉCIDER |
| **Next** | Post-payment / Nurturing |
| **Statut** | À DÉCIDER |

---

## 4. Crons / time

### E13 — Booking emails due

| | |
|--|--|
| **Trigger** | Cron `/api/cron/booking-emails` |
| **Condition** | `booking_email_jobs` pending due |
| **Action** | Render + Resend send |
| **New state** | job sent/failed |
| **Next** | Post-booking |
| **Statut** | EXISTANT |

### E14 — Calendly seat check

| | |
|--|--|
| **Trigger** | `/api/cron/calendly-seat-check` |
| **Condition** | Rows `calendly_seat_onboarding` awaiting |
| **Action** | Poll invitation ; send reminder |
| **New state** | seat status active / reminder_sent |
| **Next** | Post-payment |
| **Statut** | EXISTANT |

### E15 — Onboarding reminders

| | |
|--|--|
| **Trigger** | `/api/cron/onboarding-reminders` |
| **Condition** | Recipients due |
| **Action** | Send reminder templates |
| **New state** | jobs sent |
| **Next** | Post-payment |
| **Statut** | EXISTANT |

### E16 — Post-RDV surveys

| | |
|--|--|
| **Trigger** | `/api/cron/post-rdv-surveys` |
| **Condition** | Appointment completed window |
| **Action** | Issue survey tokens / emails |
| **New state** | surveys_sent |
| **Next** | Nurturing / product (legacy matching) |
| **Statut** | EXISTANT (lié matching — partiellement DEPRECATED métier) |

### E17 — Pool router

| | |
|--|--|
| **Trigger** | `/api/cron/pool-router` |
| **Condition** | Active slots needing leads ; pool available |
| **Action** | Assign prospects → slots ; provision links |
| **New state** | `lead_assignments` ; prospect `assigned` |
| **Next** | Provisioning / Sending |
| **Statut** | EXISTANT (SaaS autonome) |

### E18 — Sequence scheduler

| | |
|--|--|
| **Trigger** | `/api/cron/sequence-scheduler` |
| **Condition** | tap2 due / cooloff expire |
| **Action** | Queue tap2 ; release cooloff |
| **New state** | sequence_state updates |
| **Next** | Sending / Nurturing |
| **Statut** | EXISTANT |

### E19 — Retraction expire

| | |
|--|--|
| **Trigger** | `/api/cron/retraction-expire` |
| **Condition** | retraction_ends_at passed |
| **Action** | Update retraction_status |
| **New state** | retraction expired |
| **Next** | Post-payment / legal |
| **Statut** | EXISTANT |

---

## 5. Resend / engagement

### E20 — Resend webhook

| | |
|--|--|
| **Trigger** | `POST /api/webhooks/resend` |
| **Condition** | Valid event |
| **Action** | Record engagement (open/click/bounce) |
| **New state** | engagement fields on jobs (si migration) |
| **Next** | Observability ; éventuellement Nurturing |
| **Statut** | EXISTANT |

---

## 6. Ops / provision niche

### E21 — Instantly provision webhooks (segments)

| | |
|--|--|
| **Trigger** | `/api/webhooks/instantly/provision-*` |
| **Condition** | Secret ; segment match |
| **Action** | Provision lead + links for vertical |
| **New state** | Lead NOTBOOKED |
| **Next** | Sending |
| **Statut** | EXISTANT (surtout JUM — niche DEPRECATED ; pattern réutilisable) |

### E22 — Supabase link-tracking DB webhook

| | |
|--|--|
| **Trigger** | `/api/webhooks/supabase-link-tracking` |
| **Condition** | Secret |
| **Action** | Side effects sync |
| **New state** | dépend payload |
| **Next** | CRM sync |
| **Statut** | EXISTANT |

---

## 7. Admin / product (legacy matching)

### E23 — Sales call workflow action

| | |
|--|--|
| **Trigger** | `POST /api/admin/bookings/workflow-action` |
| **Condition** | Admin ; status allowed |
| **Action** | Set `no_show` / `not_paid` / `lost` ; start sequences |
| **New state** | `sales_calls.status` |
| **Next** | Nurturing |
| **Statut** | EXISTANT |

### E24 — Match proposed / delivered

| | |
|--|--|
| **Trigger** | Admin matching / deliverance APIs |
| **Condition** | Credits ; product_statut |
| **Action** | Create match / appointment |
| **New state** | matches / appointments |
| **Next** | Product delivery |
| **Statut** | EXISTANT — **DEPRECATED métier** (buyer/seller). Ne pas étendre. |

---

## Matrice Event → Module

| Event | Scr | Cln | Pro | Snd | Bkg | PV | PB | PP | Nur |
|-------|-----|-----|-----|-----|-----|----|----|----|-----|
| Scrape worker | ● | | | | | | | | |
| Clean CLI | | ● | | | | | | | |
| Provision | | | ● | | | | | | |
| lead_interested | | | | ● | | | | | |
| AI reply | | | | ● | | | | | |
| click | | | | | ● | | | | |
| invitee.created | | | | | ● | ● | ● | | |
| invitee.canceled | | | | | ● | | ● | | ● |
| confirm | | | | | ● | | ● | | |
| Stripe checkout | | | | | | | | ● | ● |
| no-show | | | | | | | | | ● |
| pool-router | | | ● | ● | | | | | |
| nurturing cron | | | | | | | | | ● |
