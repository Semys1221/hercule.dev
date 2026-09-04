/**
 * Dry-run + fake-lead checks for slug / full-link provisioning.
 *
 * Usage:
 *   pnpm smoke-link-provisioning-e2e
 *   pnpm smoke-link-provisioning-e2e -- --keep
 *   pnpm smoke-link-provisioning-e2e -- --no-email
 *
 * Optional env:
 *   TEST_LEAD_EMAIL          inbox for Resend email 2 (default nanguy29@gmail.com)
 *   INSTANTLY_TEST_LEAD_ID   real Instantly lead to PATCH/GET (wipe + canonical vars)
 *   LINK_PAGES_BASE_URL      HTML pages (default https://www.hercule.dev)
 *   CRM_BACKEND_URL          click/confirm API (default http://localhost:3000)
 */
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { buildLeadUrls, buildInstantlyCustomVariables } from "@/lib/link-tracking/urls";
import { DEFAULT_BOOKING_EMAIL_TEMPLATES, renderTemplate } from "@/lib/booking-communication/templates";

const SITE_BASE =
  process.env.LINK_PAGES_BASE_URL?.trim().replace(/\/$/, "") ||
  "https://www.hercule.dev";
const TEST_TO =
  process.env.TEST_LEAD_EMAIL?.trim() || "nanguy29@gmail.com";
const KEEP = process.argv.includes("--keep");
const NO_EMAIL = process.argv.includes("--no-email");

async function resolveApiBase(): Promise<string> {
  const configured =
    process.env.CRM_BACKEND_URL?.trim().replace(/\/$/, "") || "";
  const candidates = [
    "http://localhost:3000",
    configured,
    "https://www.hercule.dev",
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/api/link-tracking/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "__probe__" }),
        signal: AbortSignal.timeout(4000),
      });
      const raw = await response.text();
      let json: { ok?: boolean; reason?: string; error?: string } | null = null;
      try {
        json = JSON.parse(raw) as { ok?: boolean; reason?: string; error?: string };
      } catch {
        continue;
      }
      if (
        json &&
        (json.reason === "not_found" ||
          json.error === "slug required" ||
          json.ok === false ||
          response.status === 404)
      ) {
        return base;
      }
    } catch {
      // try next
    }
  }
  throw new Error(
    `No CRM API found. Start \`pnpm dev\` or set CRM_BACKEND_URL. Tried: ${candidates.join(", ")}`,
  );
}

const DEPRECATED_KEYS = ["link", "confirm_link", "tracking_url"];
const CANONICAL_KEYS = [
  "reservation_agence_link",
  "reservation_entreprise_link",
  "confirmation_agence_link",
  "statut",
] as const;

function randomSlug(prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}${suffix}`;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function dryRunUrls(): void {
  const slug = "abc123";
  const email = "jean@example.com";
  const urls = buildLeadUrls(slug, email);
  const vars = buildInstantlyCustomVariables(slug, email, "NOTBOOKED");

  assert(
    urls.reservation_agence_link ===
      `https://www.hercule.dev/reservation.html/${slug}`,
    `reservation_agence_link mismatch: ${urls.reservation_agence_link}`,
  );
  assert(
    urls.reservation_entreprise_link ===
      `https://www.hercule.dev/reservation-entreprise.html/${slug}`,
    `reservation_entreprise_link mismatch: ${urls.reservation_entreprise_link}`,
  );
  assert(
    urls.confirmation_agence_link.includes("/confirm-reservation.html/") &&
      urls.confirmation_agence_link.includes("email="),
    `confirmation_agence_link mismatch: ${urls.confirmation_agence_link}`,
  );
  assert(
    !urls.confirmation_agence_link.includes("/reservation.html/"),
    "confirmation URL must not use reservation.html",
  );

  for (const key of CANONICAL_KEYS) {
    assert(key in vars, `missing Instantly canonical key ${key}`);
  }
  for (const key of DEPRECATED_KEYS) {
    assert(!vars[key as keyof typeof vars], `deprecated Instantly key not cleared: ${key}`);
  }

  const h48 = renderTemplate(DEFAULT_BOOKING_EMAIL_TEMPLATES.h48_confirm.body, {
    firstNameLine: "Jean,",
    confirmation_agence_link: urls.confirmation_agence_link,
    confirmUrl: urls.confirmation_agence_link,
  });
  assert(
    h48.includes("confirm-reservation.html"),
    "email 2 body must contain confirmation_agence_link",
  );
  assert(
    !h48.includes("/reservation.html/") &&
      !h48.includes("reservation-entreprise.html"),
    "email 2 body must not contain booking reservation URLs",
  );

  const immediate = renderTemplate(DEFAULT_BOOKING_EMAIL_TEMPLATES.immediate.body, {
    firstNameLine: "Bonjour Jean,",
    date: "mercredi 10 septembre 2026",
    heure: "09:00",
  });
  assert(
    !immediate.includes("confirm-reservation.html"),
    "email 1 immediate must not include a confirm link",
  );

  console.log("OK dry-run: URL builders + Instantly payload + Resend email 2 mapping");
  console.log(`  reservation_agence_link      ${urls.reservation_agence_link}`);
  console.log(`  reservation_entreprise_link  ${urls.reservation_entreprise_link}`);
  console.log(`  confirmation_agence_link     ${urls.confirmation_agence_link}`);
}

async function getPage(path: string): Promise<number> {
  const response = await fetch(`${SITE_BASE}${path}`, { redirect: "follow" });
  return response.status;
}

async function postJson(
  apiBase: string,
  path: string,
  body: Record<string, string>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Non-JSON from ${apiBase}${path}: ${raw.slice(0, 200)}`);
  }
  return { status: response.status, json };
}

async function sendResendEmail2(confirmUrl: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log("SKIP Resend live: RESEND_API_KEY not set");
    return null;
  }
  const from =
    process.env.BOOKING_RESEND_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Hercule <contact@hercule.dev>";
  const subject = "[TEST agence] Confirmation requise — smoke link provisioning";
  const text = renderTemplate(DEFAULT_BOOKING_EMAIL_TEMPLATES.h48_confirm.body, {
    firstNameLine: "Smoke,",
    confirmation_agence_link: confirmUrl,
    confirmUrl,
  });
  assert(text.includes(confirmUrl), "rendered email 2 missing confirmation_agence_link");
  assert(
    !text.includes("/reservation.html/"),
    "rendered email 2 leaked reservation.html",
  );

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [TEST_TO],
      subject,
      text,
    }),
  });
  const data = (await response.json()) as { id?: string; message?: string };
  if (!response.ok) {
    throw new Error(`Resend HTTP ${response.status}: ${data.message ?? JSON.stringify(data)}`);
  }
  console.log(`OK Resend: email 2 sent to ${TEST_TO} id=${data.id ?? "?"}`);
  return data.id ?? null;
}

async function verifyInstantlyReplace(
  slug: string,
  email: string,
  instantlyLeadId?: string | null,
  statut = "NOTBOOKED",
): Promise<void> {
  const apiKey = process.env.INSTANTLY_API_KEY?.trim();
  const leadId =
    process.env.INSTANTLY_TEST_LEAD_ID?.trim() || instantlyLeadId?.trim() || "";
  if (!apiKey || !leadId) {
    console.log(
      "SKIP Instantly live: no INSTANTLY_API_KEY / instantly_lead_id available",
    );
    return;
  }

  const payload = buildInstantlyCustomVariables(slug, email, statut);
  const patch = await fetch(`https://api.instantly.ai/api/v2/leads/${leadId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ custom_variables: payload }),
  });
  if (!patch.ok) {
    throw new Error(`Instantly PATCH HTTP ${patch.status}: ${await patch.text()}`);
  }

  const get = await fetch(`https://api.instantly.ai/api/v2/leads/${leadId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!get.ok) {
    throw new Error(`Instantly GET HTTP ${get.status}: ${await get.text()}`);
  }
  const lead = (await get.json()) as {
    payload?: Record<string, unknown>;
    custom_variables?: Record<string, unknown>;
  };
  const vars = { ...(lead.payload ?? {}), ...(lead.custom_variables ?? {}) };

  for (const key of CANONICAL_KEYS) {
    assert(vars[key], `Instantly missing ${key} after REPLACE`);
  }
  for (const key of DEPRECATED_KEYS) {
    const value = vars[key];
    assert(
      value === undefined || value === null || value === "",
      `Instantly still has deprecated ${key}=${String(value)}`,
    );
  }
  console.log("OK Instantly: canonical vars present, legacy link/confirm_link wiped");
}

async function main(): Promise<void> {
  dryRunUrls();

  const apiBase = await resolveApiBase();
  console.log(`OK api: using ${apiBase}`);

  const client = createLinkTrackingClient();
  const timestamp = Date.now();
  const agenceEmail = `fake-agence-${timestamp}@hercule.dev`;
  const entrepriseEmail = `fake-entreprise-${timestamp}@hercule.dev`;
  const agenceSlug = randomSlug("fka");
  const entrepriseSlug = randomSlug("fke");
  const ids: Array<{ table: "agence" | "entreprise"; id: string }> = [];

  try {
    const agenceUrls = buildLeadUrls(agenceSlug, agenceEmail);
    const entrepriseUrls = buildLeadUrls(entrepriseSlug, entrepriseEmail);

    const { data: agence, error: agenceError } = await client
      .from("agence")
      .insert({
        email: agenceEmail,
        slug: agenceSlug,
        statut: "NOTBOOKED",
        first_name: "Fake",
        company: "Smoke Agence",
        ...agenceUrls,
      })
      .select("id, slug, reservation_agence_link, confirmation_agence_link")
      .single();
    if (agenceError || !agence) {
      throw new Error(`Failed to insert fake agence: ${agenceError?.message}`);
    }
    ids.push({ table: "agence", id: agence.id });

    const { data: entreprise, error: entrepriseError } = await client
      .from("entreprise")
      .insert({
        email: entrepriseEmail,
        slug: entrepriseSlug,
        statut: "NOTBOOKED",
        first_name: "Fake",
        company: "Smoke Entreprise",
        ...entrepriseUrls,
      })
      .select("id, slug, reservation_entreprise_link")
      .single();
    if (entrepriseError || !entreprise) {
      throw new Error(`Failed to insert fake entreprise: ${entrepriseError?.message}`);
    }
    ids.push({ table: "entreprise", id: entreprise.id });

    console.log(
      `OK supabase insert: agence ${agenceSlug} · entreprise ${entrepriseSlug}`,
    );

    const pages = [
      `/reservation.html/${agenceSlug}`,
      `/reservation-entreprise.html/${entrepriseSlug}`,
      `/confirm-reservation.html/${agenceSlug}?email=${encodeURIComponent(agenceEmail)}`,
    ];
    for (const path of pages) {
      const status = await getPage(path);
      assert(status === 200, `GET ${SITE_BASE}${path} returned ${status}`);
    }
    console.log("OK pages: all 3 booking/confirm URLs returned 200");

    const click = await postJson(apiBase, "/api/link-tracking/click", { slug: agenceSlug });
    assert(click.status === 200 && click.json.ok === true, `click failed: ${JSON.stringify(click)}`);
    const { data: afterClick, error: afterClickError } = await client
      .from("agence")
      .select("statut")
      .eq("id", agence.id)
      .single();
    if (afterClickError || afterClick?.statut !== "CLICKED") {
      throw new Error(
        `Expected CLICKED, got ${JSON.stringify(afterClick)} (${afterClickError?.message})`,
      );
    }
    console.log("OK tracking: click API set statut=CLICKED");

    const { error: bookError } = await client
      .from("agence")
      .update({
        statut: "MEETING_BOOKED",
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", agence.id);
    if (bookError) {
      throw new Error(`Failed to mark MEETING_BOOKED: ${bookError.message}`);
    }

    const confirm = await postJson(apiBase, "/api/link-tracking/confirm", {
      slug: agenceSlug,
      email: agenceEmail,
    });
    assert(
      confirm.status === 200 && confirm.json.statut === "CONFIRMED",
      `confirm failed: ${JSON.stringify(confirm)}`,
    );
    console.log("OK tracking: confirm API set statut=CONFIRMED");

    const { data: instantlySample } = await client
      .from("agence")
      .select("slug, email, instantly_lead_id, statut")
      .not("instantly_lead_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (instantlySample?.instantly_lead_id && instantlySample.slug) {
      await verifyInstantlyReplace(
        instantlySample.slug,
        instantlySample.email,
        instantlySample.instantly_lead_id,
        instantlySample.statut || "NOTBOOKED",
      );
    } else {
      console.log("SKIP Instantly live: no agence lead with instantly_lead_id");
    }

    if (NO_EMAIL) {
      console.log("SKIP Resend live: --no-email");
    } else {
      await sendResendEmail2(agenceUrls.confirmation_agence_link);
    }

    console.log("All link provisioning checks passed.");
  } finally {
    if (KEEP) {
      console.log(`KEEP fake leads: ${ids.map((row) => `${row.table}:${row.id}`).join(", ")}`);
      return;
    }
    for (const row of ids) {
      const { error } = await client.from(row.table).delete().eq("id", row.id);
      if (error) console.warn(`Cleanup warning ${row.table}: ${error.message}`);
    }
    if (ids.length) console.log(`OK cleanup: removed ${ids.length} fake lead(s)`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
