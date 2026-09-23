"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "needs_reply" | "unread";

type ThreadRow = {
  id: string;
  client_id: string;
  subject: string;
  snippet: string;
  last_message_at: string;
  needs_reply: boolean;
  ambiguous_client: boolean;
  clients?: {
    id: string;
    email: string;
    first_name: string | null;
    slug: string;
    product_statut: string;
  } | null;
  client_inbox_thread_state?: {
    read_at: string | null;
  } | null;
};

type MessageRow = {
  id: string;
  direction: "in" | "out";
  from_email: string;
  body_text: string;
  sent_at: string;
  subject: string;
};

function clientLabel(thread: ThreadRow): string {
  const client = thread.clients;
  if (!client) return "Client";
  return client.first_name?.trim() || client.email;
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ClientInboxBoard() {
  const [filter, setFilter] = useState<InboxFilter>("needs_reply");
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [composerBody, setComposerBody] = useState("");
  const [composerSubject, setComposerSubject] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const label = clientLabel(thread).toLowerCase();
      const email = thread.clients?.email?.toLowerCase() ?? "";
      return (
        label.includes(q) ||
        email.includes(q) ||
        thread.subject.toLowerCase().includes(q) ||
        thread.snippet.toLowerCase().includes(q)
      );
    });
  }, [threads, search]);

  const loadThreads = useCallback(async () => {
    const response = await fetch(
      `/api/admin/engin/communication/clients?filter=${filter}`,
    );
    const payload = (await response.json()) as { threads?: ThreadRow[]; error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Impossible de charger l’inbox");
      return;
    }
    setThreads(payload.threads ?? []);
    setError(null);
  }, [filter]);

  const loadThreadMessages = useCallback(async (threadId: string) => {
    const response = await fetch(
      `/api/admin/engin/communication/clients/threads/${threadId}/messages`,
    );
    const payload = (await response.json()) as {
      messages?: MessageRow[];
      draft?: { body?: string; subject?: string };
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error ?? "Impossible de charger la conversation");
      return;
    }
    setMessages(payload.messages ?? []);
    setComposerBody(payload.draft?.body ?? "");
    setComposerSubject(payload.draft?.subject ?? "");
    setReplyToMessageId(null);
    const last = payload.messages?.[payload.messages.length - 1];
    if (last?.direction === "in") {
      setReplyToMessageId(last.id);
    }
    await fetch(`/api/admin/engin/communication/clients/threads/${threadId}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markRead: true }),
    });
  }, []);

  useEffect(() => {
    void loadThreads();
    const timer = window.setInterval(() => void loadThreads(), 45_000);
    return () => window.clearInterval(timer);
  }, [loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      void loadThreadMessages(selectedThreadId);
    }
  }, [selectedThreadId, loadThreadMessages]);

  useEffect(() => {
    if (!selectedThreadId || !selectedThread?.client_id) return;
    const timer = window.setTimeout(async () => {
      await fetch(
        `/api/admin/engin/communication/clients/${selectedThread.client_id}/draft`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId: selectedThreadId,
            subject: composerSubject,
            body: composerBody,
          }),
        },
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [composerBody, composerSubject, selectedThreadId, selectedThread?.client_id]);

  const sendMessage = async () => {
    if (!selectedThread?.client_id || !composerBody.trim()) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/engin/communication/clients/${selectedThread.client_id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: composerBody,
            subject: composerSubject || undefined,
            threadId: selectedThreadId ?? undefined,
            replyToMessageId: replyToMessageId ?? undefined,
          }),
        },
      );
      const payload = (await response.json()) as { error?: string; threadId?: string };
      if (!response.ok) throw new Error(payload.error ?? "Envoi impossible");
      setComposerBody("");
      setStatus("Message envoyé via Gmail.");
      if (payload.threadId) {
        setSelectedThreadId(payload.threadId);
        await loadThreadMessages(payload.threadId);
      }
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  const markResolved = async () => {
    if (!selectedThreadId) return;
    await fetch(`/api/admin/engin/communication/clients/threads/${selectedThreadId}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markResolved: true }),
    });
    await loadThreads();
    if (selectedThreadId) await loadThreadMessages(selectedThreadId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Messagerie clients</h2>
          <p className="text-sm text-muted-foreground">
            Gmail ({`thomas@hercule.dev`}) — filtré sur les clients Supabase. Pas Resend.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadThreads()}>
          <RefreshCw className="mr-2 size-4" />
          Actualiser
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as InboxFilter)}
      >
        <TabsList>
          <TabsTrigger value="needs_reply">À répondre</TabsTrigger>
          <TabsTrigger value="unread">Non lus</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="min-h-[60vh]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversations</CardTitle>
            <FieldGroup>
              <Field>
                <FieldLabel className="sr-only">Recherche</FieldLabel>
                <Input
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[55vh] px-4">
              <div className="flex flex-col gap-1 pb-4">
                {filteredThreads.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Aucune conversation synchronisée. Lancez le backfill Gmail ou attendez le cron.
                  </p>
                ) : null}
                {filteredThreads.map((thread) => {
                  const unread = !thread.client_inbox_thread_state?.read_at;
                  return (
                    <Button
                      key={thread.id}
                      type="button"
                      variant={selectedThreadId === thread.id ? "secondary" : "ghost"}
                      className="h-auto flex-col items-start gap-1 px-2 py-2 text-left"
                      onClick={() => setSelectedThreadId(thread.id)}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="font-medium">{clientLabel(thread)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(thread.last_message_at)}
                        </span>
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {thread.subject || thread.snippet}
                      </span>
                      <span className="flex flex-wrap gap-1">
                        {thread.needs_reply ? (
                          <Badge variant="destructive">À répondre</Badge>
                        ) : null}
                        {unread ? <Badge variant="outline">Non lu</Badge> : null}
                        {thread.ambiguous_client ? (
                          <Badge variant="outline">Email ambigu</Badge>
                        ) : null}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex min-h-[60vh] flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="border-b border-border pb-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{clientLabel(selectedThread)}</CardTitle>
                    <CardDescription>{selectedThread.clients?.email}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link href={`/admin/clients/${selectedThread.client_id}`}>
                        Fiche client
                        <ExternalLink className="ml-1 size-3" />
                      </Link>
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => void markResolved()}>
                      Marquer traité
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                <ScrollArea className="h-[38vh] pr-3">
                  <div className="flex flex-col gap-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[90%] rounded-lg border border-border px-3 py-2 text-sm",
                          message.direction === "out"
                            ? "ml-auto bg-accent/40"
                            : "bg-muted/40",
                        )}
                      >
                        <p className="mb-1 text-xs text-muted-foreground">
                          {message.direction === "out" ? "Vous" : message.from_email} ·{" "}
                          {formatTime(message.sent_at)}
                        </p>
                        <p className="whitespace-pre-wrap">{message.body_text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Objet (nouveau fil ou override)</FieldLabel>
                    <Input
                      value={composerSubject}
                      onChange={(event) => setComposerSubject(event.target.value)}
                      placeholder={selectedThread.subject || "Re: …"}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Message</FieldLabel>
                    <Textarea
                      value={composerBody}
                      onChange={(event) => setComposerBody(event.target.value)}
                      className="min-h-28"
                      placeholder="Réponse via thomas@hercule.dev…"
                    />
                  </Field>
                </FieldGroup>
                <Button type="button" disabled={busy || !composerBody.trim()} onClick={() => void sendMessage()}>
                  Envoyer
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Sélectionnez une conversation.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
