"use client";

import { Copy, ExternalLink, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NO_SHOW_ACTIONS_DISABLED_TOOLTIP,
  noShowActionsEnabled,
} from "@/lib/admin/bookings/no-show-actions-enabled";
import {
  WORKFLOW_SEQUENCES_DISABLED_TOOLTIP,
  workflowSequencesEnabled,
} from "@/lib/admin/bookings/workflow-sequences-enabled";
import type { BookingRowActionState } from "@/lib/calendly/booking-row-actions";
import type { Niche } from "@/lib/admin/navigation";

export type BookingLinkItem = {
  label: string;
  href: string;
};

type BookingRowMenuProps = {
  niche: Niche;
  links: BookingLinkItem[];
  actions: BookingRowActionState;
  leadMatched: boolean;
  canConfirm: boolean;
  pending: boolean;
  pendingConfirm: boolean;
  onConfirm: () => void;
  onMarkNotPaid: () => void;
  onMarkNoShow: () => void;
  onMarkLost: () => void;
  onMarkUnqualified: () => void;
  onResetNoShow: () => void;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function BookingRowMenu({
  niche,
  links,
  actions,
  leadMatched,
  canConfirm,
  pending,
  pendingConfirm,
  onConfirm,
  onMarkNotPaid,
  onMarkNoShow,
  onMarkLost,
  onMarkUnqualified,
  onResetNoShow,
}: BookingRowMenuProps) {
  const sequencesEnabled = workflowSequencesEnabled(niche);
  const noShowEnabled = noShowActionsEnabled(niche);

  const hasMarkActions =
    leadMatched &&
    (actions.showNotPaid ||
      (actions.showNoShow && noShowEnabled) ||
      actions.showLost ||
      actions.showUnqualified ||
      actions.showResetNoShow);

  const hasWorkflowActions = sequencesEnabled && canConfirm;

  if (!hasMarkActions && !hasWorkflowActions && links.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const disabled = pending || pendingConfirm;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label="Actions du rendez-vous"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {sequencesEnabled ? (
          canConfirm ? (
            <DropdownMenuItem onSelect={onConfirm}>Démarrer confirmation</DropdownMenuItem>
          ) : null
        ) : (
          <DropdownMenuItem disabled title={WORKFLOW_SEQUENCES_DISABLED_TOOLTIP}>
            Séquences indisponibles
          </DropdownMenuItem>
        )}

        {hasMarkActions ? (
          <>
            {hasWorkflowActions || sequencesEnabled ? <DropdownMenuSeparator /> : null}
            {actions.showNotPaid ? (
              <DropdownMenuItem onSelect={onMarkNotPaid} disabled={!leadMatched}>
                Marquer non payé
              </DropdownMenuItem>
            ) : null}
            {actions.showNoShow && noShowEnabled ? (
              <DropdownMenuItem onSelect={onMarkNoShow} disabled={!leadMatched}>
                Marquer no-show
              </DropdownMenuItem>
            ) : null}
            {actions.showLost ? (
              <DropdownMenuItem onSelect={onMarkLost} disabled={!leadMatched}>
                Marquer perdu
              </DropdownMenuItem>
            ) : null}
            {actions.showUnqualified ? (
              <DropdownMenuItem onSelect={onMarkUnqualified} disabled={!leadMatched}>
                Marquer unqualified
              </DropdownMenuItem>
            ) : null}
            {actions.showResetNoShow ? (
              <DropdownMenuItem onSelect={onResetNoShow}>Annuler no-show</DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        {links.length > 0 ? (
          <>
            {(hasMarkActions || hasWorkflowActions) && links.length > 0 ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Liens</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {links.map((link) => (
                  <DropdownMenuItem key={link.label} asChild>
                    <a href={link.href} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" />
                      {link.label}
                    </a>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {links.map((link) => (
                  <DropdownMenuItem
                    key={`copy-${link.label}`}
                    onSelect={() => void copyText(link.href)}
                  >
                    <Copy className="size-3.5" />
                    Copier {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}

        {leadMatched && actions.showNoShow && !noShowEnabled ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled title={NO_SHOW_ACTIONS_DISABLED_TOOLTIP}>
              No-show indisponible
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
