"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const INK = "#000000";
const PAPER = "#FFFFFF";

/** Shared stroke props — felt-tip Notion line quality */
const STROKE = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type NotionStickerManProps = {
  name?: string;
  className?: string;
  replayKey?: number;
};

export function NotionStickerMan({
  name = "Noé",
  className,
  replayKey = 0,
}: NotionStickerManProps) {
  const uid = useId().replace(/:/g, "");
  const shadowId = `sticker-shadow-${uid}`;

  const characterControls = useAnimation();
  const headControls = useAnimation();
  const armControls = useAnimation();
  const eyesControls = useAnimation();
  const paperControls = useAnimation();

  const [typedName, setTypedName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runSequence() {
      setTypedName("");
      setIsTyping(false);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }

      characterControls.set({ y: -160, rotate: -10, opacity: 0 });
      headControls.set({ rotate: 22 });
      armControls.set({ rotate: 0 });
      eyesControls.set({ x: 0, y: 3 });
      paperControls.set({ scale: 1, y: 0 });

      await characterControls.start({
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 400, damping: 17, mass: 0.95 },
      });

      if (cancelled) return;

      await paperControls.start({
        scale: [1, 0.988, 1],
        y: [0, 4, 0],
        transition: { duration: 0.32, ease: "easeOut" },
      });

      if (cancelled) return;

      setIsTyping(true);

      const typingDuration = Math.max(name.length, 1) * 130;
      typingIntervalRef.current = setInterval(() => {
        setTypedName((current) => {
          const next = name.slice(0, current.length + 1);
          if (next.length >= name.length && typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          return next;
        });
      }, 130);

      await armControls.start({
        rotate: [0, -16, 0, -13, 0, -11, 0, -9, 0],
        transition: {
          duration: Math.max(typingDuration + 400, 1600) / 1000,
          ease: "easeInOut",
        },
      });

      if (cancelled) return;

      setIsTyping(false);

      await headControls.start({
        rotate: -8,
        transition: { type: "spring", stiffness: 240, damping: 18 },
      });

      if (cancelled) return;

      await eyesControls.start({
        x: -2,
        y: -3,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      });
    }

    void runSequence();

    return () => {
      cancelled = true;
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [
    name,
    replayKey,
    characterControls,
    headControls,
    armControls,
    eyesControls,
    paperControls,
  ]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 400 300"
        className="h-auto w-full max-w-[28rem]"
        role="img"
        aria-label={`Sticker animé : ${name} tombe sur une feuille et écrit son nom`}
      >
        <defs>
          <filter id={shadowId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor={INK} floodOpacity="0.14" />
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="200" cy="276" rx="130" ry="10" fill={INK} opacity="0.07" />

        {/* Paper sheet — Notion doc style */}
        <motion.g animate={paperControls}>
          <g filter={`url(#${shadowId})`}>
            <rect
              x="48"
              y="186"
              width="304"
              height="92"
              rx="4"
              fill={PAPER}
              stroke={INK}
              strokeWidth="2.5"
            />
            <path
              d="M316 186 L352 186 L352 222 L316 186 Z"
              fill={PAPER}
              stroke={INK}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {[204, 218, 232, 246, 260].map((y) => (
              <line
                key={y}
                x1="68"
                y1={y}
                x2="332"
                y2={y}
                stroke={INK}
                strokeWidth="1"
                opacity="0.12"
              />
            ))}
          </g>
        </motion.g>

        {/* Character sticker */}
        <motion.g
          animate={characterControls}
          style={{ transformOrigin: "200px 218px", transformBox: "fill-box" }}
          filter={`url(#${shadowId})`}
        >
          {/* Sticker white cutout border */}
          <ellipse
            cx="200"
            cy="168"
            rx="108"
            ry="118"
            fill={PAPER}
            stroke={INK}
            strokeWidth="4"
          />

          {/* Legs — minimal, sitting behind laptop */}
          <path
            d="M168 228 Q160 248 152 258 L168 258 Q176 244 180 228 Z"
            fill={PAPER}
            {...STROKE}
          />
          <path
            d="M232 228 Q240 248 248 258 L232 258 Q224 244 220 228 Z"
            fill={PAPER}
            {...STROKE}
          />

          {/* Hoodie body */}
          <path
            d="M148 210 Q140 178 158 162 Q200 148 242 162 Q260 178 252 210
               Q248 238 200 242 Q152 238 148 210 Z"
            fill={PAPER}
            {...STROKE}
          />

          {/* Hood lines */}
          <path
            d="M162 168 Q200 188 238 168"
            fill="none"
            {...STROKE}
            strokeWidth="2.5"
          />
          <path
            d="M178 168 Q200 198 222 168"
            fill="none"
            {...STROKE}
            strokeWidth="2.5"
          />

          {/* Drawstrings */}
          <line x1="188" y1="192" x2="184" y2="218" {...STROKE} strokeWidth="2" />
          <line x1="212" y1="192" x2="216" y2="218" {...STROKE} strokeWidth="2" />
          <circle cx="184" cy="220" r="4" fill={INK} />
          <circle cx="216" cy="220" r="4" fill={INK} />

          {/* Right arm */}
          <path
            d="M248 178 Q268 188 272 208 Q274 220 262 224 Q252 218 246 202 Q242 190 248 178 Z"
            fill={PAPER}
            {...STROKE}
          />
          <circle cx="262" cy="224" r="9" fill={PAPER} {...STROKE} />

          {/* Laptop — monochrome */}
          <g>
            <rect
              x="138"
              y="198"
              width="124"
              height="10"
              rx="3"
              fill={PAPER}
              stroke={INK}
              strokeWidth="2.5"
            />
            <rect
              x="144"
              y="174"
              width="112"
              height="26"
              rx="4"
              fill={PAPER}
              stroke={INK}
              strokeWidth="2.5"
            />
            <rect x="152" y="180" width="96" height="16" rx="2" fill={PAPER} stroke={INK} strokeWidth="1.5" />
            <text
              x="160"
              y="192"
              fill={INK}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="10"
              fontWeight="700"
            >
              {typedName}
              {isTyping ? <tspan opacity="0.4">|</tspan> : null}
            </text>
          </g>

          {/* Left arm — typing */}
          <motion.g
            animate={armControls}
            style={{ transformOrigin: "154px 182px", transformBox: "fill-box" }}
          >
            <path
              d="M152 178 Q128 186 122 206 Q118 220 130 226 Q142 218 148 200 Q152 188 152 178 Z"
              fill={PAPER}
              {...STROKE}
            />
            <circle cx="130" cy="226" r="9" fill={PAPER} {...STROKE} />
          </motion.g>

          {/* Head */}
          <motion.g
            animate={headControls}
            style={{ transformOrigin: "200px 128px", transformBox: "fill-box" }}
          >
            {/* Neck */}
            <rect x="192" y="148" width="16" height="18" rx="5" fill={PAPER} stroke={INK} strokeWidth="2" />

            {/* Ear */}
            <path
              d="M158 118 Q148 128 150 142 Q154 148 160 140 Q158 130 162 122 Z"
              fill={PAPER}
              {...STROKE}
              strokeWidth="2.5"
            />
            <path
              d="M156 128 Q154 136 158 138"
              fill="none"
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Face */}
            <path
              d="M164 82 Q148 98 148 122 Q148 148 168 158 Q200 168 228 152
                 Q248 138 248 112 Q248 86 228 72 Q200 58 176 68 Q164 74 164 82 Z"
              fill={PAPER}
              {...STROKE}
            />

            {/* Jaw accent — thicker Notion line */}
            <path
              d="M168 154 Q200 166 232 148"
              fill="none"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Hair */}
            <path
              d="M162 78 Q168 52 200 48 Q238 50 246 78 Q248 68 236 60 Q200 42 168 58
                 Q158 64 156 74 Q160 66 168 62 Q182 56 200 56 Q218 56 232 64 Q240 70 242 78 Z"
              fill={INK}
            />
            <path
              d="M170 62 Q188 54 210 58 Q226 64 234 74"
              fill="none"
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.35"
            />

            {/* Eyebrows */}
            <path d="M176 104 Q184 98 194 102" fill="none" {...STROKE} strokeWidth="3.5" />
            <path d="M206 102 Q216 98 224 104" fill="none" {...STROKE} strokeWidth="3.5" />

            {/* Glasses */}
            <rect
              x="170"
              y="108"
              width="30"
              height="22"
              rx="7"
              fill="none"
              {...STROKE}
              strokeWidth="3.5"
            />
            <rect
              x="204"
              y="108"
              width="30"
              height="22"
              rx="7"
              fill="none"
              {...STROKE}
              strokeWidth="3.5"
            />
            <line x1="200" y1="118" x2="204" y2="118" {...STROKE} strokeWidth="3" />

            {/* Eyes */}
            <motion.g animate={eyesControls}>
              <circle cx="185" cy="118" r="3.5" fill={INK} />
              <circle cx="219" cy="118" r="3.5" fill={INK} />
            </motion.g>

            {/* Nose */}
            <path
              d="M200 122 Q198 130 202 134"
              fill="none"
              stroke={INK}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Smile */}
            <path
              d="M186 140 Q200 148 214 140"
              fill="none"
              stroke={INK}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.g>
        </motion.g>

        {/* B&W sparkle on look-at-camera */}
        <motion.g
          key={replayKey}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0, 1, 0.7], scale: [0.5, 0.5, 1, 1] }}
          transition={{ delay: 3.5, duration: 0.7, ease: "easeOut" }}
        >
          <path
            d="M322 96 l2 6 l6 2 l-6 2 l-2 6 l-2-6 l-6-2 l6-2 Z"
            fill={INK}
            opacity="0.85"
          />
          <path
            d="M78 118 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5-4 l-4-1.5 l4-1.5 Z"
            fill={INK}
            opacity="0.6"
          />
        </motion.g>
      </svg>
    </div>
  );
}
