---
{
  "slug": "onboarding-sequence",
  "provider": "resend",
  "niche": "comptable",
  "steps": [
    {
      "id": "email0",
      "label": "Hold rétractation",
      "delay": "Immédiat si rétractation conservée",
      "subject": "Votre délai de rétractation est en cours",
      "emailType": "onboarding_retraction_hold",
      "bodyFormat": "text"
    },
    {
      "id": "email1",
      "label": "Bienvenue activation",
      "delay": "Immédiat (post-waiver)",
      "subject": "Bienvenue — votre onboarding Hercule est activé",
      "emailType": "onboarding_j0",
      "bodyFormat": "text"
    },
    {
      "id": "email2",
      "label": "Email J0 bis",
      "delay": "17:00 même jour",
      "subject": "",
      "emailType": "onboarding_j0_bis",
      "bodyFormat": "text"
    },
    {
      "id": "email3",
      "label": "Suivi J+1",
      "delay": "08:00 jour suivant",
      "subject": "",
      "emailType": "onboarding_j1",
      "bodyFormat": "text"
    },
    {
      "id": "email4",
      "label": "Rappel J-10",
      "delay": "estimated_first_booking_at − 10j",
      "subject": "",
      "emailType": "onboarding_reminder_m10",
      "bodyFormat": "text"
    },
    {
      "id": "email5",
      "label": "Rappel J-5",
      "delay": "estimated_first_booking_at − 5j",
      "subject": "",
      "emailType": "onboarding_reminder_m5",
      "bodyFormat": "text"
    },
    {
      "id": "email6",
      "label": "Rappel J+5",
      "delay": "estimated_first_booking_at + 5j",
      "subject": "",
      "emailType": "onboarding_reminder_p5",
      "bodyFormat": "text"
    }
  ]
}
---

{{firstNameLine}}

Votre onboarding est bien enregistré. Conformément à nos CGV, vous disposez de 4 jours calendaires pour vous rétracter tant que l'activation n'a pas démarré.

Votre activation est prévue le {{activationDate}}. Pour lancer la recherche immédiatement, rendez-vous sur votre dashboard :

{{dashboardLink}}

L'équipe Hercule

---step---

{{firstNameLine}}

Votre onboarding est bien enregistré. Nous configurons votre espace et préparons la réception de vos premiers contrats.

Votre tableau de bord :
{{dashboardLink}}

L'équipe Hercule

---step---

{{firstNameLine}}

Petit point en fin de journée : votre compte Hercule est configuré, votre calendrier de livraison est enregistré et les demandes correspondant à vos critères peuvent désormais vous être transmises.

Aucune action n'est requise de votre part pour le moment — nous vous préviendrons dès qu'une première demande sera disponible.

{{dashboardLink}}

L'équipe Hercule

---step---

{{firstNameLine}}

Nous suivons l'activation de votre compte. Votre premier contrat est en préparation : surveillez votre boîte mail et votre tableau de bord pour ne rien manquer.

{{dashboardLink}}

L'équipe Hercule

---step---

{{firstNameLine}}

Rappel : la première date de livraison estimée est le {{estimatedFirstBookingDate}}.

Votre tableau de bord reste le point central pour suivre l'avancement :
{{dashboardLink}}

L'équipe Hercule

---step---

{{firstNameLine}}

Rappel J-5 : la livraison estimée approche ({{estimatedFirstBookingDate}}).

Consultez votre tableau de bord pour le détail :
{{dashboardLink}}

L'équipe Hercule

---step---

{{firstNameLine}}

Point J+5 après la date estimée ({{estimatedFirstBookingDate}}) : nous vérifions que tout se déroule comme prévu.

{{dashboardLink}}

L'équipe Hercule