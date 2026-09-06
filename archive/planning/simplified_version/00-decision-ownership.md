# Qui décide quoi

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Identique à [../00-decision-ownership.md](../00-decision-ownership.md)  
> **Pas de cases à cocher** dans ce fichier.

---

## En bref

| **Tu décides (business)** | **L’équipe tech décide** |
|---------------------------|--------------------------|
| Qui paie, qui ne paie pas | Comment le code est écrit |
| Prix, offres 1489 / 898 / 2500 | Erreurs, retry, sécurité technique |
| Ce que voient agence et entreprise | Outils (frameworks, base de données) |
| Quand la recherche démarre, qui met en lien | Détail des routes et emails techniques |
| Promesses CGV (délais, no-show) | |

Les questions commencent par **BIZ-** (intention métier) ou **FND-**, **SUR-**, etc.  
Les **ENG-** = déjà décidé par la tech. **Ne pas les recocher.**

---

## Ordre important

1. D’abord **[22-business-intent-validation.md](./22-business-intent-validation.md)** (`BIZ-*`)
2. Ensuite le reste (`FND-*`, …)

Si une réponse plus bas contredit un `BIZ-*` déjà coché → il faut corriger avant de continuer.

---

## ENG — déjà tranché (ne pas cocher)

Résumé en une ligne chacun :

- **ENG-01** — Pas de table « communications » séparée pour les emails
- **ENG-02** — Les emails partent par le système Next (pas l’ancien outil Python)
- **ENG-03** — La base de données est la vérité côté serveur
- **ENG-04** — En production, les accès automatiques doivent être protégés
- **ENG-05 à ENG-14** — Détails techniques (jobs, enum, crons…) → voir doc parent
- **ENG-15** — Ne pas recréer l’ancien éditeur Streamlit ; tout passe par `/internal`
- **ENG-16** — Le contrat CGV reste en texte ; le code utilise des constantes alignées
- **ENG-17** — Un seul style visuel ; si suivi des appels de vente → en base, pas sur un fichier local

Si une décision ENG va à l’encontre de ce que tu veux business : note « Intention produit : … » sous la question concernée.
