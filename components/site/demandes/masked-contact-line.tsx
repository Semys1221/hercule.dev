type MaskedContactLineProps = {
  contactEmail: string;
  contactPhone: string;
};

export function MaskedContactLine({
  contactEmail,
  contactPhone,
}: MaskedContactLineProps) {
  return (
    <div className="mx-auto w-full min-h-[1.25rem] text-center">
      <p className="text-xs text-muted-foreground/80 tabular-nums">
        {contactEmail} · {contactPhone}
      </p>
      <span className="sr-only">Coordonnées masquées jusqu&apos;à attribution</span>
    </div>
  );
}
