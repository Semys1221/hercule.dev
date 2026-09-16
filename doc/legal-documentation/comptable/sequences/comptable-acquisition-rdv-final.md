---
{
  "slug": "comptable-acquisition-rdv-final",
  "provider": "resend",
  "niche": "comptable",
  "steps": [
    {
      "id": "comptable_acquisition_rdv_final",
      "label": "Dernier rappel automatique",
      "delay": "+5j",
      "subject": "Dernier rappel automatique — premiers rendez-vous",
      "emailType": "comptable_acquisition_rdv_final",
      "bodyFormat": "html"
    }
  ]
}
---

{{firstNameLine}}

Dernier rappel automatique : vos premiers rendez-vous sont attendus vers le {{estimatedFirstRdvDate}}.

Numéro de suivi DHL : {{trackingNumber}}
{{dashboardLink}}

Il s'agit du dernier email automatique de cette séquence. Pour toute question : contact@hercule.dev

Béatrice Meyer
