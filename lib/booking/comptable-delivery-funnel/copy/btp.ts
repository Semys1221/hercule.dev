import { buildVerticalCopy } from "./build-vertical-copy";

export const btpCopy = buildVerticalCopy({
  routeSegment: "btp",
  brandLabel: "Cabinet",
  heroCaption:
    "Un accompagnement pour les entreprises du BTP qui veulent sécuriser leurs marges chantier par chantier.",
  imagePath: "/reservation/btp.webp",
  entityYour: "votre entreprise",
  entityShort: "entreprise",
  intentionProfitLabel:
    "Je souhaite réellement améliorer la rentabilité de mon activité",
  investLabel: "Investir dans mon matériel ou mes chantiers",
  visibilityOptions: [
    { value: "purchases", label: "Mes achats matériaux et sous-traitance" },
    { value: "quotes_margin", label: "La marge de mes devis et chantiers" },
    { value: "payroll", label: "Mon personnel et ma masse salariale" },
    { value: "overheads", label: "Mes charges et mes dépenses" },
    { value: "all", label: "Je manque de visibilité sur l’ensemble" },
    {
      value: "unknown_margin",
      label: "Je ne sais pas précisément où ma marge disparaît",
    },
  ],
  meetingPriorityOptions: [
    { value: "purchases", label: "Mes achats / sous-traitance" },
    { value: "quotes_margin", label: "Mes devis et marges chantier" },
    { value: "payroll", label: "Mon personnel / ma masse salariale" },
    { value: "overheads", label: "Mes charges" },
    { value: "global", label: "Ma rentabilité globale" },
    { value: "accounting", label: "Ma situation comptable" },
  ],
  educationLead:
    "Une entreprise du BTP peut réaliser du chiffre d’affaires tout en laissant trop peu de bénéfice à son dirigeant.",
  educationBlocks: [
    {
      title: "Achats & sous-traitance",
      body: "Identifier les dépenses trop élevées et les écarts sur vos chantiers.",
    },
    {
      title: "Devis & rentabilité chantier",
      body: "Identifier les chantiers qui génèrent trop peu de marge.",
    },
    {
      title: "Équipes & organisation",
      body: "Identifier les coûts de personnel qui pèsent sur votre résultat.",
    },
  ],
  finalPrepEntityMention:
    "toute question particulière concernant votre activité.",
});
