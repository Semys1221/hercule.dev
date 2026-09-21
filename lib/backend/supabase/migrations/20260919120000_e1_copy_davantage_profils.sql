-- Email 1: replace modalités line with "Pour voir davantage de profils".

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        'Pour comprendre nos modalités et la qualification des demandes :',
        'Pour voir davantage de profils :'
    ),
    updated_at = NOW()
WHERE template_key = 'interested_email1'
  AND body_html LIKE '%Pour comprendre nos modalités et la qualification des demandes :%';
