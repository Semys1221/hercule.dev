import { buildVerticalCopy } from "./build-vertical-copy";

export const restaurantCopy = buildVerticalCopy({
  routeSegment: "restaurant",
  brandLabel: "Cabinet",
  heroCaption:
    "Un accompagnement pensé pour les restaurateurs qui veulent mieux piloter leur rentabilité.",
  imagePath: "/reservation/restaurant.webp",
  entityYour: "votre restaurant",
  entityShort: "restaurant",
  intentionProfitLabel:
    "Je souhaite réellement améliorer la rentabilité de mon restaurant",
  investLabel: "Investir dans le restaurant",
  visibilityOptions: [
    { value: "purchases", label: "Mes achats et mon coût matière" },
    { value: "menu_margin", label: "La rentabilité de mes plats et mes prix" },
    { value: "payroll", label: "Mon personnel et ma masse salariale" },
    { value: "overheads", label: "Mes charges et mes dépenses" },
    { value: "all", label: "Je manque de visibilité sur l’ensemble" },
    {
      value: "unknown_margin",
      label: "Je ne sais pas précisément où ma marge disparaît",
    },
  ],
  meetingPriorityOptions: [
    { value: "purchases", label: "Mes achats / mon coût matière" },
    { value: "menu_margin", label: "Mes prix et la marge de mes plats" },
    { value: "payroll", label: "Mon personnel / ma masse salariale" },
    { value: "overheads", label: "Mes charges" },
    { value: "global", label: "Ma rentabilité globale" },
    { value: "accounting", label: "Ma situation comptable" },
  ],
  educationLead:
    "Un restaurant peut avoir du chiffre d’affaires tout en laissant trop peu de bénéfice à son dirigeant.",
  educationBlocks: [
    {
      title: "Achats & coût matière",
      body: "Identifier les dépenses trop élevées et les écarts sur vos achats.",
    },
    {
      title: "Prix & rentabilité des plats",
      body: "Identifier les plats qui génèrent trop peu de marge.",
    },
    {
      title: "Personnel & organisation",
      body: "Identifier les coûts de personnel qui pèsent sur votre résultat.",
    },
  ],
  finalPrepEntityMention:
    "toute question particulière concernant votre restaurant.",
});
