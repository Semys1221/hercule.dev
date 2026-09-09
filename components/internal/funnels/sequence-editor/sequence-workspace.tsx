"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SequenceDropdown, type SequenceEditorActions } from "./sequence-dropdown";
import { SequenceHistoryTab } from "./sequence-history-tab";
import { SequenceJobLogsSheet } from "./sequence-job-logs-sheet";
import { SequenceTestDialog } from "./sequence-test-dialog";
import type { SequenceEditorAdapter, SequenceStep } from "./types";

type SequenceWorkspaceProps = {
  title: string;
  description?: string;
  adapter: SequenceEditorAdapter;
  defaultTestRecipientEmail?: string;
};

export function SequenceWorkspace({
  title,
  description,
  adapter,
  defaultTestRecipientEmail,
}: SequenceWorkspaceProps) {
  const [editorActions, setEditorActions] = useState<SequenceEditorActions | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [testOpen, setTestOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"resend" | "instantly">("resend");
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
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void editorActions?.save()}
          disabled={!editorActions || editorActions.saving}
        >
          {editorActions?.saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setTestOpen(true)}>
          Tester
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!selectedJobId}
          onClick={() => setLogsOpen(true)}
        >
          Ouvrir les logs
        </Button>
      </div>

      <Tabs defaultValue="editor" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="editor">Éditeur</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
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
        <TabsContent value="history" className="mt-0">
          <SequenceHistoryTab
            slug={adapter.slug}
            niche={adapter.niche}
            refreshToken={historyRefresh}
            onSelectJob={(job) => {
              setSelectedJobId(job.id);
              setSelectedProvider(job.provider);
              setLogsOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <SequenceTestDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        slug={adapter.slug}
        niche={adapter.niche}
        steps={steps}
        defaultRecipientEmail={testRecipient}
        onSent={() => setHistoryRefresh((value) => value + 1)}
      />

      <SequenceJobLogsSheet
        open={logsOpen}
        onOpenChange={setLogsOpen}
        jobId={selectedJobId}
        provider={selectedProvider}
      />
    </div>
  );
}
