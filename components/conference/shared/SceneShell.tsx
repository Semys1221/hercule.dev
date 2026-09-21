"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CANVAS_W = 1280;
const CANVAS_H = 720;

type SceneShellProps = {
  children: React.ReactNode;
  className?: string;
};

/** Full-viewport container with a 16:9 design canvas scaled to fit. */
export function SceneShell({ children, className }: SceneShellProps) {
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setScale(Math.min(vw / CANVAS_W, vh / CANVAS_H));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const measure = () => {
      const canvas = canvasRef.current;
      const outer = outerRef.current;
      if (!canvas || !outer) return;

      const canvasRect = canvas.getBoundingClientRect();
      const outerRect = outer.getBoundingClientRect();
      const content =
        canvas.querySelector("[data-scene-content]") ??
        canvas.querySelector(".flex, [class*='absolute']") ??
        canvas.firstElementChild;

      const contentRect = content?.getBoundingClientRect();
      const label = canvas.querySelector("p");
      const person = canvas.querySelector("[style*='width']");

      const canvasCenterY = canvasRect.top + canvasRect.height / 2;
      const contentCenterY = contentRect
        ? contentRect.top + contentRect.height / 2
        : null;
      const verticalOffset =
        contentCenterY !== null ? contentCenterY - canvasCenterY : null;

      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "681e2e",
        },
        body: JSON.stringify({
          sessionId: "681e2e",
          runId: "post-fix",
          hypothesisId: "H1-H4",
          location: "SceneShell.tsx:measure",
          message: "canvas layout metrics",
          data: {
            vw: window.innerWidth,
            vh: window.innerHeight,
            scale,
            canvasW: canvasRect.width,
            canvasH: canvasRect.height,
            outerW: outerRect.width,
            outerH: outerRect.height,
            verticalOffsetPx: verticalOffset,
            contentTag: content?.tagName ?? null,
            contentClass: content?.className?.toString().slice(0, 80) ?? null,
            labelFontSize: label
              ? getComputedStyle(label).fontSize
              : null,
            personWidth: person
              ? getComputedStyle(person as Element).width
              : null,
            canvasFlex: getComputedStyle(canvas).display,
            canvasAlignItems: getComputedStyle(canvas).alignItems,
            canvasJustifyContent: getComputedStyle(canvas).justifyContent,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    };

    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [scale, children]);

  return (
    <div
      ref={outerRef}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div
        ref={canvasRef}
        className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
