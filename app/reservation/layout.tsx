import { Cormorant_Garamond, Inter } from "next/font/google"

const jumSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jum-sans",
})
const jumSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-jum-serif",
})

export default function ReservationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${jumSans.variable} ${jumSerif.variable}`}>
      <link
        rel="stylesheet"
        href="https://assets.calendly.com/assets/external/widget.css"
      />
      {children}
    </div>
  )
}
