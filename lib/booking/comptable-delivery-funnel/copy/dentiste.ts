import { buildVerticalCopy } from "./build-vertical-copy";

export const dentisteCopy = buildVerticalCopy({
  routeSegment: "chirurgien-dentiste",
  brandLabel: "Cabinet",
  heroCaption:
    "Un accompagnement pour les chirurgiens-dentistes qui veulent mieux piloter la rentabilité de leur cabinet.",
  imagePath: "/reservation/dentiste.webp",
  entityYour: "votre cabinet",
  entityShort: "cabinet",
  intentionProfitLabel:
    "Je souhaite réellement améliorer la rentabilité de mon cabinet",
  investLabel: "Investir dans mon cabinet ou mon matériel",
  visibilityOptions: [
    { value: "purchases", label: "Mes achats et consommables" },
    { value: "acts_margin", label: "La rentabilité de mes actes et tarifs" },
    { value: "payroll", label: "Mon personnel et ma masse salariale" },
    { value: "overheads", label: "Mes charges et mes dépenses" },
    { value: "all", label: "Je manque de visibilité sur l’ensemble" },
    {
      value: "unknown_margin",
      label: "Je ne sais pas précisément où ma marge disparaît",
    },
  ],
  meetingPriorityOptions: [
    { value: "purchases", label: "Mes achats / consommables" },
    { value: "acts_margin", label: "Mes actes et marges" },
    { value: "payroll", label: "Mon personnel / ma masse salariale" },
    { value: "overheads", label: "Mes charges" },
    { value: "global", label: "Ma rentabilité globale" },
    { value: "accounting", label: "Ma situation comptable" },
  ],
  educationLead:
    "Un cabinet dentaire peut avoir une activité soutenue tout en laissant trop peu de bénéfice à son dirigeant.",
  educationBlocks: [
    {
      title: "Achats & consommables",
      body: "Identifier les dépenses trop élevées et les écarts sur vos achats.",
    },
    {
      title: "Actes & tarification",
      body: "Identifier les actes qui génèrent trop peu de marge.",
    },
    {
      title: "Personnel & organisation",
      body: "Identifier les coûts de personnel qui pèsent sur votre résultat.",
    },
  ],
  finalPrepEntityMention:
    "toute question particulière concernant votre cabinet.",
});
