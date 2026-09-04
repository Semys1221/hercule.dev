# Capacity — Corrections doc existante

> Module : [Capacity](./README.md) · Checklist patches à appliquer après création du module.

---

## Checklist

| Fichier | Correction | Statut |
|---------|------------|--------|
| [02-profile-json.md](../02-profile-json.md) | Bloc `capacity` + `communication.delays` étendu + lien module capacity | Fait |
| [deliverance/db.md](../deliverance/db.md) | `estimated_completion_at` = f(capacity), pas seulement `base_match_days` | Fait |
| [deliverance/communication.md](../deliverance/communication.md) | Email `deliverance_search_started` différé si `queue_status != none` | Fait |
| [00-overview.md](../00-overview.md) | Lien module capacity ; promesse 3–4 U4/mois + conditions | Fait |
| [README.md](../README.md) | Index module capacity avant modules produit | Fait |
| [steps](../steps) | Step 0 capacity doc + migrations + panel Streamlit | Fait |
| [VALIDATION.md](../VALIDATION.md) | Section capacity SLA pré-validée (C-01–C-06) | Fait |
| [cvg_master.md](../cvg_master.md) | CGV complètes — SLA § 9, no-show § 10.1 | Fait |
| [contrat.md](../../sop/contrat.md) | Stub redirect → cvg_master.md | Fait |

---

## Détail par fichier

### 02-profile-json.md

- Ajouter `capacity` au schéma TypeScript
- Ajouter champs `first_u4_promise_days`, etc. dans `communication.delays`
- Lien : [06-profile-integration.md](./06-profile-integration.md)

### deliverance/db.md

Remplacer init :

```typescript
// Avant
estimated_completion_at = addDays(now(), delays.base_match_days + delays.retraction_days);

// Après
const milestones = computeDeliveranceMilestones(
  profile.capacity.allocation_inboxes,
  deliverance_started_at,
  profile.capacity.capacity_phase,
);
estimated_completion_at = milestones.estimated_five_u4_at; // ou first_u4 selon UI
```

### deliverance/communication.md

```typescript
if (profile.capacity.queue_status !== "none") {
  // Pas de deliverance_search_started — email waitlist à la place (futur template)
  return;
}
insertJob({ emailType: "deliverance_search_started", ... });
```

### 00-overview.md

- Lien [Capacity](./capacity/README.md) dans l'en-tête modules
- Note promesse : **3–4 RDV honorés/mois** @ allocation standard (voir capacity)

### cvg_master.md (ex-contrat.md §5)

Référence contractuelle :

> Remplacement no-show : recrédité sous **14 jours ouvrés** (CGV § 10.1). Voir [capacity/03-sla-client.md](./03-sla-client.md).

Volume § 9 :

> Starter = pack **5 attributions** ; récurrent = jusqu'à **4/mois** ; rythme ops **3–4 honorés/mois** @ allocation 30 inbox.

---

## Prompt d'action IA

```
Appliquer patches capacity/07-doc-corrections.md sur fichiers listés.
Ne pas dupliquer le contenu funnel — renvoyer vers capacity/*.md
```
