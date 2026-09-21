-- CIF Interested E1–E2: agences e-commerce 5+ salariés, trésorerie / flux.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Pour faire simple,<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué d''agences e-commerce de plus de 5 salariés, confrontées à des enjeux de croissance, de trésorerie et de pression fiscale, sans bonne gestion financière.<br/><br/>Nous attendons une expertise sur l''optimisation des flux et des stocks de trésorerie.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous possédez les expertises requises, proposez votre cabinet en cliquant ici : <a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement — agences e-commerce de plus de 5 salariés, avec des enjeux de croissance, de trésorerie et de pression fiscale. L''expertise recherchée porte sur l''optimisation des flux et des stocks de trésorerie.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email2';
