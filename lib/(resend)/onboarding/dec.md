---
{
  "slug": "payment-onboarding",
  "provider": "resend",
  "vertical": "dec",
  "niche": "comptable",
  "stopOnReply": false,
  "stopTriggers": [],
  "steps": [
    {
      "id": "email0",
      "label": "Bienvenue post-paiement",
      "delay": "Immédiat (stripe_payment)",
      "subject": "Votre accès Hercule Mercantile est activé",
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
      "subject": "Date estimée de votre premier rendez-vous",
      "emailType": "payment_onboarding_3",
      "bodyFormat": "text"
    },
    {
      "id": "email3",
      "label": "Protocole déploiement",
      "delay": "J+3",
      "subject": "Protocole de déploiement Hercule",
      "emailType": "payment_onboarding_4",
      "bodyFormat": "text"
    },
    {
      "id": "email4",
      "label": "Configuration en cours",
      "delay": "J+6",
      "subject": "Configuration de votre espace en cours",
      "emailType": "payment_onboarding_5",
      "bodyFormat": "text"
    },
    {
      "id": "email5",
      "label": "Qualification en préparation",
      "delay": "J+9",
      "subject": "Qualification des contacts en cours",
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
      "subject": "Première demande qualifiée identifiée",
      "emailType": "payment_onboarding_8",
      "bodyFormat": "text"
    },
    {
      "id": "email8",
      "label": "Premier RDV arrive",
      "delay": "J+20",
      "subject": "Votre premier rendez-vous arrive",
      "emailType": "payment_onboarding_9",
      "bodyFormat": "text"
    }
  ]
}
---

Merci pour votre confiance. Votre paiement a bien été reçu et votre accès Hercule Mercantile est maintenant actif.

Prochaine étape : complétez votre onboarding sous 48 heures pour lancer la recherche de contrats qualifiés (restaurants indépendants +3 salariés, BIC).

Votre tableau de bord :
{{dashboardLink}}

Votre facture sera émise sous peu.

---step---

Dans les prochaines heures, vous recevrez sur {{email}} :
- une invitation Calendly Pro pour configurer votre agenda de livraison
- un accès Zoom Pro pour vos rendez-vous en visioconférence nationale

Notre équipe finalise le provisionnement sous 48 heures. Aucune action requise pour le moment.

Tableau de bord : {{dashboardLink}}

---step---

Petit point en fin de journée : votre calendrier de livraison est enregistré.

Date estimée de votre premier rendez-vous qualifié : {{estimatedFirstRdvDate}}.

Nous vous préviendrons à chaque étape. Suivez l'avancement :
{{dashboardLink}}

---step---

Merci pour votre patience pendant la phase d'initialisation.

Étape 1 — Initialisation technique
Mise en service de vos serveurs dédiés. Phase d'échauffement (warm-up) réglementaire des protocoles DNS d'une durée incompressible de 14 jours pour garantir une délivrabilité maximale.

Étape 2 — Premiers rendez-vous
Vos premiers rendez-vous de recensement s'affichent sur votre Calendly dès le 15e jour.

En attendant, votre tableau de bord reste à jour :
{{dashboardLink}}

---step---

Votre compte Hercule est configuré. Les critères de ciblage (restaurants indépendants +3 salariés, BIC) sont enregistrés.

Notre équipe active les canaux de prospection — aucune action requise de votre part.

{{dashboardLink}}

---step---

La qualification des dirigeants correspondant à vos critères est en cours.

Nous validons chaque demande en live avant attribution exclusive — obligation de moyens sur le volume de crédits (10 rendez-vous / mois), sans garantie de signature.

{{dashboardLink}}

---step---

La dernière ligne droite : vos créneaux Calendly seront visibles dès le 15e jour après activation.

Pensez à vérifier votre boîte mail (et vos spams) pour accepter l'invitation Calendly sur {{email}}.

{{dashboardLink}}

---step---

Bonne nouvelle : nous avons identifié une première demande qualifiée dans votre périmètre.

La phase de qualification live des contacts démarre — vous serez informé dès qu'une attribution sera planifiée dans votre Calendly.

{{dashboardLink}}

---step---

Votre premier rendez-vous qualifié arrive sous peu.

Surveillez votre boîte mail et votre Calendly — une fois opérationnel, le rythme vise environ 2 rendez-vous par semaine en visioconférence nationale.

Tableau de bord : {{dashboardLink}}
