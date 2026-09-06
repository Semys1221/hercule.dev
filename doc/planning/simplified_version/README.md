# Validation Hercule — version simple

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


**Pour qui :** marketing, fondateur, ops commercial. Pas besoin de lire le code.

**Version technique (même décisions) :** [../README.md](../README.md)

---

## 1. À quoi ça sert

Hercule a plusieurs docs qui ne disent pas toujours la même chose. Ce dossier pose **72 questions business** en langage courant. Tes réponses fixent ce que le produit doit faire **avant** que l’équipe tech construise.

Rien n’est codé ici. Tu coches des cases.

---

## 2. Ordre de remplissage

1. Lire [00-decision-ownership.md](./00-decision-ownership.md) (qui décide quoi — 5 min)
2. **[22-business-intent-validation.md](./22-business-intent-validation.md)** — intention métier (**en premier**)
3. Suivre [00-index.md](./00-index.md)
4. **14** en tout dernier

**C’est fini (2026-09-06).** Ne plus recocher. Suite : [`../../README.md`](../../README.md).

---

## 3. Comment répondre

- Une seule lettre par question : **A**, **B**, **C** (ou **D** si proposé)
- Tu peux ajouter une note sous la question
- Les cases `ENG-*` et `CF-*` : **ne pas cocher** (déjà tranché ou pointeur vers une autre question)

---

## 4. Mini-glossaire

| Mot | Sens court |
|-----|------------|
| **Attribution** | Une mise en relation qualifiée livrée à l’agence (avec RDV planifié) |
| **Délivrance** | Recherche active lancée pour trouver des entreprises pour l’agence |
| **Matching** | Mise en lien agence ↔ entreprise |
| **Survey** | Questionnaire après un RDV (« ça a marché ? ») |
| **MVP** | Première version du produit (pas tout tout de suite) |
| **Nurturing** | Emails de relance commerciale sur plusieurs semaines |
| **No-show** | Le prospect ne vient pas au RDV |

---

## 5. Pour l’agent IA

**Règle :** les IDs sont **identiques** au dossier parent `doc/planning/`.

| Ici | Là-bas |
|-----|--------|
| `simplified_version/22-business-intent-validation.md` → `BIZ-04` = **C** | `doc/planning/22-business-intent-validation.md` → tableau Réponses, `BIZ-04` = **C** |

**À faire quand l’utilisateur dit « c’est fini » :**

1. Lire **tous** les fichiers `simplified_version/*.md` remplis
2. Pour chaque ligne du tableau `## Réponses`, recopier la **même lettre** dans le fichier parent correspondant (même ID, même choix)
3. **Ne pas** réinterpréter : `FND-04 C` ici = `FND-04 C` en technique
4. Si une réponse contredit une autre (ex. `BIZ-*` vs `FND-*`), **stop** et poser une question ciblée
5. Les `ENG-*` : décisions tech déjà prises — ne pas demander de case
6. Les `CF-*` : lire [15-conflicts-validation.md](./15-conflicts-validation.md) ; la réponse est dans une question `BIZ-*` / `FND-*` / etc.

**Propagation :** simplified → parent → plan d’architecture définitif → code.

---

## 6. Liste des fichiers

| Fichier | Sujet | Questions |
|---------|-------|-----------|
| [22](./22-business-intent-validation.md) | Intention métier | 10 |
| [01](./01-foundations-validation.md) | Fondations produit | 16 |
| [03](./03-database-validation.md) | Suivi des étapes client | 2 |
| [04](./04-orchestration-validation.md) | Emails auto, no-show | 3 |
| [05](./05-api-webhooks-crons-validation.md) | Accès outil admin | 1 |
| [06](./06-surfaces-validation.md) | Pages client | 4 |
| [07](./07-funnels-validation.md) | Pages de vente | 2 |
| [08](./08-email-sequences-validation.md) | Séquences email | 5 |
| [09](./09-copywriting-validation.md) | Textes et prix affichés | 4 |
| [10](./10-settings-validation.md) | Réglages globaux | 2 |
| [11](./11-integrations-validation.md) | Paiement, outreach | 3 |
| [12](./12-security-permissions-validation.md) | Qui accède à quoi | 2 |
| [14](./14-implementation-boundaries-validation.md) | Par quoi commencer | 2 |
| [16](./16-sources-and-events-validation.md) | Où est la vérité | 3 |
| [17](./17-capacity-sla-validation.md) | Promesses délais/volume | 1 |
| [18](./18-legacy-ops-validation.md) | Anciens outils | 3 |
| [19](./19-internal-admin-validation.md) | Outil interne `/internal` | 3 |
| [20](./20-cvg-validation.md) | Contrat CGV | 2 |
| [21](./21-sales-ops-validation.md) | Suivi appels de vente | 2 |
| [02](./02-components-validation.md) | Catalogue composants | 2 |
| [13](./13-technical-debt-validation.md) | Lecture seule | 0 |
| [15](./15-conflicts-validation.md) | Lecture seule | 0 |

**Total : 72 questions** (hors ENG / CF).
