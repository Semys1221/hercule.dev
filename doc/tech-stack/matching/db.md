# Matching — Database

> Module : [Matching](./README.md) · Lignes : [Front client](./front-client.md) · [Front interne](./front-interne.md) · [Communication](./communication.md)  
> Contexte : [Vue d'ensemble](../00-overview.md) · Suite : [Post-RDV](../post-rdv/README.md)

---

## 1. Intro (langage simple)

Tu cliques **« Mettre en lien »** : une agence + une entreprise. Ce n'est **pas** la fin du parcours — c'est le début du sous-parcours Calendly.

Statut → `MATCH_PROPOSED`. L'entreprise reçoit un email avec lien Calendly Hercule pour booker un RDV.

---

## 2. Architecture développée (pour IA de coding)

### Trigger

Admin `POST /api/matching/link` (bouton « Mettre en lien »)

### Transaction

```sql
ALTER TYPE public.lead_statut ADD VALUE IF NOT EXISTS 'MATCH_PROPOSED';

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agence_id UUID NOT NULL REFERENCES public.agence(id),
  entreprise_id UUID NOT NULL REFERENCES public.entreprise(id),
  created_by TEXT DEFAULT 'streamlit',
  notes TEXT,
  matched_at TIMESTAMPTZ DEFAULT NOW()
);
```

1. INSERT `matches`
2. UPDATE entreprise : `matched_agence_id`, `statut = 'MATCH_PROPOSED'`
3. UPDATE agence : `matched_entreprise_id`, `statut = 'MATCH_PROPOSED'`
4. Enqueue `match_proposal_entreprise` (Calendly link)

### Webhook Calendly (`invitee.created`)

Réutiliser [`lib/link-tracking/book-lead.ts`](../../../lib/link-tracking/book-lead.ts) :

| Row | Changement |
|-----|------------|
| entreprise | `statut = 'MEETING_BOOKED'`, `scheduled_at`, `calendly_invitee_uri` |
| agence | `profile.match.active_rdv = true` (JSON patch) |

**Pas** de statut `agence_tire_1` — flag JSON plus simple.

### Validations

- Entreprise : `IN_DELIVERANCE`
- Agence : `IN_DELIVERANCE` ou `CONFIRMED` (CRM payée)
- Ni l'un ni l'autre déjà en match actif

### Ce module ne termine PAS le parcours

Après `MEETING_BOOKED` → module [Post-RDV](../post-rdv/README.md).

---

## 3. Prompt d'action IA

```
Matching DB — MATCH_PROPOSED pas SOLD (doc/tech-stack/matching/db.md).

1. POST /api/matching/link : transaction matches + statut MATCH_PROPOSED both sides
2. Étendre webhook Calendly : MEETING_BOOKED entreprise + profile.match.active_rdv agence
3. Calendly URL pattern TRACKING_BASE_URL_ENTREPRISE/{slug} (doc/crm-deployment.md)

Réutiliser : lib/link-tracking/book-lead.ts, app/api/webhooks/calendly

Tests :
- link → MATCH_PROPOSED + match row
- webhook → MEETING_BOOKED + active_rdv true
- parcours continue vers post-rdv (pas SOLD ici)
```
