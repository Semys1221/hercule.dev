/** Warm paper vignette — keeps the ivory stage from reading as a flat sheet. */
export function ConferenceStageAmbient() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 46%, rgba(26, 22, 18, 0.045) 100%)",
      }}
      aria-hidden
    />
  );
}
