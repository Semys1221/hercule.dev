-- Update h48_confirm agence template copy (contiendront vs porteront sur).

UPDATE public.booking_email_templates
SET
    body = REPLACE(
        body,
        'porteront sur des contrats de conseil financier',
        'contiendront des contrats de conseil financier'
    ),
    updated_at = NOW()
WHERE category = 'agence'
  AND email_type = 'h48_confirm'
  AND body LIKE '%porteront sur des contrats de conseil financier%';
