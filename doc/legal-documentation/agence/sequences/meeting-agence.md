---
{
  "slug": "meeting-agence",
  "provider": "resend",
  "niche": "agence",
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
      "subject": "Confirmation requise — Votre rendez-vous avec Hercule",
      "emailType": "h48_confirm",
      "bodyFormat": "text"
    },
    {
      "id": "h24_relance",
      "label": "Relance",
      "delay": "H-24",
      "subject": "Confirmation requise — Votre rendez-vous avec Hercule",
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

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous contiendront des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmation_agence_link}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.

Cordialement,

---step---

{{firstNameLine}}

Nous n'avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmation_agence_link}}

Cordialement,