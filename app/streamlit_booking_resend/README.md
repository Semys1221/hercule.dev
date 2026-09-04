# Booking Resend (Streamlit)

Outil dédié aux réservations Calendly et aux séquences email Resend, séparé par booking link **agence** et **entreprise**.

```bash
pnpm streamlit-booking-resend
# or:
cd app/streamlit_booking_resend && pip install -r requirements.txt && streamlit run app.py
```

## Prérequis

- Next.js en local pour déclencher les séquences : `pnpm dev`
- Variables dans `crm/.env` ou `.env` à la racine

## Onglets

### Réservations Agence

- Fetch Calendly (30 jours), filtré `booking_category=agence`
- Booking link : `/reservation.html/{slug}`
- Séquence principale (trackée) : immediate + H-48 + H-24 + H-20
- Role recovery (non trackée) : 2 emails + provision
- Modèles email inline (6 types)

### Réservations Entreprise

- Fetch Calendly filtré `booking_category=entreprise`
- Booking link : `/reservation-entreprise.html/{slug}`
- 1 email : confirmation immédiate
- Modèles email inline (immediate uniquement)

### Envoi granulaire (les deux onglets)

- **Séquence complète** — tous les emails applicables à la catégorie / type de séquence
- **Emails sélectionnés** — un ou plusieurs emails (`partial: true` côté API)

Colonnes `job_email_*` : statut des jobs en base (`pending`, `sent`, etc.).

## Variables d'environnement

| Variable | Usage |
|----------|-------|
| `CALENDLY_API_TOKEN` | Fetch réservations Calendly |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Base de données |
| `SUPABASE_SERVICE_ROLE_KEY` | Accès service role |
| `RESEND_API_KEY` | Envoi test des modèles |
| `BOOKING_RESEND_FROM` / `RESEND_FROM` | Adresse expéditeur |
| `CRM_BACKEND_URL` / `NEXT_PUBLIC_APP_URL` | Backend Next.js |
| `LINK_TRACKING_WEBHOOK_SECRET` / `CRON_SECRET` | Auth Bearer vers l'API |

## Smoke tests

```bash
pnpm smoke-streamlit-booking-resend-schedule
pnpm smoke-booking-partial-trigger
```

## Architecture

```
Streamlit → Calendly API
         → Supabase (leads, templates, jobs)
         → Next.js /api/booking-communication/* (trigger partiel ou complet)
         → Resend (tests email depuis Streamlit)
```
