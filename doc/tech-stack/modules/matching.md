# Module — Matching

```
status: canonical
audience: coding-agent
depends_on: ../03-data-model.md, ../07-orchestrators.md
decisions: FND-05 FND-12 BIZ-03 SUR-02 SUR-03 FND-14
do_not:
  - Deux matches open par agence
  - Confondre Calendly vente et Calendly livraison
```

Étape **7**.

Ops choisit une entreprise compatible + une agence `IN_DELIVERANCE`.  
Insert `matches` `open` → email `product_match_proposal` (lien event type **livraison**).

Webhook : si event type livraison → `appointments` + les deux `MEETING_BOOKED` + email agence.  
Si event type vente → chemin CRM existant **seulement**.

Unlink : bouton ops ; jamais auto au survey non (FND-14).
