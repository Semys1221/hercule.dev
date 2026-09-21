"use client";

import { useState } from "react";

import { NotionStickerRive } from "@/components/sticker/notion-sticker-rive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NotionStickerManDemo() {
  const [name, setName] = useState("Noé");
  const [replayKey, setReplayKey] = useState(0);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Sticker man — Rive</CardTitle>
        <CardDescription>
          Personnage Rive (state machine) + feuille/laptop en overlay React. Séquence :
          chute → frappe → regard caméra.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <NotionStickerRive name={name} replayKey={replayKey} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="sticker-name">Nom sur l&apos;écran</Label>
          <Input
            id="sticker-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ton prénom"
            maxLength={16}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setReplayKey((value) => value + 1)}
        >
          Rejouer l&apos;animation
        </Button>

        <p className="text-xs text-muted-foreground">
          Créez <code className="text-xs">public/rive/sticker-man.riv</code> dans
          l&apos;éditeur Rive — voir <code className="text-xs">public/rive/README.md</code>.
        </p>
      </CardContent>
    </Card>
  );
}
