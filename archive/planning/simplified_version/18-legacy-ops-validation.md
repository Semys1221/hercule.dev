# 18 — Anciens outils Streamlit

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../18-legacy-ops-validation.md](../18-legacy-ops-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Plusieurs **apps Streamlit** font encore tourner le CRM, les emails, Instantly, le scraper.
- **Next** envoie déjà certains emails ; les deux coexistent.

---

## Questions

#### [LEG-01] Quand Next aura un cockpit équivalent, que faire des Streamlit **CRM + emails** (`links`, `booking_resend`) ?

- [x] **A (recommandé)** — **Bascule** : Next reprend liens + templates ; Streamlit **déprécié** après parité, pas avant.
- [ ] **B** — **Garder** Streamlit indéfiniment comme cockpit CRM.
- [ ] **C** — **Éteindre tout de suite** (dangereux sans parité Next).

---



#### [LEG-02] Qui envoie les emails de **relance froid** Instantly (étapes E1–E3) : Next ou Streamlit ?

*Risque aujourd’hui : double envoi.*

- [x] **A (recommandé)** — **Next** envoie ; Streamlit = config / lecture seulement.
- [ ] **B** — **Les deux** chemins (état actuel).
- [ ] **C** — **Streamlit** envoie ; couper les crons Next.

---



#### [LEG-03] Faut-il encore un mode « **anciens leads** avant sept. 2026 sans séquence auto » ?

- [x] **A (recommandé)** — **Garder** tant qu’il reste des leads concernés ; puis supprimer le split.
- [ ] **B** — **Forcer** la séquence auto pour tout le monde maintenant.
- [ ] **C** — **Étendre** le split (nouvelles dates / flags).

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| LEG-01 | A | Streamlit déprécié après parité Next |
| LEG-02 | A | Next envoie Instantly E1–E3 |
| LEG-03 | A | Garder BOOKING_GO_LIVE_AT tant que besoin |


