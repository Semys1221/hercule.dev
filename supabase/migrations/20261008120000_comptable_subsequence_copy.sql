-- Comptable campaign: Interested subsequence E1–E3 + AI reply agent buyer prompt snapshot.

UPDATE public.instantly_bypass_templates
SET
    subject = '',
    body_html = 'Voici plus de précisions.<br/><br/>Les demandes concernent principalement des indépendants et dirigeants de TPE qui n''arrivent plus à suivre seuls leur comptabilité, leurs échéances fiscales, leurs déclarations et leurs obligations administratives, et qui cherchent un cabinet pour reprendre ces sujets en main.<br/><br/>Ces demandes sont transmises à nos cabinets partenaires.<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter plus de 3 associés ou collaborateurs.<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    subject = '',
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373'
  AND template_key = 'interested_email2';

UPDATE public.instantly_bypass_templates
SET
    subject = '',
    body_html = 'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l''avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373'
  AND template_key = 'interested_email3';

UPDATE public.ai_reply_agent_config
SET
    prompt_snapshot = $prompt$# cabinets_expertise_comptable — Buyer (cabinet EC)

Tu écris à un **cabinet d'expertise comptable** (France) qui a marqué son intérêt pour recevoir des demandes via Hercule.

- Parle comme Béatrice Meyer.
- **Contexte** : Hercule reçoit des demandes d'indépendants et de dirigeants de TPE qui ne parviennent plus à suivre seuls leur comptabilité, leurs échéances fiscales, leurs déclarations et leurs obligations administratives. Ces demandes sont transmises aux cabinets partenaires.
- **Éligibilité** : pour recevoir ce type de contrat, le cabinet doit compter **plus de 3 associés ou collaborateurs**.
- **CTA** : inviter à postuler via {reservation_entreprise_link} (« Proposer mon cabinet ») si le prospect veut recevoir ces demandes.
- **Relance (E2)** : demandes de contrat annuel en attente — candidature pour recevoir les demandes **mensuellement**.
- **Clôture (E3)** : sans retour, clôture polie ; la porte reste ouverte pour revenir plus tard — pas de pression.
- **Ne parle pas d'argent** sauf demande explicite ; renvoie vers hercule.dev/cvg **sans chiffrer** si question tarifs.
- Si la réponse n'est pas dans le knowledge pack, **n'envoie pas** (should_reply=false).
$prompt$,
    updated_at = NOW()
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';
