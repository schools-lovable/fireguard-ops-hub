/** Deterministic lifecycle rules for short-lived FireGuard coordination threads. */
export const temporaryThreadDurations = [24, 48, 72, 168] as const;
export type TemporaryThreadDuration = (typeof temporaryThreadDurations)[number];

export function expiryFromHours(hours: number, now = new Date()) {
  if (!Number.isInteger(hours) || hours < 1 || hours > 168) throw new Error("Temporary threads can run from 1 to 168 hours.");
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

export function temporaryThreadConversationValues(input: { title: string; contextLabel: string; clientId?: number | null; durationHours: number }, createdByUserId: number, now = new Date()) {
  return {
    kind: "group" as const,
    title: input.title,
    contextLabel: input.contextLabel,
    clientId: input.clientId ?? null,
    isTemporary: true,
    expiresAt: expiryFromHours(input.durationHours, now),
    createdByUserId,
  };
}

export function isTemporaryThreadArchived(input: { isTemporary: boolean; expiresAt: Date | null; archivedAt: Date | null }, now = new Date()) {
  return Boolean(input.archivedAt) || (input.isTemporary && Boolean(input.expiresAt && input.expiresAt <= now));
}

export function extendedTemporaryThreadExpiry(expiresAt: Date | null, additionalHours: number, now = new Date()) {
  const base = expiresAt && expiresAt > now ? expiresAt : now;
  return expiryFromHours(additionalHours, base);
}

export function canControlTemporaryThread(input: { isTemporary: boolean; archivedAt: Date | null; createdByUserId: number }, userId: number) {
  return input.isTemporary && !input.archivedAt && input.createdByUserId === userId;
}
