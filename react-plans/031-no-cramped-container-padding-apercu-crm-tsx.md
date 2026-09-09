# 031 — Fix no-cramped-container-padding in components/agence/apercu-crm.tsx

- **Status**: TODO
- **Commit**: 43e994f
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: react-doctor/no-cramped-container-padding
- **Estimated scope**: 1 file

## Problem

Location: `components/agence/apercu-crm.tsx:130`

This visible container leaves only 6px around its text. Use at least 8px of padding.

Surface: **marketing** | Source: react-doctor-design

## Target

Follow the canonical fix recipe:

## Fix prompt

Apply this candidate correction only after the required evidence confirms the risk.

Give text at least 8px of space inside a visible border or colored surface.

## Repo conventions to follow

- Skill: `hercule-nextjs-marketing`
- Exemplar: `components/agence/scene-accueil.tsx`
- Semantic tokens only in internal UI — see `.cursor/skills/hercule-ui/SKILL.md`

## Steps

1. Open `components/agence/apercu-crm.tsx` at line 130.
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
- **Done when**: diagnostic at `components/agence/apercu-crm.tsx:130` is resolved.
