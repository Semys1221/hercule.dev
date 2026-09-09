# 033 — Fix no-arbitrary-px-font-size in components/agence/apercu-crm.tsx

- **Status**: TODO
- **Commit**: 43e994f
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: react-doctor/no-arbitrary-px-font-size
- **Estimated scope**: 1 file

## Problem

Location: `components/agence/apercu-crm.tsx:158`

`text-[10px]` doesn't scale with the user's font-size preference — use rem, e.g. `text-[0.625rem]`.

Surface: **marketing** | Source: react-doctor-design

## Target

Follow the canonical fix recipe:

## Fix prompt

Apply this candidate correction only after the required evidence confirms the risk.

Use `rem` for arbitrary font sizes (`text-[0.8125rem]`, not `text-[13px]`) so text scales with the user's root font-size preference. Pixels stay fine for `border-*` / `outline-*`.

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
