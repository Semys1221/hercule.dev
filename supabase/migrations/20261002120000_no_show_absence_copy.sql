-- No-show sequence: operational absence copy + threaded follow-ups (email 1 subject only).

INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
VALUES
  (
    'agence',
    'no_show_indecis_1',
    'Absence — reprenez un créneau avec Hercule',
    '{{firstNameLine}}

Nous n''avons pas pu vous joindre lors de votre rendez-vous avec Hercule.

Pour en planifier un nouveau, utilisez votre lien personnel :
{{reservation_agence_link}}

L''équipe Hercule',
    NOW()
  ),
  (
    'agence',
    'no_show_indecis_2',
    '',
    '{{firstNameLine}}

Petit rappel : votre lien de réservation reste actif si vous souhaitez fixer un nouveau créneau.

{{reservation_agence_link}}

L''équipe Hercule',
    NOW()
  ),
  (
    'agence',
    'no_show_indecis_3',
    '',
    '{{firstNameLine}}

Dernier rappel : vous pouvez toujours reprendre rendez-vous via ce lien :

{{reservation_agence_link}}

L''équipe Hercule',
    NOW()
  )
ON CONFLICT (category, email_type) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();
