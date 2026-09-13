---
{
  "slug": "meeting-comptable",
  "provider": "resend",
  "niche": "comptable",
  "steps": [
    {
      "id": "immediate",
      "label": "Confirmation",
      "delay": "Immédiat",
      "subject": "Confirmation de votre rendez-vous avec Hercule",
      "emailType": "immediate",
      "bodyFormat": "text"
    },
    {
      "id": "h48_confirm",
      "label": "Confirmation requise",
      "delay": "H-48",
      "subject": "Préparez votre rendez-vous avec Hercule",
      "emailType": "h48_confirm",
      "bodyFormat": "text"
    },
    {
      "id": "h24_relance",
      "label": "Relance",
      "delay": "H-24",
      "subject": "Rappel — Votre rendez-vous avec Hercule approche",
      "emailType": "h24_relance",
      "bodyFormat": "text"
    }
  ]
}
---

{{firstNameLine}}

Votre rendez-vous avec Hercule est bien prévu le {{date}} à {{heure}}.

Les informations de connexion vous seront transmises directement par email via Calendly.

Cordialement,

---step---

{{firstNameLine}}

Pour préparer au mieux votre rendez-vous, retrouvez ici le déroulé de votre échange :
{{post_booking_link}}

---step---

{{firstNameLine}}

Votre rendez-vous avec Hercule approche — il est prévu le {{date}} à {{heure}}.

Nous avons hâte d'échanger avec vous.