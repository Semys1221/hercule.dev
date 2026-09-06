# Module — Post-RDV

```
status: canonical
audience: coding-agent
depends_on: ../01-product.md, ../10-emails.md
decisions: FND-06 FND-07 FND-08 FND-09 FND-10 EML-02 EML-03 ORCH-01
do_not:
  - Offre 898
  - Reset pack / dashboard à 0
  - Upsell entreprise
  - Email auto renouvellement à SOLD
```

Étape **8**.

Complete / no-show = table `/internal/appointments` (ou client no-show). **Pas** meeting.ended.

Survey tokenisé. Un oui → `matches.outcome=sold` → agence **IN_DELIVERANCE** (pack continue). CTA 1 489 / 989×3 **optionnel** in-page.

Entreprise succès : page merci + **un** email J+7 (CPY-02).

`sales_calls.not_paid` → nurturing plein tarif ; Stripe succeeded → cancel jobs.
