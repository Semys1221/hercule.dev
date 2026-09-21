export type HerculeStackUpdate = {
  bypass: boolean;
  replyAgent: boolean;
};

export type CampaignSwitchStats = {
  activeCampaignCount: number;
  pausedInstantly: string[];
  activatedInstantly: string | null;
  herculePaused: Record<string, HerculeStackUpdate>;
  herculeActivated: HerculeStackUpdate;
  errors: string[];
};

export type RestaurantSwitchResult =
  | {
      ok: true;
      skipped?: "already_ran" | "dry_run";
      runKey: string;
      stats: CampaignSwitchStats;
    }
  | {
      ok: false;
      runKey: string;
      stats: CampaignSwitchStats;
      error: string;
    };
