import type { Niche } from "@/lib/admin/navigation";

export type EmailVariableFamily = "outreach" | "booking" | "product";

export type EmailVariableDefinition = {
  key: string;
  niches: Niche[];
  family: EmailVariableFamily;
  supabaseColumn?: string;
  instantlyKey?: string;
};

export const EMAIL_VARIABLE_CATALOG: EmailVariableDefinition[] = [
  {
    key: "firstNameLine",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "booking",
  },
  {
    key: "date",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "booking",
  },
  {
    key: "heure",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "booking",
  },
  {
    key: "confirmation_agence_link",
    niches: ["agence"],
    family: "booking",
    supabaseColumn: "confirmation_agence_link",
  },
  {
    key: "confirmLink",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "booking",
  },
  {
    key: "post_booking_link",
    niches: ["agence", "entreprise"],
    family: "booking",
  },
  {
    key: "confirmation_comptable_link",
    niches: ["comptable"],
    family: "booking",
    supabaseColumn: "confirmation_comptable_link",
  },
  {
    key: "reservation_agence_link",
    niches: ["agence"],
    family: "outreach",
    supabaseColumn: "reservation_agence_link",
  },
  {
    key: "reservation_comptable_link",
    niches: ["comptable"],
    family: "outreach",
    supabaseColumn: "reservation_comptable_link",
  },
  {
    key: "reservation_cif_link",
    niches: ["cif"],
    family: "outreach",
    supabaseColumn: "reservation_cif_link",
  },
  {
    key: "confirmation_cif_link",
    niches: ["cif"],
    family: "booking",
    supabaseColumn: "confirmation_cif_link",
  },
  {
    key: "dashboardLink",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "product",
    supabaseColumn: "dashboard_link",
  },
  {
    key: "email",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "product",
    supabaseColumn: "email",
  },
  {
    key: "company",
    niches: ["agence", "comptable", "entreprise", "cif"],
    family: "product",
    supabaseColumn: "company",
  },
];

export function catalogVariablesForNiche(niche: Niche): string[] {
  return EMAIL_VARIABLE_CATALOG.filter((entry) => entry.niches.includes(niche)).map(
    (entry) => `{{${entry.key}}}`,
  );
}
