"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Compass,
  ExternalLink,
  Handshake,
  Lock,
  MapPin,
  Radar,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import {
  CalendlyFlowMark,
  DataGouvFlowMark,
  FlowNodeShell,
  InstantlyBoltMark,
  InstantlyHeroMark,
} from "@/components/internal/funnels/sales/sliders/instantly-flow-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  COMMERCIAL_COMPTABLE,
  FOUNDATION_PRICING_PLANS,
  formatFoundationEuros,
} from "@/lib/commercial/constants";
import {
  areSlidersThinkBeatsComplete,
  SLIDERS_DIFF,
  SLIDERS_OFFER_CORE_BULLETS,
  SLIDERS_OFFER_HORIZON_BULLETS,
  SLIDERS_STRIPE_PAYMENT_LINKS,
  SLIDERS_PILLARS,
  SLIDERS_RECAP_TILES,
  SLIDERS_TEMP_QUESTIONS,
  SLIDERS_THINK_BEATS,
  type SlidersOfferId,
  type SlidersSlideDefinition,
  resolveSlidersGoalHero,
} from "@/lib/admin/funnels/sales-sliders";
import { getPitchP2MissingRoleOptions } from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

import { PITCH_P2_OPTIONS } from "../sales-pitch-wizard-slides";
import { SalesSingleChoiceField } from "../sales-question-fields";
import { pitchSingleQuestion } from "../pitch/pitch-utils";

// ─── Keyframes (injected once) ────────────────────────────────────────────────
const CANVAS_KEYFRAMES = `
@keyframes glow-pulse    { 0%,100%{box-shadow:0 0 32px -6px hsl(var(--primary)/0.22)} 50%{box-shadow:0 0 56px -2px hsl(var(--primary)/0.42)} }
@keyframes glow-pulse-lg { 0%,100%{box-shadow:0 0 40px -8px hsl(var(--primary)/0.28)} 50%{box-shadow:0 0 72px -4px hsl(var(--primary)/0.50)} }
@keyframes word-glow     { 0%,100%{text-shadow:0 0 0 transparent}                     50%{text-shadow:0 0 20px hsl(var(--primary)/0.55)} }
@keyframes flip-up       { from{transform:translateY(24px) rotateX(80deg);opacity:0}  to{transform:none;opacity:1} }
@keyframes draw-line     { from{stroke-dashoffset:420} to{stroke-dashoffset:0} }
@keyframes draw-line-sm  { from{stroke-dashoffset:300} to{stroke-dashoffset:0} }
`;

function KF() {
  useEffect(() => {
    if (document.getElementById("sc-kf")) return;
    const s = document.createElement("style");
    s.id = "sc-kf";
    s.textContent = CANVAS_KEYFRAMES;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ─── Formatters ────────────────────────────────────────────────────────────────
const euroFmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1700): number {
  const [n, setN] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    setN(0);
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return n;
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

type GCardProps = {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "danger";
  className?: string;
  delay?: number;
  animate?: boolean;
};

function GCard({ children, variant = "default", className, delay = 0, animate = true }: GCardProps) {
  const v =
    variant === "primary"
      ? "border-primary/25 bg-primary/8 shadow-[0_0_32px_-6px_hsl(var(--primary)/0.22)]"
      : variant === "success"
        ? "border-emerald-700/40 bg-emerald-950/30"
        : variant === "danger"
          ? "border-destructive/30 bg-destructive/10"
          : "border-border/60 bg-card/80";
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 backdrop-blur-sm",
        animate && "animate-in fade-in slide-in-from-bottom-3 fill-mode-both",
        v,
        className,
      )}
      style={
        animate
          ? { animationDelay: `${delay}ms`, animationDuration: "550ms" }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/** SVG radial gauge */
function RadialGauge({ value, label, size = 136 }: { value: number; label: string; size?: number }) {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(value), 400);
    return () => clearTimeout(t);
  }, [value]);
  const sw = 10;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (anim / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={sw} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="hsl(var(--primary))" strokeWidth={sw} fill="none"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.16,1,.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{anim}%</span>
        </div>
      </div>
      <p className="max-w-[9rem] text-center text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

/** Pure-CSS bar chart */
function CssBarChart({
  bars,
}: {
  bars: ReadonlyArray<{ label: string; value: number; peak: number; color: "muted" | "primary" }>;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 450);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex items-end gap-4 px-2" style={{ height: "9rem" }}>
      {bars.map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-sm font-bold tabular-nums">{b.value}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-lg transition-all duration-[1200ms] ease-out",
                b.color === "primary" ? "bg-primary" : "bg-muted",
              )}
              style={{ height: ready ? `${(b.value / b.peak) * 100}%` : "4px" }}
            />
          </div>
          <span className="max-w-[5rem] text-center text-[10px] leading-tight text-muted-foreground">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Sequential-reveal timeline */
function TimelineDots({
  steps,
}: {
  steps: ReadonlyArray<{ label: string; detail: string; ms: number }>;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  useEffect(() => {
    const ts = steps.map((s, i) =>
      setTimeout(() => setRevealed((p) => new Set([...p, i])), s.ms),
    );
    return () => ts.forEach(clearTimeout);
  }, [steps]);
  return (
    <div className="relative flex items-start">
      <div className="absolute inset-x-3 top-[11px] h-px bg-border/50" />
      {steps.map((s, i) => {
        const on = revealed.has(i);
        return (
          <div
            key={s.label}
            className={cn(
              "relative z-10 flex flex-1 flex-col items-center gap-1.5 transition-all duration-500",
              on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors duration-300",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <p className="text-center text-[11px] font-semibold">{s.label}</p>
            <p className="max-w-[5rem] text-center text-[10px] leading-tight text-muted-foreground">
              {s.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Growth SVG curve */
function GrowthCurve({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 80" className={cn("w-full", className)} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,64 Q80,60 160,56 T320,54" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" strokeDasharray="5 4" opacity="0.35" />
      <path d="M0,64 Q80,50 160,30 T320,6 L320,75 L0,75Z" fill="url(#gc-fill)" />
      <path
        d="M0,64 Q80,50 160,30 T320,6"
        stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round"
        style={{ strokeDasharray: 420, strokeDashoffset: 0, animation: "draw-line 1.8s cubic-bezier(.16,1,.3,1) both" }}
      />
      <circle cx="0" cy="64" r="3" fill="hsl(var(--muted-foreground))" opacity="0.45" />
      <circle cx="160" cy="30" r="4" fill="hsl(var(--primary))" opacity="0.65" />
      <circle cx="320" cy="6" r="5.5" fill="hsl(var(--primary))" />
      <circle cx="320" cy="6" r="10" fill="hsl(var(--primary))" opacity="0.12" />
      <text x="4" y="76" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="system-ui">Aujourd'hui</text>
      <text x="316" y="4" fontSize="9" fill="hsl(var(--primary))" fontFamily="system-ui" textAnchor="end">12 mois ✦</text>
    </svg>
  );
}

/** Goal sparkline */
function GoalSparkline() {
  return (
    <svg viewBox="0 0 280 52" className="w-full opacity-55" preserveAspectRatio="none">
      <path d="M0,46 Q70,43 140,40 T280,38" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" strokeDasharray="5 4" />
      <path
        d="M0,46 Q70,30 140,16 T280,3"
        stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round"
        style={{ strokeDasharray: 380, strokeDashoffset: 0, animation: "draw-line-sm 1.6s cubic-bezier(.16,1,.3,1) 500ms both" }}
      />
      <circle cx="280" cy="3" r="4.5" fill="hsl(var(--primary))" />
    </svg>
  );
}

/** ROI slider */
function ROICalc() {
  const [hon, setHon] = useState(3600);
  const rdvCount = COMMERCIAL_COMPTABLE.horizonGuaranteeRdvCount;
  const revenue = hon * rdvCount;
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-primary">
        Calculateur ROI
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Honoraires moyens / mission</span>
          <span className="font-semibold tabular-nums">{euroFmt.format(hon)}</span>
        </div>
        <Slider min={1200} max={12000} step={100} value={[hon]} onValueChange={([v]) => setHon(v ?? 3600)} />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 200 €</span>
          <span>12 000 €</span>
        </div>
        <div className="mt-1 flex items-end justify-between rounded-xl bg-background/70 px-4 py-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Revenus potentiels an 1
            </p>
            <p className="text-xs text-muted-foreground">
              ~{rdvCount} missions signées (Garantie Horizon)
            </p>
          </div>
          <span className="text-2xl font-black tabular-nums text-primary">{euroFmt.format(revenue)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Icon maps ────────────────────────────────────────────────────────────────
const PILLAR_ICONS = [Radar, Zap, Handshake] as const;

const CAPTURE_SOURCES = [
  { icon: MapPin, label: "Google Maps" },
  { icon: Building2, label: "Fichiers juridiques" },
  { icon: Compass, label: "Moteurs légaux" },
] as const;

// ─── Per-slide components (each owns its hooks at top level) ──────────────────

function SlideRecap() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <KF />
      {SLIDERS_RECAP_TILES.map((tile, i) => (
        <div
          key={tile.id}
          className={cn(
            "animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 backdrop-blur-sm",
            i === 1
              ? "border-primary/25 bg-primary/8 shadow-[0_0_32px_-6px_hsl(var(--primary)/0.25)]"
              : "border-border/60 bg-card/80",
          )}
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "600ms" }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className={cn("text-lg font-semibold uppercase tracking-wider", i === 1 ? "text-primary" : "text-foreground")}>
            {tile.label}
          </p>
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{tile.caption}</p>
          {/* Ghost number */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-1 right-3 select-none font-black leading-none text-foreground/[0.04]"
            style={{ fontSize: "6.5rem" }}
          >
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

function SlideGoal({ rawGoal, goalHero }: { rawGoal: number | null; goalHero: { value: string | null; caption: string } }) {
  const count = useCountUp(rawGoal ?? 0);
  const displayValue = rawGoal ? euroFmt.format(count) : goalHero.value;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <KF />
      {/* Hero */}
      <div
        className="animate-in fade-in zoom-in-95 fill-mode-both flex flex-col items-center gap-3 rounded-3xl border border-primary/25 bg-primary/8 px-12 py-10 text-center shadow-[0_0_48px_-8px_hsl(var(--primary)/0.28)]"
        style={{ animationDuration: "700ms" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
          Objectif 6 mois
        </span>
        {displayValue ? (
          <p className="text-5xl font-black tracking-tight md:text-6xl">{displayValue}</p>
        ) : (
          <p className="text-2xl font-medium text-muted-foreground">{goalHero.caption}</p>
        )}
        <p className="text-sm text-muted-foreground">{goalHero.caption}</p>
      </div>

      {/* Gap badge */}
      <Badge
        variant="secondary"
        className="animate-in fade-in fill-mode-both px-4 py-1.5 text-xs"
        style={{ animationDelay: "400ms", animationDuration: "500ms" }}
      >
        <Sparkles className="mr-1.5 size-3" aria-hidden />
        Écart actuel à combler
      </Badge>

      {/* Sparkline */}
      <div
        className="animate-in fade-in fill-mode-both w-full max-w-sm"
        style={{ animationDelay: "600ms", animationDuration: "700ms" }}
      >
        <GoalSparkline />
      </div>
    </div>
  );
}

function SlideDeciders({
  title,
  audience,
  form,
  values,
}: {
  title: string;
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  values: SalesQualificationValues;
}) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center gap-8 py-8 text-center">
      <KF />
      <div className="animate-in fade-in zoom-in-95 fill-mode-both" style={{ animationDuration: "700ms" }}>
        <p className="font-black leading-none tracking-tight" style={{ fontSize: "clamp(3rem,7vw,5.5rem)" }}>
          {title}
        </p>
      </div>
      <div
        className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both w-full max-w-md text-left"
        style={{ animationDelay: "450ms", animationDuration: "600ms" }}
      >
        <RadioGroup
          value={values.p2DecisionMakers ?? ""}
          onValueChange={(next) =>
            form.setValue("p2DecisionMakers", next as "all_present" | "missing", {
              shouldDirty: true,
            })
          }
          className="grid gap-2"
        >
          {PITCH_P2_OPTIONS.map((option) => {
            const inputId = `canvas-p2-${option.id}`;
            return (
              <FieldLabel
                key={option.id}
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card/80 p-4"
              >
                <RadioGroupItem value={option.id} id={inputId} />
                <span className="text-sm">{option.label}</span>
              </FieldLabel>
            );
          })}
        </RadioGroup>
        {values.p2DecisionMakers === "missing" ? (
          <div className="mt-4">
            <SalesSingleChoiceField
              question={pitchSingleQuestion(
                "p2MissingRole",
                "Qui manque ?",
                getPitchP2MissingRoleOptions(audience),
              )}
              value={values.p2MissingRole ?? ""}
              onChange={(next) =>
                form.setValue("p2MissingRole", next as SalesQualificationValues["p2MissingRole"], {
                  shouldDirty: true,
                })
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SlideDiff() {
  const leftN = useCountUp(97);
  const rightN = useCountUp(3);

  return (
    <div className="flex flex-col gap-4">
      <KF />
      <div className="grid gap-5 md:grid-cols-2">
        {/* Loser — Location */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/8 p-6"
          style={{ animationDuration: "600ms" }}
        >
          <span aria-hidden className="pointer-events-none absolute -right-1 -top-2 select-none font-black leading-none opacity-[0.04]" style={{ fontSize: "7rem" }}>✗</span>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/15">
              <MapPin className="size-5 text-destructive-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Modèle actuel</p>
              <p className="text-base font-bold text-destructive-foreground">{SLIDERS_DIFF.left.label}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{SLIDERS_DIFF.left.detail}</p>
          <div
            className="mt-auto flex items-end gap-1"
            style={{ perspective: "400px" }}
          >
            <span
              className="font-black tabular-nums leading-none"
              style={{ fontSize: "clamp(3rem,6vw,4.5rem)", animation: "flip-up 600ms cubic-bezier(.16,1,.3,1) 300ms both" }}
            >
              {leftN}%
            </span>
            <span className="mb-2 text-sm text-muted-foreground">des cabinets</span>
          </div>
        </div>

        {/* Winner — Actif */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary/25 bg-primary/8 p-6 shadow-[0_0_36px_-6px_hsl(var(--primary)/0.25)]"
          style={{ animationDelay: "180ms", animationDuration: "600ms" }}
        >
          <span aria-hidden className="pointer-events-none absolute -right-1 -top-2 select-none font-black leading-none opacity-[0.04]" style={{ fontSize: "7rem" }}>✓</span>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
              <Shield className="size-5 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Avec Hercule</p>
              <p className="text-base font-bold text-primary">{SLIDERS_DIFF.right.label}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{SLIDERS_DIFF.right.detail}</p>
          <div className="mt-auto flex items-end gap-1" style={{ perspective: "400px" }}>
            <span
              className="font-black tabular-nums leading-none text-primary"
              style={{ fontSize: "clamp(3rem,6vw,4.5rem)", animation: "flip-up 600ms cubic-bezier(.16,1,.3,1) 500ms both" }}
            >
              {rightN}%
            </span>
            <span className="mb-2 text-sm text-muted-foreground">avec nous</span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center justify-center gap-3 opacity-60">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-xs text-muted-foreground">Vous rejoignez les 3 % qui verrouillent leur zone</span>
        <div className="h-px flex-1 bg-border/50" />
      </div>
    </div>
  );
}

function SlidePillars() {
  return (
    <div className="flex flex-col gap-6">
      <KF />
      <div className="grid gap-5 md:grid-cols-3">
        {SLIDERS_PILLARS.map((pillar, i) => {
          const Icon = PILLAR_ICONS[i] ?? Radar;
          return (
            <div
              key={pillar.id}
              className="animate-in fade-in slide-in-from-bottom-5 fill-mode-both relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-card/80 p-7 text-center backdrop-blur-sm"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "600ms" }}
            >
              {/* Ghost number */}
              <span aria-hidden className="pointer-events-none absolute -bottom-2 -right-0.5 select-none font-black leading-none text-foreground/[0.04]" style={{ fontSize: "6.5rem" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <Icon className="size-7 text-primary" aria-hidden />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Pilier {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-xl font-bold">{pillar.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{pillar.tagline}</p>
            </div>
          );
        })}
      </div>

      {/* Animated connector */}
      <div className="mx-auto w-2/3">
        <svg viewBox="0 0 300 14" className="w-full overflow-visible">
          <line
            x1="0" y1="7" x2="300" y2="7"
            stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round"
            style={{ strokeDasharray: 300, strokeDashoffset: 0, animation: "draw-line 1.2s cubic-bezier(.16,1,.3,1) 600ms both" }}
          />
          {[0, 0.5, 1].map((t) => (
            <circle
              key={t}
              cx={t * 300} cy={7} r={4}
              fill="hsl(var(--primary))"
              style={{ animation: `flip-up 400ms cubic-bezier(.16,1,.3,1) ${600 + t * 350}ms both` }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function SlideCapture() {
  const cabinetCount = useCountUp(127);

  return (
    <div className="flex flex-col gap-5">
      <KF />
      {/* Gauge + counter */}
      <div className="grid gap-4 md:grid-cols-2">
        <GCard variant="primary" delay={0} className="flex items-center justify-center py-6">
          <RadialGauge value={87} label="Taux d'intention des leads capturés" size={142} />
        </GCard>
        <GCard delay={150} className="flex flex-col justify-center gap-3 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Agences & cabinets
          </p>
          <p className="text-5xl font-black tabular-nums">{cabinetCount}</p>
          <p className="text-sm text-muted-foreground">accompagnés sur le réseau Hercule</p>
        </GCard>
      </div>

      {/* Sources flow */}
      <GCard delay={300} className="flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Flux de détection
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {CAPTURE_SOURCES.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-3 text-center"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <Icon className="size-5 text-primary" aria-hidden />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center">
            <Shield className="size-5 text-primary" aria-hidden />
            <span className="text-[10px] font-semibold text-primary">Hercule</span>
          </div>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-3 text-center">
            <Target className="size-5 text-primary" aria-hidden />
            <span className="text-[10px] font-medium">Cabinet</span>
          </div>
        </div>
      </GCard>

      {/* Zone badge */}
      <GCard variant="primary" delay={500} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="size-5 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Votre zone</p>
            <p className="text-xs text-muted-foreground">Exclusivité totale</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-[10px]">1 licence / zone</Badge>
      </GCard>
    </div>
  );
}

function SlideEngine() {
  const rdvCount = useCountUp(COMMERCIAL_COMPTABLE.horizonGuaranteeRdvCount);

  return (
    <div className="flex flex-col gap-5">
      <KF />
      <GCard delay={0}>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Déploiement
        </p>
        <TimelineDots
          steps={[
            { label: "J+0", detail: "Onboarding & fondations", ms: 200 },
            { label: "J+30", detail: "Première capture live", ms: 550 },
            { label: "J+60", detail: "Système pleinement actif", ms: 900 },
            { label: "J+90", detail: "Garantie RDV déclenchée", ms: 1250 },
            { label: "J+150", detail: "Régime de croisière", ms: 1600 },
          ]}
        />
      </GCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GCard delay={200} className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Leads qualifiés / mois
          </p>
          <CssBarChart
            bars={[
              { label: "Méthode actuelle", value: 2, peak: 18, color: "muted" },
              { label: "Avec Hercule", value: 18, peak: 18, color: "primary" },
            ]}
          />
        </GCard>

        <GCard variant="primary" delay={350} className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <CheckCircle2 className="size-7 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums">{rdvCount} RDV B2B</p>
            <p className="mt-0.5 text-sm font-medium">garantis en 90 jours</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Le risque est sur notre bilan</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">Garantie contractuelle</Badge>
        </GCard>
      </div>
    </div>
  );
}

const INSTANTLY_FLOW_NODES = [
  { id: "datagouv", node: <DataGouvFlowMark />, featured: false },
  { id: "instantly", node: <InstantlyBoltMark size="sm" />, featured: true },
  { id: "calendly", node: <CalendlyFlowMark />, featured: false },
] as const;

function SlideInstantlyDemo() {
  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <KF />
      <div
        className="animate-in fade-in zoom-in-95 fill-mode-both flex flex-col items-center gap-4 text-center"
        style={{ animationDuration: "600ms" }}
      >
        <InstantlyHeroMark />
        <div>
          <p className="text-lg font-bold">Moteur propriétaire Hercule Instantly</p>
          <p className="mt-1 text-sm text-muted-foreground">Démo live</p>
        </div>
      </div>

      <GCard delay={200} className="w-full max-w-2xl">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Flux du moteur
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {INSTANTLY_FLOW_NODES.map(({ id, node, featured }, index) => (
            <div key={id} className="flex items-center gap-2">
              <div
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                style={{ animationDelay: `${250 + index * 120}ms` }}
              >
                <FlowNodeShell featured={featured}>{node}</FlowNodeShell>
              </div>
              {index < INSTANTLY_FLOW_NODES.length - 1 ? (
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      </GCard>
    </div>
  );
}

function SlidePartner({ rawGoal, goalHero }: { rawGoal: number | null; goalHero: { value: string | null; caption: string } }) {
  const count = useCountUp(rawGoal ?? 0);
  const displayValue = rawGoal ? euroFmt.format(count) : goalHero.value;

  return (
    <div className="flex flex-col gap-5">
      <KF />
      {/* RACI */}
      <GCard delay={0} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 border-b border-border/40 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Rôle</span>
          <span className="text-center text-primary">Hercule</span>
          <span className="text-center">Cabinet</span>
        </div>
        {[
          { role: "Capture & leads", hercule: "Infra complète", cabinet: "—" },
          { role: "Qualification", hercule: "Scoring & filtres", cabinet: "—" },
          { role: "Inbound", hercule: "—", cabinet: "< 24 h" },
          { role: "Comptes-rendus", hercule: "Hebdomadaires", cabinet: "—" },
          { role: "Croissance", hercule: "Pilotage mensuel", cabinet: "Validation" },
        ].map((row, i) => (
          <div
            key={row.role}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both grid grid-cols-3 gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 text-xs"
            style={{ animationDelay: `${i * 80}ms`, animationDuration: "400ms" }}
          >
            <span className="font-medium">{row.role}</span>
            <span className="text-center text-primary">{row.hercule}</span>
            <span className="text-center text-muted-foreground">{row.cabinet}</span>
          </div>
        ))}
      </GCard>

      {/* Projection + future-pace */}
      <div className="grid gap-4 md:grid-cols-2">
        <GCard delay={300} className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Projection 12 mois
          </p>
          <GrowthCurve className="mt-1" />
        </GCard>

        <GCard variant="primary" delay={450} className="flex flex-col items-center justify-center gap-3 text-center">
          <TrendingUp className="size-8 text-primary" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Future-pace
          </p>
          {displayValue && (
            <p className="text-3xl font-black tabular-nums">{displayValue}</p>
          )}
          <p className="text-xs text-muted-foreground">Objectif à 12 mois</p>
        </GCard>
      </div>
    </div>
  );
}

function SlideTemp({
  values,
  goalHero,
  form,
  onResetThinkFlow,
}: {
  values: SalesQualificationValues;
  goalHero: { value: string | null };
  form: UseFormReturn<SalesQualificationValues>;
  onResetThinkFlow: () => void;
}) {
  const isThink = values.sTempCheck === "think";
  const thinkComplete = areSlidersThinkBeatsComplete(values);

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      <KF />
      <div className="animate-in fade-in zoom-in-95 fill-mode-both" style={{ animationDuration: "700ms" }}>
        <p className="font-black leading-none tracking-tight" style={{ fontSize: "clamp(3.5rem,8vw,6rem)" }}>
          {SLIDERS_TEMP_QUESTIONS[0]}
        </p>
      </div>

      <p
        className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both max-w-xl text-lg text-muted-foreground md:text-xl"
        style={{ animationDelay: "350ms", animationDuration: "600ms" }}
      >
        {"C'est la "}
        <span className="font-semibold text-foreground" style={{ animation: "word-glow 2.8s ease-in-out infinite 1.2s" }}>
          bonne solution
        </span>
        {" pour atteindre "}
        {goalHero.value ? (
          <span className="font-semibold text-primary">{goalHero.value}</span>
        ) : (
          "votre objectif"
        )}
        {" ?"}
      </p>

      <div className="w-full max-w-md text-left">
        <RadioGroup
          value={values.sTempCheck ?? ""}
          onValueChange={(next) => {
            if (next === "think") {
              form.setValue("sThinkBeat1", false, { shouldDirty: true });
              form.setValue("sThinkBeat2", false, { shouldDirty: true });
              form.setValue("sThinkBeat3", false, { shouldDirty: true });
            }
            form.setValue("sTempCheck", next as "yes" | "think", { shouldDirty: true });
          }}
          className="grid gap-2"
        >
          <FieldLabel
            htmlFor="canvas-temp-yes"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card/80 p-4"
          >
            <RadioGroupItem value="yes" id="canvas-temp-yes" />
            <span className="text-sm">Oui — bonne solution</span>
          </FieldLabel>
          <FieldLabel
            htmlFor="canvas-temp-think"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card/80 p-4"
          >
            <RadioGroupItem value="think" id="canvas-temp-think" />
            <span className="text-sm">Je dois réfléchir</span>
          </FieldLabel>
        </RadioGroup>
      </div>

      {isThink ? (
        <div className="grid w-full max-w-2xl gap-4 md:grid-cols-3">
          {SLIDERS_THINK_BEATS.map((beat, index) => {
            const fieldName =
              index === 0 ? "sThinkBeat1" : index === 1 ? "sThinkBeat2" : "sThinkBeat3";
            const checked = values[fieldName] === true;
            const inputId = `canvas-think-${beat.id}`;

            return (
              <div
                key={beat.id}
                className={cn(
                  "animate-in slide-in-from-bottom-4 fade-in fill-mode-both flex flex-col gap-3 rounded-2xl border bg-card/80 p-5 text-left backdrop-blur-sm",
                  checked ? "border-primary/40" : "border-border/60",
                )}
                style={{ animationDelay: `${index * 150}ms`, animationDuration: "500ms" }}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    onCheckedChange={(next) =>
                      form.setValue(fieldName, next === true, { shouldDirty: true })
                    }
                  />
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={inputId} className="text-sm font-medium">
                      {beat.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">{beat.caption}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {thinkComplete ? (
        <Button type="button" variant="outline" size="sm" onClick={onResetThinkFlow}>
          Retour au temp check
        </Button>
      ) : null}
    </div>
  );
}

function StripePaymentLinksTable() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast({ title: "Lien copié", description: url });
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      toast({ title: "Copie impossible", description: url, variant: "destructive" });
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 backdrop-blur-sm">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Liens de paiement Stripe
      </p>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Offre</TableHead>
            <TableHead className="hidden text-xs sm:table-cell">offer_type</TableHead>
            <TableHead className="text-xs">Montant</TableHead>
            <TableHead className="hidden text-xs md:table-cell">Mode</TableHead>
            <TableHead className="text-right text-xs">Payment Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SLIDERS_STRIPE_PAYMENT_LINKS.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.name}</TableCell>
              <TableCell className="hidden font-mono text-[11px] text-muted-foreground sm:table-cell">
                {link.offerType}
              </TableCell>
              <TableCell className="tabular-nums">{link.amountLabel}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline" className="text-[10px]">{link.mode}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={`Ouvrir le lien ${link.name}`}
                    disabled={!link.url}
                    asChild={Boolean(link.url)}
                  >
                    {link.url ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <ExternalLink className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 max-w-[10rem] truncate px-2 text-[11px] font-mono"
                    disabled={!link.url}
                    onClick={() => void handleCopy(link.id, link.url)}
                  >
                    {copiedId === link.id ? (
                      <>
                        <CheckCircle2 className="mr-1 size-3 shrink-0" aria-hidden />
                        Copié
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="mr-1 size-3 shrink-0" aria-hidden />
                        Copier
                      </>
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SlideOffer({
  selectedOffer,
  onSelectOffer,
}: {
  selectedOffer: SlidersOfferId | null;
  onSelectOffer: (o: SlidersOfferId) => void;
}) {
  const corePlan = FOUNDATION_PRICING_PLANS.find((p) => p.id === "core");
  const horizonPlan = FOUNDATION_PRICING_PLANS.find((p) => p.id === "horizon");

  const plans = [
    { id: "core" as const, plan: corePlan, bullets: SLIDERS_OFFER_CORE_BULLETS, featured: false },
    { id: "horizon" as const, plan: horizonPlan, bullets: SLIDERS_OFFER_HORIZON_BULLETS, featured: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <KF />
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map(({ id, plan, bullets, featured }, idx) => {
          if (!plan) return null;
          const isSelected = selectedOffer === id;

          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              className="h-auto p-0 text-left hover:bg-transparent"
              onClick={() => onSelectOffer(id)}
            >
              <div
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-4 fill-mode-both relative w-full rounded-2xl border p-6 transition-all duration-300",
                  featured
                    ? "border-primary/30 bg-primary/8 shadow-[0_0_40px_-6px_hsl(var(--primary)/0.28)]"
                    : "border-border/60 bg-card/80",
                  isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
                style={{
                  animationDelay: `${idx * 150}ms`,
                  animationDuration: "600ms",
                  ...(featured && !isSelected
                    ? { animation: "glow-pulse 4s ease-in-out infinite" }
                    : {}),
                }}
              >
                {/* Recommended pill */}
                {featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Recommandé
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-lg font-bold", !featured && "text-muted-foreground")}>{plan.name}</p>
                  {isSelected && <CheckCircle2 className="size-5 text-primary" aria-hidden />}
                </div>

                {/* Price */}
                <p className={cn("mt-3 text-4xl font-black tabular-nums", !featured && "text-muted-foreground")}>
                  {formatFoundationEuros(plan.priceCents)}
                  <span className="text-sm font-normal text-muted-foreground"> /mois</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{plan.tagline}</p>

                {/* Bullets */}
                <ul className="mt-4 flex flex-col gap-2.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className={cn("mt-0.5 size-3.5 shrink-0", featured ? "text-primary" : "text-muted-foreground")}
                        aria-hidden
                      />
                      <span className={featured ? "text-foreground" : "text-muted-foreground"}>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA strip */}
                <div
                  className={cn(
                    "mt-5 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold",
                    featured
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/25 text-muted-foreground",
                  )}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden />
                      Lien copié ✓
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" aria-hidden />
                      Copier le lien de paiement
                    </>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* ROI calculator */}
      <div
        className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
        style={{ animationDelay: "400ms", animationDuration: "600ms" }}
      >
        <ROICalc />
      </div>

      {/* Stripe payment links — référence closer */}
      <div
        className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
        style={{ animationDelay: "550ms", animationDuration: "600ms" }}
      >
        <StripePaymentLinksTable />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
type SalesSlidersCanvasProps = {
  slide: SlidersSlideDefinition;
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  values: SalesQualificationValues;
  selectedOffer: SlidersOfferId | null;
  onSelectOffer: (offer: SlidersOfferId) => void;
  onResetThinkFlow: () => void;
};

export const SalesSlidersCanvas = memo(function SalesSlidersCanvas({
  slide,
  audience,
  form,
  values,
  selectedOffer,
  onSelectOffer,
  onResetThinkFlow,
}: SalesSlidersCanvasProps) {
  const goalHero = resolveSlidersGoalHero(values, audience);
  const rawGoal =
    typeof (values as { w5?: number }).w5 === "number"
      ? (values as { w5: number }).w5
      : null;

  switch (slide.type) {
    case "recap":    return <SlideRecap />;
    case "goal":     return <SlideGoal rawGoal={rawGoal} goalHero={goalHero} />;
    case "deciders": return <SlideDeciders title={slide.canvasTitle} audience={audience} form={form} values={values} />;
    case "diff":     return <SlideDiff />;
    case "pillars":  return <SlidePillars />;
    case "capture":  return <SlideCapture />;
    case "engine":    return <SlideEngine />;
    case "instantly": return <SlideInstantlyDemo />;
    case "partner":   return <SlidePartner rawGoal={rawGoal} goalHero={goalHero} />;
    case "temp":     return <SlideTemp values={values} goalHero={goalHero} form={form} onResetThinkFlow={onResetThinkFlow} />;
    case "offer":    return <SlideOffer selectedOffer={selectedOffer} onSelectOffer={onSelectOffer} />;
    default:         return null;
  }
});
