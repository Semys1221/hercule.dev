import { listEmails } from "./client";

import type { InstantlyEmailRecord } from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickLatest(items: InstantlyEmailRecord[]): InstantlyEmailRecord | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) => {
    const ta = a.timestamp_email ?? a.timestamp_created ?? "";
    const tb = b.timestamp_email ?? b.timestamp_created ?? "";
    return tb.localeCompare(ta);
  })[0] ?? null;
}

export type ResolvedThread = {
  replyToUuid: string;
  eaccount: string;
  subject?: string;
};

export async function resolveThreadForReply(
  apiKey: string,
  params: {
    leadEmail: string;
    campaignId: string;
    fallbackEaccount?: string;
    preferredEmailId?: string;
  },
): Promise<ResolvedThread | null> {
  if (params.preferredEmailId?.trim() && params.fallbackEaccount?.trim()) {
    return {
      replyToUuid: params.preferredEmailId.trim(),
      eaccount: params.fallbackEaccount.trim(),
    };
  }

  const attempts = 3;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const received = await listEmails(apiKey, {
      search: params.leadEmail,
      campaignId: params.campaignId,
      emailType: "received",
      latestOfThread: true,
      limit: 10,
    });
    const receivedPick = pickLatest(received);
    if (receivedPick?.id && receivedPick.eaccount) {
      return {
        replyToUuid: receivedPick.id,
        eaccount: receivedPick.eaccount,
        subject: receivedPick.subject,
      };
    }

    const sent = await listEmails(apiKey, {
      search: params.leadEmail,
      campaignId: params.campaignId,
      emailType: "sent",
      latestOfThread: true,
      limit: 10,
    });
    const sentPick = pickLatest(sent);
    if (sentPick?.id && sentPick.eaccount) {
      return {
        replyToUuid: sentPick.id,
        eaccount: sentPick.eaccount,
        subject: sentPick.subject,
      };
    }

    if (attempt < attempts - 1) {
      await sleep(3000);
    }
  }

  if (params.fallbackEaccount?.trim()) {
    const any = await listEmails(apiKey, {
      search: params.leadEmail,
      campaignId: params.campaignId,
      limit: 5,
    });
    const pick = pickLatest(any);
    if (pick?.id) {
      return {
        replyToUuid: pick.id,
        eaccount: pick.eaccount ?? params.fallbackEaccount.trim(),
        subject: pick.subject,
      };
    }
  }

  return null;
}

export async function leadHasRepliedSince(
  apiKey: string,
  leadEmail: string,
  sinceIso: string,
): Promise<boolean> {
  const received = await listEmails(apiKey, {
    search: leadEmail,
    emailType: "received",
    limit: 20,
  });

  return received.some((item) => {
    const ts = item.timestamp_email ?? item.timestamp_created;
    return Boolean(ts && ts > sinceIso);
  });
}
