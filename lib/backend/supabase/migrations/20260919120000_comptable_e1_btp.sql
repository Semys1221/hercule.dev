-- Comptable Interested E1–E2: niche BTP (remplace agences e-commerce).

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(body_html, 'agences e-commerce', 'entreprises de BTP'),
    updated_at = NOW()
WHERE template_key = 'interested_email1'
  AND body_html LIKE '%agences e-commerce%';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué d''entreprises de BTP de 3 à 12 salariés, disposant d''un budget annuel dédié à l''externalisation comptable. L''expertise recherchée est une approche à 360 : le social / paie, la tenue fiscale, conseils.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>L''appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement — entreprises de BTP de 3 à 12 salariés, disposant d''un budget annuel dédié à l''externalisation comptable.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';
