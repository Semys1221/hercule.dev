-- JUM chirurgiens-dentistes Interested E1: DGFiP / AMF / cotisations / taxe 30–41 %.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Les cotisations bloquent une partie de vos honoraires, mais plusieurs leviers réglementaires permettent de réduire la taxe à 30 % à 41 % avant le prélèvement final.<br/><br/>Pour vérifier si votre structure est éligible aux critères mis en vigueur par la DGFiP, nous validons l''étude de votre dossier lors d''un entretien individuel.<br/><br/>Votre première étude se déroulera à distance avec un consultant agréé par l''AMF.<br/><br/>Réserver votre échange : <a href="{{reservation_jum_link}}">Réserver votre échange</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = '0f0b450a-e550-461c-96f6-1a7681678d67'
  AND template_key = 'interested_email1_dentiste';
