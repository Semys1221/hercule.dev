# 12 — Qui accède à quoi

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../12-security-permissions-validation.md](../12-security-permissions-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

---

## Ce qu’on garde

- Les **liens secrets** (slug) donnent accès aux pages RDV sans compte.
- L’**outil interne** et les **API admin** sont sensibles : quiconque a l’URL peut modifier des contenus.

---

## Questions

#### [SEC-01] `/internal` et les API admin : doivent-ils rester **sans login**, comme écrit dans le README internal ?

- [ ] **A (recommandé)** — **Non** : ajouter une **vraie auth** (mot de passe partagé / SSO) au moins sur les **modifications**. Ce n’est pas un portail client agence.
- [x] **B** — **Oui** : **zéro login** ; URL non publique + pas d’index Google suffisent.
- [ ] **C** — Login seulement hors prod locale ; en prod protection Vercel / firewall, sans écran de login dans l’app.

*Aligner avec [API-01](./05-api-webhooks-crons-validation.md).*

---



#### [SEC-02] Les pages **réservation / confirmation** (slug) et le **questionnaire** : toujours **sans compte client** ?

- [x] **A (recommandé)** — **Oui** : lien secret ou token ; **pas de compte** client au MVP.
- [ ] **B** — **Login client** (Clerk ou autre) pour suivi + questionnaire.
- [ ] **C** — Slug pour la **vente** seulement ; le **suivi produit** exigera un login.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| SEC-01 | B | Zéro login /internal |
| SEC-02 | A | Slug/token, pas de compte client |


