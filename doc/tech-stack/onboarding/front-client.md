# Onboarding — Front client (React / Next.js)

> Module : [Onboarding](./README.md) · Lignes : [DB](./db.md) · [Front interne](./front-interne.md) · [Communication](./communication.md)  
> Contexte : [Vue d'ensemble](../00-overview.md) · [4 lignes](../01-four-lines-model.md)

---

## 1. Intro (langage simple)

Page formulaire pour agence ou entreprise. C'est la **dernière fois** qu'ils envoient des données qui modifient la base.

Après ça : pages suivi **100 % lecture seule** (sauf survey post-RDV plus tard).

---

## 2. Architecture développée (pour IA de coding)

### Routes

| Route | POST autorisé |
|-------|---------------|
| `/onboarding/agence` | Oui → `POST /api/onboarding/agence` |
| `/onboarding/entreprise` | Oui → `POST /api/onboarding/entreprise` |
| `/onboarding/merci` | Non (statique) |
| `/suivi/*` | **Non** — GET only |

### Champs form → `profile.form`

Inclure `droit_retractation` (bool) pour agences — impacte délais email (+4j).

### Règles read-only après onboarding

- Aucun bouton « avancer étape », « confirmer match », etc. sur le client
- Design : [`components/agence/`](../../../components/agence/)

---

## 3. Prompt d'action IA

```
Pages onboarding client (doc/tech-stack/onboarding/front-client.md).

- React Hook Form + Zod
- POST /api/onboarding/[category] — seule mutation client autorisée hors survey
- Redirect /onboarding/merci
- Documenter en commentaire : après onboarding, client read-only

Réutiliser : components/agence/demandes-section.tsx (style)

Tests : submit → 201 ; duplicate → 409 ; suivi pages sans POST
```
