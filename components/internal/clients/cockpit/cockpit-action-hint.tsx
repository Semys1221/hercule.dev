"use client";

import { Info } from "lucide-react";

import type { CockpitActionHelp } from "@/lib/admin/clients/action-help";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function recipientLabel(scope: string): string {
  if (scope === "both") return "agence + entreprise";
  if (scope === "agence") return "agence";
  return "entreprise";
}

type CockpitActionHintProps = {
  help: CockpitActionHelp;
};

export function CockpitActionHint({ help }: CockpitActionHintProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{help.summary}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              <Info className="size-3" />
              Détail email &amp; UI
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm space-y-2 text-xs">
            <p className="font-medium">Emails immédiats</p>
            <ul className="list-disc space-y-1 pl-4">
              {help.emails.immediate.map((email) => (
                <li key={email.type}>
                  {email.subject} → {recipientLabel(email.recipients)}
                </li>
              ))}
            </ul>
            {help.emails.scheduled && help.emails.scheduled.length > 0 ? (
              <>
                <p className="font-medium">Emails planifiés</p>
                <ul className="list-disc space-y-1 pl-4">
                  {help.emails.scheduled.map((email) => (
                    <li key={`${email.type}-${email.delay}`}>
                      {email.delay} : {email.subject} → {recipientLabel(email.recipients)}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {help.uiEffects.length > 0 ? (
              <>
                <p className="font-medium">Effet UI client</p>
                <ul className="list-disc space-y-1 pl-4">
                  {help.uiEffects.map((effect) => (
                    <li key={effect}>{effect}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {help.dbEffects && help.dbEffects.length > 0 ? (
              <>
                <p className="font-medium">Base de données</p>
                <ul className="list-disc space-y-1 pl-4">
                  {help.dbEffects.map((effect) => (
                    <li key={effect}>{effect}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
