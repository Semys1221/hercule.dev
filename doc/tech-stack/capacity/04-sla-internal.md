# Capacity — SLA interne (alertes ops)

> Module : [Capacity](./README.md) · Voir aussi : [SLA client](./03-sla-client.md)

---

## 1. Intro (langage simple)

Cibles **plus serrées** que les promesses client — pour alertes Streamlit (onglet Capacity, phase C) et décisions ops quotidiennes.

---

## 2. Seuils d'alerte

| Signal | Seuil | Action |
|--------|-------|--------|
| J+10 sans U2 | Client actif, 0 match | Review ciblage / volume sends |
| J+25 sans U3 | Match proposé, 0 RDV booké | Relance entreprise / autre match |
| U4 < 2 à J+45 (@ 30 inbox) | Sous baseline (~7/mois) | Diagnostiquer funnel ; baseline prédit 3+ |
| Closes agence > `clients_max` | Acquisition > capacity | Stop signature ou commande batch +60 |
| Queue > 0 et warmup J+12 | Batch bientôt prêt | Pré-allouer inboxes, prévenir clients en file |
| Pool livraison < 20% libre | Capacité saturée | Waitlist only |

---

## 3. Cibles internes vs promesses client

| Jalon | Cible interne (@ 30) | Promesse client |
|-------|----------------------|-----------------|
| Activation après signature | ≤ 2j | ≤ 4j |
| 1er U4 | ≤ 14j après activation | ≤ 21j |
| 5 U4 cumulés | ≤ 28j | ≤ 35j |
| 10 U4 cumulés | ≤ 50j | ≤ 60j |

---

## 4. Règles vente bootstrap

| Règle | Détail |
|-------|--------|
| Max closes immédiats | **2** sans waitlist |
| 3e close | `QUEUED_WARMUP` — activation T+15 |
| 4e close+ | Interdit sans acceptation waitlist écrite |

---

## 5. Prompt d'action IA

```
SLA interne (doc/tech-stack/capacity/04-sla-internal.md).

- Alertes Streamlit Capacity tab
- Comparer deliverance_started_at + jours vs seuils U2/U3/U4
- Flag si closes_mois > clients_max

Références : crm/admin_tool.py (phase C), capacity/05-waiting-list.md
```
