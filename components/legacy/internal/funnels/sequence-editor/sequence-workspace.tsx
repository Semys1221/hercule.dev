"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SequenceDropdown, type SequenceEditorActions } from "./sequence-dropdown";
import { SequenceJobLogsSheet } from "./sequence-job-logs-sheet";
import { SequenceTestDebugPanel } from "./sequence-test-debug-panel";
import type { SequenceEditorAdapter, SequenceStep } from "./types";

type SequenceWorkspaceProps = {
  title: string;
  description?: string;
  adapter: SequenceEditorAdapter;
  campaignId?: string | null;
  editorKind?: "booking" | "bypass" | "reply_agent" | string;
  defaultTestRecipientEmail?: string;
};

export function SequenceWorkspace({
  title,
  description,
  adapter,
  campaignId,
  editorKind = "booking",
  defaultTestRecipientEmail,
}: SequenceWorkspaceProps) {
  const [editorActions, setEditorActions] = useState<SequenceEditorActions | null>(
    null,
  );
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [activeTab, setActiveTab] = useState<"editor" | "ops">("editor");
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"resend" | "instantly">(
    "resend",
  );
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleRegisterActions = useCallback((actions: SequenceEditorActions) => {
    setEditorActions(actions);
    setSteps(actions.steps);
  }, []);

  const testRecipient = useMemo(
    () =>
      defaultTestRecipientEmail ??
      process.env.NEXT_PUBLIC_OPS_TEST_EMAIL ??
      "",
    [defaultTestRecipientEmail],
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Fichier git :{" "}
          <code>{`app/(marketing)/content/legal-documentation/${adapter.niche}/sequences/${adapter.slug}.md`}</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void editorActions?.save()}
          disabled={!editorActions || editorActions.saving}
        >
          {editorActions?.saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setActiveTab("ops")}
        >
          Test &amp; Debug
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "editor" | "ops")}
        className="flex flex-col gap-4"
      >
        <TabsList>
          <TabsTrigger value="editor">Éditeur</TabsTrigger>
          <TabsTrigger value="ops">Test &amp; Debug</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="mt-0">
          <SequenceDropdown
            title={title}
            description={description}
            adapter={adapter}
            embedded
            hideSaveButton
            onRegisterActions={handleRegisterActions}
            onStepsChange={setSteps}
          />
        </TabsContent>
        <TabsContent value="ops" className="mt-0">
          <SequenceTestDebugPanel
            slug={adapter.slug}
            niche={adapter.niche}
            provider={adapter.provider}
            editorKind={editorKind}
            campaignId={campaignId}
            steps={steps}
            defaultRecipientEmail={testRecipient}
            historyRefresh={historyRefresh}
            onHistoryRefresh={() => setHistoryRefresh((value) => value + 1)}
            onOpenLogs={(job) => {
              setSelectedJobId(job.id);
              setSelectedProvider(job.provider);
              setLogsOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <SequenceJobLogsSheet
        open={logsOpen}
        onOpenChange={setLogsOpen}
        jobId={selectedJobId}
        provider={selectedProvider}
      />
    </div>
  );
}
