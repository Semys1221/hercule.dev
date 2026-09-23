"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { ClientOpsTask } from "@/lib/clients/engin-types";

type EnginClientTasksProps = {
  clientId: string;
};

function formatDue(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EnginClientTasks({ clientId }: EnginClientTasksProps) {
  const [tasks, setTasks] = React.useState<ClientOpsTask[]>([]);
  const [title, setTitle] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/engin/clients/${encodeURIComponent(clientId)}/tasks`,
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Impossible de charger les tâches");
      }
      const body = (await response.json()) as { tasks: ClientOpsTask[] };
      setTasks(body.tasks ?? []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Tâches indisponibles",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    const nextTitle = title.trim();
    if (!nextTitle || saving) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/engin/clients/${encodeURIComponent(clientId)}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Création impossible");
      }
      const body = (await response.json()) as { task: ClientOpsTask };
      setTasks((prev) => [body.task, ...prev]);
      setTitle("");
      setDueAt("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Tâche non créée",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: ClientOpsTask, done: boolean) {
    const response = await fetch(
      `/api/admin/engin/clients/${encodeURIComponent(clientId)}/tasks/${task.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: done ? "done" : "open" }),
      },
    );
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      toast({
        variant: "destructive",
        title: "Mise à jour impossible",
        description: body.error ?? "Une erreur est survenue.",
      });
      return;
    }
    const body = (await response.json()) as { task: ClientOpsTask };
    setTasks((prev) => prev.map((row) => (row.id === body.task.id ? body.task : row)));
  }

  const open = tasks.filter((task) => task.status === "open");
  const done = tasks.filter((task) => task.status === "done");

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="engin-task-title">Nouvelle tâche</FieldLabel>
          <Input
            id="engin-task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex. Relancer le siège Calendly"
            disabled={saving}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="engin-task-due">Échéance</FieldLabel>
          <Input
            id="engin-task-due"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            disabled={saving}
          />
        </Field>
        <Button type="button" disabled={saving || !title.trim()} onClick={() => void handleCreate()}>
          Ajouter
        </Button>
      </FieldGroup>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des tâches…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <TaskList title="À faire" tasks={open} onToggle={toggleTask} />
          <TaskList title="Terminées" tasks={done} onToggle={toggleTask} />
        </div>
      )}
    </div>
  );
}

function TaskList({
  title,
  tasks,
  onToggle,
}: {
  title: string;
  tasks: ClientOpsTask[];
  onToggle: (task: ClientOpsTask, done: boolean) => Promise<void>;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune tâche.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={(checked) => {
                  void onToggle(task, checked === true);
                }}
                aria-label={task.title}
              />
              <div className="flex flex-col gap-0.5">
                <span className={task.status === "done" ? "text-muted-foreground line-through" : ""}>
                  {task.title}
                </span>
                {formatDue(task.due_at) ? (
                  <span className="text-xs text-muted-foreground">
                    Échéance {formatDue(task.due_at)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
