# 034 — Fix no-tiny-text in components/agence/apercu-crm.tsx

- **Status**: TODO
- **Commit**: 43e994f
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: react-doctor/no-tiny-text
- **Estimated scope**: 1 file

## Problem

Location: `components/agence/apercu-crm.tsx:158`

Your users strain to read 10px text, so use at least 12px for readable interface text, & 16px is best.

Surface: **marketing** | Source: react-doctor-design

## Target

Follow the canonical fix recipe:

## Fix prompt

Apply this candidate correction only after the required evidence confirms the risk.

Use at least 12px (0.75rem) for any body content; 16px (1rem) is ideal for prose. Captions and labels can go to 14px (0.875rem) with strong contrast. Don't shrink the font to make a layout fit: fix the layout. See https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation

## Repo conventions to follow

- Skill: `hercule-nextjs-marketing`
- Exemplar: `components/agence/scene-accueil.tsx`
- Semantic tokens only in internal UI — see `.cursor/skills/hercule-ui/SKILL.md`

## Steps

1. Open `components/agence/apercu-crm.tsx` at line 158.
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
- **Done when**: diagnostic at `components/agence/apercu-crm.tsx:158` is resolved.
