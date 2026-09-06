# Module — CMS funnels

```
status: canonical
audience: coding-agent
depends_on: ../06-components.md
decisions: FUN-01 COMP-02 ENG-15 CPY-03
do_not:
  - Créer des kinds de blocs depuis l’UI
  - Remettre la CGV dans funnel.json
```

Étape **10**.

Migrer `content/funnels/**/funnel.json` → `funnel_pages`. Publish = row `published`.  
Builder `/internal/funnels` lit/écrit la table, plus le filesystem du déploiement.

FAQ / pricing restent `content/` **ou** dérivent CGV (CVG-02) — pas une 3e vérité tarifaire.

Catalogue blocs fermé (code).
