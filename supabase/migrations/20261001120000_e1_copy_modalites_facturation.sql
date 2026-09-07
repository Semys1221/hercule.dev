-- Email 1: replace "Pour voir davantage de profils" with billing modalities line.

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        'Pour voir davantage de profils :',
        'Pour comprendre nos modalités de facturation :'
    ),
    updated_at = NOW()
WHERE template_key = 'interested_email1'
  AND body_html LIKE '%Pour voir davantage de profils :%';
