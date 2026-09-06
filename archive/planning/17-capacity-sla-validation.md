# 17 — Capacity & SLA

> **GELÉ — 2026-09-06.** Validation terminée. Ne plus recocher. Canon de build : [`doc/README.md`](../README.md) · Clarifications : [`23-clarifications-post-validation.md`](./23-clarifications-post-validation.md)


Pré-validé dans l’ancien [`VALIDATION.md`](../archive/2026-09-pre-architecture/VALIDATION.md) Partie 1 bis (cases cochées **Oui**). Ce fichier **ne relance pas** 6 débats. Une seule confirmation : ces décisions tiennent-elles toujours ?

Sources : `doc/tech-stack/capacity/*`, `cvg_master.md`.

---

## PARTIE 1 — Ce qui a déjà été validé (produit)

| ID ancien | Décision | Doc |
|-----------|----------|-----|
| C-01 | 1er RDV honoré ≤ 21 j @ 30 inbox ; ≤ 28 j @ 15 constrained | capacity/03-sla-client.md |
| C-02 | 3–4 U4 honorés / mois @ 30 inbox ; 2–3 @ 15 ; plafond marketing 3–5 ≠ minimum contractuel | capacity/00-deliverables.md |
| C-03 | No-show : remplacement sous **14 jours ouvrés** (pas immédiat) | CGV § 10.1 |
| C-04 | 10 inbox agence fixe ; 30 inbox/client cible ; 15 si constrained ; warmup 15 j ; +60 par achat | capacity/01-inbox-model.md |
| C-05 | Bootstrap closes 14 j depuis 11 RDV ; ~2–3 closes ; max 2 immédiats + 1 QUEUED_WARMUP | capacity/09-bootstrap-timeline.md |
| C-06 | Funnel baseline entreprise 1/30/30/60 % ; agence 3/50/20/40 % | capacity/02-funnel-math.md |

**Code :** `buildDefaultProfile()` copie déjà des délais (21/35/60, queue_warmup 15). **Pas** d’allocation inbox réelle, pas de file d’attente, pas de compteur U4.

C’est de la **config JSON + promesse commerciale**, pas un moteur capacity.

---

## PARTIE 2

#### [CAP-01] Les décisions capacity C-01 à C-06 restent-elles la vérité **commerciale / SLA** à implémenter (même si le moteur inbox n’est pas le premier module) ?

- [x] **A (recommandé)** — Oui : elles restent ; l’implémentation technique (inbox pool, waiting list) peut être **plus tard**, mais copy, profile.delays et CGV ne doivent pas les contredire.
- [ ] **B** — Les rouvrir : une ou plusieurs C-* sont obsolètes (préciser lesquelles en notes).
- [ ] **C** — Capacity hors produit logiciel : ops humaine seulement, pas de champs `profile.capacity`.

**Impact si l’architecture change :** High si B/C (CGV + landing)  
**Domaines affectés :** CGV, landing, profile, SET-01, matching throughput  
**Ancien ID :** C-01–C-06, CF-08

Si B : lister les C-* invalidées sous la table.

---

## Réponses

| ID | Choix | Notes |
|----|-------|-------|
| CAP-01 | A | C-01…C-06 restent la vérité commerciale |
