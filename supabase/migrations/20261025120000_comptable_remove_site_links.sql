-- Comptable Interested E1–E3: remove hercule.dev footer links; E1 intro line break.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>Les demandes concernent principalement des indépendants et dirigeants de TPE qui n''arrivent plus à suivre seuls leur comptabilité, leurs échéances fiscales, leurs déclarations et leurs obligations administratives.<br/><br/>Ils cherchent un cabinet pour reprendre ces sujets en main.<br/><br/>Ces demandes sont transmises à nos cabinets partenaires.<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter plus de 3 associés ou collaborateurs.<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet devient pertinent pour votre cabinet à l''avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email3';
