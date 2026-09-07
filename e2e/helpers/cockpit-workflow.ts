import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  assertEmailJobsForLead,
  assertTimelineFirstStepActive,
  assertTimelineLabel,
  getAgenceIdBySlug,
  getAgenceProductStatut,
  getEntrepriseIdBySlug,
  getEntrepriseProductStatut,
  getLatestMatchForAgence,
  getScheduledAppointmentsForAgence,
  pollAgenceProductStatut,
  TEST_AGENCE_EMAIL,
  TEST_AGENCE_SLUG,
  TEST_ENTREPRISE_ACME_SLUG,
} from "./supabase-assertions";
import {
  createScheduledAppointment,
} from "./cockpit-fixture";

const COCKPIT_PATH = `/internal/clients/agence/${TEST_AGENCE_SLUG}`;
const LIST_PATH = "/internal/funnels/agence/clients";
const DASHBOARD_PATH = `/dashboard/${TEST_AGENCE_SLUG}`;

export async function runClientsListSmoke(page: Page, request: APIRequestContext): Promise<void> {
  const [clientsRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/clients?category=agence") &&
        response.request().method() === "GET",
      { timeout: 90_000 },
    ),
    page.goto(LIST_PATH, { waitUntil: "domcontentloaded" }),
  ]);
  expect(clientsRes.ok()).toBeTruthy();

  const seedButton = page.getByRole("button", { name: "Charger données démo" });
  await expect(seedButton).toBeVisible({ timeout: 60_000 });
  await seedButton.scrollIntoViewIfNeeded();

  const [seedRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/clients/seed") && response.request().method() === "POST",
      { timeout: 90_000 },
    ),
    seedButton.click(),
  ]);
  expect(seedRes.ok()).toBeTruthy();

  await page.getByPlaceholder("Rechercher par email ou société…").fill(TEST_AGENCE_EMAIL);
  await expect(page.getByRole("cell", { name: new RegExp(TEST_AGENCE_EMAIL, "i") })).toBeVisible();
  await page
    .getByRole("cell", { name: new RegExp(`Agence Test Hercule|${TEST_AGENCE_EMAIL}`, "i") })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/internal/clients/agence/${TEST_AGENCE_SLUG}$`));
}

export async function runCockpitWorkflow(
  page: Page,
  request: APIRequestContext,
  options: { includeNoShow: boolean },
): Promise<void> {
  await page.goto(COCKPIT_PATH, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("tab", { name: "État" })).toBeVisible();

  // Match — options may load on first cockpit paint (all tabs mount)
  await page.getByRole("tab", { name: "Match" }).click();
  await page.getByRole("combobox").click();
  await expect(page.getByRole("option").first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole("option").filter({ hasText: /Acme/i }).first().click();
  const matchResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/matches") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Proposer le match" }).click();
  const matchRes = await matchResponse;
  expect(matchRes.ok()).toBeTruthy();

  const entrepriseId = await getEntrepriseIdBySlug(TEST_ENTREPRISE_ACME_SLUG);
  await assertEmailJobsForLead("entreprise", entrepriseId, [
    { emailType: "match_proposal", allowedStatuses: ["sent", "failed"] },
    { emailType: "match_proposal_followup", status: "pending" },
  ]);
  expect(await getEntrepriseProductStatut(TEST_ENTREPRISE_ACME_SLUG)).toBe("MATCH_PROPOSED");

  const agenceId = await getAgenceIdBySlug(TEST_AGENCE_SLUG);
  const match = await getLatestMatchForAgence(agenceId);
  await createScheduledAppointment(request, match.id);

  // Statut override (ops) — after match booking sets MEETING_BOOKED
  await page.getByRole("tab", { name: "Avancer statut" }).click();
  const statutResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/statut") && response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "RDV réservé" }).click();
  const statutRes = await statutResponse;
  expect(statutRes.ok()).toBeTruthy();
  await expect(page.getByText(/Statut → RDV réservé/i)).toBeVisible();

  // Deliverance
  await page.getByRole("tab", { name: "Délivrance" }).click();
  const searchResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/admin/deliverance/${match.id}`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Lancer la recherche" }).click();
  expect((await searchResponse).ok()).toBeTruthy();

  await assertEmailJobsForLead("agence", agenceId, [
    { emailType: "deliverance_search_started", allowedStatuses: ["sent", "failed"] },
    { emailType: "deliverance_d7_update", status: "pending" },
  ]);
  await assertTimelineFirstStepActive(TEST_AGENCE_SLUG);

  const milestoneResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/admin/deliverance/${match.id}`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Avancer l'étape" }).click();
  expect((await milestoneResponse).ok()).toBeTruthy();
  await assertEmailJobsForLead("agence", agenceId, [
    { emailType: "deliverance_milestone", allowedStatuses: ["sent", "failed"] },
  ]);

  const waitlistResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/admin/deliverance/${match.id}`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "File d'attente" }).click();
  expect((await waitlistResponse).ok()).toBeTruthy();
  await assertEmailJobsForLead("agence", agenceId, [
    { emailType: "deliverance_waitlist", allowedStatuses: ["sent", "failed"] },
  ]);

  // Dashboard timeline cross-check (DB — avoids flaky client render during E2E)
  await assertTimelineFirstStepActive(TEST_AGENCE_SLUG);

  // RDV — no-show first (dry), then complete on a fresh scheduled slot
  await page.reload();
  await page.getByRole("tab", { name: "RDV" }).click();

  if (options.includeNoShow) {
    const beforeNoShow = await getScheduledAppointmentsForAgence(agenceId);
    const noShowTarget = beforeNoShow.find((row) => row.status === "scheduled");
    expect(noShowTarget).toBeTruthy();

    const noShowResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/admin/appointments/${noShowTarget!.id}/no-show`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "No-show entreprise" }).first().click();
    expect((await noShowResponse).ok()).toBeTruthy();
    expect(await getAgenceProductStatut(TEST_AGENCE_SLUG)).toBe("IN_DELIVERANCE");

    await createScheduledAppointment(request, match.id);
    await page.reload();
    await page.getByRole("tab", { name: "RDV" }).click();
  }

  const appointments = await getScheduledAppointmentsForAgence(agenceId);
  const scheduled = appointments.find((row) => row.status === "scheduled");
  expect(scheduled).toBeTruthy();

  const completeResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/admin/appointments/${scheduled!.id}/complete`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "RDV effectué" }).first().click();
  expect((await completeResponse).ok()).toBeTruthy();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "POST_RDV_SURVEY");
  await assertEmailJobsForLead("agence", agenceId, [
    { emailType: "survey_rdv_agence", allowedStatuses: ["sent", "failed"] },
  ]);

  // Timeline edit
  await page.getByRole("tab", { name: "Timeline" }).click();
  const timelineLabel = `E2E timeline ${Date.now()}`;
  await page.locator('input[id^="timeline-label-"]').first().fill(timelineLabel);
  const timelineResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/timeline") && response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Enregistrer la timeline" }).click();
  expect((await timelineResponse).ok()).toBeTruthy();
  await assertTimelineLabel(TEST_AGENCE_SLUG, timelineLabel);

  // Manual email
  await page.getByRole("tab", { name: "Email" }).click();
  const emailResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/email") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Envoyer" }).click();
  expect((await emailResponse).ok()).toBeTruthy();
}

export async function submitAgenceSurvey(page: Page, agenceId: string): Promise<void> {
  const { getSurveyTokenForLatestCompletedAppointment } = await import("./supabase-assertions");
  const token = await getSurveyTokenForLatestCompletedAppointment(agenceId);
  await page.goto(`/survey/${token}`);
  await page.getByLabel("Oui").click();
  const surveyResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/survey/${token}`) && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Envoyer" }).click();
  expect((await surveyResponse).ok()).toBeTruthy();
  await expect(page.getByText("Merci, votre retour a bien été enregistré.")).toBeVisible();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");
}

export { COCKPIT_PATH, DASHBOARD_PATH, LIST_PATH };
