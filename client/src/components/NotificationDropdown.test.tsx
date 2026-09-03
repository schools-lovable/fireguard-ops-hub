// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { NotificationDropdown } from "./NotificationDropdown";

const alerts = [
  { id: 8, kind: "overdue", title: "Overdue exception", body: "Riverside evidence needs an owner.", href: "/exceptions", isRead: false, createdAt: new Date("2026-08-24T10:00:00Z") },
  { id: 3, kind: "learning", title: "Academy learning", body: "A new course is ready.", href: "/academy", isRead: true, createdAt: new Date("2026-08-24T09:00:00Z") },
];

afterEach(cleanup);

function renderDropdown(onMarkRead = vi.fn()) {
  const location = memoryLocation({ path: "/", record: true });
  render(<Router hook={location.hook}><NotificationDropdown notifications={alerts} onMarkRead={onMarkRead} /></Router>);
  return { location, onMarkRead };
}

describe("NotificationDropdown", () => {
  it("opens from the notification control and dismisses through its explicit close action", async () => {
    const user = userEvent.setup();
    renderDropdown();
    await user.click(screen.getByRole("button", { name: "1 unread notifications" }));
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Dismiss notifications" }));
    expect(screen.queryByRole("heading", { name: "Notifications" })).toBeNull();
  });

  it("marks a preview item as read and sends See all to the full notification view", async () => {
    const user = userEvent.setup();
    const { location, onMarkRead } = renderDropdown();
    await user.click(screen.getByRole("button", { name: "1 unread notifications" }));
    await user.click(screen.getByRole("button", { name: "Mark read" }));
    expect(onMarkRead).toHaveBeenCalledWith(8);
    await user.click(screen.getByRole("link", { name: /See all notifications/i }));
    expect(location.history.at(-1)).toBe("/notifications");
  });
});
