-- Entreprise post-booking prep page URL (Resend H-48 + Instantly custom variable).

ALTER TABLE public.entreprise
    ADD COLUMN IF NOT EXISTS post_booking_link TEXT;

UPDATE public.entreprise
SET post_booking_link =
    'https://www.hercule.dev/post-booking-entreprise.html/' || slug || '?email=' || lower(email)
WHERE slug IS NOT NULL
  AND email IS NOT NULL
  AND post_booking_link IS NULL;

COMMENT ON COLUMN public.entreprise.post_booking_link IS
    'Full post-booking prep URL: https://www.hercule.dev/post-booking-entreprise.html/{slug}?email={email}';
