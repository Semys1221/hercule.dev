# Module — Sales ops

```
status: canonical
audience: coding-agent
depends_on: ../03-data-model.md
decisions: SAL-01 SAL-02 ENG-17
do_not:
  - Fusionner sales_calls.status dans lead_statut
  - Notes sur laptop / JSON local
  - CA entreprise
```

Étape **10**.

`/internal/sales` : liste des `sales_calls` (jointure Calendly vente). Notes en base. Statuts d’appel `not_paid` / `paid` **≠** livraison.

Métriques dérivées (taux de close, forecast) = queries, pas une 2e SoT.

Entreprise : qualification gratuite seulement.
