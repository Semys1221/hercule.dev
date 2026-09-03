"use client"

import { useCallback, useRef, useState, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

const DECEL_DELAY_MS = 120
const PAUSE_AFTER_MS = 400

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean
  /**
   * Whether to decelerate smoothly before pausing on hover
   * @default false
   */
  smoothPause?: boolean
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number
}

type MarqueePhase = "running" | "slowing" | "paused"

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  smoothPause = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const [phase, setPhase] = useState<MarqueePhase>("running")
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (!smoothPause) return

    clearTimers()
    const decelTimer = window.setTimeout(() => setPhase("slowing"), DECEL_DELAY_MS)
    const pauseTimer = window.setTimeout(() => setPhase("paused"), PAUSE_AFTER_MS)
    timersRef.current = [decelTimer, pauseTimer]
  }, [clearTimers, smoothPause])

  const handleMouseLeave = useCallback(() => {
    if (!smoothPause) return

    clearTimers()
    setPhase("running")
  }, [clearTimers, smoothPause])

  return (
    <div
      {...props}
      onMouseEnter={smoothPause ? handleMouseEnter : undefined}
      onMouseLeave={smoothPause ? handleMouseLeave : undefined}
      className={cn(
        "group/marquee flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around gap-(--gap)", {
              "animate-marquee flex-row": !vertical,
              "animate-marquee-vertical flex-col": vertical,
              "[animation-direction:reverse]": reverse,
              "group-hover/marquee:[animation-play-state:paused]":
                pauseOnHover && !smoothPause,
              "[animation-play-state:paused]": smoothPause && phase === "paused",
            })}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
