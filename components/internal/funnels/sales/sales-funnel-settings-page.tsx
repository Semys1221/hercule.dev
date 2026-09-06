"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getPitchSidebarEnabledServerSnapshot,
  getPitchSidebarEnabledSnapshot,
  setPitchSidebarEnabled,
  subscribePitchSidebarEnabled,
} from "@/lib/admin/funnels/sales-funnel-settings";
import type { SalesSessionSettingsDocument } from "@/lib/admin/funnels/sales-session-settings-types";
import {
  SESSION_BACK_CTA,
  SESSION_INSTITUTIONAL_SIDEBAR_DESCRIPTION,
  SESSION_INSTITUTIONAL_SIDEBAR_OFF,
  SESSION_INSTITUTIONAL_SIDEBAR_ON,
  SESSION_INSTITUTIONAL_SIDEBAR_TITLE,
  SESSION_INSTITUTIONAL_SIDEBAR_TOGGLE,
  SESSION_PREPARATION_DESCRIPTION,
  SESSION_PREPARATION_LOAD_ERROR,
  SESSION_PREPARATION_SAVE_CTA,
  SESSION_PREPARATION_SAVE_ERROR,
  SESSION_PREPARATION_SAVE_SUCCESS,
  SESSION_PREPARATION_TITLE,
  SESSION_SETTINGS_BACK_ARIA,
  SESSION_SETTINGS_DESCRIPTION,
  SESSION_SETTINGS_LABEL,
  SESSION_SETTINGS_TAB_GENERAL,
  SESSION_SETTINGS_TAB_PREPARATION,
  SESSION_WAITING_QUEUE_DESCRIPTION,
  SESSION_WAITING_QUEUE_OFF,
  SESSION_WAITING_QUEUE_ON,
  SESSION_WAITING_QUEUE_TITLE,
  SESSION_WAITING_QUEUE_TOGGLE,
} from "@/lib/admin/funnels/ui-copy";
import { pathToHref, type Audience } from "@/lib/admin/navigation";

type SalesFunnelSettingsPageProps = {
  audience: Audience;
};

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xs" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function SalesFunnelSettingsPage({ audience }: SalesFunnelSettingsPageProps) {
  const funnelHref = pathToHref([audience, "sales", "funnel"]);
  const pitchSidebarEnabled = useSyncExternalStore(
    subscribePitchSidebarEnabled,
    () => getPitchSidebarEnabledSnapshot(audience),
    getPitchSidebarEnabledServerSnapshot,
  );

  const [settings, setSettings] = useState<SalesSessionSettingsDocument | null>(null);
  const [preparationContent, setPreparationContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPreparation, setSavingPreparation] = useState(false);
  const [savingWaitingQueue, setSavingWaitingQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/sales-session-settings/${audience}`);
      const body = (await response.json()) as {
        document?: SalesSessionSettingsDocument;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? SESSION_PREPARATION_LOAD_ERROR);
      }
      const document = body.document ?? null;
      setSettings(document);
      setPreparationContent(document?.preparation.content ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : SESSION_PREPARATION_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistSettings = useCallback(
    async (
      nextDocument: SalesSessionSettingsDocument,
      options?: { successMessage?: string; onSaving?: (value: boolean) => void },
    ) => {
      options?.onSaving?.(true);
      setError(null);
      setSuccess(null);
      try {
        const response = await fetch(`/api/admin/sales-session-settings/${audience}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextDocument),
        });
        const body = (await response.json()) as {
          document?: SalesSessionSettingsDocument;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? SESSION_PREPARATION_SAVE_ERROR);
        }
        const document = body.document ?? nextDocument;
        setSettings(document);
        setPreparationContent(document.preparation.content);
        if (options?.successMessage) {
          setSuccess(options.successMessage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : SESSION_PREPARATION_SAVE_ERROR);
      } finally {
        options?.onSaving?.(false);
      }
    },
    [audience],
  );

  async function handleWaitingQueueChange(enabled: boolean) {
    if (!settings) return;
    const nextDocument: SalesSessionSettingsDocument = {
      ...settings,
      waitingQueue: { enabled },
      updatedAt: new Date().toISOString(),
    };
    setSettings(nextDocument);
    await persistSettings(nextDocument, { onSaving: setSavingWaitingQueue });
  }

  async function handlePreparationSave() {
    if (!settings) return;
    const nextDocument: SalesSessionSettingsDocument = {
      ...settings,
      preparation: { content: preparationContent },
      updatedAt: new Date().toISOString(),
    };
    await persistSettings(nextDocument, {
      successMessage: SESSION_PREPARATION_SAVE_SUCCESS,
      onSaving: setSavingPreparation,
    });
  }

  const waitingQueueEnabled = settings?.waitingQueue.enabled ?? false;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={funnelHref} aria-label={SESSION_SETTINGS_BACK_ARIA}>
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{SESSION_SETTINGS_LABEL}</h1>
          <p className="text-sm text-muted-foreground">{SESSION_SETTINGS_DESCRIPTION}</p>
        </div>
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}
      {success ? <InternalStatusAlert variant="success" message={success} /> : null}

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">{SESSION_SETTINGS_TAB_GENERAL}</TabsTrigger>
            <TabsTrigger value="preparation">{SESSION_SETTINGS_TAB_PREPARATION}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{SESSION_INSTITUTIONAL_SIDEBAR_TITLE}</CardTitle>
                <CardDescription>{SESSION_INSTITUTIONAL_SIDEBAR_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="pitch-sidebar-toggle">
                      {SESSION_INSTITUTIONAL_SIDEBAR_TOGGLE}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {pitchSidebarEnabled
                        ? SESSION_INSTITUTIONAL_SIDEBAR_ON
                        : SESSION_INSTITUTIONAL_SIDEBAR_OFF}
                    </p>
                  </div>
                  <Switch
                    id="pitch-sidebar-toggle"
                    checked={pitchSidebarEnabled}
                    onCheckedChange={(checked) => setPitchSidebarEnabled(audience, checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{SESSION_WAITING_QUEUE_TITLE}</CardTitle>
                <CardDescription>{SESSION_WAITING_QUEUE_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="waiting-queue-toggle">{SESSION_WAITING_QUEUE_TOGGLE}</Label>
                    <p className="text-sm text-muted-foreground">
                      {waitingQueueEnabled ? SESSION_WAITING_QUEUE_ON : SESSION_WAITING_QUEUE_OFF}
                    </p>
                  </div>
                  <Switch
                    id="waiting-queue-toggle"
                    checked={waitingQueueEnabled}
                    disabled={savingWaitingQueue || !settings}
                    onCheckedChange={(checked) => void handleWaitingQueueChange(checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preparation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{SESSION_PREPARATION_TITLE}</CardTitle>
                <CardDescription>{SESSION_PREPARATION_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  id="preparation-content"
                  value={preparationContent}
                  onChange={(event) => setPreparationContent(event.target.value)}
                  className="min-h-[320px] resize-y"
                  disabled={!settings}
                />
                <Button
                  onClick={() => void handlePreparationSave()}
                  disabled={savingPreparation || !settings}
                >
                  {SESSION_PREPARATION_SAVE_CTA}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Button asChild variant="outline" className="w-fit">
        <Link href={funnelHref}>{SESSION_BACK_CTA}</Link>
      </Button>
    </div>
  );
}
