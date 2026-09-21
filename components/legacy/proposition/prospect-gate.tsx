"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropositionListItem } from "@/lib/legacy/propositions/registry";

type ProspectGateProps = {
  prospects: PropositionListItem[];
  onStart: (slug: string) => void;
};

export function ProspectGate({ prospects, onStart }: ProspectGateProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canStart = selectedSlug.length > 0;

  return (
    <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900/60 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-xl text-zinc-50">Sélection du prospect</CardTitle>
        <CardDescription className="text-zinc-400">
          Choisissez le prospect pour charger sa proposition personnalisée.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prospects.length === 0 ? (
          <p className="text-sm text-zinc-400">Aucune proposition configurée.</p>
        ) : (
          <>
            {mounted ? (
              <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                <SelectTrigger className="w-full border-zinc-700 bg-zinc-950/50 text-zinc-100">
                  <SelectValue placeholder="Sélectionner un prospect" />
                </SelectTrigger>
                <SelectContent>
                  {prospects.map((prospect) => (
                    <SelectItem key={prospect.slug} value={prospect.slug}>
                      {prospect.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div
                className="flex h-9 w-full items-center rounded-md border border-zinc-700 bg-zinc-950/50 px-3 text-sm text-zinc-400"
                aria-hidden
              >
                Sélectionner un prospect
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              disabled={!canStart}
              onClick={() => onStart(selectedSlug)}
            >
              Commencer
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
