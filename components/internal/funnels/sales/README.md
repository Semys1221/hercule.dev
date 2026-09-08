# Session client — parcours live

## AI agents

Before editing, read:

1. [`.cursor/rules/nextjs-hercule.mdc`](../../../../.cursor/rules/nextjs-hercule.mdc)
2. [`.cursor/skills/hercule-nextjs/SKILL.md`](../../../../.cursor/skills/hercule-nextjs/SKILL.md) (router)
3. [`.cursor/skills/hercule-nextjs-sales-funnel/SKILL.md`](../../../../.cursor/skills/hercule-nextjs-sales-funnel/SKILL.md) (this domain)

Canon: [doc/README.md](../../../../doc/README.md).

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

## Session test (mode développeur)

Sur l'étape **Rendez-vous**, le bouton **Test** :

- provisionne ou réinitialise le lead `seed-sales-session` (`nanguy29@gmail.com`) ;
- pré-remplit qualification, closing et formulaire dashboard ;
- active le mode développeur (navigation libre + raccourcis dashboard).

Sur le dashboard client (`/dashboard/seed-sales-session`), en mode dev : **Simuler le paiement** puis **Compléter l'onboarding (test)** pour parcourir le pipeline sans Stripe ni saisie manuelle.
