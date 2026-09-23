"use client";

import { useMemo, useState } from "react";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BEATS } from "./beats";
import { cueFor } from "./cues";
import { SCENE_LABELS, type SceneId } from "./types";

type BeatGroup = {
  scene: SceneId;
  items: { beatIdx: number; beatId: number; label: string }[];
};

function buildBeatGroups(): BeatGroup[] {
  const groups: BeatGroup[] = [];

  BEATS.forEach((beat, beatIdx) => {
    const label = cueFor(beat.scene, beat.step)?.label ?? beat.scene;
    const last = groups[groups.length - 1];

    if (last?.scene === beat.scene) {
      last.items.push({ beatIdx, beatId: beat.id, label });
      return;
    }

    groups.push({
      scene: beat.scene,
      items: [{ beatIdx, beatId: beat.id, label }],
    });
  });

  return groups;
}

const BEAT_GROUPS = buildBeatGroups();

type ConferenceBeatNavigatorProps = {
  beatIdx: number;
  beatId: number;
  onSelectBeat: (beatIdx: number) => void;
};

export function ConferenceBeatNavigator({
  beatIdx,
  beatId,
  onSelectBeat,
}: ConferenceBeatNavigatorProps) {
  const [open, setOpen] = useState(false);
  const beat = BEATS[beatIdx];
  const currentLabel = beat
    ? (cueFor(beat.scene, beat.step)?.label ?? `Point ${beatId}`)
    : `Point ${beatId}`;

  const groups = useMemo(() => BEAT_GROUPS, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border bg-card/80 text-foreground backdrop-blur-sm hover:bg-card hover:text-foreground"
        >
          <ListOrdered className="size-4" />
          <span className="tabular-nums">{beatId}</span>
          <span className="max-w-[8rem] truncate text-muted-foreground">{currentLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-80 border-border bg-card p-0 text-foreground"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Rechercher un point…"
            className="text-foreground placeholder:text-muted-foreground"
          />
          <CommandList className="max-h-72">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              Aucun point trouvé.
            </CommandEmpty>

            {groups.map((group) => (
              <CommandGroup
                key={group.scene}
                heading={SCENE_LABELS[group.scene]}
                className="text-muted-foreground [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {group.items.map((item) => (
                  <CommandItem
                    key={item.beatIdx}
                    value={`${item.beatId} ${item.label} ${SCENE_LABELS[group.scene]}`}
                    onSelect={() => {
                      onSelectBeat(item.beatIdx);
                      setOpen(false);
                    }}
                    className={
                      item.beatIdx === beatIdx
                        ? "bg-muted text-foreground"
                        : "text-foreground aria-selected:bg-muted"
                    }
                  >
                    <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {item.beatId}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
