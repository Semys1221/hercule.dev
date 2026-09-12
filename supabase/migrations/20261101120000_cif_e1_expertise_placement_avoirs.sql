-- CIF Interested E1: expertise placement avoirs + réduction pression fiscale.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>L''expertise recherchée porte sur le placement des avoirs professionnels et privés et la réduction de la pression fiscale.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez que nous vous mettions en relation avec ces cabinets : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/><i>L''appel se réalisera avec un membre de l''équipe</i><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email1';
