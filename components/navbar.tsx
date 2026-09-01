"use client"

import { HerculeMark } from "@/components/hercule-mark"
import { CALENDLY_URL } from "@/lib/constants"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur-md">
      <div className="w-full flex justify-center px-6 py-4">
        <div className="w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HerculeMark variant="dual" className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Hercule</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#methode" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Méthode
            </a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Tarification
            </a>
            <a href="#garanties" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Garanties
            </a>
            <a href="#contact" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 rounded-md border border-zinc-700 transition-colors"
            >
              Demander un apport d&apos;affaire
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
