const CALENDLY_API_BASE = "https://api.calendly.com";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function publicWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl && appUrl.startsWith("https://") && !appUrl.includes("localhost")) {
    return `${appUrl}/api/webhooks/calendly`;
  }
  return "https://www.hercule.dev/api/webhooks/calendly";
}

async function calendlyFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${CALENDLY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    throw new Error(
      `Calendly ${response.status} on ${path}: ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );
  }
  return data as T;
}

type WebhookItem = {
  uri?: string;
  callback_url?: string;
  events?: string[];
  state?: string;
};

async function main(): Promise<void> {
  const token = requireEnv("CALENDLY_API_TOKEN");
  const url = publicWebhookUrl();

  const me = await calendlyFetch<{
    resource?: { uri?: string; current_organization?: string };
  }>(token, "/users/me");
  const organization = me.resource?.current_organization?.trim();
  const userUri = me.resource?.uri?.trim();
  if (!organization && !userUri) {
    throw new Error("Calendly /users/me returned no organization or user URI");
  }

  const listPath = organization
    ? `/webhook_subscriptions?organization=${encodeURIComponent(organization)}&scope=organization&count=100`
    : `/webhook_subscriptions?user=${encodeURIComponent(userUri ?? "")}&scope=user&count=100`;

  const existing = await calendlyFetch<{ collection?: WebhookItem[] }>(
    token,
    listPath,
  );

  const already = (existing.collection ?? []).find((item) => {
    const callback = (item.callback_url ?? "").replace(/\/$/, "");
    const events = item.events ?? [];
    return (
      callback === url.replace(/\/$/, "") &&
      events.includes("invitee.created") &&
      item.state !== "disabled"
    );
  });

  if (already) {
    console.log(`Webhook already registered: ${already.uri ?? url}`);
    return;
  }

  const body: Record<string, unknown> = {
    url,
    events: ["invitee.created"],
    signing_key: process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() || undefined,
  };
  if (organization) {
    body.organization = organization;
    body.scope = "organization";
  } else {
    body.user = userUri;
    body.scope = "user";
  }

  const created = await calendlyFetch<{ resource?: { uri?: string } }>(
    token,
    "/webhook_subscriptions",
    { method: "POST", body: JSON.stringify(body) },
  );
  console.log(`Registered Calendly webhook ${created.resource?.uri ?? ""} → ${url}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
