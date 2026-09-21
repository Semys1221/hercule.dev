import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export type InternalPageSegment = {
  label: string;
  href?: string;
};

type InternalPageHeaderProps = {
  title: string;
  description?: string;
  segments?: InternalPageSegment[];
  actions?: React.ReactNode;
};

export function InternalPageHeader({
  title,
  description,
  segments = [],
  actions,
}: InternalPageHeaderProps) {
  return (
    <div className="mb-8 space-y-4">
      {segments.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              return (
                <Fragment key={`${segment.label}-${index}`}>
                  <BreadcrumbItem>
                    {isLast || !segment.href ? (
                      <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={segment.href}>{segment.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <Separator />
    </div>
  );
}
