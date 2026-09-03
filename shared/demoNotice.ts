export const DEMO_NOTICE_DISMISSED_KEY = "fireguard.demo-notice.dismissed";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function isDemoNoticeDismissed(storage?: StorageLike) {
  try {
    return storage?.getItem(DEMO_NOTICE_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDemoNoticeDismissed(storage: StorageLike | undefined, dismissed: boolean) {
  try {
    if (dismissed) storage?.setItem(DEMO_NOTICE_DISMISSED_KEY, "true");
    else storage?.removeItem(DEMO_NOTICE_DISMISSED_KEY);
  } catch {
    // Browser storage may be unavailable or disabled; the in-memory UI state still updates.
  }
}
