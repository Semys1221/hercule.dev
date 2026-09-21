---
{
  "slug": "no-show",
  "provider": "instantly_bypass",
  "niche": "cif",
  "campaignId": "e3bdb573-fe9f-437d-bd96-4ceb52869dd4",
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
      "subject": "Re: votre message",
      "templateKey": "interested_email3",
      "bodyFormat": "html"
    }
  ]
}
---

Merci de me confirmer si votre réservation Calendly a bien été effectuée.<br/><br/>Nos demandes doivent être pourvues dès la mi-septembre.<br/><br/>Sans confirmation de votre part, nous proposerons cette candidature à une autre agence web.<br/><br/><a href="{{reservation_agence_link}}">Demandez l'audit de votre agence</a><br/><br/>Cordialement,<br/>Béatrice Meyer<br/>hercule.dev Courtage contrat BNC/BIC<br/><a href="https://hercule.dev">hercule.dev</a><br/><a href="https://hercule.dev">hercule.dev</a>

---step---

N'ayant reçu aucune confirmation de votre part, nous devons retirer votre agence.<br/><br/>Cordialement,<br/>Béatrice Meyer<br/>hercule.dev Courtage contrat BNC/BIC<br/><a href="https://hercule.dev">hercule.dev</a><br/><a href="https://hercule.dev">hercule.dev</a>

---step---

Bonjour {{first_name}},<br/><br/>N'ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l'avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}