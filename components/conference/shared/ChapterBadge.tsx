type ChapterBadgeProps = {
  chapter: string;
  beat: string;
};

export function ChapterBadge({ chapter, beat }: ChapterBadgeProps) {
  return (
    <div className="pointer-events-none absolute top-4 left-5 z-10 flex items-center gap-2 text-[9px] uppercase tracking-[0.20em] text-zinc-700 select-none">
      <span>{chapter}</span>
      <span className="text-zinc-800">·</span>
      <span>{beat}</span>
    </div>
  );
}
