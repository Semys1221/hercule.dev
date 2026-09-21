-- Add outreach signature tagline to hardcoded Béatrice Meyer blocks in subsequence templates.

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        '<br/><br/>Béatrice Meyer',
        '<br/><br/>Béatrice Meyer<br/>hercule.dev Courtage contrat BNC/BIC<br/><a href="https://hercule.dev">hercule.dev</a>'
    ),
    updated_at = NOW()
WHERE body_html LIKE '%Béatrice Meyer%'
  AND body_html NOT LIKE '%Courtage contrat BNC/BIC%'
  AND body_html LIKE '%<br/><br/>Béatrice Meyer%';

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        'Cordialement,<br/>Béatrice Meyer',
        'Cordialement,<br/>Béatrice Meyer<br/>hercule.dev Courtage contrat BNC/BIC<br/><a href="https://hercule.dev">hercule.dev</a>'
    ),
    updated_at = NOW()
WHERE body_html LIKE '%Cordialement,<br/>Béatrice Meyer%'
  AND body_html NOT LIKE '%Courtage contrat BNC/BIC%';

UPDATE public.instantly_bypass_templates
SET
    body_html = REPLACE(
        body_html,
        'Bonne continuation,<br/><br/>Béatrice Meyer',
        'Bonne continuation,<br/><br/>Béatrice Meyer<br/>hercule.dev Courtage contrat BNC/BIC<br/><a href="https://hercule.dev">hercule.dev</a>'
    ),
    updated_at = NOW()
WHERE body_html LIKE '%Bonne continuation,<br/><br/>Béatrice Meyer%'
  AND body_html NOT LIKE '%Courtage contrat BNC/BIC%';
