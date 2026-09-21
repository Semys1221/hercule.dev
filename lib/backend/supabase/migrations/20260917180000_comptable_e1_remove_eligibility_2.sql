-- Comptable Interested E1: remove minimum 2 associates/collaborators eligibility line.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué d''agences e-commerce de 3 à 12 salariés, disposant d''un budget annuel dédié à l''externalisation comptable. L''expertise recherchée est une approche à 360 : le social / paie, la tenue fiscale, conseils.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';
