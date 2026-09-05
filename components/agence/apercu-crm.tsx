"use client"

import type { ComponentType } from "react"
import { HerculeMark } from "@/components/hercule-mark"
import { motion } from "framer-motion"
import {
  Search,
  ChevronDown,
  Users,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Radar,
  MessageSquare,
  Send,
} from "lucide-react"

const prospects = [
  {
    name: "Marie Dupont",
    role: "CEO",
    company: "Retail Plus",
    need: "Refonte Shopify",
    budget: "2 000 €",
    active: true,
  },
  {
    name: "Thomas Leroy",
    role: "Fondateur",
    company: "Studio Nova",
    need: "Site vitrine + SEO",
    budget: "1 500 €",
  },
  {
    name: "Sophie Martin",
    role: "Directrice",
    company: "Bio Market",
    need: "Migration WordPress",
    budget: "2 500 €",
  },
  {
    name: "Lucas Bernard",
    role: "CEO",
    company: "AgriWeb SAS",
    need: "E-commerce B2B",
    budget: "1 500 €",
  },
  {
    name: "Camille Rousseau",
    role: "Associée",
    company: "Luxe Digital",
    need: "Refonte branding web",
    budget: "2 000 €",
  },
]

const timelineSteps = [
  { label: "Signal détecté", icon: Radar, done: true },
  { label: "Prise de contact", icon: MessageSquare, done: true },
  { label: "Qualification", icon: Phone, done: true },
  { label: "Rendez-vous confirmé", icon: Calendar, done: true },
  { label: "Livraison effectuée", icon: Send, done: false, current: true },
]

const marieConversation = [
  {
    sender: "Hercule",
    text: "Bonjour Marie, nous avons reçu votre demande de refonte Shopify. Pouvez-vous confirmer votre budget et votre calendrier ?",
    variant: "hercule" as const,
  },
  {
    sender: "Marie Dupont",
    text: "Budget validé à 2 000 €, livraison souhaitée sous 30 jours.",
    variant: "client" as const,
  },
  {
    sender: "Hercule",
    text: "Parfait. Nous recherchons une agence compatible pour vous accompagner.",
    variant: "hercule" as const,
  },
  {
    sender: "Système",
    text: "Demande en cours d'attribution — audit de compatibilité agence en cours",
    variant: "system" as const,
  },
]

export function ApercuCrm() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  }

  const panelVariants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
    },
  }

  const selected = prospects.find((p) => p.active) ?? prospects[0]

  return (
    <motion.div
      className="w-full h-full bg-zinc-950 flex overflow-hidden text-zinc-100 text-sm"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sidebar */}
      <motion.div
        className="w-[200px] h-full bg-zinc-900/80 border-r border-zinc-800/50 flex flex-col shrink-0"
        variants={panelVariants}
      >
        <div className="p-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <HerculeMark variant="dual" className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Hercule</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-auto" />
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800/50 rounded-md text-zinc-500 text-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Rechercher un prospect...</span>
          </div>
        </div>
        <div className="px-3 space-y-0.5">
          <NavItem icon={Users} label="Prospects disponibles" badge={12} active />
          <NavItem icon={Phone} label="En qualification" badge={3} />
          <NavItem icon={Calendar} label="Rendez-vous planifiés" badge={5} />
        </div>
      </motion.div>

      {/* Detail panel — après la sidebar */}
      <motion.div
        className="w-[240px] h-full bg-zinc-900/60 border-r border-zinc-800/50 flex flex-col shrink-0"
        variants={panelVariants}
      >
        <div className="p-4 border-b border-zinc-800/50">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Identité</p>
          <p className="text-white font-medium">{selected.name}</p>
          <p className="text-zinc-400 text-xs mt-0.5">
            {selected.role} · {selected.company}
          </p>
        </div>
        <div className="p-4 space-y-3 flex-1">
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Budget projet</p>
            <p className="text-white text-xl font-semibold">{selected.budget}</p>
            <p className="text-zinc-500 text-[10px] mt-1">Fourchette 1 500 € – 2 500 €</p>
          </div>
          <DetailRow label="Besoin validé" value={selected.need} />
          <DetailRow label="Délai" value="< 30 jours" />
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Qualification téléphonique validée
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            Rendez-vous demain · 10:00
          </div>
        </div>
      </motion.div>

      {/* Main — prospect list + timeline */}
      <motion.div className="flex-1 flex flex-col min-w-0" variants={panelVariants}>
        <div className="h-12 border-b border-zinc-800/50 flex items-center px-4 gap-4 shrink-0">
          <span className="text-white font-medium">Plateforme de courtage</span>
          <span className="text-zinc-500 text-xs">Budgets 1 500 € – 12 500 €</span>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden min-h-0">
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {prospects.map((prospect) => (
              <ProspectCard key={prospect.company} {...prospect} />
            ))}
          </div>

          <div className="flex-1 min-h-0 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3 flex flex-col gap-3 overflow-hidden">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider shrink-0">
              Historique de conversation — {selected.name}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {timelineSteps.map((step, index) => {
                const Icon = step.icon
                const isLast = index === timelineSteps.length - 1
                return (
                  <div key={step.label} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                          step.done
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : step.current
                              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-600"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <span
                        className={`text-[9px] text-center leading-tight truncate w-full px-0.5 ${
                          step.done || step.current ? "text-zinc-300" : "text-zinc-600"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`h-px flex-1 min-w-[8px] mb-4 ${step.done ? "bg-emerald-500/40" : "bg-zinc-700"}`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {marieConversation.map((message) => (
                <ConversationBubble key={message.text} {...message} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function NavItem({
  icon: Icon,
  label,
  badge,
  active,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  badge?: number
  active?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-default ${
        active ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:bg-zinc-800/40"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      {badge != null && (
        <span className="ml-auto text-[10px] bg-zinc-700/80 px-1.5 py-0.5 rounded text-zinc-300">{badge}</span>
      )}
    </div>
  )
}

function ProspectCard({
  name,
  role,
  company,
  need,
  budget,
  active,
}: {
  name: string
  role: string
  company: string
  need: string
  budget: string
  active?: boolean
}) {
  return (
    <div
      className={`p-2.5 rounded-md border bg-zinc-800/30 ${
        active ? "border-indigo-500/50 bg-indigo-500/5" : "border-zinc-800/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-white text-xs font-medium truncate">{name}</p>
          <p className="text-zinc-500 text-[10px] truncate">
            {role} · {company}
          </p>
        </div>
        <span className="text-[10px] font-medium text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded shrink-0">
          {budget}
        </span>
      </div>
      <p className="text-zinc-500 text-[10px] truncate">{need}</p>
    </div>
  )
}

function ConversationBubble({
  sender,
  text,
  variant,
}: {
  sender: string
  text: string
  variant: "hercule" | "client" | "system"
}) {
  if (variant === "system") {
    return (
      <div className="px-2 py-1.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 text-center">
        <p className="text-[10px] text-zinc-500">{text}</p>
      </div>
    )
  }

  return (
    <div
      className={`px-2.5 py-2 rounded-md border ${
        variant === "hercule"
          ? "bg-indigo-500/10 border-indigo-500/20 ml-0 mr-4"
          : "bg-zinc-800/50 border-zinc-700/50 ml-4 mr-0"
      }`}
    >
      <p className="text-[9px] text-zinc-500 mb-0.5">{sender}</p>
      <p className="text-[10px] text-zinc-300 leading-relaxed">{text}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-zinc-200 text-xs mt-0.5">{value}</p>
    </div>
  )
}
