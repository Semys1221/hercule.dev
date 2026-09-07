"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type SalesIntroChecklistProps = {
  items: string[];
  resetKey: string;
};

export function SalesIntroChecklist({ items, resetKey }: SalesIntroChecklistProps) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setChecked(new Set());
  }, [resetKey]);

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const id = `sales-intro-check-${resetKey}-${index}`;
        const isChecked = checked.has(index);

        return (
          <li key={index} className="flex items-start gap-3">
            <Checkbox
              id={id}
              checked={isChecked}
              onCheckedChange={(value) => {
                setChecked((previous) => {
                  const next = new Set(previous);
                  if (value === true) {
                    next.add(index);
                  } else {
                    next.delete(index);
                  }
                  return next;
                });
              }}
              className="mt-0.5"
            />
            <Label
              htmlFor={id}
              className="text-sm font-normal leading-relaxed tracking-tight text-foreground"
            >
              {item}
            </Label>
          </li>
        );
      })}
    </ul>
  );
}
