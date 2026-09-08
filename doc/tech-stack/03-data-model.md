# 03 — Modèle de données

```
status: canonical
audience: coding-agent
depends_on: 02-state-machines.md
decisions: DB-01 DB-02 SOT-01 SOT-02 FND-05 SAL-01 FUN-01 ENG-01 ENG-03 ENG-08
do_not:
  - Créer une table communications
  - Unifier agence et entreprise en une table lead
  - Stocker le compteur MEETING_n comme colonne de statut
  - Mettre PAID dans lead_statut
```

Légende colonnes : **A** autoritaire · **D** dérivé · **W** déclenche workflow.

---

## Live — GARDER (UNCHANGED)

| Table | Rôle | Action |
|-------|------|--------|
| `agence` / `entreprise` | Fiches miroir | Ajouter colonnes NEW ci-dessous |
| `booking_email_jobs` | File Resend | Étendre CHECK `email_type` |
| `booking_email_templates` | Corps | Idem |
| `agence_demandes` | Carousel marketing | Inchangé |
| `instantly_bypass_*` (6) | Ops froid | Inchangé ; Next envoie (LEG-02) |
| `ai_reply_agent_*` (6) | Ops IA | Inchangé ; hors `/internal` produit |
| `instantly_bypass_settings` / webhook_settings | Kill switches | SET-02 : édités Streamlit pour l’instant |

RLS on, 0 policy. Service role serveur.

`booking_email_jobs.lead_id` reste **sans FK** jusqu’à ce que les jobs produit pointent éventuellement `appointments.id` (ENG-08).

---

## NEW — `agence` / `entreprise` colonnes

| Colonne | Type | Rôle |
|---------|------|------|
| `product_statut` | enum `product_statut` | **A** livraison (défaut `NONE`) |
| `onboarding_completed_at` | timestamptz | déjà présent |
| `deliverance_started_at` | timestamptz | **A** |
| `estimated_completion_at` | timestamptz | **D** capacity |
| `active_match_id` | uuid nullable | **D** match `open` |
| `credits_remaining` | int nullable | **D** pour pack_989x3 ; null si monthly |
| `offer_type` | text nullable | `starter_1489_5` \| `monthly_1489` \| `pack_989x3` |

`profile` JSONB **reste** (DB-02) : `form`, `communication.delays` (produit), `display.timeline`, `capacity`, `offers` (flags CTA, **pas** 898).

Ne pas ajouter `matched_entreprise_id` comme SoT : SoT = `matches`.

---

## NEW — tables

### `payments`

`id`, `agence_id` FK, `offer_type`, `amount_cents`, `status` (`pending|succeeded|failed|refunded`), `stripe_checkout_session_id` unique, `stripe_payment_intent_id`, `stripe_event_id` unique, `succeeded_at`, `created_at`.

### `matches`

`id`, `agence_id`, `entreprise_id`, `status` (`open|closed`), `outcome` (`sold|no_sale|unlinked|null`), `opened_at`, `closed_at`, `created_by`, `notes`.  
Contrainte : **au plus un** `open` par `agence_id`.

### `appointments`

`id`, `match_id` FK, `agence_id`, `entreprise_id`, `kind` = `delivery` (jamais `sales`), `calendly_invitee_uri` unique, `scheduled_at`, `status` (`scheduled|completed|no_show_entreprise|no_show_agence|cancelled`), `survey_token_agence` unique, `survey_token_entreprise` unique, `completed_at`, `noshow_reported_at`, `noshow_reported_by`.

Attribution consommée : insert `scheduled`. Recrédit : `no_show_entreprise`.

RDV **vente** : restent sur colonnes Calendly de la row lead **plus** `sales_calls`. Ne pas les mettre dans `appointments`.

### `sales_calls`

`id`, `agence_id` nullable (avant fiche), `email`, `calendly_invitee_uri` unique, `scheduled_at`, `status` (`scheduled|completed|no_show|not_paid|paid`), `notes` jsonb, `forecast_cents` nullable, `created_at`.

### CMS funnels (FUN-01) — étape 10

`funnel_pages` (`slug` unique, `audience`, `status` draft/published, `tree` jsonb, `published_at`). Migrer depuis `content/funnels/**/funnel.json`.

### Instantly stats cache (SOT-02) — peut attendre l’étape 10

`instantly_campaign_snapshots` : `campaign_id`, `fetched_at`, `payload` jsonb.

---

## Dérivés (ne pas stocker comme statut)

- Compteur attributions agence
- Compteur RDV livrés entreprise (FND-12)
- `sales_calls.paid` si `payments.succeeded` existe
