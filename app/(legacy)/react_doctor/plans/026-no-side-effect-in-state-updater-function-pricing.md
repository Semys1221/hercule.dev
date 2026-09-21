# 026 — Fix no-side-effect-in-state-updater-function in components/comptable/pricing-flip-card.tsx

- **Status**: TODO
- **Commit**: 43e994f
- **Severity**: MEDIUM
- **Category**: Bugs
- **Rule**: react-doctor/no-side-effect-in-state-updater-function
- **Estimated scope**: 1 file

## Problem

Location: `components/comptable/pricing-flip-card.tsx:33`

This side-effecting call runs inside a state updater, which React may invoke more than once. Move it outside the setter after computing the next state.

Surface: **marketing** | Source: react-doctor

## Target

Follow the canonical fix recipe:

## Fix prompt

Apply this candidate correction only after the required evidence confirms the risk.

React may replay a state updater, so callbacks, analytics, and persistence inside it can run more than once. Compute state purely, then perform the side effect outside the setter.

## Repo conventions to follow

- Skill: `hercule-nextjs-marketing`
- Exemplar: `components/agence/scene-accueil.tsx`
- Semantic tokens only in internal UI — see `.cursor/skills/hercule-ui/SKILL.md`

## Steps

1. Open `components/comptable/pricing-flip-card.tsx` at line 33.
2. Apply the canonical fix without changing unrelated code.
3. Run verification commands below.

## Boundaries

- Do NOT change public component APIs unless required by the fix.
- Do NOT refactor marketing inline styles unless this file is internal/dashboard.
- STOP if the file has drifted from commit 43e994f; re-run `pnpm frontend-audit scan`.

## Verification

- **Mechanical**: `pnpm doctor` — targeted diagnostic cleared, score not regressed.
- **Lint**: `pnpm lint`
- **Visual** (if UI changed): `pnpm e2e:visual` for affected surface.
- **Done when**: diagnostic at `components/comptable/pricing-flip-card.tsx:33` is resolved.
