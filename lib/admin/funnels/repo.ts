import {
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

import {
  DEFAULT_LAYOUT_ID,
} from "@/lib/admin/funnels/catalog";
import {
  type EditTicket,
  type FunnelDocument,
  type FunnelScope,
  type FunnelSummary,
  createEditTicketBodySchema,
  editTicketSchema,
  funnelDocumentSchema,
  funnelSlugSchema,
  publicPathForScope,
} from "@/lib/admin/funnels/schema";
import { designTokensForTicket } from "@/lib/admin/funnels/tokens";

function contentRoot(): string {
  return join(process.cwd(), "content", "funnels");
}

function assertSafeSegment(value: string, label: string): void {
  const parsed = funnelSlugSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${label}`);
  }
}

function scopeDirectory(scope: FunnelScope): string {
  assertSafeSegment(scope.audience, "audience");
  if (scope.kind === "onboarding") {
    return join(contentRoot(), scope.audience, "onboarding");
  }
  if (!scope.stage) {
    throw new Error("Vente funnel requires stage");
  }
  assertSafeSegment(scope.stage, "stage");
  return join(contentRoot(), scope.audience, "vente", scope.stage);
}

function funnelDirectory(scope: FunnelScope, slug: string): string {
  assertSafeSegment(slug, "slug");
  return join(scopeDirectory(scope), slug);
}

function funnelFilePath(scope: FunnelScope, slug: string): string {
  return join(funnelDirectory(scope, slug), "funnel.json");
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function nextDefaultDisplayName(scope: FunnelScope): Promise<string> {
  const dir = scopeDirectory(scope);
  await ensureDir(dir);

  let entries: string[] = [];
  try {
    entries = await readdir(dir, { withFileTypes: true })
      .then((items) => items.filter((item) => item.isDirectory()).map((item) => item.name));
  } catch {
    entries = [];
  }

  const pattern = /^my_funnel_(\d+)$/;
  let max = 0;
  for (const entry of entries) {
    const match = entry.match(pattern);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return `my_funnel_${max + 1}`;
}

function slugFromDisplayName(displayName: string): string {
  const normalized = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);

  const parsed = funnelSlugSchema.safeParse(normalized);
  if (parsed.success) {
    return parsed.data;
  }

  return `funnel_${Date.now()}`;
}

export async function listFunnels(scope: FunnelScope): Promise<FunnelSummary[]> {
  const dir = scopeDirectory(scope);
  await ensureDir(dir);

  let entries: string[] = [];
  try {
    entries = await readdir(dir, { withFileTypes: true })
      .then((items) => items.filter((item) => item.isDirectory()).map((item) => item.name));
  } catch {
    return [];
  }

  const summaries: FunnelSummary[] = [];
  for (const slug of entries) {
    try {
      const doc = await readFunnel(scope, slug);
      summaries.push({
        slug: doc.slug,
        displayName: doc.displayName,
        status: doc.status,
        updatedAt: doc.updatedAt,
        stepCount: doc.steps.length,
      });
    } catch {
      // skip invalid folders
    }
  }

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function readFunnel(scope: FunnelScope, slug: string): Promise<FunnelDocument> {
  const raw = await readFile(funnelFilePath(scope, slug), "utf8");
  return funnelDocumentSchema.parse(JSON.parse(raw));
}

export async function createFunnel(
  scope: FunnelScope,
  displayName?: string,
): Promise<FunnelDocument> {
  const name = displayName ?? (await nextDefaultDisplayName(scope));
  let slug = slugFromDisplayName(name);
  const dir = scopeDirectory(scope);
  await ensureDir(dir);

  let suffix = 1;
  while (true) {
    try {
      await readFunnel(scope, slug);
      slug = `${slugFromDisplayName(name)}_${suffix}`;
      suffix += 1;
    } catch {
      break;
    }
  }

  const now = new Date().toISOString();
  const doc: FunnelDocument = {
    schemaVersion: 1,
    slug,
    displayName: name,
    audience: scope.audience,
    kind: scope.kind,
    stage: scope.stage,
    status: "draft",
    layoutId: null,
    publicPath: publicPathForScope(scope),
    steps: [],
    createdAt: now,
    updatedAt: now,
  };

  const funnelDir = funnelDirectory(scope, slug);
  await ensureDir(funnelDir);
  await writeFile(funnelFilePath(scope, slug), `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  return doc;
}

export async function updateFunnel(
  scope: FunnelScope,
  slug: string,
  patch: Partial<
    Pick<FunnelDocument, "displayName" | "layoutId" | "steps" | "status">
  >,
): Promise<FunnelDocument> {
  const existing = await readFunnel(scope, slug);
  const updated: FunnelDocument = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const parsed = funnelDocumentSchema.parse(updated);
  await writeFile(funnelFilePath(scope, slug), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

export async function publishFunnel(scope: FunnelScope, slug: string): Promise<FunnelDocument> {
  const all = await listFunnels(scope);
  for (const summary of all) {
    if (summary.slug !== slug && summary.status === "published") {
      await updateFunnel(scope, summary.slug, { status: "draft" });
    }
  }

  return updateFunnel(scope, slug, { status: "published" });
}

export async function deleteFunnel(scope: FunnelScope, slug: string): Promise<void> {
  await readFunnel(scope, slug);
  await rm(funnelDirectory(scope, slug), { recursive: true, force: true });
}

export async function writeEditTicket(
  input: unknown,
): Promise<{ ticket: EditTicket; filePath: string }> {
  const body = createEditTicketBodySchema.parse(input);
  const scope: FunnelScope = {
    audience: body.audience,
    kind: body.kind,
    stage: body.stage ?? null,
  };

  await readFunnel(scope, body.funnelSlug).catch(() => {
    throw new Error("Funnel not found");
  });

  const now = new Date();
  const ticketId = `${now.toISOString().replace(/[:.]/g, "-")}_${body.funnelSlug}`;
  const subdir = body.ticketKind === "layout" ? "layouts" : "components";
  const relativePath = join("edits_to_make", subdir, `${ticketId}.json`);
  const absolutePath = join(contentRoot(), relativePath);

  await ensureDir(join(contentRoot(), "edits_to_make", subdir));

  const ticket: EditTicket = editTicketSchema.parse({
    schemaVersion: 1,
    id: ticketId,
    kind: body.ticketKind,
    status: "pending",
    createdAt: now.toISOString(),
    funnelRef: {
      audience: body.audience,
      kind: body.kind,
      stage: body.stage ?? null,
      slug: body.funnelSlug,
    },
    target: {
      componentPath: body.componentPath ?? null,
    },
    command: body.command,
    cursorImpact: body.cursorImpact,
    designTokens: designTokensForTicket(),
    constraints: [
      "Reuse project CSS variables from app/globals.css",
      "Use shadcn/ui components from components/ui",
      "Do not introduce a new visual language",
    ],
  });

  await writeFile(absolutePath, `${JSON.stringify(ticket, null, 2)}\n`, "utf8");
  return { ticket, filePath: relativePath };
}

export function defaultLayoutId(): string {
  return DEFAULT_LAYOUT_ID;
}
