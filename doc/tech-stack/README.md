# Tech-stack Hercule — spec de build

```
status: canonical
audience: coding-agent
depends_on: ../README.md
do_not:
  - Traiter archive/ comme canon
  - Implémenter hors de l’ordre 13-implementation-roadmap.md
```

**Entrée globale :** [`doc/README.md`](../README.md)

## Ordre

1. [00-decisions.md](./00-decisions.md)
2. [01-product.md](./01-product.md)
3. [02-state-machines.md](./02-state-machines.md)
4. [03-data-model.md](./03-data-model.md)
5. [04-transitions.md](./04-transitions.md) · [05-events.md](./05-events.md)
6. [13-implementation-roadmap.md](./13-implementation-roadmap.md)
7. Module de l’étape : [modules/](./modules/)

## Inventaires

- [06-components.md](./06-components.md)
- [07-orchestrators.md](./07-orchestrators.md)
- [08-api.md](./08-api.md)
- [09-surfaces.md](./09-surfaces.md)
- [10-emails.md](./10-emails.md)
- [11-integrations.md](./11-integrations.md)
- [12-security.md](./12-security.md)
- [constants-commercial.md](./constants-commercial.md)

## Contrat & capacity

- [cvg_master.md](./cvg_master.md) — SoT légale
- [cvg_onboarding.md](./cvg_onboarding.md)
- [cvg_site-sync.md](./cvg_site-sync.md)
- [capacity/README.md](./capacity/README.md)

## Runtime deps (AI Reply Agent)

Ces fichiers sont lus au runtime par le reply agent Grok (Streamlit + webhook Next.js). Ne pas archiver sans mettre à jour [`app/streamlit_reply_agent/legal_content.py`](../../app/streamlit_reply_agent/legal_content.py) et [`lib/ai-reply-agent/knowledge.ts`](../../lib/ai-reply-agent/knowledge.ts).

- [ai-reply-knowledge.md](./ai-reply-knowledge.md) — agence / entreprise (default)
- [ai-reply-knowledge-comptable.md](./ai-reply-knowledge-comptable.md) — niche comptable (`niche_preset_id` contient `comptable`)
- [cvg_comptable.md](./cvg_comptable.md) — contrat cabinets EC (référence légale, pas chargé tel quel au runtime)
- [00-overview.md](./00-overview.md)
- [deliverance/front-client.md](./deliverance/front-client.md)

## Hors spec

Questionnaire, SOP, Streamlit, anciennes docs : [`archive/`](../../archive/README.md)
