# Module — Deliverance

Timeline suivi read-only client + emails datés depuis profile.

| Ligne | Fichier |
|-------|---------|
| DB | [db.md](./db.md) |
| Front client | [front-client.md](./front-client.md) — **GET only** — page suivi complète (timeline, FAQ, support) |
| Front interne | [front-interne.md](./front-interne.md) |
| Communication | [communication.md](./communication.md) |

### Page suivi client (`/suivi/[category]/[link]`)

Spec complète dans [front-client.md](./front-client.md) :

| Section | Contenu |
|---------|---------|
| Structure UI | En-tête, timeline, bandeau statut, FAQ, support, footer |
| FAQ | Questions agence (A1–A8) ou entreprise (E1–E7), filtrées par `category` |
| Support | Texte-only — `contact@hercule.dev`, réponses lun–sam 9 h–12 h, sans bouton |

Prérequis : [Onboarding](../onboarding/README.md)

Suite : [Matching](../matching/README.md)

Retour : [Vue d'ensemble](../00-overview.md)
