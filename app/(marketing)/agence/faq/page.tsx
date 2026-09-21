import { redirect } from "next/navigation"

/** Public agence FAQ retired — redirect to FAQ hub. */
export default function AgenceFaqPageRoute() {
  redirect("/faq")
}
