-- Comptable + CIF reply agent: harmoniser la relance E2 (02 oct. / attributions).

UPDATE public.ai_reply_agent_config
SET
    prompt_snapshot = REPLACE(
        prompt_snapshot,
        '- **Relance (E2)** : demandes de contrat annuel en attente — candidature pour recevoir les demandes **mensuellement**.',
        '- **Relance (E2)** : rappel — les échanges démarrent le **02 oct.** dans la limite des **attributions** ; demandes de contrat annuel en attente — candidature pour recevoir les demandes **mensuellement**.'
    ),
    updated_at = NOW()
WHERE campaign_id = 'e4c58718-ca00-4e27-b714-68e522fe4db6';

UPDATE public.ai_reply_agent_config
SET
    prompt_snapshot = REPLACE(
        prompt_snapshot,
        '- **Relance (E2)** : rappel de la fenêtre 19 sept.–02 oct. ; demandes de contrat annuel en attente.',
        '- **Relance (E2)** : rappel — les échanges démarrent le **02 oct.** dans la limite des **attributions** ; demandes en attente — proposer le briefing collectif via {reservation_cif_link}.'
    ),
    updated_at = NOW()
WHERE campaign_id = 'e3bdb573-fe9f-437d-bd96-4ceb52869dd4';
