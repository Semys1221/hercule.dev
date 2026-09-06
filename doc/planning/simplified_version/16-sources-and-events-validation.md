# 16 — Où est la vérité (RDV, stats, délais)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../16-sources-and-events-validation.md](../16-sources-and-events-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- La **base** est la référence pour les fiches agence / entreprise.
- Un RDV d’**appel commercial** et un RDV de **livraison** (match) ne sont pas la même chose.
- Les emails planifiés ont leur propre file d’attente.

---

## Questions

#### [SOT-01] Les RDV de **livraison** (compteur, lien avec l’entreprise, no-show) : faut-il une **fiche RDV séparée** du RDV d’appel commercial sur la même ligne ?

*Aujourd’hui : une seule ligne Calendly par lead — risque d’écraser le RDV vente.*

- [x] **A (recommandé)** — **Oui** : table (ou équivalent) **à part** ; le compteur « meeting 1, 2, 3… » se **calcule** depuis ces RDV, pas tapé à la main.
- [ ] **B** — **Non** : un seul RDV par fiche ; pas de compteur MEETING_n.
- [ ] **C** — Historique dans le **bloc JSON** de la fiche, sans table dédiée.

---



#### [SOT-02] Les **stats des campagnes** Instantly (froid) : quelle source fait foi en interne ?

- [ ] **A (recommandé)** — **API Instantly** = vérité ; cache local optionnel, rafraîchi à la main.
- [ ] **B** — **Fichier JSON local** comme archive ops, sans sync obligatoire.
- [x] **C** — **Sauvegarder en base** comme vérité interne.

---



#### [SOT-03] Les **délais des emails produit** (recherche lancée, match, après-RDV) : par fiche dans un bloc JSON, comme la spec ?

*Les emails vente utilisent des délais fixes dans le code.*

- [x] **A (recommandé)** — **Oui pour le produit** ; les emails vente gardent leurs délais en code (deux familles).
- [ ] **B** — **Tout** en code + templates ; pas besoin de délais par fiche.
- [ ] **C** — **Réglage global** (une table settings), pas par fiche.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| SOT-01 | A | Table appointments ; compteur dérivé |
| SOT-02 | C | Stats Instantly en base |
| SOT-03 | A | Délais produit dans profile ; vente en code |


