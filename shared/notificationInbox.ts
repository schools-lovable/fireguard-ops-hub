/** Presentation-safe notification helpers shared by the top-bar dropdown and its deterministic test coverage. */
export type NotificationPreview = {
  id: number;
  isRead: boolean;
  createdAt: Date;
};

export const notificationKinds = ["digest", "overdue", "assignment", "report", "presence", "learning"] as const;
export const notificationPriorities = ["high", "medium", "low"] as const;
export type NotificationKind = (typeof notificationKinds)[number];
export type NotificationPriority = (typeof notificationPriorities)[number];
export type NotificationSort = "newest" | "oldest" | "priority";

export type FilterableNotification = NotificationPreview & {
  kind: NotificationKind;
  priority: NotificationPriority;
};

const priorityWeight: Record<NotificationPriority, number> = { high: 3, medium: 2, low: 1 };

export function unreadNotificationCount<T extends NotificationPreview>(notifications: T[]) {
  return notifications.filter(notification => !notification.isRead).length;
}

export function recentNotifications<T extends NotificationPreview>(notifications: T[], limit = 4) {
  return [...notifications]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, limit);
}

export function filterNotifications<T extends FilterableNotification>(notifications: T[], filter: { kind: NotificationKind | "all"; priority: NotificationPriority | "all"; sort: NotificationSort }) {
  return notifications
    .filter(notification => (filter.kind === "all" || notification.kind === filter.kind) && (filter.priority === "all" || notification.priority === filter.priority))
    .sort((left, right) => {
      if (filter.sort === "oldest") return left.createdAt.getTime() - right.createdAt.getTime();
      if (filter.sort === "priority") return priorityWeight[right.priority] - priorityWeight[left.priority] || right.createdAt.getTime() - left.createdAt.getTime();
      return right.createdAt.getTime() - left.createdAt.getTime();
    });
}
