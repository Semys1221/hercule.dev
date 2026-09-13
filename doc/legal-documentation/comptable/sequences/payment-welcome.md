---
{
  "slug": "payment-welcome",
  "provider": "resend",
  "niche": "comptable",
  "steps": [
    {
      "id": "product_payment_welcome",
      "label": "Bienvenue post-paiement",
      "delay": "Immédiat (stripe_payment)",
      "subject": "Votre accès Hercule est activé",
      "emailType": "product_payment_welcome",
      "bodyFormat": "text"
    }
  ]
}
---

{{firstNameLine}}

Votre paiement a bien été reçu. Votre accès Hercule est maintenant actif.

Prochaine étape : complétez votre onboarding pour démarrer la recherche de contrats.

Accédez à votre tableau de bord :
{{dashboardLink}}

Votre facture a été émise — vous la recevrez d'ici peu.

L'équipe Hercule