-- Interested E1: appel de présentation daté mercredi 23 septembre 10h (Paris).

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        'Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).',
        'L''appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).'
    ),
    updated_at = NOW()
WHERE template_key = 'interested_email1'
  AND body_html LIKE '%Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).%';

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        '<i>L''appel se réalisera avec un membre de l''équipe</i>',
        'L''appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).'
    ),
    updated_at = NOW()
WHERE template_key = 'interested_email1'
  AND body_html LIKE '%<i>L''appel se réalisera avec un membre de l''équipe</i>%';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué d''agences e-commerce de 3 à 12 salariés, disposant d''un budget annuel dédié à l''externalisation comptable. L''expertise recherchée est une approche à 360 : le social / paie, la tenue fiscale, conseils.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>L''appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>L''expertise recherchée porte sur le placement des avoirs professionnels et privés et la réduction de la pression fiscale.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez que nous vous mettions en relation avec ces cabinets : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>L''appel de présentation de Hercule sera réalisé ce mercredi 23 septembre à 10h (heure de Paris).<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email1';
