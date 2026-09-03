/** Pure Fireguard Chat rules keep direct-conversation identity and inbox ordering deterministic. */
export function canonicalDirectKey(firstUserId: number, secondUserId: number) {
  if (firstUserId === secondUserId) throw new Error("A direct conversation needs two distinct operators.");
  return [firstUserId, secondUserId].sort((left, right) => left - right).join(":");
}

export type InboxSortCandidate = { pinnedAt: Date | null; updatedAt: Date };

export function compareChatInbox<T extends InboxSortCandidate>(left: T, right: T) {
  const leftPinned = Boolean(left.pinnedAt);
  const rightPinned = Boolean(right.pinnedAt);
  if (leftPinned !== rightPinned) return leftPinned ? -1 : 1;
  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

export function isMuted(mutedUntil: Date | null, now = new Date()) {
  return Boolean(mutedUntil && mutedUntil.getTime() > now.getTime());
}
