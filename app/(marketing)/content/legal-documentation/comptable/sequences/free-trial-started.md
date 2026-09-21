---
{
  "slug": "free-trial-started",
  "provider": "resend",
  "niche": "comptable",
  "steps": [
    {
      "id": "free_trial_started_1",
      "label": "Essai commencé",
      "delay": "Immédiat (stripe_payment)",
      "subject": "Votre essai a commencé",
      "emailType": "free_trial_started_1",
      "bodyFormat": "text"
    },
    {
      "id": "free_trial_started_2",
      "label": "Opérationnel OK",
      "delay": "J+2",
      "subject": "Opérationnel OK",
      "emailType": "free_trial_started_2",
      "bodyFormat": "text"
    },
    {
      "id": "free_trial_started_3",
      "label": "RDV sous 14 jours",
      "delay": "J+3",
      "subject": "Votre premier rendez-vous arrive sous 14 jours",
      "emailType": "free_trial_started_3",
      "bodyFormat": "text"
    }
  ]
}
---

{{firstNameLine}}

Votre essai a commencé. Votre premier rendez-vous sera livré sous 14 jours.

Si vous souhaitez vous désabonner ou ne pas renouveler, cliquez ici :
{{billingPortalLink}}

Tableau de bord : {{dashboardLink}}

Béatrice Meyer

---step---

{{firstNameLine}}

Opérationnel OK — votre espace essai tourne. Nous préparons votre premier rendez-vous.

Tableau de bord : {{dashboardLink}}

Béatrice Meyer

---step---

{{firstNameLine}}

Votre premier rendez-vous arrivera avant 14 jours — tenez-vous prêt !

Tableau de bord : {{dashboardLink}}

Béatrice Meyer
