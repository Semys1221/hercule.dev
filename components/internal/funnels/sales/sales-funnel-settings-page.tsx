"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  getDeveloperModeEnabledServerSnapshot,
  getDeveloperModeEnabledSnapshot,
  getPitchSidebarEnabledServerSnapshot,
  getPitchSidebarEnabledSnapshot,
  setDeveloperModeEnabled,
  setPitchSidebarEnabled,
  subscribeDeveloperModeEnabled,
  subscribePitchSidebarEnabled,
} from "@/lib/admin/funnels/sales-funnel-settings";
import type { SalesSessionSettingsDocument } from "@/lib/admin/funnels/sales-session-settings-types";
import { salesTestSessionSlugForAudience } from "@/lib/admin/funnels/sales-test-session-preset";
import {
  SESSION_DEVELOPER_MODE_DESCRIPTION,
  SESSION_DEVELOPER_MODE_OFF,
  SESSION_DEVELOPER_MODE_ON,
  SESSION_DEVELOPER_MODE_TITLE,
  SESSION_DEVELOPER_MODE_TOGGLE,
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
  SESSION_DATA_DESCRIPTION,
  SESSION_SETTINGS_TAB_DATA,
  SESSION_SETTINGS_TAB_GENERAL,
  SESSION_SETTINGS_TAB_PREPARATION,
  SESSION_WAITING_QUEUE_DESCRIPTION,
  SESSION_WAITING_QUEUE_OFF,
  SESSION_WAITING_QUEUE_ON,
  SESSION_WAITING_QUEUE_TITLE,
  SESSION_WAITING_QUEUE_TOGGLE,
  SESSION_ONBOARDING_DEV_CTA,
  SESSION_ONBOARDING_DEV_DESCRIPTION,
  SESSION_ONBOARDING_DEV_TITLE,
} from "@/lib/admin/funnels/ui-copy";
import { setDashboardDeveloperModeEnabled } from "@/lib/dashboard/developer-mode";
import { sessionHubHref, pathToHref, type Audience } from "@/lib/admin/navigation";

import { SalesSessionDataPanel } from "./sales-session-data-panel";

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
  const searchParams = useSearchParams();
  const initialInviteeUri = searchParams.get("inviteeUri");
  const defaultTab = initialInviteeUri ? "donnees" : "general";

  const funnelHref = pathToHref([audience, "sales", "funnel"]);
  const pitchSidebarEnabled = useSyncExternalStore(
    subscribePitchSidebarEnabled,
    () => getPitchSidebarEnabledSnapshot(audience),
    getPitchSidebarEnabledServerSnapshot,
  );
  const developerModeEnabled = useSyncExternalStore(
    subscribeDeveloperModeEnabled,
    () => getDeveloperModeEnabledSnapshot(audience),
    getDeveloperModeEnabledServerSnapshot,
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

  function openOnboardingDevFunnel() {
    setDeveloperModeEnabled(audience, true);
    setDashboardDeveloperModeEnabled(true);
    window.open(
      `/dashboard/${encodeURIComponent(salesTestSessionSlugForAudience(audience))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

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
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList>
            <TabsTrigger value="general">{SESSION_SETTINGS_TAB_GENERAL}</TabsTrigger>
            <TabsTrigger value="preparation">{SESSION_SETTINGS_TAB_PREPARATION}</TabsTrigger>
            <TabsTrigger value="donnees">{SESSION_SETTINGS_TAB_DATA}</TabsTrigger>
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
                <CardTitle className="text-base">{SESSION_DEVELOPER_MODE_TITLE}</CardTitle>
                <CardDescription>{SESSION_DEVELOPER_MODE_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="developer-mode-toggle">{SESSION_DEVELOPER_MODE_TOGGLE}</Label>
                    <p className="text-sm text-muted-foreground">
                      {developerModeEnabled
                        ? SESSION_DEVELOPER_MODE_ON
                        : SESSION_DEVELOPER_MODE_OFF}
                    </p>
                  </div>
                  <Switch
                    id="developer-mode-toggle"
                    checked={developerModeEnabled}
                    onCheckedChange={(checked) => setDeveloperModeEnabled(audience, checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{SESSION_ONBOARDING_DEV_TITLE}</CardTitle>
                <CardDescription>{SESSION_ONBOARDING_DEV_DESCRIPTION}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="secondary" onClick={openOnboardingDevFunnel}>
                  {SESSION_ONBOARDING_DEV_CTA}
                </Button>
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

          <TabsContent value="donnees" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{SESSION_DATA_DESCRIPTION}</p>
            <SalesSessionDataPanel
              audience={audience}
              initialInviteeUri={initialInviteeUri}
            />
          </TabsContent>
        </Tabs>
      )}

    </div>
  );
}
