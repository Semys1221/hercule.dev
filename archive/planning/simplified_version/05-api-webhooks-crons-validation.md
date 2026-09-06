# 05 — Accès outil admin (API)

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon : [`../../README.md`](../../README.md) · Clarifications : [`../23-clarifications-post-validation.md`](../23-clarifications-post-validation.md)


> Version simple · Décisions identiques à [../05-api-webhooks-crons-validation.md](../05-api-webhooks-crons-validation.md)  
> Coche ici ; l’agent recopiera les mêmes lettres dans le document technique.

Inventaire des routes → document parent.

---

## Ce qu’on garde

- Les outils internes (funnels, FAQ, fiches) passent par des **liens admin** déjà en place.
- Les emails et Calendly ont leurs **automatisations** côté serveur.

---

## Question

#### [API-01] Les liens admin (`/api/admin/*` : funnels, FAQ, pricing, demandes, onboarding) : accessibles **sans login**, comme le README internal actuel ?

*Même sujet que [SEC-01](./12-security-permissions-validation.md) — réponse cohérente attendue.*

- [ ] **A (recommandé)** — **Non** : exiger une **auth** (session, SSO ou mot de passe ops) sur **toutes les modifications**, y compris funnels.
- [x] **B** — **Oui** : **aucun login** ; l’URL n’est pas publique (politique actuelle).
- [ ] **C** — **Mix** : lecture ouverte en interne ; **création fiche** et **modif demandes** protégées.

---



## Réponses


| ID     | Choix | Notes |
| ------ | ----- | ----- |
| API-01 | B | Pas de login admin |


