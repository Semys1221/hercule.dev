"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Pencil, Rocket, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolbarActionState } from "@/lib/admin/funnels/toolbar-actions";
import { cn } from "@/lib/utils";

export type InternalResourceToolbarProps = {
  edit: ToolbarActionState & { href?: string };
  preview: ToolbarActionState;
  promote: ToolbarActionState;
  delete: ToolbarActionState & {
    confirmTitle: string;
    confirmDescription: string;
  };
  busy?: boolean;
  className?: string;
  onPreview?: () => void;
  onPromote?: () => Promise<void>;
  onDeleteConfirm?: () => Promise<void>;
};

type ToolbarButtonProps = {
  label: string;
  icon: React.ReactNode;
  action: ToolbarActionState & { href?: string };
  busy?: boolean;
  onClick?: () => void;
};

function ToolbarButton({
  label,
  icon,
  action,
  busy,
  onClick,
}: ToolbarButtonProps) {
  const button = (
    <Button
      variant="outline"
      size="sm"
      disabled={!action.enabled || busy}
      onClick={action.enabled ? onClick : undefined}
      asChild={action.enabled && action.href ? true : undefined}
    >
      {action.enabled && action.href ? (
        <Link href={action.href}>
          {icon}
          {label}
        </Link>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );

  if (!action.enabled && action.reason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent>{action.reason}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

export function InternalResourceToolbar({
  edit,
  preview,
  promote,
  delete: deleteAction,
  busy = false,
  className,
  onPreview,
  onPromote,
  onDeleteConfirm,
}: InternalResourceToolbarProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    if (!onDeleteConfirm) {
      return;
    }
    await onDeleteConfirm();
    setDeleteOpen(false);
  }

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        <ToolbarButton
          label="Edit"
          icon={<Pencil className="size-4" />}
          action={edit}
          busy={busy}
        />
        <ToolbarButton
          label="Preview"
          icon={<Eye className="size-4" />}
          action={preview}
          busy={busy}
          onClick={onPreview}
        />
        <ToolbarButton
          label="Promote"
          icon={<Rocket className="size-4" />}
          action={promote}
          busy={busy}
          onClick={() => {
            if (onPromote) {
              void onPromote();
            }
          }}
        />
        <ToolbarButton
          label="Delete"
          icon={<Trash2 className="size-4" />}
          action={deleteAction}
          busy={busy}
          onClick={() => setDeleteOpen(true)}
        />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteAction.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAction.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
