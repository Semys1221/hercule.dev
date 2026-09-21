-- Comptable Interested E1/E2: propose next two Calendly slots + reservation link.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>Les demandes concernent des indépendants et dirigeants de TPE qui cherchent un cabinet pour reprendre comptabilité, fiscal et obligations administratives.<br/><br/>Hercule qualifie ces demandes et les attribue en exclusivité à des cabinets partenaires. Le dirigeant ne paie rien à Hercule ; l''accès aux missions s''accompagne d''une garantie de signature d''un contrat annuel à 3 500 € en fonction des offres.<br/><br/>Éligibilité : plus de 3 associés ou collaborateurs.<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Pour comprendre nos modalités de facturation :<br/><a href="https://hercule.dev">hercule.dev</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Pour plus d''information sur nos tarifications :<br/><a href="https://hercule.dev">hercule.dev</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';

INSERT INTO public.email_variable_bindings (niche, variable_key, enabled)
VALUES
    ('comptable', 'slot_1', true),
    ('comptable', 'slot_2', true)
ON CONFLICT (niche, variable_key) DO NOTHING;
