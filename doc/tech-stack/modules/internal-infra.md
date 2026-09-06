# Module — Internal infra (`/internal`)

```
status: canonical
audience: coding-agent
depends_on: ../13-implementation-roadmap.md
decisions: FND-02 ADM-01 ADM-02 ADM-03 SEC-01 COMP-01
do_not:
  - Login
  - Resusciter streamlit_funnels
```

Étapes **3–4** (et morceaux de 10).

**À livrer :**

- Shell existant : étendre nav (leads, appointments, later sales, templates).
- `lib/product/transitions.ts` : seules écritures `product_statut` / matches / appointments / payments (hors webhooks).
- Pages recipient : deux colonnes d’état visibles (CRM vs livraison).
- Trigger : créer Payment Link ; plus tard match / complete RDV.
- Édition CGV : même chargeur que `/cvg` (CVG-01).

**Hors module :** scraper, AI reply, toggles Instantly (SET-02 Streamlit).
