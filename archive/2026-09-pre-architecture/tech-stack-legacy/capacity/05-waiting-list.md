# Capacity — File d'attente & reload

> Module : [Capacity](./README.md) · Voir aussi : [Inbox model](./01-inbox-model.md) · [Bootstrap timeline](./09-bootstrap-timeline.md)

---

## 1. Intro (langage simple)

Quand tu signes plus de clients que le pool inbox ne peut servir immédiatement — ou pendant le warmup 15j d'un batch +60 — le client entre en **file d'attente** avec une date d'activation et une position visibles.

---

## 2. États capacity client

```
ACTIVE           — envoi entreprise en cours (allocation 30 ou 15)
CONSTRAINED_15   — actif @ 15 inbox, upgrade prévu au prochain reload
QUEUED_WARMUP    — signé pendant warmup batch ; activation à T+15 (+ buffer)
QUEUED_CAPACITY  — pool saturé ; activation quand inbox libérées ou batch prêt
```

---

## 3. Règles de transition

| Condition | État | `estimated_activation_at` |
|-----------|------|----------------------------|
| Pool ≥ 30 libres, pas warmup | `ACTIVE` @ 30 | Immédiat post onboarding |
| Pool 15–29 libres | `CONSTRAINED_15` | Immédiat @ 15 inbox |
| Pool < 15 libres | `QUEUED_CAPACITY` | Fin warmup batch OU libération |
| Signé pendant warmup 15j | `QUEUED_WARMUP` | `warmup_end + 2j` (buffer) |
| Reload batch +60 terminé | Upgrade FIFO | 15→30 si pool le permet |

---

## 4. Reload batch +60

1. Commande batch → 60 rows `inbox_pool.status = warmup`, `warmup_started_at = now()`
2. J+15 → status `active`, pool livraison += 60
3. FIFO queue : clients `QUEUED_*` activés dans l'ordre de signature
4. Clients `CONSTRAINED_15` upgradés vers 30 si `inboxes_libres ≥ 15` par client

---

## 5. Communication client

| Canal | Contenu |
|-------|---------|
| Email signature (si queue) | Position `{n}` + `{estimated_activation_at}` |
| Page suivi (pre-activation) | « Votre recherche démarre le {date} — position {n} » |
| Email upgrade 15→30 | « Allocation complète active — débit RDV optimisé » |

Jobs deliverance **non démarrés** tant que `queue_status !== none` — voir [deliverance/communication.md](../deliverance/communication.md).

---

## 6. Prompt d'action IA

```
File d'attente (doc/tech-stack/capacity/05-waiting-list.md).

- capacity_status enum sur agence
- estimated_activation_at calculé depuis inbox_pool warmup
- Pas de deliverance_search_started si queue active

Références : capacity/06-profile-integration.md, deliverance/communication.md
```
