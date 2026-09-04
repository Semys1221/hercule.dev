-- Rename tracking slug column and persist full booking/confirm URLs.

ALTER TABLE public.agence RENAME COLUMN link TO slug;
ALTER TABLE public.entreprise RENAME COLUMN link TO slug;

ALTER INDEX public.agence_link_idx RENAME TO agence_slug_idx;
ALTER INDEX public.entreprise_link_idx RENAME TO entreprise_slug_idx;

ALTER TABLE public.agence
    ADD COLUMN reservation_agence_link TEXT,
    ADD COLUMN reservation_entreprise_link TEXT,
    ADD COLUMN confirmation_agence_link TEXT;

ALTER TABLE public.entreprise
    ADD COLUMN reservation_agence_link TEXT,
    ADD COLUMN reservation_entreprise_link TEXT,
    ADD COLUMN confirmation_agence_link TEXT;

UPDATE public.agence SET
    reservation_agence_link = 'https://www.hercule.dev/reservation.html/' || slug,
    reservation_entreprise_link = 'https://www.hercule.dev/reservation-entreprise.html/' || slug,
    confirmation_agence_link = 'https://www.hercule.dev/confirm-reservation.html/' || slug
        || '?email=' || replace(lower(trim(email)), '@', '%40');

UPDATE public.entreprise SET
    reservation_agence_link = 'https://www.hercule.dev/reservation.html/' || slug,
    reservation_entreprise_link = 'https://www.hercule.dev/reservation-entreprise.html/' || slug,
    confirmation_agence_link = 'https://www.hercule.dev/confirm-reservation.html/' || slug
        || '?email=' || replace(lower(trim(email)), '@', '%40');

ALTER TABLE public.agence
    ALTER COLUMN reservation_agence_link SET NOT NULL,
    ALTER COLUMN reservation_entreprise_link SET NOT NULL,
    ALTER COLUMN confirmation_agence_link SET NOT NULL;

ALTER TABLE public.entreprise
    ALTER COLUMN reservation_agence_link SET NOT NULL,
    ALTER COLUMN reservation_entreprise_link SET NOT NULL,
    ALTER COLUMN confirmation_agence_link SET NOT NULL;

COMMENT ON COLUMN public.agence.slug IS
  'Unique URL slug passed as Calendly utm_content. Not a full URL.';
COMMENT ON COLUMN public.entreprise.slug IS
  'Unique URL slug passed as Calendly utm_content. Not a full URL.';
COMMENT ON COLUMN public.agence.reservation_agence_link IS
  'Full booking URL: https://www.hercule.dev/reservation.html/{slug}';
COMMENT ON COLUMN public.entreprise.reservation_agence_link IS
  'Full booking URL: https://www.hercule.dev/reservation.html/{slug}';
COMMENT ON COLUMN public.agence.reservation_entreprise_link IS
  'Full booking URL: https://www.hercule.dev/reservation-entreprise.html/{slug}';
COMMENT ON COLUMN public.entreprise.reservation_entreprise_link IS
  'Full booking URL: https://www.hercule.dev/reservation-entreprise.html/{slug}';
COMMENT ON COLUMN public.agence.confirmation_agence_link IS
  'Full confirm URL for agence Resend/Instantly: confirm-reservation.html/{slug}?email=';
COMMENT ON COLUMN public.entreprise.confirmation_agence_link IS
  'Full confirm URL (stored on both tables; used for agence emails only).';
