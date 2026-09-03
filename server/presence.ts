/** FireGuard presence rules: an open, authenticated operations session is considered active for five minutes after its last heartbeat. */
export const PRESENCE_WINDOW_MS = 5 * 60 * 1000;

export function presenceCutoff(now = new Date()) {
  return new Date(now.getTime() - PRESENCE_WINDOW_MS);
}

export function isRecentlyActive(lastActiveAt: Date | null, now = new Date()) {
  return Boolean(lastActiveAt && lastActiveAt >= presenceCutoff(now));
}

export function managerWantsPresenceAlert(role: string, preferences: { alertFieldTeam: boolean; alertReviewers: boolean }) {
  return (role === "field" && preferences.alertFieldTeam) || (role === "reviewer" && preferences.alertReviewers);
}
