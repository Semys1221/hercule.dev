# Module — Délivrance

```
status: canonical
audience: coding-agent
depends_on: ../04-transitions.md, ../capacity/README.md
decisions: FND-04 FND-15 CAP-01 SUR-01
do_not:
  - Page client avant étape 9
  - Promesses hors C-01…C-06 / constants-commercial
```

Étapes **6** (jobs + admin) et **9** (front secret-link).

Happy path start = `payments.succeeded`, pas un bouton « Lancer » (override ops autorisé).

Timeline : labels dans `profile.display.timeline` ; dates calculées via `profile.communication.delays` + capacity.  
ADVANCE_STEP / DELAY+7 j : API ops, reschedule jobs.

Front `/suivi/agence/[slug]` : read-only + no-show.  
Front `/suivi/entreprise/[slug]` : read-only + compteur RDV dérivé.
