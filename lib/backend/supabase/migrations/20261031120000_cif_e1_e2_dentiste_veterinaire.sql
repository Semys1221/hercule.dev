-- CIF Interested E1–E2: cabinets dentistes/vétérinaires 2+ salariés.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Pour faire simple,<br/><br/>Nous avons des demandes de cabinets de dentistes et vétérinaires (2+ salariés), confrontés à des enjeux de croissance, trésorerie et pression fiscale.<br/><br/>Expertise attendue : optimisation des flux et stocks de trésorerie.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Si vous souhaitez que nous vous mettions en relation avec ces cabinets : <a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email1';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous sur les demandes en attente — cabinets dentistes/vétérinaires (2+ salariés), enjeux trésorerie et fiscalité.<br/><br/>Les échanges démarrent entre le 19 sept. et le 02 oct.<br/><br/>Disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email2';
