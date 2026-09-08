import {
  appendPlainSignature,
  renderBookingHtml,
} from "@/lib/booking-communication/signatures";
import type { LeadCategory } from "@/lib/link-tracking/types";

export function formatParisTime(iso: string | null | undefined): string {
  if (!iso?.trim()) {
    return "l'heure prévue";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    timeStyle: "short",
  }).format(date);
}

export function buildNotPresentBody(
  firstName: string,
  startTime: string | null | undefined,
): string {
  const greeting = firstName === "Bonjour" ? "Bonjour" : `Bonjour ${firstName}`;
  const heure = formatParisTime(startTime);
  return `${greeting},

Votre rendez-vous avec Hercule était prévu à ${heure}.

Êtes-vous toujours disponible pour notre échange ?`;
}

export async function renderNotPresentEmail(params: {
  firstName: string;
  startTime: string | null | undefined;
  category: LeadCategory;
}): Promise<{ text: string; html: string }> {
  const body = buildNotPresentBody(params.firstName, params.startTime);
  return {
    text: appendPlainSignature(body, params.category),
    html: await renderBookingHtml(body, params.category),
  };
}
