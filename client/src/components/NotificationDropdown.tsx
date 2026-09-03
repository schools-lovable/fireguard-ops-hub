import React, { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Link } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { recentNotifications, unreadNotificationCount } from "@shared/notificationInbox";

export type NotificationDropdownItem = {
  id: number;
  kind: string;
  title: string;
  body: string;
  href: string;
  isRead: boolean;
  createdAt: Date;
};

type NotificationDropdownProps = {
  notifications: NotificationDropdownItem[];
  isLoading?: boolean;
  error?: { message: string } | null;
  isMarkingRead?: boolean;
  isCurrentPage?: boolean;
  onMarkRead: (id: number) => void;
};

/** Accessible, click-dismissible alert preview that links to the durable notification centre. */
export function NotificationDropdown({
  notifications,
  isLoading = false,
  error = null,
  isMarkingRead = false,
  isCurrentPage = false,
  onMarkRead,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const unreadNotifications = unreadNotificationCount(notifications);
  const notificationPreview = recentNotifications(notifications);
  const dismiss = () => setOpen(false);

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" className={`icon-button notification-trigger ${open || isCurrentPage ? "is-active" : ""}`} aria-label={unreadNotifications ? `${unreadNotifications} unread notifications` : "Notifications"} title={unreadNotifications ? `${unreadNotifications} unread notifications` : "Notifications"}>
        <Bell size={16} />
        {unreadNotifications > 0 && <span className="notification-badge" aria-hidden="true">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={10} className="notification-popover">
      <div className="notification-popover-header">
        <div><span className="soft-label">Exception centre</span><h2>Notifications</h2></div>
        <div>{unreadNotifications > 0 && <span className="notification-unread-label">{unreadNotifications} new</span>}<button type="button" className="notification-close" onClick={dismiss} aria-label="Dismiss notifications"><X size={15} /></button></div>
      </div>
      <div className="notification-preview-list" aria-live="polite">
        {isLoading && <p className="notification-popover-state">Loading notifications…</p>}
        {error && <p className="notification-popover-state is-error">Notifications are temporarily unavailable.</p>}
        {!isLoading && !error && notificationPreview.length === 0 && <p className="notification-popover-state">You are up to date. New exception and operations alerts will appear here.</p>}
        {notificationPreview.map(notification => <div className={`notification-preview ${notification.isRead ? "" : "is-unread"}`} key={notification.id}>
          <Link href={notification.href} className="notification-preview-link" onClick={() => { dismiss(); if (!notification.isRead) onMarkRead(notification.id); }}>
            <span className={`notification-preview-icon is-${notification.kind}`}><Bell size={14} /></span>
            <span><strong>{notification.title}</strong><small>{notification.body}</small></span>
          </Link>
          {notification.isRead ? <span className="notification-read-state" aria-label="Read"><Check size={13} /></span> : <button type="button" className="notification-read-button" disabled={isMarkingRead} onClick={() => onMarkRead(notification.id)}>Mark read</button>}
        </div>)}
      </div>
      <Link href="/notifications" className="notification-view-all" onClick={dismiss}><span>See all notifications</span><span aria-hidden="true">→</span></Link>
    </PopoverContent>
  </Popover>;
}
