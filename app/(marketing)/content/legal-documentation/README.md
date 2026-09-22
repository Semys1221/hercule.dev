# Legal documentation (runtime)

Exported from Notion **Hercule Canon** (pricing **v3**). Do not treat as editorial master.

| Path | Role |
|------|------|
| `_shared/cgv.md` | Unique CGV — sections DEC Mercantile · Hercule Hubris |
| `_shared/mentions-legales.md` | Groupement Evan Sinclair |
| `_shared/confidentialite.md` | Privacy |
| `{comptable,assurance,cif}/` | Niche FAQ + pricing + CGV mirror |
| `{comptable,cif,ias}/sequences/` | Git mirror of live sequences |
| `agence/`, `entreprise/` | Legacy stubs (archived) |

## Canon pricing v3

| Offre | Prix | Ancre `/cvg` |
|-------|------|--------------|
| Hercule Mercantile (DEC) | 1 499 € — 1 mois · 10 RDV garantis · 30 j de test · +30 j gratuits | `#dec` |
| Hercule Hubris (IAS + CIF) | Option A 4 000 € flat · Option B 1 800 €/mois × 3 · 15–20 bilans/trimestre | `#hubris` |

Obsolete as standalone listings: IAS 1 999 €/mois · CIF 3 499 €/90j · DEC pack 3 598 € (−20 %).

```bash
pnpm legal:export
pnpm legal:validate
```
