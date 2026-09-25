import type { QualificationRecord, QualificationUpsertPayload } from "./schema";

export async function fetchQualificationBySlug(
  slug: string,
  routeSegment: string,
): Promise<QualificationRecord | null> {
  const params = new URLSearchParams({ slug, routeSegment });
  const response = await fetch(
    `/api/booking/comptable-delivery/qualification?${params.toString()}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`qualification fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as { ok?: boolean; record?: QualificationRecord };
  if (!data.ok || !data.record) return null;
  return data.record;
}

export async function upsertQualification(
  payload: QualificationUpsertPayload,
): Promise<QualificationRecord | null> {
  const response = await fetch("/api/booking/comptable-delivery/qualification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`qualification upsert failed: ${response.status}`);
  }
  const data = (await response.json()) as { ok?: boolean; record?: QualificationRecord };
  if (!data.ok || !data.record) return null;
  return data.record;
}
