# 09 — Textes et prix affichés

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../09-copywriting-validation.md](../09-copywriting-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **CGV** font référence pour les engagements (no-show 14 j ouvrés, pack Starter, etc.).
- Le site, les emails et l’outil interne doivent **dire la même chose** sur les prix et les mots clés.
- Plusieurs endroits stockent du texte (`content/`, fichiers markdown) — à unifier.

---

## Questions

#### [CPY-01] Faut-il garder **deux prix agence** distincts dans tous les textes : entrée ~1 500 € et renouvellement 1 489 € ?

- [ ] **A (recommandé)** — **Oui** : deux montants, textes et boutons séparés (premier achat vs renouvellement).
- [x] **B** — **Tout** à **1 489 €**/month sans engagement et 989x3=2 967 pour 3 mois donc 15 rdv avec une garantie de up to 15 remplacement si - de 4.5K ce CA en 3 mois. 
- [ ] **C** — **Tout** à **1 500 €** (ou un autre montant unique — préciser en note).

*Pourquoi ça compte : emails, landing, page questionnaire.*

---



#### [CPY-02] Dans l’email J+7 **entreprise** (après RDV), on garde le mot « onboarding » ?

- [x] **A (recommandé)** — **Non** : dire « collaboration / démarrage avec l’agence » (évite la confusion avec le formulaire agence).
- [ ] **B** — **Garder** « onboarding » tel quel.
- [ ] **C** — Formulation neutre : « Comment s’est passé votre projet ? »

---



#### [CPY-03] Où vit le texte **réutilisable** du site (FAQ, grille tarifaire) : fichiers `content/` ou markdown `doc/tech-stack` ?

- [x] **A (recommandé)** — Site public = `content/` ; **CGV légales** = fichiers contrat (`cvg_master.md`) — pas de double vérité.
- [ ] **B** — **Un seul** dossier markdown `doc/` pour tout.
- [ ] **C** — **Base de données** (nouveau système).

*Contrat vs marketing : voir aussi [CVG-01](./20-cvg-validation.md).*

---



#### [CPY-04] L’offre « **998 € / mois × 3 mois** » dans un ancien doc : offre réelle ou brouillon ?

- [ ] **A (recommandé)** — **Brouillon à ignorer** ; seulement 898 € one-shot + 1 489 € + 2 500 €/mois (CGV).
- [x] **B** — **Offre réelle** à ajouter (préciser en note) : **Tout** à **1 489 €**/month sans engagement et 989x3=2 967 pour 3 mois donc 15 rdv avec une garantie de up to 15 remplacement si - de 4.5K ce CA en 3 mois. Offre à 2500/month = vitrine jamais appliqué ni proposé. 
- [ ] **C** — **Remplace** l’offre 898 €.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| CPY-01 | B | 1489/mois ou 989×3=2967 / 15 RDV |
| CPY-02 | A | Pas le mot onboarding côté entreprise |
| CPY-03 | A | content/ site ; cvg_master contrat |
| CPY-04 | B | Offre réelle 1489 + 989×3 ; 2500 vitrine |


