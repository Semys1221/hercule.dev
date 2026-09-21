import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock supabase ────────────────────────────────────────────────────────────
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockUpdateEq = vi.fn(() => ({}));

vi.mock("@/lib/legacy/link-tracking/supabase", () => ({
  createLinkTrackingClient: () => ({
    from: () => ({
      select: mockSelect,
      update: mockUpdate,
    }),
  }),
}));

// ─── Mock product-send ────────────────────────────────────────────────────────
const mockSendProductEmailNow = vi.fn();
const mockScheduleLeadEmailJobs = vi.fn();

vi.mock("@/lib/legacy/booking-communication/product-send", () => ({
  sendProductEmailNow: (...args: unknown[]) => mockSendProductEmailNow(...args),
  scheduleLeadEmailJobs: (...args: unknown[]) => mockScheduleLeadEmailJobs(...args),
}));

// ─── Mock hooks ───────────────────────────────────────────────────────────────
vi.mock("@/lib/legacy/admin/management/recipients/hooks", () => ({
  syncClientSequenceStarted: vi.fn(),
}));

// ─── Mock urls ────────────────────────────────────────────────────────────────
vi.mock("@/lib/legacy/link-tracking/urls", () => ({
  dashboardLinkFor: () => "https://www.hercule.dev/dashboard/abc",
}));

import { startPropositionLudovicSequence } from "./orchestrator";

const SAMPLE_LEAD = {
  id: "lead-123",
  email: "ludovic@example.com",
  slug: "example-slug",
  first_name: "Ludovic",
  company: "Cabinet Ludovic",
  profile: {},
  retraction_ends_at: null,
};

const SAMPLE_PAYMENT = {
  offerId: "formule-test-15",
  offerLabel: "Formule Test — 15 profils",
  profileVolume: 15,
  amountLabel: "1 489 € / mois",
};

describe("startPropositionLudovicSequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: SAMPLE_LEAD, error: null });
    mockSendProductEmailNow.mockResolvedValue({ ok: true });
    mockScheduleLeadEmailJobs.mockResolvedValue({ inserted: 3 });
    mockUpdate.mockReturnValue({ eq: mockUpdateEq });
    mockUpdateEq.mockResolvedValue({});
  });

  it("throws if lead is not found", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(
      startPropositionLudovicSequence({
        leadId: "missing",
        paymentAt: new Date(),
        stripeCheckoutSessionId: "cs_test_abc",
        payment: SAMPLE_PAYMENT,
      }),
    ).rejects.toThrow("lead_not_found");
  });

  it("sends welcome email immediately with correct type", async () => {
    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    expect(mockSendProductEmailNow).toHaveBeenCalledWith(
      expect.objectContaining({
        emailType: "proposition_ludovic_welcome",
        category: "comptable",
        idempotencyKey: "proposition-ludovic:cs_test_abc:welcome",
      }),
    );
  });

  it("passes profileVolume, offerLabel, amountLabel as extras to welcome email", async () => {
    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    expect(mockSendProductEmailNow).toHaveBeenCalledWith(
      expect.objectContaining({
        extra: expect.objectContaining({
          profileVolume: "15",
          offerLabel: "Formule Test — 15 profils",
          amountLabel: "1 489 € / mois",
        }),
      }),
    );
  });

  it("schedules 3 follow-up jobs (E2 +24h, E3 +48h, E4 +5j)", async () => {
    const paymentAt = new Date("2026-09-18T10:00:00Z");

    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt,
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    expect(mockScheduleLeadEmailJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        jobs: expect.arrayContaining([
          expect.objectContaining({
            emailType: "proposition_ludovic_config_ready",
            scheduledFor: new Date(paymentAt.getTime() + 24 * 60 * 60 * 1000),
            idempotencyKey: "proposition-ludovic:cs_test_abc:config_ready",
          }),
          expect.objectContaining({
            emailType: "proposition_ludovic_rdv_reminder",
            scheduledFor: new Date(paymentAt.getTime() + 48 * 60 * 60 * 1000),
            idempotencyKey: "proposition-ludovic:cs_test_abc:rdv_reminder",
          }),
          expect.objectContaining({
            emailType: "proposition_ludovic_rdv_final",
            scheduledFor: new Date(paymentAt.getTime() + 5 * 24 * 60 * 60 * 1000),
            idempotencyKey: "proposition-ludovic:cs_test_abc:rdv_final",
          }),
        ]),
      }),
    );
  });

  it("sets estimatedFirstRdvAt to J+20 (not J+25)", async () => {
    const paymentAt = new Date("2026-09-18T10:00:00Z");

    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt,
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    const expectedJ20 = new Date(paymentAt.getTime() + 20 * 24 * 60 * 60 * 1000);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          estimated_first_booking_at: expectedJ20.toISOString(),
        }),
      }),
    );
  });

  it("persists proposition_payment with slug, offerId, profileVolume, amountLabel", async () => {
    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          proposition_payment: {
            slug: "ludovic",
            offerId: "formule-test-15",
            offerLabel: "Formule Test — 15 profils",
            profileVolume: 15,
            amountLabel: "1 489 € / mois",
          },
        }),
      }),
    );
  });

  it("uses proposition-ludovic idempotency prefix", async () => {
    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_XYZ",
      payment: SAMPLE_PAYMENT,
    });

    const callArgs = mockSendProductEmailNow.mock.calls[0][0];
    expect(callArgs.idempotencyKey).toBe("proposition-ludovic:cs_test_XYZ:welcome");
  });

  it("uses triggered_by=proposition_ludovic_sequence for scheduled jobs", async () => {
    await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    expect(mockScheduleLeadEmailJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        triggeredBy: "proposition_ludovic_sequence",
      }),
    );
  });

  it("returns welcomeSent=true and scheduledJobs=3 on success", async () => {
    const result = await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_abc",
      payment: SAMPLE_PAYMENT,
    });

    expect(result).toEqual({ welcomeSent: true, scheduledJobs: 3 });
  });

  it("works for formule-croissance-45 with volume=45", async () => {
    const result = await startPropositionLudovicSequence({
      leadId: "lead-123",
      paymentAt: new Date("2026-09-18T10:00:00Z"),
      stripeCheckoutSessionId: "cs_test_abc",
      payment: {
        offerId: "formule-croissance-45",
        offerLabel: "Formule Croissance — 45 profils",
        profileVolume: 45,
        amountLabel: "2 500 € / mois",
      },
    });

    expect(result.welcomeSent).toBe(true);
    expect(mockSendProductEmailNow).toHaveBeenCalledWith(
      expect.objectContaining({
        extra: expect.objectContaining({
          profileVolume: "45",
          offerLabel: "Formule Croissance — 45 profils",
        }),
      }),
    );
  });
});
