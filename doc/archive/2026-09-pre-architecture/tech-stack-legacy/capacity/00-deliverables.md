# Capacity — Livrables par client payant

> Module : [Capacity](./README.md) · Suite : [Inbox model](./01-inbox-model.md) · [SLA client](./03-sla-client.md)

---

## 1. Intro (langage simple)

Chaque agence payante reçoit un **flux de RDV entreprises qualifiés** dans son agenda. Pour éviter la confusion entre « RDV commercial Hercule », « match proposé » et « RDV facturable », on définit **5 unités** distinctes.

---

## 2. Unités de livraison

| Unité | Description | Déclencheur | Preuve en base |
|-------|-------------|-------------|----------------|
| **U1 — Activation service** | Recherche lancée, fiche en délivrance | Admin promote après onboarding | `IN_DELIVERANCE`, `deliverance_started_at` |
| **U2 — Proposition match** | Entreprise identifiée + email Calendly entreprise | Admin « Mettre en lien » | `MATCH_PROPOSED`, job `match_proposal_entreprise` |
| **U3 — RDV qualifié booké** | Créneau entreprise réservé dans agenda agence | Webhook Calendly match | `MEETING_BOOKED`, `scheduled_at` |
| **U4 — RDV honoré** | Décideur présent en visio | Confirmation post-RDV / admin | Facturable **149 €** |
| **U5 — Remplacement no-show** | Recrédit si absence H-24 | Garantie [cvg_master.md](../cvg_master.md) § 10.1 | Re-match ou nouveau U3 |

**Unité de facturation : U4 uniquement** (aligné contrat).

---

## 3. Promesse commerciale (calibrée funnel baseline)

| Allocation inbox | Promesse volume | Modèle prédit (U4/mois) |
|------------------|-----------------|-------------------------|
| **30 inbox** (standard) | **3 à 4 RDV honorés / mois** | ~7 U4 |
| **15 inbox** (constrained) | **2 à 3 RDV honorés / mois** | ~3,6 U4 |

- « **3–5 RDV/mois** » du contrat = **plafond marketing** — pas engagement minimum documenté.
- Promesse **safe** = 3–4 @ 30 inbox (marge ~×1,75 vs modèle).

---

## 4. Ce que le client voit (page suivi)

| Élément | Source |
|---------|--------|
| Progression U1 → U2 → U3 | `statut` + `deliverance_step` + `profile.display.timeline` |
| Compteur RDV honorés du mois | Comptage U4 (à implémenter) |
| Prochain jalon estimé | `profile.capacity.estimated_*_at` |
| Phase bootstrap vs stable | `profile.capacity.capacity_phase` |
| Position file d'attente | `profile.capacity.queue_position` |

---

## 5. Distinction cycles commerciaux

| Terme | Sens |
|-------|------|
| **RDV commercial agence** | Call vente Hercule (Calendly `/30min`) — funnel acquisition |
| **U3 / U4 match** | RDV entreprise ↔ agence partenaire — funnel livraison |
| **Pack 898 €** | 3 cycles match (doc [agence-commercial](../post-rdv/agence-commercial.md)) — distinct du rythme mensuel U4 |

---

## 6. Prompt d'action IA

```
Livrables capacity (doc/tech-stack/capacity/00-deliverables.md).

- Distinguer U1–U5 dans toute copy client et admin
- Facturation = U4 seulement
- Promesse volume depuis allocation inbox (30 → 3–4/mois, 15 → 2–3/mois)
- Page suivi : compteur U4 + dates profile.capacity

Références : capacity/02-funnel-math.md, capacity/03-sla-client.md
```
