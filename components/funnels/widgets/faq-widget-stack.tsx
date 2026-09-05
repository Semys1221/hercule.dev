"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

import { FaqWidget } from "@/components/funnels/widgets/faq-widget";
import { Button } from "@/components/ui/button";
import type { FaqComponentConfig } from "@/lib/admin/funnels/schema";
import type { FaqAudience } from "@/lib/site/faq-types";
import { cn } from "@/lib/utils";

type FaqWidgetStackProps = {
  audience: FaqAudience;
  configs: FaqComponentConfig[];
  compact?: boolean;
};

export function FaqWidgetStack({ audience, configs, compact = false }: FaqWidgetStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (configs.length === 0) {
    return null;
  }

  if (configs.length === 1) {
    return <FaqWidget audience={audience} config={configs[0]} compact={compact} />;
  }

  const frontIndex = flipped ? 1 : 0;
  const backIndex = flipped ? 0 : 1;

  function toggle() {
    setFlipped((current) => !current);
    setActiveIndex((current) => (current === 0 ? 1 : 0));
  }

  return (
    <div className="relative">
      <div className="relative min-h-[220px] [perspective:1200px]">
        <motion.div
          className="relative w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className={cn(
              "w-full [backface-visibility:hidden]",
              flipped && "pointer-events-none absolute inset-0",
            )}
            aria-hidden={flipped}
          >
            <FaqWidget audience={audience} config={configs[frontIndex]} compact={compact} />
          </div>
          <div
            className={cn(
              "w-full [transform:rotateY(180deg)] [backface-visibility:hidden]",
              !flipped && "pointer-events-none absolute inset-0",
            )}
            aria-hidden={!flipped}
          >
            <FaqWidget audience={audience} config={configs[backIndex]} compact={compact} />
          </div>
        </motion.div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="size-10 rounded-full shadow-md"
          onClick={toggle}
          aria-label="Basculer entre les deux blocs FAQ"
          aria-live="polite"
        >
          <RotateCw className="size-4" />
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
        FAQ {activeIndex + 1} sur 2
      </p>
    </div>
  );
}
