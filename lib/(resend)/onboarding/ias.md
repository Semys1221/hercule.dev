---
{
  "slug": "payment-onboarding",
  "provider": "resend",
  "vertical": "ias",
  "niche": "entreprise",
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
      "subject": "Date estimée de votre premier rendez-vous dirigeant BTP",
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
      "subject": "Configuration de votre espace courtier",
      "emailType": "payment_onboarding_5",
      "bodyFormat": "text"
    },
    {
      "id": "email5",
      "label": "Qualification en préparation",
      "delay": "J+9",
      "subject": "Qualification des dirigeants BTP en cours",
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
      "label": "Premier lead identifié",
      "delay": "J+15",
      "subject": "Premier dirigeant BTP qualifié identifié",
      "emailType": "payment_onboarding_8",
      "bodyFormat": "text"
    },
    {
      "id": "email8",
      "label": "Premier RDV arrive",
      "delay": "J+20",
      "subject": "Votre premier rendez-vous dirigeant arrive",
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
- Premier rendez-vous dirigeant PME bâtiment planifié sous 20 à 25 jours après activation

Votre tableau de bord :
{{dashboardLink}}

Votre facture sera émise sous peu.

---step---

Dans les prochaines heures, vous recevrez sur {{email}} :
- une invitation Calendly Pro pour configurer votre agenda de livraison
- un accès Zoom Pro pour vos rendez-vous IFC / prévoyance en visioconférence

Notre équipe finalise le provisionnement sous 48 heures.

Tableau de bord : {{dashboardLink}}

---step---

Petit point en fin de journée : votre calendrier de livraison est enregistré.

Date estimée de votre premier rendez-vous dirigeant (PME BTP 3–15 salariés) : {{estimatedFirstRdvDate}}.

Suivez l'avancement :
{{dashboardLink}}

---step---

Merci pour votre patience pendant la phase d'initialisation.

Étape 1 — Initialisation technique
Mise en service de vos serveurs dédiés. Phase d'échauffement (warm-up) réglementaire des protocoles DNS d'une durée incompressible de 14 jours pour garantir une délivrabilité maximale.

Étape 2 — Premiers rendez-vous
Vos premiers rendez-vous de recensement s'affichent sur votre Calendly dès le 15e jour.

En attendant :
{{dashboardLink}}

---step---

Votre espace courtier ORIAS est configuré. Les critères Hercule Hubris sont enregistrés : bilans lourds IFC, prévoyance et protection sociale — PME bâtiment 3 à 15 salariés.

Aucune action requise de votre part.

{{dashboardLink}}

---step---

La qualification live des dirigeants BTP est en cours (signaux IFC, prévoyance lourde, Madelin).

Chaque attribution est exclusive — obligation de moyens sur les crédits, sans garantie de signature ni de commissions upfront.

{{dashboardLink}}

---step---

La dernière ligne droite : vos créneaux Calendly seront visibles dès le 15e jour.

Vérifiez {{email}} (et vos spams) pour accepter l'invitation Calendly Pro.

{{dashboardLink}}

---step---

Bonne nouvelle : nous avons identifié un premier dirigeant BTP qualifié dans votre périmètre.

La qualification live des contacts démarre — vous serez informé dès qu'un rendez-vous sera planifié dans votre Calendly.

{{dashboardLink}}

---step---

Votre premier rendez-vous dirigeant PME bâtiment arrive sous peu.

Surveillez votre Calendly et votre boîte mail — visioconférence nationale, fenêtre habituelle 20 à 25 jours après activation.

Tableau de bord : {{dashboardLink}}
