# Session client — parcours live

Ce dossier héberge la **session client** utilisée en production, pas l'éditeur de parcours admin.

## Route

`/internal/funnels/{audience}/sales/funnel`

- Plein écran, sans sidebar admin (`FunnelAppSidebar`)
- Layout dédié : `app/internal/funnels/[audience]/sales/funnel/`

## Accès

| Action | Chemin |
|--------|--------|
| Entrée | Hub Session (`/internal/funnels/{audience}/sales`) → bouton **Ouvrir la session** |
| Sortie | Bouton **Quitter** en bas de la sidebar → retour au hub Session |

Le lien direct n'apparaît pas dans la navigation admin : la session s'ouvre uniquement depuis le hub.

## Architecture

- `sales-funnel-module.tsx` — shell plein écran (sidebar étapes + contenu)
- `sales-funnel-sidebar.tsx` — navigation des étapes
- `sales-funnel-sections.ts` — configuration des étapes
- `sales-hub-landing.tsx` — porte d'entrée admin (bouton d'ouverture)

Ne pas brancher ce flux via `leaf-content` ni le catch-all `(workspace)/[[...path]]`.

## Usage

Cette interface est destinée à être affichée **directement devant le client** pendant un rendez-vous.
