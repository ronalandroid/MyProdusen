import type { SubmitOutcome } from '@/lib/attendance/submit-attendance';

/**
 * Decide whether a failed online submit should fall back to the offline queue.
 *
 * Only genuine "the request never reached a server" failures qualify — those
 * surface as status 0 from submit-attendance (offline short-circuit, network
 * error, or timeout-abort). A server that answered with a 4xx/5xx made a real
 * decision (validation, outside-radius, late-reason-required, auth, server
 * bug) and must be shown to the user, NOT silently queued: queuing a rejected
 * submit would replay the same rejection on sync and mislead the employee into
 * thinking they clocked in.
 */
export function shouldQueueOffline(outcome: SubmitOutcome<unknown>): boolean {
  return outcome.ok === false && outcome.status === 0;
}
