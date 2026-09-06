# Module — Capacity & SLA

```
status: canonical
audience: coding-agent
depends_on: ../00-decisions.md, ../constants-commercial.md, ../cvg_master.md
decisions: CAP-01
do_not:
  - Facturer 149 € / U4
  - Utiliser MEETING_10 comme jalon contractuel
  - Promettre 898 = 3 cycles
  - Contredire C-01…C-06
```

**SoT « quoi promettre ».** Comment livrer : [modules/deliverance.md](../modules/deliverance.md).  
Moteur inbox **plus tard** OK (CAP-01) : les **chiffres** restent vrais.

## C-01…C-06 (inchangés)

| ID | Règle |
|----|--------|
| C-01 | 1er RDV honoré ≤ 21 j @ 30 inbox ; ≤ 28 j @ 15 constrained |
| C-02 | 3–4 U4 honorés / mois @ 30 ; 2–3 @ 15 ; plafond marketing 3–5 ≠ minimum |
| C-03 | No-show : remplacement **14 jours ouvrés** |
| C-04 | 10 inbox agence fixe ; 30 inbox/client cible ; 15 constrained ; warmup 15 j ; +60 par achat |
| C-05 | Bootstrap closes 14 j depuis 11 RDV ; ~2–3 closes ; max 2 immédiats + 1 QUEUED_WARMUP |
| C-06 | Funnel baseline entreprise 1/30/30/60 % ; agence 3/50/20/40 % |

## Unités (recalées offres 2026-09-06)

| Unité | Sens | Preuve |
|-------|------|--------|
| U1 | Activation recherche | `product_statut=IN_DELIVERANCE` après **PAID** |
| U2 | Match proposé | `matches.open` |
| U3 | RDV **planifié** = Attribution consommée | `appointments.scheduled` |
| U4 | RDV **honoré** (SLA volume C-02, pas une ligne de facture) | `appointments.completed` |
| U5 | Remplacement no-show | recrédit + nouvel U3 |

**Facturation :** offre 1 489 €/mois ou pack 2 967 € — **pas** 149 €/U4.

## Index (détail inbox / funnel — nombres C-* toujours valides)

Les fichiers `01-inbox-model.md` … `09-bootstrap-timeline.md` décrivent le **moteur** inbox. Ils peuvent encore citer d’anciens prix : **ignorer les prix**, garder les maths inbox. Canon des prix = CGV + constants.

- [00-deliverables.md](./00-deliverables.md)
- [01-inbox-model.md](./01-inbox-model.md)
- [02-funnel-math.md](./02-funnel-math.md)
- [03-sla-client.md](./03-sla-client.md)
- [04-sla-internal.md](./04-sla-internal.md)
- [05-waiting-list.md](./05-waiting-list.md)
- [06-profile-integration.md](./06-profile-integration.md)
- [09-bootstrap-timeline.md](./09-bootstrap-timeline.md)

`07-doc-corrections.md` et `08-implementation-roadmap.md` : **legacy** (Streamlit / anciens modules). Suivre [../13-implementation-roadmap.md](../13-implementation-roadmap.md).
