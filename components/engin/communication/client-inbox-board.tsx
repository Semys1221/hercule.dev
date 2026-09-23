"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "needs_reply" | "unread";

const FILTER_ITEMS: { value: InboxFilter; label: string }[] = [
  { value: "needs_reply", label: "À répondre" },
  { value: "unread", label: "Non lus" },
  { value: "all", label: "Tous" },
];

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

function clientInitials(thread: ThreadRow): string {
  const label = clientLabel(thread);
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
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

function ThreadListRow({
  thread,
  selected,
  onSelect,
}: {
  thread: ThreadRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const unread = !thread.client_inbox_thread_state?.read_at;
  const subject = thread.subject || thread.snippet;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/60",
        selected && "bg-muted/80",
      )}
    >
      <Avatar className="size-9">
        <AvatarFallback className="text-xs font-medium">{clientInitials(thread)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>
            {clientLabel(thread)}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatTime(thread.last_message_at)}
          </span>
        </div>
        <p className={cn("line-clamp-1 text-sm", unread ? "text-foreground" : "text-muted-foreground")}>
          {subject}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{thread.snippet}</p>
        {(thread.needs_reply || thread.ambiguous_client) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {thread.needs_reply ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                À répondre
              </Badge>
            ) : null}
            {thread.ambiguous_client ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Email ambigu
              </Badge>
            ) : null}
          </div>
        )}
      </div>
      {unread ? (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

function FilterRail({
  filter,
  onFilterChange,
}: {
  filter: InboxFilter;
  onFilterChange: (value: InboxFilter) => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Filtres inbox">
      {FILTER_ITEMS.map((item) => (
        <Button
          key={item.value}
          type="button"
          variant={filter === item.value ? "secondary" : "ghost"}
          className="justify-start font-normal"
          onClick={() => onFilterChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
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
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

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
      setLoadingThreads(false);
      return;
    }
    setThreads(payload.threads ?? []);
    setError(null);
    setLoadingThreads(false);
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
    setLoadingThreads(true);
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

  const selectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setMobileShowThread(true);
  };

  const sendMessage = async () => {
    if (!selectedThread?.client_id || !composerBody.trim()) return;
    setBusy(true);
    setError(null);
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
      toast({ title: "Message envoyé via Gmail." });
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
    toast({ title: "Conversation marquée comme traitée." });
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  };

  const threadPane = (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {selectedThread ? (
        <>
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setMobileShowThread(false)}
                aria-label="Retour à la liste"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0">
                <p className="font-semibold leading-tight">{clientLabel(selectedThread)}</p>
                <p className="text-sm text-muted-foreground">{selectedThread.clients?.email}</p>
                {selectedThread.clients?.product_statut ? (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {selectedThread.clients.product_statut}
                  </Badge>
                ) : null}
              </div>
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
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="flex flex-col gap-3 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-lg border border-border px-3 py-2 text-sm",
                    message.direction === "out"
                      ? "ml-auto bg-muted"
                      : "bg-card shadow-sm",
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
          <div className="shrink-0 border-t border-border bg-card p-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Objet</FieldLabel>
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
                  onKeyDown={handleComposerKeyDown}
                  className="min-h-24"
                  placeholder="Réponse via thomas@hercule.dev…"
                />
              </Field>
            </FieldGroup>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">⌘/Ctrl + Entrée pour envoyer</p>
              <Button
                type="button"
                disabled={busy || !composerBody.trim()}
                onClick={() => void sendMessage()}
              >
                Envoyer
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-sm font-medium text-foreground">Choisissez une conversation</p>
          <p className="text-sm text-muted-foreground">
            Les emails synchronisés depuis Gmail apparaissent dans la liste.
          </p>
        </div>
      )}
    </div>
  );

  const listHeader = (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
      <Input
        placeholder="Rechercher…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="h-9"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => void loadThreads()}
        aria-label="Actualiser"
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  );

  const listBody = loadingThreads ? (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  ) : filteredThreads.length === 0 ? (
    <div className="px-4 py-10 text-center text-sm text-muted-foreground">
      <p>Aucune conversation synchronisée.</p>
      <p className="mt-2 text-xs">
        Lancez{" "}
        <code className="rounded bg-muted px-1 py-0.5">pnpm backfill-client-inbox-from-gmail</code>{" "}
        ou attendez le cron.
      </p>
    </div>
  ) : (
    <ScrollArea className="h-full min-h-0">
      {filteredThreads.map((thread) => (
        <ThreadListRow
          key={thread.id}
          thread={thread}
          selected={selectedThreadId === thread.id}
          onSelect={() => selectThread(thread.id)}
        />
      ))}
    </ScrollArea>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error ? (
        <Alert variant="destructive" className="m-3 shrink-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <p className="shrink-0 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Gmail (thomas@hercule.dev) — clients Supabase uniquement. Pas Resend.
      </p>

      <div className="hidden min-h-0 flex-1 lg:flex">
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-16rem)]">
          <ResizablePanel defaultSize={14} minSize={12} maxSize={22} className="bg-card">
            <FilterRail filter={filter} onFilterChange={setFilter} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={22} maxSize={40} className="flex flex-col border-x border-border bg-card">
            {listHeader}
            <div className="min-h-0 flex-1">{listBody}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={56} minSize={35} className="min-h-0">
            {threadPane}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2">
          {FILTER_ITEMS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? "secondary" : "ghost"}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {!mobileShowThread ? (
          <div className="flex min-h-0 flex-1 flex-col bg-card">
            {listHeader}
            <div className="min-h-0 flex-1">{listBody}</div>
          </div>
        ) : (
          <div className="min-h-0 flex-1">{threadPane}</div>
        )}
      </div>
    </div>
  );
}
