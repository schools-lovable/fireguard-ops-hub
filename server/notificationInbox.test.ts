import { describe, expect, it } from "vitest";
import { filterNotifications, recentNotifications, unreadNotificationCount } from "../shared/notificationInbox";

const notifications = [
  { id: 1, isRead: true, createdAt: new Date("2026-08-24T08:00:00Z") },
  { id: 2, isRead: false, createdAt: new Date("2026-08-24T10:00:00Z") },
  { id: 3, isRead: false, createdAt: new Date("2026-08-24T09:00:00Z") },
];

describe("notification inbox selectors", () => {
  it("counts only unread notifications for the top-bar badge", () => {
    expect(unreadNotificationCount(notifications)).toBe(2);
  });

  it("orders the limited dropdown preview newest first without mutating the source list", () => {
    expect(recentNotifications(notifications, 2).map(notification => notification.id)).toEqual([2, 3]);
    expect(notifications.map(notification => notification.id)).toEqual([1, 2, 3]);
  });

  it("filters by durable alert type or priority and can order critical alerts first", () => {
    const filterable = [
      { id: 1, isRead: false, kind: "learning" as const, priority: "low" as const, createdAt: new Date("2026-08-24T10:00:00Z") },
      { id: 2, isRead: false, kind: "assignment" as const, priority: "medium" as const, createdAt: new Date("2026-08-24T09:00:00Z") },
      { id: 3, isRead: false, kind: "overdue" as const, priority: "high" as const, createdAt: new Date("2026-08-24T08:00:00Z") },
    ];
    expect(filterNotifications(filterable, { kind: "overdue", priority: "all", sort: "newest" }).map(notification => notification.id)).toEqual([3]);
    expect(filterNotifications(filterable, { kind: "all", priority: "medium", sort: "newest" }).map(notification => notification.id)).toEqual([2]);
    expect(filterNotifications(filterable, { kind: "all", priority: "all", sort: "priority" }).map(notification => notification.id)).toEqual([3, 2, 1]);
  });
});
