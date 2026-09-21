# Architecture Backend Hercule

> Documentation technique du **moteur**, du **backend de gestion**, et du **contrat** avec le front.  
> Spec d’écrans (routes, composants) : **hors scope** — voir [`frontend.md`](./frontend.md).  
> Dernière mise à jour : trois couches engine / gestion / UI.

## 1. Vue d'ensemble

Hercule est un **engine d'acquisition B2B** standardisé. Il scrape des prospects, les nettoie, les provisionne, les contacte par email, les fait booker un RDV, puis les accompagne via une pré-vente et des modules optionnels post-booking.

Le système est une **grille** :

- **Colonnes** = modules universels (moteurs réutilisables)
- **Lignes** = niches (configurations de ces modules pour une cible)

Il n'existe pas un workflow différent par niche. Il existe **un seul système**, paramétré par niche.

```
                    MODULES UNIVERSELS
             Scr  Cln  Pro  Snd  Bkg  PV   PB   PP   Nur
             ─────────────────────────────────────────────
comptable     ✓    ✓    ✓    ✓    ✓    ✓    ?    ?    ?
cif           ✓    ✓    ✓    ✓    ✓    ✓    ?    ?    ?
restaurant    ✓    ✓    ✓    ✓    ✓    ✓    ?    ?    ?
santé         ✓    ✓    ✓    ✓    ✓    ✓    ?    ?    ?
btp           ✓    ✓    ✓    ✓    ✓    ✓    ?    ?    ?
architect     ✓    ✓    ✓    ✓    ✓    ✓    ?    ?    ?
```

`?` = module optionnel ON/OFF, configurable indépendamment par niche.

---

## 2. Principe fondamental : coquille universelle

L'engine ne « sait » pas ce qu'est un comptable ou un restaurant. Il traite des **prospects** d'une niche à travers 9 modules, dans l'ordre.

La niche = un ensemble de paramètres :

- cible de scraping (preset Outscraper)
- règles de cleaning
- campagne Instantly + templates E1–E3
- lien Calendly déposé dans la séquence
- contenu de la page pré-vente
- activation des modules optionnels
- copywriting, prompts AI reply, quotas, etc.

**Seul point de variabilité critique pour le destinataire du RDV :** le lien Calendly provisionné dans Instantly. Ce lien pointe vers un event type de l'organisation Calendly Hercule. Qui tient cet event = qui reçoit le RDV.

---

## 3. Les 9 modules

| # | Module | Obligatoire | Rôle |
|---|--------|-------------|------|
| 1 | Scraping | ✓ | Collecte de leads (Outscraper → Instantly list) |
| 2 | Cleaning | ✓ | Vérification emails (MyEmailVerifier) |
| 3 | Provisioning | ✓ | Slugs + variables Instantly (liens Calendly) |
| 4 | Sending | ✓ | Campagnes Instantly + bypass E1–E3 + AI reply |
| 5 | Booking | ✓ | Webhook Calendly → lead booké |
| 6 | Pré-vente | ✓ | Page auto post-booking (présentation ou wizard) |
| 7 | Post-booking | optionnel | Rappels / relances autour du RDV |
| 8 | Post-payment | optionnel | Onboarding / suivi après paiement |
| 9 | Nurturing | optionnel | Relances conditionnelles (J+n, acheté ou non) |

Une niche **doit** traverser Scraping → Pré-vente. Les trois derniers modules s'activent indépendamment (ex. Post-booking OFF + Nurturing ON est valide).

Détail : [`modules.md`](./modules.md).

---

## 4. Niches actives

| Code | Cible scraping typique | Table lead (EXISTANT / À CONSTRUIRE) |
|------|------------------------|--------------------------------------|
| `comptable` | Cabinets d'expertise comptable | EXISTANT — `comptable` |
| `cif` | Conseillers financiers / CGP | EXISTANT — `cif` |
| `restaurant` | Restaurants | EXISTANT partiel — `prospect_pool` (niche=`restaurant`) |
| `santé` | Cabinets santé | EXISTANT partiel — `prospect_pool` (niche=`sante`) |
| `btp` | PME BTP | EXISTANT partiel — `prospect_pool` (niche=`btp`) |
| `architect` | Architectes DPLG | À CONSTRUIRE — preset scrape existe (`architectes_dplg`) |

### DEPRECATED

| Élément | Statut | Notes |
|---------|--------|-------|
| Table / niche `agence` | DEPRECATED | Ne plus étendre. Agence web n'est plus une niche. |
| Table / niche `entreprise` | DEPRECATED | Logique seller/buyer supprimée. |
| Table / niche `jum` | DEPRECATED | JUM n'est pas une niche. Les verticals (médecin, kiné…) restent des **presets de scraping**, pas des niches. |
| Logique buyer / seller | DEPRECATED | Plus de matching agence↔entreprise comme modèle métier. |
| Table `matches` | DEPRECATED | Liée au matching buyer/seller. |
| Niche « agence web » | DEPRECATED | Campagnes Instantly legacy possibles, hors grille canon. |

---

## 5. Trois couches : engine, gestion, front

```
                    FRONT-END
              (contrôle / visualisation)
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
        Client Management    System Management
              │                   │
              └─────────┬─────────┘
                        ↓
┌─────────────────────────────────────────┐
│  BACKEND GESTION                        │
│  Table clients + lifecycle + allocation │
│  Décide / calcule / persiste / exécute  │
└─────────────────┬───────────────────────┘
                  │ éligibilité, quotas, inboxes
                  ▼
┌─────────────────────────────────────────┐
│  ENGINE (grille niches × modules)       │
│  scrape → clean → provision → send →    │
│  book → pré-vente → [PB/PP/Nur]         │
│  Agnostique. Standardisé. Evergreen.    │
└─────────────────────────────────────────┘
```

Règle : Front = « je demande / je déclenche / j’affiche ». Backend gestion = « je décide / je calcule / je persiste / j’exécute ». Détail : [`frontend.md`](./frontend.md).

- L'engine produit des RDV vers des calendriers (Hercule ou clients tiers). Il **ne** porte pas la date de première livraison ni le lifecycle commercial.
- Le backend de gestion stocke **les clients d'Hercule**, calcule `delivery_start_at`, l’éligibilité au pool, l’allocation (quotas, inboxes, tâches). Le CRM n’est plus un simple UPSERT post-Stripe.
- Un prospect qui signe avec un comptable tiers ne rentre pas dans `clients` Hercule ; il reste dans le CRM du comptable (D16 inchangé pour l’entrée paiement).
- Deux **points d’entrée** possibles vers `clients` : formulaire d’onboarding (gestion) **et** import paiement destinataire = Hercule (W11). Coexistence : **À DÉCIDER**.
- Schéma exact `clients` (colonnes, enum lifecycle) : [`data-model.md`](./data-model.md), [`states.md`](./states.md). Workflows : [`workflows.md`](./workflows.md) § gestion.

---

## 6. Stack technique (EXISTANT)

| Couche | Technologie | Rôle |
|--------|-------------|------|
| App / API | Next.js App Router (TypeScript) | Webhooks, crons, orchestrateurs, admin `/internal` |
| DB | Supabase (PostgreSQL) | État, jobs, templates. Migrations : `lib/backend/supabase/migrations/` |
| Ops tooling | Streamlit (Python) | Scraper, clean, links, subsequence, reply agent, booking-resend |
| Workers | Render + VPS | Scrape workers, clean CLI, monitoring Grafana |
| Outreach | Instantly | Campagnes, Unibox replies, custom variables |
| Booking | Calendly (org Hercule) | Event types, webhooks, agendas clients |
| Email transactional | Resend | Séquences booking / product |
| Paiements | Stripe | Checkout, webhooks |
| Scraping | Outscraper | Google Maps leads |
| Email verify | MyEmailVerifier | Cleaning |
| AI reply | Groq / xAI (Grok) | Reply agent |
| Crons externes | cron-job.org | Sub-daily (Hobby Vercel) |

**Pattern d'orchestration (canon) :**

```
Webhook (Calendly / Instantly / Stripe / …)
  → INSERT job row (Supabase)
  → Cron GET /api/cron/* (Bearer CRON_SECRET)
  → Action (send email, advance pipeline, …)
```

Pas d'Inngest. Pas de n8n pour le runtime métier.

Code métier Next sous `lib/legacy/**` (anciennement `lib/admin`, `lib/booking-communication`, etc.). Ops sous `lib/backend/**`.

---

## 7. Flux principal

```
Scraping          Outscraper → list Instantly
    ↓
Cleaning          MyEmailVerifier → push valides
    ↓
Provisioning      slug + reservation_*_link → Instantly PATCH
    ↓
Sending           Instantly campaign → Interested → bypass E1–E3 / AI reply
    ↓
Booking           Clic lien → Calendly → invitee.created → lead MEETING_BOOKED
    ↓
Pré-vente         Page auto (slug) — présentation ou wizard
    ↓
[Post-booking]    Rappels Resend (si ON)
[Post-payment]    Onboarding / Stripe (si ON)
[Nurturing]       Relances J+n (si ON)
```

Détail : [`workflows.md`](./workflows.md), [`routing.md`](./routing.md).  
Gestion clientèle (hors cette chaîne) : [`workflows.md`](./workflows.md) § gestion, [`frontend.md`](./frontend.md).

---

## 8. Ce que le client configure (opinionated)

Le client final **ne configure pas** l'acquisition. Hercule contrôle scraping, cleaning, campagnes, copy, prompts, liens, pages, routing.

Le client fournit seulement :

- type de niche souhaité
- infos entreprise + légales / footer
- produits/services acceptés à promouvoir
- connexion agenda via invitation Calendly org Hercule
- acceptation des conditions de paiement

---

## 9. Légende EXISTANT / À CONSTRUIRE / À DÉCIDER

Utilisée dans toute la doc :

| Tag | Signification |
|-----|---------------|
| **EXISTANT** | Implémenté dans le repo (code ou migration). Source de vérité technique. |
| **À CONSTRUIRE** | Nécessaire au modèle canon, absent ou fragmenté. |
| **À DÉCIDER** | Repo + docs insuffisants pour trancher. Options listées. |

---

## 10. Index de la documentation

| Fichier | Contenu |
|---------|---------|
| [`README.md`](./README.md) | Index + lien chantier |
| [`architecture.md`](./architecture.md) | Ce fichier (canon conceptuel) |
| [`modules.md`](./modules.md) | 9 modules détaillés |
| [`workflows.md`](./workflows.md) | Parcours engine + workflows de gestion |
| [`frontend.md`](./frontend.md) | Contrat Front / backend gestion (pas spec UI) |
| [`events.md`](./events.md) | Catalogue d'événements |
| [`states.md`](./states.md) | Machines d'état |
| [`data-model.md`](./data-model.md) | Entités et schéma |
| [`integrations.md`](./integrations.md) | Services externes |
| [`routing.md`](./routing.md) | Prospect → client → calendrier |
| [`implementation-plan.md`](./implementation-plan.md) | Plan conceptuel — **exécutable = `build/`** |
| [`architecture.html`](./architecture.html) | Illustration interactive |
| [`build/KICKOFF.md`](./build/KICKOFF.md) | Message à coller : wipe local (-1) puis inventaire |
| [`build/AGENT-PROMPT.md`](./build/AGENT-PROMPT.md) | Règlement : -1 → 0 → 15 |

Chantier agent (catalogues précis + boucle Read→Verify) : [`build/`](./build/).

Illustration HTML : ouvrir `architecture.html` dans un navigateur.
