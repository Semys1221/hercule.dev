# Workflows

Parcours prospect à travers l'engine. Les modules optionnels sont des **branches**, pas des forks du core.

Workflows **gestion clientèle** (hors moteur) : §11. Contrat UI : [`frontend.md`](./frontend.md).

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

## 8. Workflow CRM Hercule (W11 — trop étroit aujourd’hui)

**EXISTANT conceptuel / À CONSTRUIRE.** Aujourd’hui le canon ne décrit que l’import **après paiement** (D16) :

```
Prospect booke un event tenu par Hercule
  → RDV commercial Hercule
  → paiement Hercule (Stripe)
  → INSERT/UPSERT table clients
  → pipeline interne (onboarding, deliverance…)

L'engine continue pour d'autres niches / clients sans référence à ce CRM.
```

**Élargissement (gestion) :** W11 reste l’entrée **paiement destinataire = Hercule**. Un **second point d’entrée** est le formulaire d’onboarding (React) — W-G1. Coexistence des deux : **À DÉCIDER**. Le pipeline interne n’est plus un commentaire : voir §11 (W-G*).

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

---

## 11. Workflows de gestion clientèle (hors moteur, À CONSTRUIRE)

Le moteur sait filtrer / pooler selon des **quotas de slots**. Il ne sait pas encore : créer un client depuis un formulaire, calculer le premier jour de livraison, n’envoyer des prospects qu’à partir de cette date, allouer des inboxes, générer les tâches ops.

Contrat UI : [`frontend.md`](./frontend.md).  
Réutiliser, **ne pas dupliquer** : `client_outreach_slots`, `inbox_pool`, `inbox_provision_queue`, pool-router. L’écart = **lifecycle client** au-dessus des slots.

Chaîne cible (SoT backend ; le front n’affiche que l’état persisté) :

```
Client créé
  → Date de livraison calculée (ex. signup + 20 j)
  → Provisioning (infra, inboxes, tâches)
  → Warm-up
  → Éligible
  → Entre dans le pool
  → Reçoit des prospects
```

### W-G1 — Client Onboarding

| | |
|--|--|
| **Statut** | **À CONSTRUIRE** |
| **Trigger** | Soumission formulaire React (typer / fiche). Second trigger possible : W11 paiement Hercule |
| **Entrée** | Payload validé (identité, niche, champs légaux minimaux) |
| **Conditions** | Données valides ; niche ∈ actives (D11) |
| **Étapes** | 1. Validation 2. INSERT `clients` 3. Sélection niche 4. Activation (statut created / onboarding) 5. Enchaîner W-G2, W-G5–W-G7 |
| **Ancrage** | Table `clients` D1 ; W11 trop tardif s’il est le seul insert |
| **Échecs** | Validation → pas de row ; double email **À DÉCIDER** |

### W-G2 — Delivery Start / First Delivery

| | |
|--|--|
| **Statut** | **Absent** (exemple métier : 1er RDV d’ici 20 jours) |
| **Trigger** | Suite W-G1 (création) ; éventuellement patch admin de la date |
| **Étapes** | 1. `delivery_start_at = signup_date + délai` 2. Persister 3. Déterminer l’instant d’éligibilité pool 4. Si changement de date : recalc W-G9 / W-G10 |
| **À DÉCIDER** | Délai 20 j constant vs par offre / SKU |

Le React **affiche** `delivery_start_at`. Il ne le calcule pas.

### W-G3 — Client Eligibility

| | |
|--|--|
| **Statut** | **À CONSTRUIRE** — distinct de `capacity_status` slot et de `inbox_pool.status` |
| **États visés** | `pending` → `warming` → `eligible` → `active` → `paused` (et variantes, voir lifecycle W-G8) |
| **Rôle** | Le moteur sait si **ce client** peut **actuellement** recevoir des prospects |

Ne pas fusionner avec `lead_statut`.

### W-G4 — Capacity / Allocation

| | |
|--|--|
| **Statut** | Pool-router **EXISTANT** (slots `capacity_status=active` + budget sends) — **À CONSTRUIRE** : volume, fenêtre, quota **client**, prise en compte de `delivery_start_at` |
| **Rôle** | Combien de prospects / RDV, **quand**, sur quelle période, selon quota **et** date d’éligibilité |

### W-G5 — Email Inbox Provisioning

| | |
|--|--|
| **Statut** | `inbox_pool` / `inbox_provision_queue` **EXISTANT** — **À CONSTRUIRE** : calcul du nombre, association client → inboxes, warmup lié au lifecycle, libération / réallocation |
| **Étapes** | Calcul nb boîtes → attribution → création / config → association → warmup → release éventuelle |
| **À DÉCIDER** | Formule du nombre de boîtes |

### W-G6 — Client → Infrastructure provisioning

| | |
|--|--|
| **Statut** | Fragmenté (seat Calendly **EXISTANT**, campagnes Instantly, links) — **À CONSTRUIRE** comme orchestrateur à l’entrée client |
| **Rôle** | Quelles ressources créer : comptes, campagnes, domaines, inboxes, liens, séquences, event type Calendly (D17) |

### W-G7 — Task Generation

| | |
|--|--|
| **Statut** | Jobs email **EXISTANT** — **tâches ops client** absentes |
| **Trigger** | Client créé (W-G1) et transitions W-G8 |
| **Exemples** | provisioning, configuration, vérification, lancement, suivi |
| **Chaque tâche** | état + deadline éventuelle |
| **À DÉCIDER** | Table `client_tasks` vs réemploi des tables jobs |

### W-G8 — Client Lifecycle

| | |
|--|--|
| **Statut** | **À CONSTRUIRE** |
| **Machine visée** | `created` → `onboarding` → `provisioning` → `warming` → `eligible` → `active` → `paused` → `cancelled` |
| **Règle** | Chaque transition **déclenche** les actions backend (pas le front) |

Détail des états : [`states.md`](./states.md) couche 5.

### W-G9 — Quota / Pool Recalculation

| | |
|--|--|
| **Statut** | Budget sends **EXISTANT** — **À CONSTRUIRE** : recalc à l’**entrée / sortie** d’un client |
| **Rôle** | Pool **dynamique**. Le round-robin ne regarde pas seulement « qui existe », mais **qui est éligible** et **quelle capacité reste**. |

### W-G10 — Priority / Queue

| | |
|--|--|
| **Statut** | **Absent** |
| **Rôle** | Un nouveau client n’est **pas** traité comme un actif J0. Il a une date d’éligibilité. À cette date il **entre dans la queue** / le pool. |

### W-G11 — Client Status Synchronization

| | |
|--|--|
| **Statut** | **À CONSTRUIRE** (contrat) |
| **Rôle** | Le front affiche l’état. Le backend **possède** l’état réel. Pas de state machine parallèle dans React. |

### À DÉCIDER (gestion — non tranchés)

| Sujet | Options |
|-------|---------|
| Délai 1re livraison | 20 j constant vs par offre / SKU |
| Enum lifecycle | Colonne dédiée vs mapping sur `capacity_status` (déconseillé : couches distinctes) |
| Nombre d’inboxes | Formule (quota, niche, …) |
| Tâches | `client_tasks` vs jobs existants |
| Formulaire | Internal Hercule vs client-facing |
| Double entrée `clients` | Form onboarding (W-G1) vs Stripe D16 (W11) — un, l’autre, ou les deux |

Ces IDs ne sont **pas** des D1–D22. Ne pas les ajouter à [`build/decisions.md`](./build/decisions.md).
