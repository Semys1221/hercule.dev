-- Hardcode sender signature in subsequence email templates.

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(body_html, '{{accountSignature}}', 'Béatrice Meyer'),
    updated_at = NOW()
WHERE template_key IN (
    'interested_email1',
    'interested_email2',
    'interested_email3',
    'no_show_email1',
    'no_show_email2'
);
