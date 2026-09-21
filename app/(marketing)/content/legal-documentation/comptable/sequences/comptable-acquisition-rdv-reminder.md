---
{
  "slug": "comptable-acquisition-rdv-reminder",
  "provider": "resend",
  "niche": "comptable",
  "steps": [
    {
      "id": "comptable_acquisition_rdv_reminder",
      "label": "Rappel premier RDV",
      "delay": "+48h",
      "subject": "Rappel — vos premiers rendez-vous arrivent",
      "emailType": "comptable_acquisition_rdv_reminder",
      "bodyFormat": "html"
    }
  ]
}
---

{{firstNameLine}}

Petit rappel : vos premiers rendez-vous devraient commencer vers le {{estimatedFirstRdvDate}}.

Numéro de suivi DHL : {{trackingNumber}}
{{dashboardLink}}

Béatrice Meyer
