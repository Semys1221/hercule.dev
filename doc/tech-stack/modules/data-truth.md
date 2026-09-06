# Module — Data truth

```
status: canonical
audience: coding-agent
depends_on: ../03-data-model.md
decisions: DB-01 SOT-01 FND-01 FND-05 FND-16 SAL-01
do_not:
  - Étendre lead_statut avec PAID / MEETING_n / SOLD comme unique vérité
```

Étape **2**.

Migration unique (ou split enum puis tables) :

1. `CREATE TYPE product_statut AS ENUM (...)`
2. `ALTER TABLE agence/entreprise ADD product_statut ... DEFAULT 'NONE'`
3. Tables `payments`, `matches`, `appointments`, `sales_calls`
4. Unique partial index : un `matches.status='open'` par `agence_id`
5. Unique `appointments.calendly_invitee_uri`
6. Ne pas backfiller `product_statut` depuis `ONBOARDED` CRM sans revue ops

Registry `/internal/database` : marquer tables NEW `planned→active` après migrate.
