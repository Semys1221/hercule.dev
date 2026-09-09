-- Comptable Interested subsequence: add hercule.dev tarifications link to E1–E3.

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        '{{accountSignature}}',
        'Pour plus d''information sur nos tarifications :<br/><a href="https://hercule.dev">hercule.dev</a><br/><br/>{{accountSignature}}'
    ),
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6'
  AND template_key IN ('interested_email1', 'interested_email2', 'interested_email3')
  AND body_html NOT LIKE '%Pour plus d%information sur nos tarifications%';
