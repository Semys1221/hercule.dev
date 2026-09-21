---
{
  "slug": "meeting-cif",
  "provider": "resend",
  "niche": "cif",
  "steps": [
    {
      "id": "immediate",
      "label": "Confirmation",
      "delay": "Immédiat",
      "subject": "Votre audit de compatibilité Hercule est confirmé",
      "emailType": "immediate",
      "bodyFormat": "text"
    },
    {
      "id": "h48_confirm",
      "label": "Confirmation requise",
      "delay": "H-48",
      "subject": "Préparez votre audit de compatibilité · Hercule",
      "emailType": "h48_confirm",
      "bodyFormat": "text"
    },
    {
      "id": "h24_relance",
      "label": "Relance",
      "delay": "H-24",
      "subject": "Votre audit Hercule approche",
      "emailType": "h24_relance",
      "bodyFormat": "text"
    }
  ]
}
---

{{firstNameLine}}

Votre rendez-vous d'audit de compatibilité avec Hercule est bien confirmé le {{date}} à {{heure}}.

Nous reviendrons ensemble sur votre cabinet, votre zone d'intervention et vos disponibilités pour recevoir de nouvelles missions de tenue PME.

Les informations de connexion vous seront transmises directement par Calendly.

---step---

{{firstNameLine}}

Pour préparer au mieux votre rendez-vous, retrouvez ici le déroulé de votre échange :
{{post_booking_link}}

---step---

{{firstNameLine}}

Votre rendez-vous avec Hercule approche — il est prévu le {{date}} à {{heure}}.

Nous avons hâte d'échanger avec vous.