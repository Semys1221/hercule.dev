import { renewGmailWatchIfNeeded } from "./renew-watch";
import { syncGmailIncremental } from "./sync-incremental";

export async function runClientInboxSync() {
  const sync = await syncGmailIncremental();
  const watch = await renewGmailWatchIfNeeded();
  return { sync, watch };
}
