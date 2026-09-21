# Rive — Sticker man

## Fichiers

| Fichier | Usage |
|---------|--------|
| `sticker-man.riv` | **Asset cible** — scène custom (à créer dans [Rive](https://rive.app)) |
| `chatbot.riv` | Fallback actuel (lip-sync `isTalking`) |
| `character-state-machine.riv` | Référence community (walk / run / jump) |

## Contrat `sticker-man.riv`

Créer une state machine **`StickerMan`** avec ces inputs :

| Input | Type | Déclenché quand |
|-------|------|-----------------|
| `fall` | Trigger | Le perso atterrit sur la feuille |
| `type` | Trigger | Début de la frappe clavier |
| `lookCamera` | Trigger | Fin de frappe — regard caméra |
| `isTyping` | Boolean (opt.) | `true` pendant la frappe |
| `isTalking` | Boolean (opt.) | Lip-sync pendant la frappe |

Le **nom sur l’écran du laptop** reste en overlay React (`StickerScenePaper`) — texte dynamique.

## Workflow Rive editor

1. [rive.app](https://rive.app) → nouveau fichier
2. Dessiner le perso style Notion (N&B, lunettes, hoodie)
3. Animer : `idle` → `fall` → `typing` → `look`
4. State machine `StickerMan` + triggers ci-dessus
5. Exporter → `public/rive/sticker-man.riv`
6. Recharger `/internal/composants/sticker-man`

Config runtime : `lib/sticker/rive-sticker-config.ts`
