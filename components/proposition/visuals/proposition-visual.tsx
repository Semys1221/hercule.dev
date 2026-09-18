"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  Building2,
  DollarSign,
  FileText,
  Globe,
  LineChart,
  PiggyBank,
  Scale,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";

import { HerculeMark } from "@/components/hercule-mark";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { AnimatedList } from "@/components/ui/animated-list";
import { NumberTicker } from "@/components/ui/number-ticker";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { cn } from "@/lib/utils";

// ─── 1. BEAM PIPELINE ─────────────────────────────────────────────────────────
// Shows: Prospects B2B → Hercule Algorithm → Cabinet
const BeamCircle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label: string }
>(({ className, children, label }, ref) => (
  <div className="flex flex-col items-center gap-2">
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-14 items-center justify-center rounded-full border bg-zinc-900 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
    <span className="text-center text-xs font-medium text-zinc-400">{label}</span>
  </div>
));
BeamCircle.displayName = "BeamCircle";

function BeamPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prospectRef = useRef<HTMLDivElement>(null);
  const herculeRef = useRef<HTMLDivElement>(null);
  const cabinetRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex h-44 w-full items-center justify-between px-6"
    >
      <BeamCircle ref={prospectRef} label="Prospects B2B" className="border-zinc-700">
        <Users className="size-6 text-zinc-300" />
      </BeamCircle>

      <BeamCircle
        ref={herculeRef}
        label="Hercule"
        className="size-16 border-indigo-500/50 bg-indigo-950/60"
      >
        <HerculeMark className="size-8 text-indigo-300" />
      </BeamCircle>

      <BeamCircle ref={cabinetRef} label="Votre cabinet" className="border-emerald-700/50">
        <Building2 className="size-6 text-emerald-400" />
      </BeamCircle>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={prospectRef}
        toRef={herculeRef}
        gradientStartColor="#6366f1"
        gradientStopColor="#818cf8"
        duration={3}
        pathColor="#3f3f46"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={herculeRef}
        toRef={cabinetRef}
        gradientStartColor="#818cf8"
        gradientStopColor="#34d399"
        duration={3}
        delay={1.2}
        pathColor="#3f3f46"
      />
    </div>
  );
}

// ─── 2. ANIMATED LEADS ────────────────────────────────────────────────────────
// Shows: Qualified B2B prospect cards appearing one by one
const RAW_LEADS = [
  { name: "Dirigeant PME", sector: "Services B2B", emoji: "💼", color: "#6366f1" },
  { name: "Chef d'entreprise", sector: "E-commerce", emoji: "🏪", color: "#10b981" },
  { name: "Gérant SA", sector: "Industrie locale", emoji: "🏭", color: "#f59e0b" },
  { name: "Directeur général", sector: "Conseil & expertise", emoji: "📊", color: "#8b5cf6" },
  { name: "PDG", sector: "Tech B2B SaaS", emoji: "💻", color: "#06b6d4" },
];
const LEADS_POOL = Array.from({ length: 3 }, () => RAW_LEADS).flat();

function LeadCard({
  name,
  sector,
  emoji,
  color,
}: (typeof RAW_LEADS)[0]) {
  return (
    <figure className="relative mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}40` }}
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
          <p className="text-xs text-zinc-400">{sector}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
          Qualifié ✓
        </span>
      </div>
    </figure>
  );
}

function AnimatedLeads() {
  return (
    <div className="relative flex h-40 w-full flex-col overflow-hidden">
      <AnimatedList delay={1400}>
        {LEADS_POOL.map((lead, idx) => (
          <LeadCard key={`${lead.name}-${idx}`} {...lead} />
        ))}
      </AnimatedList>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-950/90 to-transparent" />
    </div>
  );
}

// ─── 3. CABINET 360 ───────────────────────────────────────────────────────────
// Shows: Cabinet at center, service icons orbiting inner ring, result icons in outer ring
function Cabinet360() {
  return (
    <div className="relative flex h-56 w-full flex-col items-center justify-center overflow-hidden">
      {/* Center — cabinet */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="flex size-14 items-center justify-center rounded-full border border-indigo-500/50 bg-indigo-950/70">
          <Building2 className="size-7 text-indigo-300" />
        </div>
        <span className="text-xs font-medium text-zinc-400">Cabinet</span>
      </div>

      {/* Inner orbit — 4 services */}
      <OrbitingCircles iconSize={36} radius={76} duration={18} speed={0.9}>
        <div className="flex size-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800" title="Comptabilité">
          <FileText className="size-4 text-zinc-300" />
        </div>
        <div className="flex size-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800" title="Fiscal">
          <Scale className="size-4 text-zinc-300" />
        </div>
        <div className="flex size-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800" title="Patrimoine">
          <PiggyBank className="size-4 text-zinc-300" />
        </div>
        <div className="flex size-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800" title="Conseil">
          <LineChart className="size-4 text-zinc-300" />
        </div>
      </OrbitingCircles>

      {/* Outer orbit (reverse) — results */}
      <OrbitingCircles iconSize={32} radius={128} duration={24} speed={0.6} reverse>
        <div className="flex size-8 items-center justify-center rounded-full border border-indigo-700/50 bg-indigo-900/50">
          <TrendingUp className="size-3.5 text-indigo-300" />
        </div>
        <div className="flex size-8 items-center justify-center rounded-full border border-emerald-700/50 bg-emerald-900/50">
          <Users className="size-3.5 text-emerald-300" />
        </div>
        <div className="flex size-8 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/50">
          <DollarSign className="size-3.5 text-amber-300" />
        </div>
        <div className="flex size-8 items-center justify-center rounded-full border border-purple-700/50 bg-purple-900/50">
          <BarChart3 className="size-3.5 text-purple-300" />
        </div>
      </OrbitingCircles>

      <p className="absolute bottom-1 text-xs text-zinc-500">
        comptabilité · fiscal · patrimoine · conseil
      </p>
    </div>
  );
}

// ─── 4. ROI COUNTER ───────────────────────────────────────────────────────────
// Shows: 3 animated cards — prospects, honoraire, projected monthly revenue
function RoiCounter({ prospects = 15, honoraire = 300 }: { prospects?: number; honoraire?: number }) {
  const monthlyRevenue = prospects * honoraire;

  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-4"
      >
        <Users className="mb-1 size-4 text-zinc-400" />
        <p className="text-2xl font-semibold text-zinc-100">
          <NumberTicker value={prospects} />
        </p>
        <p className="text-center text-xs text-zinc-400">profils / mois</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.4 }}
        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-4"
      >
        <DollarSign className="mb-1 size-4 text-zinc-400" />
        <p className="text-2xl font-semibold text-zinc-100">
          <NumberTicker value={honoraire} />
          <span className="ml-0.5 text-sm font-normal text-zinc-400">€</span>
        </p>
        <p className="text-center text-xs text-zinc-400">honoraire moyen</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34, duration: 0.4 }}
        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-4"
      >
        <TrendingUp className="mb-1 size-4 text-indigo-400" />
        <p className="text-2xl font-semibold text-indigo-300">
          <NumberTicker value={monthlyRevenue} />
          <span className="ml-0.5 text-sm font-normal text-indigo-400">€</span>
        </p>
        <p className="text-center text-xs text-indigo-400">CA projeté / mois</p>
      </motion.div>
    </div>
  );
}

// ─── 4. CIRCULAR PROGRESS ─────────────────────────────────────────────────────
// Shows: Animated conversion rate progress bar
function CircularProgress() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setValue(62), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <AnimatedCircularProgressBar
        value={value}
        max={100}
        gaugePrimaryColor="#6366f1"
        gaugeSecondaryColor="rgba(99,102,241,0.12)"
        className="size-32"
      />
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-100">Taux de conversion estimé</p>
        <p className="mt-0.5 text-xs text-zinc-400">12 → 13 clients convertis / 20 profils</p>
      </div>
    </div>
  );
}

// ─── 5. RIPPLE SIGNAL ─────────────────────────────────────────────────────────
// Shows: Signal propagating outward — instant connection concept
function RippleSignal() {
  return (
    <div className="relative flex h-44 w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      {/* Manual ripple rings with indigo colors */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-indigo-500/25"
          style={{
            width: 56 + i * 44,
            height: 56 + i * 44,
          }}
          animate={{ opacity: [0.6, 0], scale: [0.85, 1.15] }}
          transition={{
            duration: 2.2,
            delay: i * 0.35,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Center */}
      <div className="relative z-10 flex flex-col items-center gap-2.5">
        <div className="flex size-12 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/15">
          <Zap className="size-6 text-indigo-300" />
        </div>
        <p className="text-sm font-semibold text-zinc-100">Connexion instantanée</p>
        <p className="text-xs text-zinc-400">Signal émis → transmis en temps réel</p>
      </div>
    </div>
  );
}

// ─── 6. STEP PROGRESS ─────────────────────────────────────────────────────────
// Shows: Two circular progress bars side by side for palier 1 and palier 2
function StepProgress() {
  const [v1, setV1] = useState(0);
  const [v2, setV2] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setV1(60), 350);
    const t2 = setTimeout(() => setV2(100), 950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-8 py-2">
      <div className="flex flex-col items-center gap-2.5">
        <AnimatedCircularProgressBar
          value={v1}
          max={100}
          gaugePrimaryColor="#6366f1"
          gaugeSecondaryColor="rgba(99,102,241,0.12)"
          className="size-24"
        />
        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-200">Palier 1</p>
          <p className="text-xs text-zinc-400">15 profils</p>
        </div>
      </div>

      <div className="h-px w-8 bg-zinc-700" />

      <div className="flex flex-col items-center gap-2.5">
        <AnimatedCircularProgressBar
          value={v2}
          max={100}
          gaugePrimaryColor="#10b981"
          gaugeSecondaryColor="rgba(16,185,129,0.12)"
          className="size-24"
        />
        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-200">Palier 2</p>
          <p className="text-xs text-zinc-400">45 profils</p>
        </div>
      </div>
    </div>
  );
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────
export const PROPOSITION_VISUALS = [
  "beam-pipeline",
  "animated-leads",
  "orbiting-team",
  "cabinet-360",
  "roi-counter",
  "circular-progress",
  "ripple-signal",
  "step-progress",
] as const;

export type PropositionVisualType = (typeof PROPOSITION_VISUALS)[number];

export function PropositionVisual({
  visual,
  prospects,
  honoraire,
}: {
  visual: string;
  prospects?: number;
  honoraire?: number;
}) {
  switch (visual as PropositionVisualType) {
    case "beam-pipeline":
      return <BeamPipeline />;
    case "animated-leads":
      return <AnimatedLeads />;
    case "orbiting-team":
      return <Cabinet360 />;
    case "cabinet-360":
      return <Cabinet360 />;
    case "roi-counter":
      return <RoiCounter prospects={prospects} honoraire={honoraire} />;
    case "circular-progress":
      return <CircularProgress />;
    case "ripple-signal":
      return <RippleSignal />;
    case "step-progress":
      return <StepProgress />;
    default:
      return null;
  }
}
