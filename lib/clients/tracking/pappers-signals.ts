import { COMPTABLE_SIGNALS } from "@/lib/legacy/admin/funnels/comptable-sales-copy";

export type PappersSignal = {
  id: string;
  label: string;
};

/** Placeholder in phase line arrays — resolved at scan generation time. */
export const PAPPERS_SIGNAL_PLACEHOLDER = "__PAPPERS_SIGNAL__";

const EXTENDED_PAPPERS_SIGNALS: PappersSignal[] = [
  {
    id: "comptes-annuels",
    label: "dépôt des comptes annuels (échéance)",
  },
  {
    id: "augmentation-capital",
    label: "augmentation de capital",
  },
  {
    id: "changement-siege",
    label: "changement d'adresse du siège",
  },
  {
    id: "procedure-collective",
    label: "procédure collective (BODACC)",
  },
  {
    id: "croissance-ca",
    label: "croissance du chiffre d'affaires (tranche INSEE)",
  },
];

/** Ten Pappers-backed signals that justify accounting counsel — DEC journal only. */
export const PAPPERS_COMPTABLE_SIGNALS: readonly PappersSignal[] = [
  ...COMPTABLE_SIGNALS.map(({ id, label }) => ({ id, label })),
  ...EXTENDED_PAPPERS_SIGNALS,
];

export const SECTOR_SIGNAL_JOURNAL_LINE =
  "Signaux sectoriels appliqués — profils patrimoniaux";

export function formatPappersSignalJournalLine(signal: PappersSignal): string {
  return `Signaux Pappers appliqués — ${signal.label}`;
}

export function pickPappersSignal(slug: string, slotKey: string): PappersSignal {
  const index = hashString(`${slug}:${slotKey}`) % PAPPERS_COMPTABLE_SIGNALS.length;
  return PAPPERS_COMPTABLE_SIGNALS[index];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
