/** Indigo radial glow — matches proposition-scene.tsx ambient layer. */
export function ConferenceStageAmbient() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -30%)",
        width: "900px",
        height: "600px",
        background:
          "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
      }}
      aria-hidden
    />
  );
}
