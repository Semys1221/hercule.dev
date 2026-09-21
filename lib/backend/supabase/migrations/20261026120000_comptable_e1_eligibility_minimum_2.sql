-- Comptable Interested E1: eligibility threshold minimum 2 associates/collaborators.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>Les demandes concernent principalement des indépendants et dirigeants de TPE qui n''arrivent plus à suivre seuls leur comptabilité, leurs échéances fiscales, leurs déclarations et leurs obligations administratives.<br/><br/>Ils cherchent un cabinet pour reprendre ces sujets en main.<br/><br/>Ces demandes sont transmises à nos cabinets partenaires.<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter au minimum 2 associés ou collaborateurs.<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';
