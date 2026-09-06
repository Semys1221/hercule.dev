# 19 — Outil interne `/internal`

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../19-internal-admin-validation.md](../19-internal-admin-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- `/internal` a déjà l’éditeur de funnels, FAQ, pricing, fiches onboarding.
- Les **emails vente** et les **actions** (no-show, etc.) pointent encore vers Streamlit ou sont absents.
- Les pages **composants / base** sont un inventaire, pas le cockpit ops complet.

---

## Questions

#### [ADM-01] `/internal` doit-il être le **cockpit ops** à trois rôles : éditer le live, éditer la doc qui se propage, **déclencher** les workflows ?

- [x] **A (recommandé)** — **Oui** : contrat produit ; Streamlit temporaire jusqu’à parité (FND-02 A).
- [ ] **B** — **Non** : `/internal` = contenu + funnels ; l’ops métier reste Streamlit.
- [ ] **C** — **Split** : docs + contenu dans Next ; **actions** (no-show, envoi) restent Streamlit.

---



#### [ADM-02] L’**édition et la prévisualisation** des emails vente (sujet, HTML, délais) : dans `/internal` ou Streamlit ?

- [x] **A (recommandé)** — **Oui dans** `/internal` ; la base et l’envoi restent côté Next.
- [ ] **B** — **Garder** Streamlit `booking_resend` comme éditeur.
- [ ] **C** — `/internal` = **preview seulement** ; édition en SQL / scripts.

---



#### [ADM-03] Les actions **no-show**, « RDV fait », « renvoyer questionnaire » : depuis une **table de RDV** dans `/internal` ?

- [x] **A (recommandé)** — **Oui** : table interne ; clic déclenche la suite (après ORCH-01).
- [ ] **B** — **Pas de table** au MVP ; no-show = Streamlit ou hors app (CGV 48 h).
- [ ] **C** — **API / script** seulement, sans écran tableau.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| ADM-01 | A | /internal = édition + docs + triggers |
| ADM-02 | A | Édition emails vente dans /internal |
| ADM-03 | A | Table RDV interne pour no-show / RDV fait |


