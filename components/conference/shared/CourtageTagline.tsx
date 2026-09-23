const COURTAGE_TAGLINE_CLASS =
  "max-w-md shrink-0 text-center text-xs leading-relaxed tracking-[0.16em] text-muted-foreground uppercase";

export function CourtageTagline() {
  return (
    <p className={COURTAGE_TAGLINE_CLASS}>
      Courtage de projet BNC/BIC/TNS
      <br />
      Patience et expertise métier.
    </p>
  );
}
