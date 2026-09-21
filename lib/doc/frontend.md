# Front-end — contrat (pas une spec d’écrans)

> Canon du **contrat** UI ↔ backend de gestion.  
> **Hors scope :** routes, composants, shadcn, copy d’écrans.  
> Détail des workflows : [`workflows.md`](./workflows.md) § gestion.  
> Dernière mise à jour : couche gestion + contrat FE.

Le moteur d’acquisition (9 modules) est documenté. En pensant au front-end, on découvre des **workflows backend manquants** : orchestration commerciale, éligibilité, allocation. Ce fichier fige la règle architecturale et les **intentions** d’UI. La spec d’interface vient **après** ces workflows.

---

## 1. Trois couches

```
                    FRONT-END
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
        Client Management    System Management
              │                   │
              └─────────┬─────────┘
                        ↓
              BACKEND GESTION
              (workflows métier)
                        ↓
          Acquisition engines / tools
```

| Couche | Rôle |
|--------|------|
| **Engine** | Grille niches × modules. Agnostique. Produit des prospects / RDV. [`architecture.md`](./architecture.md) |
| **Backend gestion** | Reçoit les **commandes** du front, **décide**, calcule, persiste, exécute. Relie la clientèle au moteur (quotas, éligibilité, inboxes, tâches). |
| **Front-end** | Interface de **contrôle et visualisation**. Demande, déclenche, affiche. |

Le front-end **contient de la logique d’affichage et d’orchestration d’appels**, pas de logique métier. Exemple : « premier RDV dans 20 jours » n’est **pas** calculé en React.

---

## 2. Règle architecturale

**Front-end :** « Je demande / je déclenche / j’affiche. »

**Backend :** « Je décide / je calcule / je persiste / j’exécute. »

Conséquences :

- Un formulaire React **soumet** une commande (`create_client`, `pause_client`, …).
- Le backend **valide**, écrit en DB, enchaîne les workflows, expose l’état.
- Le front **relit** l’état persisté (statut, `delivery_start_at`, quotas, tâches, erreurs).
- Recalculs (date de livraison, nb d’inboxes, place dans le pool) = **serveur**. Modifier une date affichée sans commande backend = interdit conceptuel.

---

## 3. Exemple : premier RDV J+20

Annonce commerciale : le client reçoit son premier rendez-vous **d’ici 20 jours**.

| Où | Quoi |
|----|------|
| **Pas React** | `Date.now() + 20 * 864e5` dans le composant |
| **Backend** | À la création du client : `delivery_start_at = signup_date + délai` (ex. 20 j) **persisté** |
| **Moteur / router** | N’assigne des prospects que si `now >= delivery_start_at` **et** client éligible **et** capacité restante — pas « dès qu’un row existe » |
| **Front** | Affiche `delivery_start_at` (et le statut) renvoyés par l’API |

Le délai **20 jours** est un **exemple** métier. Constante globale vs par offre : **À DÉCIDER** ([`workflows.md`](./workflows.md) § À DÉCIDER gestion).

Le pooling par quotas existe déjà côté engine. Il **manque** encore le lien « client créé → date d’éligibilité → entrée dans la queue ».

---

## 4. Deux surfaces

### Client Management

Opérer **un** client d’Hercule : création, niche, dates, quotas, inboxes, tâches, pause, livraisons, erreurs.

### System Management

Opérer **le système** : pool, campagnes, inboxes globales, jobs, santé moteur, overrides manuels transverses.

Les deux surfaces parlent au **même** backend de gestion. Elles ne dupliquent pas les règles du router.

---

## 5. Intentions (commandes)

Chaque ligne = intention UI. **Jamais** un calcul local. Le workflow cible est **À CONSTRUIRE** sauf mention.

| Intention | Commande (concept) | Le front affiche | Workflow |
|-----------|--------------------|------------------|----------|
| Créer un client | soumettre le formulaire (typer / fiche) | row créé + erreurs de validation | Onboarding |
| Sélectionner / configurer la niche | `set_niche` | niche persistée | Onboarding |
| Voir la date de 1re livraison | — (lecture) | `delivery_start_at` | First delivery |
| Voir le statut | — (lecture) | `lifecycle_status` | Eligibility / Lifecycle / sync |
| Voir les quotas | — (lecture) | quota + restant période | Capacity / Quota recalc |
| Voir les inboxes | — (lecture) | comptes liés, warmup | Inbox provisioning |
| Voir les tâches générées | — (lecture) | liste + états + deadlines | Task generation |
| Voir la progression | — (lecture) | étape lifecycle + tâches | Lifecycle |
| Mettre en pause | `pause_client` | statut `paused` | Lifecycle |
| Réactiver | `resume_client` | statut précédent autorisé | Lifecycle |
| Modifier des paramètres autorisés | `patch_client` (champs whitelist backend) | nouvelles valeurs persistées | selon champ |
| Voir prospects / RDV livrés | — (lecture) | assignments / bookings du client | Engine + routing |
| Voir les erreurs | — (lecture) | échecs jobs / tâches | tous |
| Intervenir manuellement | override admin explicite | audit + nouvel état | selon cas |

Le formulaire d’onboarding (React) : personne remplit → **ajout en database** → le backend enchaîne date de livraison, allocation d’inboxes, génération de tâches. Internal vs page client : **À DÉCIDER**.

---

## 6. Ce que le front ne fait pas

- Décider si un client **peut** recevoir des prospects aujourd’hui.
- Calculer le nombre de boîtes, le round-robin, les quotas.
- Avancer le lifecycle « en dur » sans transition backend.
- Dupliquer les flags modules de l’engine.

Le client **final** (acheteur d’acquisition) ne configure toujours pas scraping, copy, campagnes — [`architecture.md`](./architecture.md) §8. Ce document concerne l’UI **Hercule** (contrôle), pas un dashboard SaaS self-serve (hors scope).

---

## 7. Processus de spec

```
Backend moteur (canon actuel)
       ↓
Penser le front-end (ce fichier : intentions)
       ↓
Découvrir les actions de gestion
       ↓
Ajouter les workflows backend manquants ([`workflows.md`](./workflows.md) § gestion)
       ↓
Seulement ensuite spécifier le front-end (écrans, routes, composants)
```

Découvrir des workflows en concevant l’UI est **normal**. Les porter dans React ne l’est pas.

Chantier exécutable moteur (`build/` phases 00–15, D1–D22) : **inchangé**. Gestion clientèle = **deuxième chantier conceptuel** — [`implementation-plan.md`](./implementation-plan.md) Phase 7.

---

## 8. Index lié

| Fichier | Lien |
|---------|------|
| [`architecture.md`](./architecture.md) §5 | Trois couches |
| [`workflows.md`](./workflows.md) | W-G* gestion + W11 élargi |
| [`states.md`](./states.md) | Couche CRM / lifecycle (séparée) |
| [`data-model.md`](./data-model.md) | `clients`, `delivery_start_at`, tâches |
| [`routing.md`](./routing.md) | Gate éligibilité + date |
| [`events.md`](./events.md) | `client.*` haut niveau |
