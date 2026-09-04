# Booking Resend (Streamlit)

Outil dédié aux réservations Calendly et aux séquences email Resend.

```bash
pnpm streamlit-booking-resend
# or:
cd app/streamlit_booking_resend && pip install -r requirements.txt && streamlit run app.py
```

## Prérequis

- Next.js en local pour aperçu / send-once / tests : `pnpm dev` (`CRM_BACKEND_URL=http://localhost:3000`)
- Variables dans `crm/.env` ou `.env` à la racine
- `BOOKING_GO_LIVE_AT` — cutoff UTC. Les leads agence avec `booked_at` antérieur restent en **Agence Legacy** (pas de séquence auto)

## Onglets

### Séquences

Édition unique des templates Resend :

- Auto agence : immediate, H-48, H-24, H-20
- Auto entreprise : immediate
- Legacy : Intro (`role_seq_48`) et relance page temporaire (`role_seq_24`). La relance lien standard réutilise H-48.

### Réservations Agence

Nouveaux bookings trackés **après** le go-live. Observation (jobs / confirmation). Bouton d’urgence : annuler les relances restantes. La séquence démarre via le webhook Calendly + cron.

### Agence Legacy

Bookings agence trackés **avant** le go-live. Envoi manuel uniquement :

- Intro Hercule (`role_seq_48`)
- Relance confirmation : lien standard (`h48_confirm`) ou page temporaire (`role_seq_24` + `temporary-reservation.html`)

### Réservations Entreprise

Observation de l’email immédiat auto.

### Historique

Tous les jobs `booking_email_jobs` (auto + envois manuels legacy).

## Variables d'environnement

| Variable | Usage |
|----------|-------|
| `CALENDLY_API_TOKEN` | Fetch réservations Calendly |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Base de données |
| `SUPABASE_SERVICE_ROLE_KEY` | Accès service role |
| `RESEND_API_KEY` | Envoi test des modèles |
| `BOOKING_RESEND_FROM` / `RESEND_FROM` | Adresse expéditeur |
| `CRM_BACKEND_URL` | Backend Next.js (défaut `http://localhost:3000`) |
| `LINK_TRACKING_WEBHOOK_SECRET` / `CRON_SECRET` | Auth Bearer vers l'API |
| `BOOKING_GO_LIVE_AT` | Cutoff ISO UTC auto vs legacy agence |

## Smoke tests

```bash
pnpm smoke-streamlit-booking-resend-schedule
pnpm smoke-booking-legacy
pnpm smoke-booking-email-render
```

## Architecture

```
Calendly webhook → skip sequence si agence legacy
                 → lun–mer recovery (role_seq_48/24) / jeu–sam séquence complète
                 → startSequenceForBookedLead → booking_email_jobs → cron
Streamlit Legacy → /api/booking-communication/send-once (email_type)
Streamlit Séquences → templates Supabase
```
