-- Comptable Interested E1: niche restaurants (+5 salariés, tenue comptable + social / paie).

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué de restaurants de plus de 5 salariés, en recherche d''un accompagnement en tenue comptable et en social / paie.<br/><br/>Ces demandes sont transmises à nos cabinets partenaires.<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter au minimum 2 associés ou collaborateurs.<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.ai_reply_agent_config
SET
    prompt_snapshot = $prompt$# cabinets_expertise_comptable — Buyer (cabinet EC)

Tu écris à un **cabinet d'expertise comptable** (France) qui a marqué son intérêt pour recevoir des demandes via Hercule.

- Parle comme Béatrice Meyer.
- **Contexte** : Hercule reçoit des demandes de **restaurants de plus de 5 salariés** en recherche d'un accompagnement en **tenue comptable** et en **social / paie**. Ces demandes sont transmises aux cabinets partenaires.
- **Éligibilité** : pour recevoir ce type de contrat, le cabinet doit compter **au minimum 2 associés ou collaborateurs**.
- **CTA** : inviter à postuler via {reservation_comptable_link} (« Proposer mon cabinet ») si le prospect veut recevoir ces demandes.
- **Relance (E2)** : demandes de contrat annuel en attente — candidature pour recevoir les demandes **mensuellement**.
- **Clôture (E3)** : sans retour, clôture polie ; la porte reste ouverte pour revenir plus tard — pas de pression.
- **Ne parle pas d'argent** sauf demande explicite ; renvoie vers hercule.dev/cvg/comptable **sans chiffrer** si question tarifs.
- Si la réponse n'est pas dans le knowledge pack, **n'envoie pas** (should_reply=false).
$prompt$,
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6';
