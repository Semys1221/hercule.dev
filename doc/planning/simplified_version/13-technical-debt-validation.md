# 13 — Dette technique (lecture seule)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · [../13-technical-debt-validation.md](../13-technical-debt-validation.md)  
> **Rien à cocher** — inventaire pour contexte ; les suppressions passent par LEG-* et BND-*.

---

## En bref

Ce fichier liste ce qui est **cassé, doublonné ou obsolète** dans le code et la doc. Ce n’est pas un questionnaire : tu ne choisis pas A/B/C ici.

### Applications et routes

| Problème | Pourquoi ça gêne | Question liée |
|----------|------------------|---------------|
| Script `streamlit-funnels` sans app | Confusion | — |
| Dossier `streamlit_enrich` vide | Bruit | — |
| Ancienne session admin supprimée | Doc / env pas alignés | [SEC-01](./12-security-permissions-validation.md) |
| Deux dossiers `documentation_2` | Les agents lisent la mauvaise doc | [BND-01](./14-implementation-boundaries-validation.md) |
| Panneaux UI sans page | Code mort probable | [SUR-01](./06-surfaces-validation.md) |

### Données

| Problème | Question liée |
|----------|---------------|
| Pas encore de table `matches` | [FND-05](./01-foundations-validation.md) |
| Statuts mélangés (vente vs livraison) | [FND-01](./01-foundations-validation.md) |
| Fiches avec `profile` vide | Onboarding |

### Logique en double

| Problème | Question liée |
|----------|---------------|
| Instantly envoyé depuis Next **et** Streamlit | [LEG-02](./18-legacy-ops-validation.md) |
| FAQ / pricing vs CGV | [CPY-03](./09-copywriting-validation.md), [CVG-02](./20-cvg-validation.md) |
| Deux cockpits admin (Streamlit vs Next) | [FND-02](./01-foundations-validation.md) |

### Workarounds temporaires

- Date `BOOKING_GO_LIVE_AT` pour les anciens leads → [LEG-03](./18-legacy-ops-validation.md)
- Mots différents (`lead` vs `client`, `BOOKED` vs `MEETING_BOOKED`) → à figer après [FND-01](./01-foundations-validation.md)

**Détail technique complet** → [../13-technical-debt-validation.md](../13-technical-debt-validation.md)
