-- Comptable Interested E1–E2: urgency window 19 sept – 02 oct.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>Les demandes concernent principalement des indépendants et dirigeants de TPE qui n''arrivent plus à suivre seuls leur comptabilité, leurs échéances fiscales, leurs déclarations et leurs obligations administratives.<br/><br/>Ils cherchent un cabinet pour reprendre ces sujets en main.<br/><br/>Ces demandes sont transmises à nos cabinets partenaires.<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter au minimum 2 associés ou collaborateurs.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';
