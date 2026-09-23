import { NOTIFICATION_CATALOG } from "@/lib/(resend)/notifications/catalog";
import { listResendBookingSequences } from "@/lib/(resend)/sequences/registry";

export type CommunicationCatalogItem = {
  id: string;
  kind: "sequence" | "notification";
  name: string;
  category: string;
  description: string;
  status?: string;
  stepCount?: number;
  audiences?: string[];
};

export function loadCommunicationCatalog(): {
  sequences: CommunicationCatalogItem[];
  notifications: CommunicationCatalogItem[];
} {
  const sequences = listResendBookingSequences()
    .filter((entry) => entry.status === "built")
    .map((entry) => ({
      id: entry.slug,
      kind: "sequence" as const,
      name: entry.name,
      category: entry.category,
      description: entry.description,
      status: entry.status,
      stepCount: entry.stepCount,
      audiences: entry.audiences,
    }));

  const notifications = NOTIFICATION_CATALOG.map((entry) => ({
    id: entry.id,
    kind: "notification" as const,
    name: entry.label,
    category: "Notifications transactionnelles",
    description: entry.description,
  }));

  return { sequences, notifications };
}
