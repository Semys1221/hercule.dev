# 04 — Emails automatiques et no-show

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../04-orchestration-validation.md](../04-orchestration-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **emails de rappel** après un RDV d’appel commercial (H-48, H-24, etc.) fonctionnent déjà.
- Les emails partent via le **même moteur** (file d’attente + envoi planifié).

---

## Questions

#### [ORCH-01] Après un RDV **livraison** (agence↔entreprise), comment passe-t-on au questionnaire ou au no-show ?

- [x] **A (recommandé)** — **Tu** (ou le client via un parcours) marques « RDV fait » ou « no-show ». Pas de détection auto fiable côté Calendly.
- [ ] **B** — **Rien** après le book ; pas de questionnaire auto au MVP.
- [ ] **C** — **Automatique** quand Calendly dit que le RDV est fini (ou cron).

*Pourquoi ça compte : CGV no-show 48 h, questionnaire post-RDV.*

---



#### [ORCH-02] Les emails de **vente** (après book appel Hercule) restent-ils séparés des emails de **livraison** ?

- [x] **A (recommandé)** — **Oui**, deux familles d’emails ; même moteur technique mais types différents.
- [ ] **B** — On **éteint** les emails vente quand la livraison est live.
- [ ] **C** — **Un seul** éditeur de séquences pour tout dès le MVP.

---



#### [ORCH-03] Quand l’agence **paie** (1489 ou 898), est-ce que les **emails de relance** (nurturing) s’arrêtent **tout de suite** ?

- [x] **A (recommandé)** — **Oui**, immédiatement quand tu confirmes le paiement.
- [ ] **B** — Pas de nurturing au MVP.
- [ ] **C** — Arrêt **plus tard** (risque d’un email après paiement).

---



## Réponses


| ID      | Choix | Notes |
| ------- | ----- | ----- |
| ORCH-01 | A | Fin RDV / no-show = acte admin ou client |
| ORCH-02 | A | Deux familles email, même moteur |
| ORCH-03 | A | Stop nurturing immédiat au paiement |


