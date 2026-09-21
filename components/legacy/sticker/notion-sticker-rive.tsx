"use client";

import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useStateMachineInput,
} from "@rive-app/react-canvas";
import { motion, useAnimation } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { StickerScenePaper } from "@/components/legacy/sticker/sticker-scene-paper";
import { STICKER_RIVE } from "@/lib/legacy/sticker/rive-sticker-config";
import { cn } from "@/lib/utils";

type NotionStickerRiveProps = {
  name?: string;
  className?: string;
  replayKey?: number;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function NotionStickerRive({
  name = "Noé",
  className,
  replayKey = 0,
}: NotionStickerRiveProps) {
  const [rivSrc, setRivSrc] = useState(STICKER_RIVE.fallbackSrc);
  const [stateMachine, setStateMachine] = useState(
    STICKER_RIVE.fallbackStateMachine,
  );
  const [typedName, setTypedName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<"fall" | "typing" | "look" | "idle">("fall");

  const fallControls = useAnimation();
  const paperControls = useAnimation();
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveAsset() {
      try {
        const response = await fetch(STICKER_RIVE.src, { method: "HEAD" });
        if (cancelled) return;

        if (response.ok) {
          setRivSrc(STICKER_RIVE.src);
          setStateMachine(STICKER_RIVE.stateMachine);
          return;
        }
      } catch {
        // fall through to demo asset
      }

      if (!cancelled) {
        setRivSrc(STICKER_RIVE.fallbackSrc);
        setStateMachine(STICKER_RIVE.fallbackStateMachine);
      }
    }

    void resolveAsset();

    return () => {
      cancelled = true;
    };
  }, []);

  const { RiveComponent, rive } = useRive({
    src: rivSrc,
    stateMachine,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.BottomCenter,
    }),
  });

  const fallTrigger = useStateMachineInput(
    rive,
    stateMachine,
    STICKER_RIVE.triggers.fall,
  );
  const typeTrigger = useStateMachineInput(
    rive,
    stateMachine,
    STICKER_RIVE.triggers.type,
  );
  const lookTrigger = useStateMachineInput(
    rive,
    stateMachine,
    STICKER_RIVE.triggers.lookCamera,
  );
  const typingBool = useStateMachineInput(
    rive,
    stateMachine,
    STICKER_RIVE.booleans.typing,
  );
  const talkingBool = useStateMachineInput(
    rive,
    stateMachine,
    STICKER_RIVE.booleans.talking,
  );

  const clearTypingInterval = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  }, []);

  const runTypewriter = useCallback(
    async (cancelled: () => boolean) => {
      setTypedName("");
      setIsTyping(true);
      typingBool && (typingBool.value = true);
      talkingBool && (talkingBool.value = true);
      typeTrigger?.fire();

      let index = 0;
      await new Promise<void>((resolve) => {
        typingIntervalRef.current = setInterval(() => {
          if (cancelled()) {
            clearTypingInterval();
            resolve();
            return;
          }
          index += 1;
          setTypedName(name.slice(0, index));
          if (index >= name.length) {
            clearTypingInterval();
            resolve();
          }
        }, 130);
      });

      await delay(280);
      if (cancelled()) return;

      setIsTyping(false);
      typingBool && (typingBool.value = false);
      talkingBool && (talkingBool.value = false);
    },
    [clearTypingInterval, name, talkingBool, typeTrigger, typingBool],
  );

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    async function runSequence() {
      clearTypingInterval();
      setTypedName("");
      setIsTyping(false);
      setPhase("fall");

      typingBool && (typingBool.value = false);
      talkingBool && (talkingBool.value = false);

      fallControls.set({ y: -120, rotate: -8, opacity: 0 });
      paperControls.set({ scale: 1, y: 0 });

      await fallControls.start({
        y: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 400, damping: 17, mass: 0.95 },
      });
      if (isCancelled()) return;

      fallTrigger?.fire();

      await paperControls.start({
        scale: [1, 0.988, 1],
        y: [0, 4, 0],
        transition: { duration: 0.32, ease: "easeOut" },
      });
      if (isCancelled()) return;

      setPhase("typing");
      await runTypewriter(isCancelled);
      if (isCancelled()) return;

      setPhase("look");
      lookTrigger?.fire();

      await delay(400);
      if (isCancelled()) return;

      setPhase("idle");
    }

    if (!rive) return;

    void runSequence();

    return () => {
      cancelled = true;
      clearTypingInterval();
    };
  }, [
    name,
    replayKey,
    rive,
    fallControls,
    paperControls,
    fallTrigger,
    lookTrigger,
    typingBool,
    talkingBool,
    clearTypingInterval,
    runTypewriter,
  ]);

  return (
    <div
      className={cn("relative mx-auto aspect-[4/3] w-full max-w-[28rem]", className)}
      data-phase={phase}
      aria-label={`Sticker Rive : ${name}`}
    >
      <motion.div
        animate={paperControls}
        className="absolute inset-0"
      >
        <StickerScenePaper typedName={typedName} isTyping={isTyping} />
      </motion.div>

      <motion.div
        animate={fallControls}
        className="absolute inset-x-0 bottom-8 top-0"
        style={{ transformOrigin: "50% 85%", transformBox: "fill-box" }}
      >
        <RiveComponent className="h-full w-full" />
      </motion.div>

      {rivSrc === STICKER_RIVE.fallbackSrc ? (
        <p className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted-foreground">
          Avatar démo — ajoutez <code className="text-[10px]">public/rive/sticker-man.riv</code>
        </p>
      ) : null}
    </div>
  );
}
