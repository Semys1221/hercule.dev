"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
import { ENGIN_TEST_RECIPIENT } from "@/lib/engin/communication/constants";

import type { CatalogItem } from "./communication-types";

export function NotificationCommunicationEditor() {
  const [notifications, setNotifications] = useState<CatalogItem[]>([]);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  const loadCatalog = useCallback(async () => {
    const response = await fetch("/api/admin/engin/communication/catalog");
    const payload = (await response.json()) as { notifications: CatalogItem[] };
    setNotifications(payload.notifications ?? []);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const loadSelection = useCallback(async (id: string) => {
    setError(null);
    setStatus(null);
    setSelectionId(id);
    const response = await fetch(`/api/admin/engin/communication/notifications/${id}`);
    const payload = (await response.json()) as {
      document?: { subject: string; body: string };
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error ?? "Chargement impossible");
      return;
    }
    setSubject(payload.document?.subject ?? "");
    setBody(payload.document?.body ?? "");
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = body;
    }
  }, [revision]);

  const save = async () => {
    if (!selectionId) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/engin/communication/notifications/${selectionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Enregistrement impossible");
      setStatus("Enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (!selectionId) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/engin/communication/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "notification",
          id: selectionId,
          subject,
          body,
          recipientEmail: ENGIN_TEST_RECIPIENT,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Envoi impossible");
      setStatus(`Test envoyé à ${ENGIN_TEST_RECIPIENT}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Emails transactionnels produit (Resend).</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] pr-3">
            <div className="flex flex-col gap-1">
              {notifications.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={selectionId === item.id ? "secondary" : "ghost"}
                  className="h-auto justify-start px-2 py-1.5 text-left"
                  onClick={() => void loadSelection(item.id)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectionId ? "Édition notification" : "Choisir une notification"}
          </CardTitle>
          <CardDescription>
            Variables dynamiques documentées dans le catalogue Resend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          {selectionId ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void save()} disabled={busy}>
                  Enregistrer
                </Button>
                <Button type="button" variant="secondary" onClick={() => void sendTest()} disabled={busy}>
                  Envoyer un test
                </Button>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>Objet</FieldLabel>
                  <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel>Texte</FieldLabel>
                  <div
                    ref={editorRef}
                    className="min-h-64 rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    onBlur={(event) => setBody(event.currentTarget.innerText)}
                  />
                </Field>
              </FieldGroup>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
