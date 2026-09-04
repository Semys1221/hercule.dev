# Booking Resend (Streamlit)

Outil dédié aux réservations Calendly et aux séquences email Resend (booking confirmation).

```bash
pnpm streamlit-booking-resend
# or:
cd app/streamlit_booking_resend && pip install -r requirements.txt && streamlit run streamlit_app.py
```

## Prérequis

- Next.js en local pour déclencher les séquences : `pnpm dev`
- Variables dans `crm/.env` ou `.env` à la racine (voir ci-dessous)

## Onglets

### Réservations Calendly

1. **Charger Calendly** — liste les RDV actifs sur 30 jours
2. Filtrer : toutes / trackées / non trackées
3. Colonnes d'horaires d'envoi (Europe/Paris) : email 1–4 selon le type de séquence
4. Cocher/décocher les prospects à inclure
5. **Provisionner** — crée ou met à jour le lead Supabase (role recovery)
6. **Envoyer la séquence** — détection auto :
   - **Principale** (trackée) : immédiat + H-48 + H-24 + H-20
   - **Role recovery** (non trackée) : 2 emails H-48 / H-24 (8h Paris)

Les horaires planifiés en base (`booking_email_jobs`) priment sur l'estimation affichée.

### Modèles email

Édition des templates Supabase (`booking_email_templates`), aperçu, envoi test Resend, enregistrement.

## Variables d'environnement

| Variable | Usage |
|----------|-------|
| `CALENDLY_API_TOKEN` | Fetch réservations Calendly |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Base de données |
| `SUPABASE_SERVICE_ROLE_KEY` | Accès service role |
| `RESEND_API_KEY` | Envoi test des modèles |
| `BOOKING_RESEND_FROM` / `RESEND_FROM` | Adresse expéditeur |
| `CRM_BACKEND_URL` / `NEXT_PUBLIC_APP_URL` | Backend Next.js (défaut `http://localhost:3000`) |
| `LINK_TRACKING_WEBHOOK_SECRET` / `CRON_SECRET` | Auth Bearer vers l'API |
| `BOOKING_TEMPORARY_BASE_URL` | Lien confirmation role recovery |

## Smoke test

```bash
python3 ./scripts/streamlit_booking_resend/smokeSchedule.py
```

Vérifie le calcul des horaires (port Python de `lib/booking-communication/schedule.ts`).

## Architecture

```
Streamlit → Calendly API (fetch RDV)
         → Supabase (leads, templates, jobs)
         → Next.js /api/booking-communication/* (déclenchement séquences)
         → Resend (tests email uniquement depuis Streamlit)
```

Le CRM (`pnpm crm`) reste inchangé ; cet outil en extrait la partie booking email.
