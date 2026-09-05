"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type InternalPreviewJsonSheetProps = {
  title: string;
  description?: string;
  data: unknown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InternalPreviewJsonSheet({
  title,
  description,
  data,
  open,
  onOpenChange,
}: InternalPreviewJsonSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <pre className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/20 p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </SheetContent>
    </Sheet>
  );
}
