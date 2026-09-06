# Package de validation — Hercule

## 1. Pourquoi ce package existe

Le code, `doc/tech-stack/`, `doc/documentations_2/` et `doc/documentation_2/` décrivent **plusieurs architectures produit** qui ne coïncident pas. Une partie du système est en production (CRM Instantly → Calendly → Resend). Une autre n’existe que dans la documentation (matching, délivrance, post-RDV, compteurs `MEETING_n`).

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

**Total questions produit : 72** (hors `ENG-*` / `CF-*`). Compteurs et graphe : [00-index.md](./00-index.md).

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
| `V-` / `D-` / `C-` | — | Ancien [VALIDATION.md](../tech-stack/VALIDATION.md), mappé ici |

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

## 6. Ce qui sera reporté après vos réponses

Quand vous indiquerez que la validation est terminée, l’agent :

1. Lira **tous** les documents remplis.
2. Produira un **plan d’architecture définitif** (CONFIRMED / RECOMMENDED / REJECTED / DEPRECATED / NEW / UNCHANGED / MIGRATION REQUIRED).
3. Résoudra les `CF-*` à partir de vos réponses.
4. S’arrêtera si deux réponses créent une contradiction technique, au lieu d’implémenter l’impossible.
5. N’écrira le code qu’après validation de ce plan définitif.

## 7. Ce que ce package ne fait pas

- Ne choisit pas silencieusement entre les trois machines d’état produit.
- Ne supprime pas Streamlit, Instantly, ni les tables CRM.
- Ne réécrit pas encore `doc/tech-stack/` (archivage **après** vos réponses).
- Ne corrige pas les secrets fail-open dans le code (décision `ENG-*`, implémentation plus tard).
