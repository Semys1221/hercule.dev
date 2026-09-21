import type {
  ClosingCommitLevel,
  ClosingFitLevel,
  DashboardClosingState,
} from "@/lib/legacy/dashboard/types";

export function normalizeRecoveryCycle(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(2, Math.floor(value)));
}

function parseClosingFitLevel(value: unknown): ClosingFitLevel | null {
  if (value === "fits" || value === "partial" || value === "mismatch") {
    return value;
  }
  return null;
}

function parseClosingCommitLevel(value: unknown): ClosingCommitLevel | null {
  if (value === "launch" || value === "hesitate") {
    return value;
  }
  return null;
}

export function emptyDashboardClosingState(): DashboardClosingState {
  return {
    fit: null,
    fitWhy: "",
    commit: null,
    serviceFits: null,
    serviceWhy: "",
    friction: "",
    recoveryCompleted: false,
    recoveryCycle: 0,
    finalCommitAccepted: false,
  };
}

export function parseDashboardClosing(raw: unknown): DashboardClosingState {
  const prev = (raw ?? {}) as Partial<DashboardClosingState>;
  const finalCommitAccepted = prev.finalCommitAccepted === true;
  const recoveryCycle = normalizeRecoveryCycle(prev.recoveryCycle);

  return {
    fit: parseClosingFitLevel(prev.fit),
    fitWhy: typeof prev.fitWhy === "string" ? prev.fitWhy : "",
    commit: parseClosingCommitLevel(prev.commit),
    serviceFits:
      typeof prev.serviceFits === "boolean" ? prev.serviceFits : null,
    serviceWhy: typeof prev.serviceWhy === "string" ? prev.serviceWhy : "",
    friction: typeof prev.friction === "string" ? prev.friction : "",
    recoveryCompleted:
      prev.recoveryCompleted === true || finalCommitAccepted === true,
    recoveryCycle,
    finalCommitAccepted,
  };
}

export function mergeDashboardClosing(
  existing: unknown,
  patch: Record<string, unknown>,
): DashboardClosingState {
  const prev = parseDashboardClosing(existing);
  const fit = parseClosingFitLevel(patch.fit);
  const commit = parseClosingCommitLevel(patch.commit);
  const recoveryCycle =
    patch.recoveryCycle !== undefined
      ? normalizeRecoveryCycle(patch.recoveryCycle)
      : prev.recoveryCycle;
  const finalCommitAccepted =
    patch.finalCommitAccepted === true
      ? true
      : prev.finalCommitAccepted;

  return {
    fit: fit ?? prev.fit,
    fitWhy:
      typeof patch.fitWhy === "string" ? patch.fitWhy : prev.fitWhy,
    commit: commit ?? prev.commit,
    serviceFits:
      typeof patch.serviceFits === "boolean"
        ? patch.serviceFits
        : prev.serviceFits,
    serviceWhy:
      typeof patch.serviceWhy === "string"
        ? patch.serviceWhy
        : prev.serviceWhy,
    friction:
      typeof patch.friction === "string" ? patch.friction : prev.friction,
    recoveryCycle,
    finalCommitAccepted,
    recoveryCompleted:
      patch.recoveryCompleted === true ||
      finalCommitAccepted ||
      prev.recoveryCompleted,
  };
}
