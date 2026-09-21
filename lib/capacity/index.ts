/**
 * SaaS autonome — capacity control plane.
 *
 * Pool router + sequence scheduler + SLA over existing Instantly / link-tracking pipeline.
 */

export {
  SAAS_CAPACITY,
  SAAS_NICHES,
  SAAS_OFFER_TYPE,
  SAAS_NICHE_PRESETS,
  DEFAULT_NICHE_PREFERENCES,
  currentMonthKey,
  totalInboxFleet,
  type SaasNiche,
} from "./constants";

export type {
  ProspectPoolStatus,
  CapacityStatus,
  InboxStatus,
  InboxQueueStatus,
  SequenceState,
  ProspectPoolRow,
  ClientOutreachSlot,
  InboxPoolRow,
  InboxProvisionQueueRow,
  LeadAssignment,
  PoolRouterRunResult,
  SequenceSchedulerResult,
  CapacitySlaSnapshot,
} from "./types";

export {
  computeCapacitySla,
  estimateActivationAt,
  buildProfileCapacityBlock,
} from "./compute-sla";

export { runPoolRouter } from "./pool-router";
export { runSequenceScheduler } from "./sequence-scheduler";

export {
  syncSaasAssignmentOnBooking,
  resolveSlotByCampaignId,
} from "./pipeline-bridge";

export {
  createCapacityClient,
  listActiveSlotsNeedingLeads,
  fetchAvailableProspects,
  countPoolByNiche,
  createClientSlotForAgence,
  listInboxQueue,
  listSlots,
  listRecentRouterRuns,
  listInboxesForSlot,
  findAssignmentByInstantlyLead,
  markAssignmentBooked,
} from "./supabase";
