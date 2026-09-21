# 029 — Fix no-tiny-uppercase-tracked-label in components/comptable/apercu-crm.tsx

- **Status**: TODO
- **Commit**: 43e994f
- **Severity**: MEDIUM
- **Category**: Maintainability
- **Rule**: react-doctor/no-tiny-uppercase-tracked-label
- **Estimated scope**: 1 file

## Problem

Location: `components/comptable/apercu-crm.tsx:154`

This tiny uppercase tracked label is difficult to scan and makes the interface feel mechanically styled. Use readable sentence-case text.

Surface: **marketing** | Source: react-doctor-design

## Target

Follow the canonical fix recipe:

## Fix prompt

Apply this candidate correction only after the required evidence confirms the risk.

Use ordinary interface casing at a readable size instead of shrinking and spacing out short labels.

## Repo conventions to follow

- Skill: `hercule-forms`
- Exemplar: `components/internal/funnels/fiche-form.tsx`
- Semantic tokens only in internal UI — see `.cursor/skills/hercule-ui/SKILL.md`

## Steps

1. Open `components/comptable/apercu-crm.tsx` at line 154.
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
- **Done when**: diagnostic at `components/comptable/apercu-crm.tsx:154` is resolved.
