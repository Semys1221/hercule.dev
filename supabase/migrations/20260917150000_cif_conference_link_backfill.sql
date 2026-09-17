-- CIF conference cutover follow-up: backfill reservation links + E1 copy (briefing collectif).

UPDATE public.cif
SET
    reservation_cif_link = REPLACE(
        reservation_cif_link,
        'https://www.hercule.dev/reservation-cif.html',
        'https://www.hercule.dev/reservation-conference.html'
    ),
    updated_at = NOW()
WHERE reservation_cif_link LIKE '%reservation-cif.html%';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>L''expertise recherchée porte sur le placement des avoirs professionnels et privés et la réduction de la pression fiscale.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez découvrir le système Hercule pour votre cabinet : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>Inscription à notre conférence collective en visio (mercredi 10h, heure de Paris) via le lien ci-dessus.<br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email1';
