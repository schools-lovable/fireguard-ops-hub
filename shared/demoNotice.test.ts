import { describe, expect, it } from "vitest";
import { DEMO_NOTICE_DISMISSED_KEY, isDemoNoticeDismissed, setDemoNoticeDismissed } from "./demoNotice";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("demo notice preference", () => {
  it("persists and restores the dismissal preference", () => {
    const storage = createStorage();

    expect(isDemoNoticeDismissed(storage)).toBe(false);
    setDemoNoticeDismissed(storage, true);
    expect(storage.getItem(DEMO_NOTICE_DISMISSED_KEY)).toBe("true");
    expect(isDemoNoticeDismissed(storage)).toBe(true);

    setDemoNoticeDismissed(storage, false);
    expect(isDemoNoticeDismissed(storage)).toBe(false);
  });
});
