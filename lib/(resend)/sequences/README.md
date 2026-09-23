# Resend sequences

Source of truth for Resend booking sequences used by Engin Communication and the legacy admin editors.

| Path | Role |
|------|------|
| `entries.ts` | Sequence catalog (`provider: "resend"`) |
| `booking-slugs.ts` | Email types per slug / audience |
| `content/{niche}/{slug}.md` | Git copy of subject + body |
| `file-io.ts` | Read / write markdown |
| `sync-to-file.ts` | Persist a save from the template editor |

Instantly / bypass / reply-agent sequences stay under `app/(marketing)/content/legal-documentation/`.

Runtime send still goes through `lib/(resend)/communication/`.
