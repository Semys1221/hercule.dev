# Routing

Routing = **attribution** du prospect vers un **client destinataire** et son **calendrier**.  
Ce n'est **pas** de l'authentification.

---

## 1. Principe métier

Tous les prospects suivent le même process horizontal (scrape → … → send).

La seule variable qui décide « client de qui » :

> **Quel lien Calendly est déposé dans la séquence Instantly.**

Ce lien pointe vers un **event type** de l'organisation Calendly Hercule.  
Le titulaire de cet event / calendrier connecté = destinataire du RDV.

Exemples :

- Lien → event « RDV avec Cabinet Dupont (comptable) » ⇒ le restaurant devient **client du comptable**
- Lien → event « RDV commercial Hercule » ⇒ le comptable devient **client d'Hercule** (puis import CRM Hercule)

L'engine ne hardcode pas « restaurant appartient à comptable ». Il injecte un lien.

---

## 2. Flow conceptuel

```
Prospect (niche N)
       ↓
Provisioning / Pool router
       ↓
Sélection client destinataire (parmi clients actifs sur N)
       ↓
Inject Instantly variable = Calendly scheduling URL (event type client)
       ↓
Sending (E1–E3 contient le lien)
       ↓
Prospect clique → page booking
       ↓
Calendly org Hercule → event type client
       ↓
Webhook invitee.created (+ slug/utm_content)
       ↓
Lead booké ; RDV dans agenda connecté du client
```

---

## 3. Identification niche

Sources **EXISTANT** :

- Table lead / catégorie (`comptable`, `cif`, …)
- `niche_outreach_config.niche`
- `prospect_pool.niche` (`restaurant`|`sante`|`btp`)
- Campaign Instantly ID → config bypass / outreach

Slug 6-char sur lead résout le row (email, niche, liens).

---

## 4. Multi-client par niche

**Métier confirmé :** une niche peut alimenter **N clients** en parallèle.

### EXISTANT (SaaS autonome)

Tables :

- `client_outreach_slots` — capacité, prefs niches, `calendly_scheduling_url`, campaign/list Instantly
- `prospect_pool` — stock
- `lead_assignments` — assignation + double-tap state
- Cron `/api/cron/pool-router` — `lib/legacy/capacity/pool-router.ts`
- Cron sequence-scheduler — tap2 / cooloff

Logique router (résumé) :

1. Lister slots `capacity_status=active` needing leads
2. Respecter budget sends mensuel
3. Picker niche selon `niche_preferences` weights
4. Prendre prospects `available`
5. Créer assignment + provision links (`provisionLeadsByEmails`)

**Canon cible (gestion, W-G4 / W-G9 / W-G10) :** ne pas s’arrêter à « slot active ». Filtrer les clients **éligibles** (`lifecycle` + `now >= delivery_start_at`) avec **capacité restante**. Un client créé J0 n’entre dans le pool qu’à sa date d’éligibilité. Détail : [`workflows.md`](./workflows.md) §11, [`frontend.md`](./frontend.md).

### À CONSTRUIRE

- Généraliser ce pattern à **toutes** les niches actives (`comptable`, `cif`, `architect`, …), pas seulement restaurant/santé/btp
- Remplacer FK `agence_id` par owner client générique
- Event type Calendly **par client** comme SoT (pas seulement URL string)

---

## 5. Règles de sélection client

| Règle | Statut |
|-------|--------|
| Client actif (`capacity_status=active`) | EXISTANT |
| Client **éligible** : lifecycle + `now >= delivery_start_at` | **À CONSTRUIRE** — au-dessus du slot ; pas « le row existe » |
| Quota / budget sends mois | EXISTANT |
| Prefs niche (weights) | EXISTANT |
| Round-robin / fair-share across slots | EXISTANT partiel (batch fair-share) |
| Disponibilité Calendly temps réel | EXISTANT APIs availability — **pas** encore gate du router |
| Round-robin strict + sticky lead | À DÉCIDER |
| Priorité client Hercule vs tiers | À DÉCIDER |

---

## 6. Slug & pages booking

**EXISTANT :**

- Slug stocké sur lead
- URLs `reservation_*_link` → `/reservation/{slug}` (`utm_content=slug`)
- Webhook lit utm_content → retrouve lead
- Page React `/reservation/[slug]` (variantes agence / entreprise / conférence / JUM)

**À CONSTRUIRE :**

- Lien unique qui encode à la fois tracking lead **et** event type client déjà choisi à la provision

Important : le routing se décide **à la provision / assignation**, pas au clic (sauf redesign).

---

## 7. Calendly org invite (clients)

Objectif : le client ne fournit **pas** son propre lien Calendly public. Il rejoint l'org Hercule.

### Flow cible

```
Client signe / onboard
       ↓
Hercule crée / assigne event type
       ↓
Invitation membre org Calendly (email client)
       ↓
Client accepte + connecte agenda
       ↓
calendly_seat_onboarding → active
       ↓
Slot outreach activable (warmup → active)
```

**EXISTANT** : table + orchestrator `calendly-seat-onboarding`, cron seat-check, emails welcome/reminder (pattern agence).  
**À DÉCIDER** : automatisation 100% API vs étape admin manuelle ; mapping event type creation.

---

## 8. `niche_outreach_config` vs routing client

| Niveau | Contenu | Usage |
|--------|---------|-------|
| Niche | Campaign Instantly, list, defaults | Bootstrap campagne |
| Client | `calendly_scheduling_url` / event type URI | Lien injecté au prospect |

Aujourd'hui `niche_outreach_config.calendly_event_type_uri` est souvent le lien **unique** de la niche.

Canon cible :

- Config niche = moteur + defaults
- Lien bookable = **toujours** celui du client routé

---

## 9. CRM Hercule vs routing

Si le client destinataire **est Hercule** :

1. Event type Hercule
2. Après paiement → row CRM `clients` (W11, D16) **et/ou** formulaire onboarding (W-G1) — **À DÉCIDER**
3. Seat onboarding + lifecycle jusqu’à `eligible` / `active` pour que **ce** client reçoive plus tard des RDV sur **ses** niches

Si le client destinataire **est un tiers** (ex. comptable) :

1. Event type du comptable dans org Hercule
2. Pas d’import CRM Hercule (sauf si Hercule upsell ce comptable ailleurs)

---

## 10. Erreurs & cas limites

| Cas | Comportement |
|-----|--------------|
| Aucun slot actif | Ne pas provisionner / alerter pool | EXISTANT partiel (skip counts) |
| Pool niche vide | Alert threshold `poolAlertThreshold` | EXISTANT constants |
| Client paused mid-sequence | Stop assigns ; assignments en cours À DÉCIDER |
| Mauvais event type dans Instantly | RDV chez le mauvais client — monitoring critique |
| Double assign same email | Unique indexes email+niche | EXISTANT |

---

## 11. Synthèse EXISTANT / À CONSTRUIRE / À DÉCIDER

| Élément | Tag |
|---------|-----|
| Slug → lead resolution | EXISTANT |
| Webhook Calendly book | EXISTANT |
| Pool router SaaS 3 niches | EXISTANT |
| Event type par client (métier) | À CONSTRUIRE partout |
| Multi-client toutes niches | À CONSTRUIRE |
| Découpler slots de `agence` | À CONSTRUIRE |
| Gate éligibilité `delivery_start_at` + lifecycle | À CONSTRUIRE |
| Disponibilité comme contrainte router | À DÉCIDER |
| Sticky vs re-route | À DÉCIDER |
| Invite org 100% auto | À DÉCIDER |
