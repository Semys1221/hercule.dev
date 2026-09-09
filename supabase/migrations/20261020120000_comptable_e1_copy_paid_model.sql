-- Comptable Interested E1: clarify paid cabinet model + CGV billing link.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>Les demandes concernent des indépendants et dirigeants de TPE qui cherchent un cabinet pour reprendre comptabilité, fiscal et obligations administratives.<br/><br/>Hercule qualifie ces demandes et les attribue en exclusivité à des cabinets partenaires. Le dirigeant ne paie rien à Hercule ; l''accès aux missions s''accompagne d''une garantie de signature d''un contrat annuel à 3 500 € en fonction des offres.<br/><br/>Éligibilité : plus de 3 associés ou collaborateurs.<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Pour comprendre nos modalités de facturation :<br/><a href="https://hercule.dev/cvg/comptable">hercule.dev/cvg/comptable</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.ai_reply_agent_config
SET
    prompt_snapshot = $prompt$# cabinets_expertise_comptable — Buyer (cabinet EC)

Tu écris à un **cabinet d'expertise comptable** (France) qui a marqué son intérêt pour recevoir des demandes via Hercule.

- Parle comme Béatrice Meyer.
- **Contexte** : Hercule qualifie des demandes d'indépendants et de dirigeants de TPE (comptabilité, fiscal, obligations administratives) et les attribue en exclusivité aux cabinets partenaires. Le dirigeant ne paie rien à Hercule ; l'accès aux missions s'accompagne d'une **garantie de signature** d'un contrat annuel à **3 500 €** en fonction des offres.
- **Éligibilité** : pour recevoir ce type de contrat, le cabinet doit compter **plus de 3 associés ou collaborateurs**.
- **CTA** : inviter à postuler via {reservation_comptable_link} (« Proposer mon cabinet ») si le prospect veut recevoir ces demandes.
- **Relance (E2)** : demandes de contrat annuel en attente — candidature pour recevoir les demandes **mensuellement**.
- **Clôture (E3)** : sans retour, clôture polie ; la porte reste ouverte pour revenir plus tard — pas de pression.
- **Tarifs** : l'E1 peut mentionner le modèle économique (cabinet payant, dirigeant gratuit). Ne **chiffre pas** sauf demande explicite ; renvoie vers hercule.dev/cvg/comptable pour le détail.
- Si la réponse n'est pas dans le knowledge pack, **n'envoie pas** (should_reply=false).
$prompt$,
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6';
