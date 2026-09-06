/** Unit tests for Calendly organization seat status parsing. */

import assert from "node:assert/strict";

import { getCalendlySeatStatus } from "@/lib/calendly/org";

const originalFetch = globalThis.fetch;

async function withMockFetch(
  handler: (url: string) => Promise<Response>,
  run: () => Promise<void>,
): Promise<void> {
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    return handler(url);
  };
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main(): Promise<void> {
  process.env.CALENDLY_API_TOKEN = "test-token";

  await withMockFetch(async (url) => {
    if (url.endsWith("/users/me")) {
      return new Response(
        JSON.stringify({
          resource: {
            current_organization: "https://api.calendly.com/organizations/ORG123",
          },
        }),
        { status: 200 },
      );
    }
    if (url.includes("/organization_memberships")) {
      return new Response(JSON.stringify({ collection: [] }), { status: 200 });
    }
    if (url.includes("/organizations/ORG123/invitations")) {
      return new Response(
        JSON.stringify({
          collection: [{ status: "pending", email: "client@example.com" }],
        }),
        { status: 200 },
      );
    }
    return new Response("not found", { status: 404 });
  }, async () => {
    const status = await getCalendlySeatStatus("client@example.com");
    assert.equal(status.isMember, false);
    assert.equal(status.invitationStatus, "pending");
  });

  await withMockFetch(async (url) => {
    if (url.endsWith("/users/me")) {
      return new Response(
        JSON.stringify({
          resource: {
            current_organization: "https://api.calendly.com/organizations/ORG123",
          },
        }),
        { status: 200 },
      );
    }
    if (url.includes("/organization_memberships")) {
      return new Response(
        JSON.stringify({
          collection: [{ user: "https://api.calendly.com/users/USER1" }],
        }),
        { status: 200 },
      );
    }
    return new Response(JSON.stringify({ collection: [] }), { status: 200 });
  }, async () => {
    const status = await getCalendlySeatStatus("member@example.com");
    assert.equal(status.isMember, true);
    assert.equal(status.invitationStatus, "accepted");
  });

  console.log("OK calendly org seat status tests");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
