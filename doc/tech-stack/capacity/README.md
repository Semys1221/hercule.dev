# Module — Capacity & SLA

Capacité inbox, funnel cold email, délais promettables, file d'attente warmup.

> **Source de vérité** pour « quoi promettre » au client payant.  
> Les modules [Onboarding](../onboarding/README.md) → [Post-RDV](../post-rdv/README.md) restent la source de vérité pour « comment livrer ».

## Pourquoi ce module existe

La doc produit (`base_match_days: 14`, timeline, emails) ne relie pas :

- les **RDV honorés facturables** (149 €) à la **capacité inbox** ;
- la promesse ops **3–4 RDV honorés/mois** ([cvg_master.md](../cvg_master.md) § 9) au modèle de charge ;
- le **warmup 15j** et la **file d'attente** quand plusieurs clients signent en bootstrap.

## Index

| Doc | Contenu |
|-----|---------|
| [00-deliverables.md](./00-deliverables.md) | Unités U1–U5, promesse commerciale calibrée |
| [01-inbox-model.md](./01-inbox-model.md) | Pool, 10 agence fixe, 30/client cible, warmup |
| [02-funnel-math.md](./02-funnel-math.md) | Funnels entreprise + agence, formules, projections |
| [03-sla-client.md](./03-sla-client.md) | Délais promettables (externe) |
| [04-sla-internal.md](./04-sla-internal.md) | Alertes ops (interne) |
| [05-waiting-list.md](./05-waiting-list.md) | États queue, reload batch +60 |
| [06-profile-integration.md](./06-profile-integration.md) | `profile.capacity`, SQL, dates estimées |
| [07-doc-corrections.md](./07-doc-corrections.md) | Patches fichiers existants (checklist) |
| [08-implementation-roadmap.md](./08-implementation-roadmap.md) | Phases code Supabase / Streamlit / suivi |
| [09-bootstrap-timeline.md](./09-bootstrap-timeline.md) | Phase démarrage : 11 RDV calendrier, jalons U4 |

## Ordre d'implémentation

**Ce module avant le front client** — les dates affichées sur `/suivi/agence/[slug]` viennent de `profile.capacity` et du funnel baseline.

Voir [steps](../steps) et [08-implementation-roadmap.md](./08-implementation-roadmap.md).

## Paramètres baseline (validés)

| Funnel | Reply | Positive | Booking | Closing |
|--------|-------|----------|---------|---------|
| **Entreprise** (livraison) | 1% | 30% | 30% | 60% |
| **Agence** (acquisition) | 3% | 50% | 20% | 40% |

| Infra | Valeur |
|-------|--------|
| Pool actuel | 60 inbox |
| Réserve agence | 10 inbox (fixe) |
| Allocation cible / client | 30 inbox livraison |
| Allocation contrainte | 15 inbox |
| Warmup batch | 15 jours |
| Incrément achat | +60 inbox |

Retour : [Vue d'ensemble](../00-overview.md) · [Index tech-stack](../README.md)
