# Capacity — SLA client (promesses externes)

> Module : [Capacity](./README.md) · Voir aussi : [SLA interne](./04-sla-internal.md) · [Bootstrap timeline](./09-bootstrap-timeline.md)

---

## 1. Intro (langage simple)

Ce document liste ce que tu peux **promettre par écrit** au client payant — avec buffer par rapport aux cibles internes. Deux phases : **bootstrap** (pool 60, warmup en cours) et **stable** (pool 120, T+15+).

---

## 2. À la signature / onboarding

| Étape | Promesse client | Condition |
|-------|-----------------|-----------|
| Accès onboarding | **48h** après paiement | Client remplit le form |
| Démarrage recherche (U1) | **J+0 à J+4** | J+4 si rétractation légale |
| File d'attente | **+15 jours max** | Batch warmup ou capacité saturée — position communiquée |

---

## 3. Premiers livrables (après activation envoi)

| Étape | Bootstrap | Stable (T+15+, pool 120) |
|-------|-----------|--------------------------|
| Première proposition match (U2) | **14–21j ouvrés** | **14–21j ouvrés** |
| Premier RDV booké (U3) | **21–35j ouvrés** | **21–35j ouvrés** |
| **Premier RDV honoré (U4)** | **≤ 21j** @ 30 inbox · **≤ 28j** @ 15 | **≤ 21j** @ 30 inbox |
| **5 U4 cumulés** | **≤ 35j** @ 30 · **≤ 45j** @ 15 | **≤ 35j** @ 30 |
| **10 U4 cumulés** | **≤ 60j** @ 30 (si applicable) | **≤ 60j** @ 30 |

Phase bootstrap = **+7j** de marge implicite + mention « montée en charge infrastructure » pour clients @ 15 ou en file.

---

## 4. Rythme mensuel (client actif)

| Allocation | Promesse U4/mois | Modèle prédit |
|------------|------------------|---------------|
| **30 inbox** | **3–4 honorés / mois** | ~7 |
| **15 inbox** (constrained) | **2–3 honorés / mois** | ~3,6 |

| Métrique | Promesse |
|----------|----------|
| Match → RDV booké | **5–10 jours ouvrés** |
| No-show replacement | **Sous 14 jours** (pas « immédiat » — voir note contrat) |

---

## 5. Copy waitlist (exemple client #2 @ 15 inbox)

> Votre 1er RDV qualifié est estimé sous **28 jours** après activation. Les **5 premiers RDV** sous **45 jours**. Passage en allocation complète (30 inboxes) le **{infrastructure_ready_at}**.

---

## 6. Calendrier commercial Henri (funnel agence — interne vente)

| Métrique | Baseline |
|----------|----------|
| RDV commerciaux / mois | ~13 (10 inbox) |
| Closes possibles / mois | ~5 |
| **Règle** | Max **2 closes immédiats** + 1 en file warmup en phase bootstrap |

---

## 7. Réponses pré-validées (ex-sop E2.2 / E3.x)

Décisions documentées pour [VALIDATION.md](../VALIDATION.md) :

| Question | Décision doc |
|----------|--------------|
| Délai onboarding → 1er RDV livré (U4) | **≤ 21j** après activation @ 30 inbox ; **≤ 28j** @ 15 |
| Volume RDV/mois | **3–4** promis @ 30 inbox (plafond marketing 5) |
| No-show replacement | **Sous 14 jours** |
| Signal → appel live qual | **24–48h** (interne — non promis « immédiat » landing) |
| Qualif → RDV calendrier | **5–10 jours ouvrés** après match (U2 → U3) |

---

## 8. Prompt d'action IA

```
SLA client (doc/tech-stack/capacity/03-sla-client.md).

- Promesses depuis allocation inbox + capacity_phase bootstrap|stable
- computeDeliveranceMilestones → estimated_first_u4_at, estimated_five_u4_at, estimated_ten_u4_at
- Copy waitlist si queue_status != none

Références : capacity/06-profile-integration.md, capacity/09-bootstrap-timeline.md
```
