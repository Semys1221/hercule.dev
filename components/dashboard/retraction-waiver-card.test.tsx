import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DashboardData } from "@/lib/dashboard/types";

import { RetractionWaiverCard } from "./retraction-waiver-card";

const baseData: DashboardData = {
  slug: "seed-test",
  email: "test@example.com",
  firstName: "Test",
  company: "Test Co",
  statut: "CONFIRMED",
  productStatut: "PAID_PENDING_ONBOARDING",
  scheduledAt: null,
  dashboardLink: null,
  timeline: [],
  onboardingCompleted: true,
  tieDownAccepted: true,
  form: {},
  faq: [],
  isPaid: true,
  dashboardMode: "dashboard_active",
  audience: "agence",
  deliveryPlan: null,
  enterpriseBrief: null,
  retraction: {
    status: "pending",
    endsAt: "2099-01-01T00:00:00.000Z",
    waivedAt: null,
    canWaive: true,
    activationAt: "2099-01-01T00:00:00.000Z",
    firstContratWorkingDays: 11,
  },
};

describe("RetractionWaiverCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders only when canWaive", () => {
    const { container } = render(
      <RetractionWaiverCard
        data={{ ...baseData, retraction: { ...baseData.retraction!, canWaive: false } }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("submits waiveRetraction PATCH", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RetractionWaiverCard data={baseData} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Démarrer maintenant" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dashboard/seed-test",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ waiveRetraction: true }),
        }),
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
