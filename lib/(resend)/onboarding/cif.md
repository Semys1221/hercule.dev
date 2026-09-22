---
{
  "slug": "payment-onboarding",
  "provider": "resend",
  "vertical": "cif",
  "niche": "cif",
  "stopOnReply": false,
  "stopTriggers": [],
  "steps": [
    {
      "id": "email0",
      "label": "Bienvenue post-paiement",
      "delay": "Immédiat (stripe_payment)",
      "subject": "Votre accès Hercule Hubris est activé",
      "emailType": "payment_onboarding_1",
      "bodyFormat": "text"
    },
    {
      "id": "email1",
      "label": "Calendly Pro & Zoom Pro",
      "delay": "J0 +2h",
      "subject": "Calendly Pro et Zoom Pro — invitation à venir",
      "emailType": "payment_onboarding_2",
      "bodyFormat": "text"
    },
    {
      "id": "email2",
      "label": "Date premier RDV estimée",
      "delay": "J0 17:00 Paris",
      "subject": "Date estimée de votre premier rendez-vous PME",
      "emailType": "payment_onboarding_3",
      "bodyFormat": "text"
    },
    {
      "id": "email3",
      "label": "Protocole déploiement",
      "delay": "J+3",
      "subject": "Protocole de déploiement Hercule Hubris",
      "emailType": "payment_onboarding_4",
      "bodyFormat": "text"
    },
    {
      "id": "email4",
      "label": "Configuration en cours",
      "delay": "J+6",
      "subject": "Configuration de votre espace cabinet",
      "emailType": "payment_onboarding_5",
      "bodyFormat": "text"
    },
    {
      "id": "email5",
      "label": "Qualification en préparation",
      "delay": "J+9",
      "subject": "Qualification des bilans lourds en cours",
      "emailType": "payment_onboarding_6",
      "bodyFormat": "text"
    },
    {
      "id": "email6",
      "label": "Créneaux Calendly imminents",
      "delay": "J+12",
      "subject": "Vos créneaux Calendly arrivent",
      "emailType": "payment_onboarding_7",
      "bodyFormat": "text"
    },
    {
      "id": "email7",
      "label": "Premier bilan identifié",
      "delay": "J+15",
      "subject": "Premier bilan lourd identifié",
      "emailType": "payment_onboarding_8",
      "bodyFormat": "text"
    },
    {
      "id": "email8",
      "label": "Premier RDV arrive",
      "delay": "J+20",
      "subject": "Votre premier rendez-vous PME arrive",
      "emailType": "payment_onboarding_9",
      "bodyFormat": "text"
    }
  ]
}
---

Merci pour votre confiance. Votre paiement Hercule Hubris a bien été reçu et votre accès est maintenant actif.

L'équipe Hercule configure votre espace dans les prochaines 48 heures :
- Provisionnement Calendly Pro
- Provisionnement Zoom Pro
- Premier rendez-vous PME planifié sous 20 à 25 jours après activation

Votre tableau de bord :
{{dashboardLink}}

Votre facture sera émise sous peu.

---step---

Dans les prochaines heures, vous recevrez sur {{email}} :
- une invitation Calendly Pro pour configurer votre agenda de livraison
- un accès Zoom Pro pour vos audits de compatibilité en visioconférence

Notre équipe finalise le provisionnement sous 48 heures.

Tableau de bord : {{dashboardLink}}

---step---

Petit point en fin de journée : votre calendrier de livraison est enregistré.

Date estimée de votre premier rendez-vous PME (BNC médicaux) : {{estimatedFirstRdvDate}}.

Suivez l'avancement :
{{dashboardLink}}

---step---

Merci pour votre patience pendant la phase d'initialisation.

Étape 1 — Initialisation technique
Mise en service de vos serveurs dédiés. Phase d'échauffement (warm-up) réglementaire des protocoles DNS d'une durée incompressible de 14 jours pour garantir une délivrabilité maximale.

Étape 2 — Premiers rendez-vous
Vos premiers rendez-vous d'audit de compatibilité s'affichent sur votre Calendly dès le 15e jour.

En attendant :
{{dashboardLink}}

---step---

Votre espace cabinet est configuré. Les critères Hercule Hubris sont enregistrés : 15 à 20 bilans lourds programmés sur le trimestre, praticiens BNC médicaux à forte trésorerie dormante.

Aucune action requise de votre part.

{{dashboardLink}}

---step---

La qualification live des besoins patrimoniaux est en cours.

Chaque bilan lourd est validé avant attribution exclusive — obligation de moyens, sans garantie de signature ni de commissions upfront.

{{dashboardLink}}

---step---

La dernière ligne droite : vos créneaux Calendly seront visibles dès le 15e jour.

Vérifiez {{email}} (et vos spams) pour accepter l'invitation Calendly Pro.

{{dashboardLink}}

---step---

Bonne nouvelle : nous avons identifié un premier bilan lourd compatible avec votre cabinet.

La qualification live des contacts démarre — vous serez informé dès qu'un rendez-vous sera planifié dans votre Calendly.

{{dashboardLink}}

---step---

Votre premier rendez-vous PME BNC arrive sous peu.

Surveillez votre Calendly et votre boîte mail — visioconférence nationale, fenêtre habituelle 20 à 25 jours après activation.

Tableau de bord : {{dashboardLink}}
