# 20 — Contrat (CGV)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../20-cvg-validation.md](../20-cvg-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **CGV** sont des fichiers markdown (`cvg_master`, `cvg_entreprise`), pas un JSON Streamlit.
- Le site et `/internal` les **affichent** ; l’édition complète n’est pas encore activée.
- Le **pricing** du site peut diverger du contrat — à éviter.

---

## Questions

#### [CVG-01] Où vit la **version officielle** du contrat ?

- [x] **A (recommandé)** — **Markdown** dans `doc/tech-stack/` ; `/internal` peut les modifier ; tout passe par le même chargeur que le site.
- [ ] **B** — **Base de données** (versioning, trace à l’acceptation).
- [ ] **C** — **CMS JSON** (modèle ancien Streamlit) ; markdown abandonné ou généré.

---



#### [CVG-02] Qui peut **modifier** les CGV, et le **pricing** du site peut-il dire autre chose que le contrat ?

- [x] **A (recommandé)** — Éditeur internal **« c’est le contrat »** ; pricing / FAQ **dérivent** ou citent les mêmes chiffres.
- [ ] **B** — CGV = **git / juridique** seulement ; `/internal` reste lecture seule.
- [ ] **C** — Le pricing **peut diverger** pour le marketing (landing ≠ contrat).

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| CVG-01 | A | Markdown tech-stack SoT contrat |
| CVG-02 | A | Pricing/FAQ dérivent du contrat |


