"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { InternalStatusAlert } from "@/components/legacy/internal/funnels/ui/internal-status-alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salesAudienceToLeadCategory } from "@/lib/legacy/admin/funnels/sales-audience";
import {
  formatClosingAnswers,
  formatQualificationAnswers,
  getSalesSessionStorageRows,
} from "@/lib/legacy/admin/funnels/sales-qualification-display";
import {
  SESSION_DATA_ANSWERS_DESCRIPTION,
  SESSION_DATA_ANSWERS_TITLE,
  SESSION_DATA_EMPTY,
  SESSION_DATA_LOAD_ERROR,
  SESSION_DATA_PROSPECT_LABEL,
  SESSION_DATA_PROSPECT_PLACEHOLDER,
  SESSION_DATA_STORAGE_DESCRIPTION,
  SESSION_DATA_STORAGE_TITLE,
} from "@/lib/legacy/admin/funnels/ui-copy";
import { readBookingsClientCache } from "@/lib/legacy/calendly/bookings-client-cache";
import { CALENDLY_BOOKINGS_DAYS_BEHIND } from "@/lib/legacy/calendly/bookings-window";
import type { EnrichedCalendlyBooking } from "@/lib/legacy/calendly/enrich-bookings";
import type { Audience } from "@/lib/legacy/admin/navigation";
import type { SalesCall } from "@/lib/legacy/sales-calls/types";

import {
  salesBookingLabel,
  SalesBookingSelectOptions,
  salesBookingValueClassName,
} from "./sales-booking-select-options";

type SalesSessionDataPanelProps = {
  audience: Audience;
  initialInviteeUri?: string | null;
};

function DataSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function SalesSessionDataPanel({
  audience,
  initialInviteeUri,
}: SalesSessionDataPanelProps) {
  const [bookings, setBookings] = useState<EnrichedCalendlyBooking[]>([]);
  const [selectedUri, setSelectedUri] = useState(initialInviteeUri ?? "");
  const [salesCall, setSalesCall] = useState<SalesCall | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingSalesCall, setLoadingSalesCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.invitee_uri === selectedUri) ?? null,
    [bookings, selectedUri],
  );

  const leadCategory =
    selectedBooking?.lead_category ??
    selectedBooking?.booking_category ??
    salesAudienceToLeadCategory(audience);

  const loadSalesCall = useCallback(async (inviteeUri: string) => {
    if (!inviteeUri) {
      setSalesCall(null);
      return;
    }

    setLoadingSalesCall(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/sales-calls?inviteeUri=${encodeURIComponent(inviteeUri)}`,
      );
      const body = (await response.json()) as { salesCall?: SalesCall; error?: string };
      if (!response.ok) {
        if (response.status === 404) {
          setSalesCall(null);
          return;
        }
        throw new Error(body.error ?? SESSION_DATA_LOAD_ERROR);
      }
      setSalesCall(body.salesCall ?? null);
    } catch (loadError) {
      setSalesCall(null);
      setError(loadError instanceof Error ? loadError.message : SESSION_DATA_LOAD_ERROR);
    } finally {
      setLoadingSalesCall(false);
    }
  }, []);

  useEffect(() => {
    const cached = readBookingsClientCache(audience, CALENDLY_BOOKINGS_DAYS_BEHIND);
    setBookings(cached?.bookings ?? []);
    setLoadingBookings(false);
  }, [audience]);

  useEffect(() => {
    if (initialInviteeUri) {
      setSelectedUri(initialInviteeUri);
    }
  }, [initialInviteeUri]);

  useEffect(() => {
    if (!selectedUri) {
      setSalesCall(null);
      return;
    }
    void loadSalesCall(selectedUri);
  }, [loadSalesCall, selectedUri]);

  const qualificationRows = useMemo(
    () =>
      formatQualificationAnswers(
        audience,
        salesCall?.notes?.qualification as Record<string, unknown> | undefined,
      ),
    [audience, salesCall?.notes?.qualification],
  );

  const closingRows = useMemo(
    () =>
      formatClosingAnswers(salesCall?.notes?.closing as Record<string, unknown> | undefined),
    [salesCall?.notes?.closing],
  );

  const storageRows = useMemo(
    () =>
      getSalesSessionStorageRows({
        audience,
        salesCallId: salesCall?.id ?? null,
        inviteeUri: selectedUri || null,
        leadCategory,
      }),
    [audience, leadCategory, salesCall?.id, selectedUri],
  );

  const answerRows = useMemo(
    () => [...qualificationRows, ...closingRows],
    [closingRows, qualificationRows],
  );

  if (loadingBookings && bookings.length === 0) {
    return <DataSkeleton />;
  }

  return (
    <div className="space-y-4">
      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <div className="space-y-2">
        <Label htmlFor="session-data-prospect">{SESSION_DATA_PROSPECT_LABEL}</Label>
        <Select
          value={selectedUri}
          onValueChange={setSelectedUri}
          disabled={bookings.length === 0}
        >
          <SelectTrigger id="session-data-prospect" className="w-full max-w-xl">
            <SelectValue placeholder={SESSION_DATA_PROSPECT_PLACEHOLDER}>
              {selectedBooking ? (
                <span className={salesBookingValueClassName(selectedBooking.start_time)}>
                  {salesBookingLabel(selectedBooking)}
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SalesBookingSelectOptions bookings={bookings} />
          </SelectContent>
        </Select>
      </div>

      {selectedUri ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{SESSION_DATA_STORAGE_TITLE}</CardTitle>
              <CardDescription>{SESSION_DATA_STORAGE_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Emplacement</TableHead>
                    <TableHead>Chemin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="break-all font-mono text-xs text-muted-foreground">
                        {row.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{SESSION_DATA_ANSWERS_TITLE}</CardTitle>
              <CardDescription>{SESSION_DATA_ANSWERS_DESCRIPTION}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSalesCall ? (
                <Skeleton className="h-32 w-full" />
              ) : answerRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">{SESSION_DATA_EMPTY}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">Question</TableHead>
                      <TableHead>Réponse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {answerRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="align-top font-medium">{row.question}</TableCell>
                        <TableCell className="align-top text-muted-foreground">{row.answer}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
