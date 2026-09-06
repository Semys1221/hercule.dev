# Module — Onboarding

```
status: canonical
audience: coding-agent
depends_on: ../01-product.md, ../cvg_onboarding.md
decisions: FND-03 FND-04 BIZ-04
do_not:
  - Passer IN_DELIVERANCE à la soumission du form
```

Étape **5** (form) ; la gate PAID est [payments-stripe.md](./payments-stripe.md).

- `POST /api/onboarding/agence` et `/entreprise` **publics**.
- Écrit `profile.form`, `product_statut=ONBOARDED`, `cvg_accepted_at`, `cvg_version`.
- Email `product_onboarding_received` seulement.
- Admin peut toujours créer une fiche via `/api/admin/onboarding` existant : **même** transition `NONE→ONBOARDED`.

UI shadcn. Checkbox CGV obligatoire (texte [cvg_onboarding.md](../cvg_onboarding.md)).
