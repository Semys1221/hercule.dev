-- Email 1: replace opening line with "Pour faire simple,".

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(body_html, 'Voici les précisions.', 'Pour faire simple,'),
    updated_at = NOW()
WHERE template_key = 'interested_email1'
  AND body_html LIKE '%Voici les précisions.%';
