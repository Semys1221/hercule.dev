---
{
  "slug": "no-show",
  "provider": "instantly_bypass",
  "niche": "comptable",
  "campaignId": "e4c58718-ca00-4e27-b714-68e522fe4db6",
  "templateKeys": [
    "no_show_email1",
    "no_show_email2",
    "interested_email3"
  ],
  "steps": [
    {
      "id": "no_show_email1",
      "label": "Email 1",
      "delay": "Immédiat",
      "subject": "",
      "templateKey": "no_show_email1",
      "bodyFormat": "html"
    },
    {
      "id": "no_show_email2",
      "label": "Email 2",
      "delay": "+24h",
      "subject": "",
      "templateKey": "no_show_email2",
      "bodyFormat": "html"
    },
    {
      "id": "interested_email3",
      "label": "Email 3",
      "delay": "+48h",
      "subject": "",
      "templateKey": "interested_email3",
      "bodyFormat": "html"
    }
  ]
}
---



---step---



---step---

Bonjour {{first_name}},<br/><br/>N'ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l'avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}