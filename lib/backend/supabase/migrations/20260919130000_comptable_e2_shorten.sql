-- Comptable Interested E2: shorter BTP follow-up.

UPDATE public.instantly_bypass_templates
SET
    body_html = 'Bonjour,<br/><br/>Je reviens vers vous sur les demandes en attente — entreprises de BTP de 3 à 12 salariés.<br/><br/>Échanges entre le 19 sept. et le 02 oct. Êtes-vous disponible le {{slot_1}} ou le {{slot_2}} ?<br/><br/><a href="{{reservation_entreprise_link}}">Proposer mon cabinet</a><br/><br/>{{accountSignature}}',
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key = 'interested_email2';
