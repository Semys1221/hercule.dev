export function PropositionDecMechanism() {
  return (
    <section className="flex w-full max-w-3xl flex-col items-center gap-4 text-center">
      <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">Mécanisme</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm tracking-[0.18em] text-muted-foreground">
        <span>VOLUME</span>
        <span className="text-foreground" aria-hidden>→</span>
        <span>QUALIFICATION</span>
        <span className="text-foreground" aria-hidden>→</span>
        <span>INTÉRÊT</span>
      </div>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Des dirigeants de restauration solvables, qui viennent vers nous, qualifiés sur la
        rentabilité et le pilotage des coûts — puis confiés à votre cabinet en exclusivité.
      </p>
    </section>
  );
}
