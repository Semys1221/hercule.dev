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
import { CUES } from "./cues";
import { SCENE_LABELS, type SceneId } from "./types";

const FIRST_NAV_BEAT = 1;

type BeatGroup = {
  scene: SceneId;
  items: { beatIdx: number; beatId: number; label: string }[];
};

function buildBeatGroups(): BeatGroup[] {
  const groups: BeatGroup[] = [];

  BEATS.forEach((beat, beatIdx) => {
    if (beatIdx < FIRST_NAV_BEAT) return;

    const label = CUES[beat.id]?.label ?? beat.scene;
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
  const currentLabel = CUES[beatId]?.label ?? `Point ${beatId}`;

  const groups = useMemo(() => BEAT_GROUPS, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-zinc-700/60 bg-zinc-950/80 text-zinc-300 backdrop-blur-sm hover:bg-zinc-900 hover:text-zinc-100"
        >
          <ListOrdered className="size-4" />
          <span className="tabular-nums">{beatId}</span>
          <span className="max-w-[8rem] truncate text-zinc-500">{currentLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-80 border-zinc-800 bg-zinc-950 p-0 text-zinc-100"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Rechercher un point…"
            className="text-zinc-100 placeholder:text-zinc-500"
          />
          <CommandList className="max-h-72">
            <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
              Aucun point trouvé.
            </CommandEmpty>

            {groups.map((group) => (
              <CommandGroup
                key={group.scene}
                heading={SCENE_LABELS[group.scene]}
                className="text-zinc-400 [&_[cmdk-group-heading]]:text-zinc-500"
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
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-300 aria-selected:bg-zinc-800/80"
                    }
                  >
                    <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-zinc-500">
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
