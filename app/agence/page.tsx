import { redirect } from "next/navigation"

/** Public agence landing retired — courtage B2B hub is now `/`. */
export default function AgencePage() {
  redirect("/")
}
