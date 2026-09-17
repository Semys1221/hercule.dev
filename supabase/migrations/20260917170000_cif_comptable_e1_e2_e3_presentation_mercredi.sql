-- CIF + Comptable Interested E1–E3: appels de présentation mercredi 10h (sans mention conférence).
-- Comptable: backfill reservation links → reservation-conference.html.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>L''expertise recherchée porte sur le placement des avoirs professionnels et privés et la réduction de la pression fiscale.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez que nous vous mettions en relation avec ces cabinets : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous sur les demandes en attente — cabinets dentistes/vétérinaires (2+ salariés), enjeux trésorerie et fiscalité.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).<br/><br/><a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email2';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet vous intéresse encore, les appels de présentation ont lieu tous les mercredis à 10h (heure de Paris) : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email3';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Voici plus de précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué d''agences e-commerce de 3 à 12 salariés, disposant d''un budget annuel dédié à l''externalisation comptable. L''expertise recherchée est une approche à 360 : le social / paie, la tenue fiscale, conseils.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct. Si vous souhaitez candidater, proposez votre cabinet en cliquant ici : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).<br/><br/>Pour recevoir ce type de contrat, votre cabinet doit compter au minimum 2 associés ou collaborateurs.<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinets et entreprise démarrent entre le 19 septembre et le 02 oct.<br/><br/>Les appels de présentation sont réalisés tous les mercredis à 10h (heure de Paris).<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je me dois de clôturer nos échanges ici.<br/><br/>Si le sujet vous intéresse encore, les appels de présentation ont lieu tous les mercredis à 10h (heure de Paris) : <a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email3';

UPDATE public.comptable
SET
    reservation_comptable_link = REPLACE(
        reservation_comptable_link,
        'https://www.hercule.dev/reservation-entreprise.html',
        'https://www.hercule.dev/reservation-conference.html'
    ),
    updated_at = NOW()
WHERE reservation_comptable_link LIKE '%reservation-entreprise.html%';
