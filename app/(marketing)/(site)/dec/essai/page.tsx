import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Offres DEC — Hercule",
  description: "Souscription DEC via la page conférence Hercule.",
};

export default function DecFreeTrialPage() {
  redirect("/conference/inscription");
}
