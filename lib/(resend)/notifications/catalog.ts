export type NotificationCatalogEntry = {
  id: string;
  label: string;
  description: string;
  sourceModule: string;
};

export const NOTIFICATION_CATALOG: NotificationCatalogEntry[] = [
  {
    id: "monthly-renewal-j7",
    label: "Renouvellement J-7",
    description: "Choix pause ou continuation, 7 jours avant la mensualité.",
    sourceModule: "lib/(resend)/clients/workflows/monthly-renewal-j7.ts",
  },
  {
    id: "subscription-renewed-client",
    label: "Abonnement renouvelé — client",
    description: "Crédits rendez-vous réinitialisés.",
    sourceModule: "lib/(resend)/clients/workflows/subscription-notify.ts",
  },
  {
    id: "subscription-renewed-ops",
    label: "Abonnement renouvelé — ops",
    description: "Copie interne du renouvellement.",
    sourceModule: "lib/(resend)/clients/workflows/subscription-notify.ts",
  },
  {
    id: "subscription-cancelled-client",
    label: "Abonnement annulé — client",
    description: "Confirmation d'annulation.",
    sourceModule: "lib/(resend)/clients/workflows/subscription-notify.ts",
  },
  {
    id: "subscription-cancelled-ops",
    label: "Abonnement annulé — ops",
    description: "Copie interne de l'annulation.",
    sourceModule: "lib/(resend)/clients/workflows/subscription-notify.ts",
  },
  {
    id: "credits-adjusted-client",
    label: "Crédits ajustés — client",
    description: "Email client après ajustement manuel.",
    sourceModule: "lib/(resend)/clients/workflows/adjust-credits.ts",
  },
  {
    id: "credits-adjusted-ops",
    label: "Crédits ajustés — ops",
    description: "Copie interne de l'ajustement.",
    sourceModule: "lib/(resend)/clients/workflows/adjust-credits.ts",
  },
  {
    id: "conference-welcome-fallback",
    label: "Bienvenue conférence (repli)",
    description: "Envoyé si la séquence payment-onboarding ne démarre pas.",
    sourceModule: "lib/(resend)/conference/post-payment.ts",
  },
  {
    id: "onboarding-answers-ops",
    label: "Réponses onboarding — ops",
    description: "Intro de la notification ops après onboarding.",
    sourceModule: "lib/(resend)/clients/workflows/onboarding-video-conference.ts",
  },
  {
    id: "onboarding-answers-client",
    label: "Réponses onboarding — client",
    description: "Intro de la copie client.",
    sourceModule: "lib/(resend)/clients/workflows/onboarding-video-conference.ts",
  },
  {
    id: "free-trial-onboarding-ops",
    label: "Essai DEC — onboarding ops",
    description: "Intro de la notification essai DEC.",
    sourceModule: "lib/(resend)/clients/workflows/onboarding-video-conference.ts",
  },
];

export function getNotificationCatalogEntry(id: string): NotificationCatalogEntry | null {
  return NOTIFICATION_CATALOG.find((entry) => entry.id === id) ?? null;
}
