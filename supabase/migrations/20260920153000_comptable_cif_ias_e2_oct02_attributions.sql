-- Comptable + CIF + IAS Interested E2: échanges démarrent le 02 oct. dans la limite des attributions.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous sur les demandes en attente — entreprises de BTP de 3 à 12 salariés.<br/><br/>Les échanges entre cabinet et clients démarrent le 02 oct. dans la limite des attributions. Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous sur les demandes en attente — cabinets dentistes/vétérinaires (2+ salariés), enjeux trésorerie et fiscalité.<br/><br/>Les échanges entre cabinet et clients démarrent le 02 oct. dans la limite des attributions.<br/><br/>Disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_cif_link}}">Mon cabinet est compatible</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4'
  AND template_key = 'interested_email2';

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous concernant les demandes de contrat annuel en attente que nous recevons actuellement.<br/><br/>Les échanges entre cabinet et clients démarrent le 02 oct. dans la limite des attributions.<br/><br/>Si vous souhaitez postuler pour recevoir ces demandes mensuellement pour votre cabinet :<br/><br/>Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_cif_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'fcfbc849-508d-493a-b8a1-fb14db2f4909'
  AND template_key = 'interested_email2';
