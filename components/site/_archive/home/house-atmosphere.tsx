import { StaticGlassHerculeMark } from "@/components/site/home/static-glass-hercule-mark"

export function HouseAtmosphere() {
  return (
    <section
      className="relative flex min-h-svh flex-col items-center justify-center bg-background px-8 md:px-16"
      aria-label="Hercule"
    >
      <StaticGlassHerculeMark className="size-20 md:size-24" />
      <p
        className="mt-8 text-base font-medium tracking-[0.34em] text-foreground md:text-lg"
        aria-hidden
      >
        HERCULE
      </p>
    </section>
  )
}
