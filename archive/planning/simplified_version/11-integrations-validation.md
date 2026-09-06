# 11 — Paiement et outils externes

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../11-integrations-validation.md](../11-integrations-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- **Calendly** pour les RDV, **Resend** pour les emails auto, **Instantly** pour le froid.
- **Stripe** et **login Clerk** ne sont **pas** dans le code aujourd’hui.

---

## Questions

#### [INT-01] Comment l’agence **paie** au MVP : manuellement ou via Stripe ?

- [ ] **A (recommandé)** — **Manuel** : tu confirmes 1 489 € / 898 € (et l’entrée ~1 500 €) ; **pas de Stripe** tant que l’abo 2 500 € n’est pas choisi côté produit.
- [ ] **B** — **Aucun paiement dans le code** (comme le live actuel) : même pas de bouton « paiement confirmé ».
- [x] **C** — **Stripe** (lien ou checkout) + webhook pour confirmer automatiquement.

---



#### [INT-02] Instantly, les relances froides (E1–E3) et l’**agent IA** qui répond : partie du **produit** Hercule ou **outils ops** à part ?

- [x] **A (recommandé)** — **Outils ops** : documentés, maintenus, **hors** modules livraison ; le produit prend les leads déjà confirmés / payés.
- [ ] **B** — **Tout un seul produit** : `/internal` doit piloter Instantly / IA comme le matching.
- [ ] **C** — **Sortir** Instantly / IA du repo à moyen terme.

---



#### [INT-03] Le **scraper** (trouver des entreprises) et le **nettoyeur d’emails** : on les garde dans Streamlit ou on les met dans Next ?

- [x] **A (recommandé)** — **Oui, hors Next** : pas d’outil scraper dans `/internal`.
- [ ] **B** — **Migrer** dans `/internal` comme l’éditeur de funnels.
- [ ] **C** — **Abandonner** / autre fournisseur.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| INT-01 | C | Stripe lien/checkout + webhook ; ops envoie le lien |
| INT-02 | A | Instantly/IA = outils ops hors livraison |
| INT-03 | A | Scraper hors Next |


