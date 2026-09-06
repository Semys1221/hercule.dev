# Package de validation — Hercule

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


## 1. Pourquoi ce package existe

Le code, `doc/tech-stack/` (canon actuel) et l’archive `doc/archive/2026-09-pre-architecture/` décrivent l’état **avant** gel. Ce package a fixé les décisions. Ne plus recocher.

Ce package n’implémente rien. Il établit une **couche de validation** : ce qui est réellement en place, ce qui est cohérent, ce qui entre en conflit, et les décisions produit sans lesquelles aucune architecture définitive n’est honnête.

Hiérarchie respectée :

```
code + documentation existants
        ↓
audit ingénierie
        ↓
documents de validation (ici)
        ↓
vous confirmez les décisions
        ↓
plan d’architecture définitif
        ↓
documentation définitive
        ↓
infrastructure / modules / tests
```

## 2. Ce qui a été audité

- `doc/` (tech-stack, SOP, documentations_2, documentation_2, outreach copy, VALIDATION.md)
- Routes App Router, APIs, webhooks, crons
- 35 migrations Supabase (17 tables migrées)
- Orchestrateurs TypeScript (`booking-communication`, `instantly-bypass`, `ai-reply-agent`, `link-tracking`)
- Apps Streamlit + package Python `crm/`
- Pages HTML publiques de réservation
- Funnel builder `/internal` + `content/funnels/`
- Intégrations : Supabase, Calendly, Resend, Instantly, xAI/Grok, cron-job.org, Outscraper, Pappers, MyEmailVerifier
- Variables d’environnement, auth, RLS

**Aucune modification de code de production** n’a été faite pendant cet audit.

## 3. Organisation

| Fichier | Rôle |
|---------|------|
| [00-index.md](./00-index.md) | Index, graphe de dépendances, compteurs de décisions |
| [00-decision-ownership.md](./00-decision-ownership.md) | Produit vs ingénierie, décisions `ENG-*` déjà tranchées |
| [01-foundations-validation.md](./01-foundations-validation.md) | Modèle produit, machines d’état, qui écrit |
| [02-components-validation.md](./02-components-validation.md) | Composants significatifs + inventaire classé |
| [03-database-validation.md](./03-database-validation.md) | Inventaire tables / colonnes |
| [04-orchestration-validation.md](./04-orchestration-validation.md) | Jobs, files, workflows |
| [05-api-webhooks-crons-validation.md](./05-api-webhooks-crons-validation.md) | Routes, webhooks, crons |
| [06-surfaces-validation.md](./06-surfaces-validation.md) | Marketing, client, interne, HTML public |
| [07-funnels-validation.md](./07-funnels-validation.md) | Funnels sales (fichiers) vs funnel produit |
| [08-email-sequences-validation.md](./08-email-sequences-validation.md) | Séquences Resend / Instantly / spécifiées |
| [09-copywriting-validation.md](./09-copywriting-validation.md) | Copy métier, hors logique technique |
| [10-settings-validation.md](./10-settings-validation.md) | Valeurs configurables |
| [11-integrations-validation.md](./11-integrations-validation.md) | Services externes |
| [12-security-permissions-validation.md](./12-security-permissions-validation.md) | Auth, secrets, surfaces |
| [13-technical-debt-validation.md](./13-technical-debt-validation.md) | Dette, morts, doublons |
| [14-implementation-boundaries-validation.md](./14-implementation-boundaries-validation.md) | Périmètre MVP / hors scope |
| [15-conflicts-validation.md](./15-conflicts-validation.md) | Conflits CF-* non fusionnés |
| [16-sources-and-events-validation.md](./16-sources-and-events-validation.md) | Sources de vérité + événements métier |
| [17-capacity-sla-validation.md](./17-capacity-sla-validation.md) | Promesses capacity déjà pré-validées |
| [18-legacy-ops-validation.md](./18-legacy-ops-validation.md) | Streamlit, CRM Python, outils ops |
| [19-internal-admin-validation.md](./19-internal-admin-validation.md) | Console `/internal` : édition, docs canoniques, triggers |
| [20-cvg-validation.md](./20-cvg-validation.md) | SoT CGV, write-back, consommateurs |
| [21-sales-ops-validation.md](./21-sales-ops-validation.md) | Appels de vente, métriques, sales entreprise |
| [22-business-intent-validation.md](./22-business-intent-validation.md) | Intention métier (offre, unité, paiement, pack) — **à remplir en premier** |
| [simplified_version/README.md](./simplified_version/README.md) | **Même package en langage simple** (marketing / PO) — IDs identiques |

**Total questions produit : 72**

Chaque domaine a **deux parties** :

1. **Ce qui est valide** — à confirmer : « oui, c’est ce que je veux garder ».
2. **Ce qui doit changer** — écart, risque, recommandation, **question produit**.

## 4. Comment remplir

1. Lire [00-decision-ownership.md](./00-decision-ownership.md). Les `ENG-*` ne se cochent pas : ce sont des décisions d’ingénierie.
2. Remplir [22-business-intent-validation.md](./22-business-intent-validation.md) **en premier** (`BIZ-*`). Puis suivre [00-index.md](./00-index.md) dans l’ordre des dépendances (fondations → base → intégrations → …).
3. Pour chaque question `[PREFIX-NN]`, cocher **une seule** case A, B ou C.
4. Si C demande une précision (`____`), l’écrire sous la question.
5. Ne pas modifier le code, le schéma, ni les documents hors `doc/planning/` pendant la validation.

**Consignes :**

> Remplissez les documents de validation, puis dites à l’agent que la validation est terminée (`c’est fini`). Ne modifiez plus les réponses ensuite sans demander explicitement une nouvelle revue d’architecture.

## 5. Signification des IDs

| Préfixe | Propriétaire | Signification |
|---------|--------------|---------------|
| `BIZ-` | Produit | Intention métier (offre, unité, pack) — **avant** `FND-*` |
| `FND-` | Produit | Fondations / modèle métier |
| `DB-` | Produit | Intention de modèle de données |
| `ORCH-` | Produit | Comportement des workflows (pas le retry) |
| `API-` | Produit | Comportement exposé (pas la forme HTTP) |
| `SUR-` | Produit | Surfaces utilisateur |
| `FUN-` | Produit | Funnels sales / matching |
| `EML-` | Produit | Séquences, cadences, déclencheurs |
| `CPY-` | Produit | Copy / terminologie métier |
| `SET-` | Produit | Réglages configurables |
| `INT-` | Produit | Quels services restent dans le produit |
| `SEC-` | Produit | Politique d’accès (pas fail-closed secrets) |
| `CAP-` | Produit | SLA / capacity |
| `LEG-` | Produit | Devenir des outils ops / Streamlit |
| `BND-` | Produit | Frontières d’implémentation |
| `SOT-` | Produit | Source de vérité d’un fait métier |
| `ADM-` | Produit | Console `/internal` (édition, docs, triggers) |
| `CVG-` | Produit | Contrat / CGV (pas le copy marketing) |
| `SAL-` | Produit | Sales-ops (appels, issues, entreprise) |
| `COMP-` | Produit | Catalogue composants / registry |
| `UI-` | Produit | Périmètre du langage visuel |
| `CF-` | — | Conflit documenté (la décision est une question ailleurs) |
| `ENG-` | Ingénierie | **Décidé.** Pas une question. |
| `V-` / `D-` / `C-` | — | Ancien [`VALIDATION.md`](../archive/2026-09-pre-architecture/VALIDATION.md), mappé ici |

Format d’une question produit :

```
[FND-01] Phrase en une ou deux phrases se terminant par ?

Contexte (pourquoi ça compte). Recommandation ingénierie si elle existe.

- [ ] A (recommandé) — …
- [ ] B — Préserver l’architecture actuelle / la doc actuelle
- [ ] C — Alternative réellement différente

Impact si l’architecture change : High | Medium | Low
Domaines affectés : …
Ancien ID : V-xx / D-xx (si applicable)
```

## 6. Après validation (fait)

1. Réponses recopiées simplified → parents. Clarifications : [23-clarifications-post-validation.md](./23-clarifications-post-validation.md).
2. Plan d’architecture définitif : [`doc/tech-stack/00-decisions.md`](../tech-stack/00-decisions.md).
3. Spec de build pour agent IA : [`doc/README.md`](../README.md) + [`13-implementation-roadmap.md`](../tech-stack/13-implementation-roadmap.md).
4. Ancienne doc contradictoire : [`doc/archive/2026-09-pre-architecture/`](../archive/2026-09-pre-architecture/).

**Ne plus recocher.** Pour changer une décision : nouvelle revue d’architecture, pas d’édition silencieuse des cases.

## 7. Ce que ce package ne fait plus

- N’implémente pas le code (roadmap seulement).
- Ne corrige pas les secrets fail-open (étape 1 du roadmap, `ENG-04`).
