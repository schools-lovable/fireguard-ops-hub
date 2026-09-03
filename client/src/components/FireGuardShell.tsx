/** FireGuard visual system: primary workspaces live in the rail, while the top bar carries subpage context and account utilities. */
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { FIREGUARD_DIRECT_ACCESS } from "@shared/accessMode";
import { Bell, ChevronUp, ClipboardCheck, Eye, FileBarChart, FlaskConical, FolderKanban, GraduationCap, Grid2X2, LifeBuoy, LogOut, MessageCircleMore, Settings2, ShieldAlert, ShieldCheck, UserRound, UsersRound, Wrench } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFireguardPermissions, useFireguardWorkspace } from "@/hooks/useFireguardData";
import { trpc } from "@/lib/trpc";
import { DemoEnvironmentBanner } from "@/components/DemoEnvironmentBanner";
import { DesktopRouteSwitcher } from "@/components/DesktopRouteSwitcher";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { getActiveHeaderTabId, getContextualSubpages, getSidebarTabs } from "@shared/navigation";
import { isDemoNoticeDismissed, setDemoNoticeDismissed } from "@shared/demoNotice";

const markUrl = "/manus-storage/fireguard-mark_095028dc.png";
const routeTitle = (route: string | null) => {
  if (route?.startsWith("/service/")) return "Service compliance";
  return ({ "/": "Overview", "/academy": "Academy", "/chat": "Fireguard Chat", "/clients": "Clients", "/clients/map": "Client map", "/service": "Service", "/reviews": "Evidence review", "/exceptions": "Exceptions", "/team": "Team", "/reports": "Reports", "/notifications": "Exception centre", "/profile": "Operator profile", "/settings": "Settings", "/settings/access": "Access & PIN", "/support": "Support" }[route ?? ""] ?? "FireGuard");
};
const navigationIcons = { overview: Grid2X2, work: Wrench, clients: FolderKanban, people: GraduationCap, coordination: MessageCircleMore, intelligence: FileBarChart, settings: Settings2, support: LifeBuoy };

export function FireGuardShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isPresenceDrawerOpen, setPresenceDrawerOpen] = useState(false);
  const [isDemoNoticeHidden, setDemoNoticeHidden] = useState(false);
  const [railOverflow, setRailOverflow] = useState({ above: false, below: false });
  const railMenuRef = useRef<HTMLElement>(null);
  const { data: permissions } = useFireguardPermissions();
  const { data: workspace } = useFireguardWorkspace();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: profileDashboard } = trpc.fireguard.profile.dashboard.useQuery();
  const { logout, loading: isSigningOut } = useAuth();
  const utils = trpc.useUtils();
  const { data: activeUsers = [], isLoading: isPresenceLoading } = trpc.fireguard.presence.active.useQuery(undefined, { refetchInterval: 60_000, refetchOnWindowFocus: true });
  const { data: notifications = [], isLoading: isNotificationsLoading, error: notificationsError } = trpc.fireguard.notifications.list.useQuery(undefined, { refetchInterval: 30_000, refetchOnWindowFocus: true });
  const presenceHeartbeat = trpc.fireguard.presence.heartbeat.useMutation({ onSuccess: () => utils.fireguard.presence.active.invalidate() });
  const markNotificationRead = trpc.fireguard.notifications.markRead.useMutation({ onSuccess: () => utils.fireguard.notifications.list.invalidate() });

  useEffect(() => {
    const sendPresence = () => presenceHeartbeat.mutate({ route: location });
    sendPresence();
    const intervalId = window.setInterval(sendPresence, 60_000);
    window.addEventListener("focus", sendPresence);
    return () => { window.clearInterval(intervalId); window.removeEventListener("focus", sendPresence); };
  }, [location, presenceHeartbeat.mutate]);

  useEffect(() => {
    setDemoNoticeHidden(isDemoNoticeDismissed(window.localStorage));
  }, []);

  useEffect(() => {
    const menu = railMenuRef.current;
    if (!menu) return;
    const updateOverflowCue = () => {
      const maxScrollTop = Math.max(0, menu.scrollHeight - menu.clientHeight);
      const next = { above: menu.scrollTop > 1, below: menu.scrollTop < maxScrollTop - 1 };
      setRailOverflow(previous => previous.above === next.above && previous.below === next.below ? previous : next);
    };
    updateOverflowCue();
    menu.addEventListener("scroll", updateOverflowCue, { passive: true });
    window.addEventListener("resize", updateOverflowCue);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOverflowCue);
    observer?.observe(menu);
    return () => { menu.removeEventListener("scroll", updateOverflowCue); window.removeEventListener("resize", updateOverflowCue); observer?.disconnect(); };
  }, []);

  const roleLabel = permissions?.role ? `${permissions.role[0].toUpperCase()}${permissions.role.slice(1)}` : "Loading";
  const namedUsers = activeUsers.filter(user => user.name).map(user => user.name as string);
  const activeUserLabel = isPresenceLoading ? "Checking active operators" : activeUsers.length === 1 ? "1 active operator" : `${activeUsers.length} active operators`;
  const profileInitials = (currentUser?.name || "FG").split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const navigationPermissions = { canReviewEvidence: Boolean(permissions?.canReviewEvidence), canManageOperations: Boolean(permissions?.canManageOperations) };
  const visibleNavigation = getSidebarTabs(navigationPermissions);
  const primaryNavigation = visibleNavigation.filter(tab => tab.id !== "support");
  const supportNavigation = visibleNavigation.find(tab => tab.id === "support");
  const activeNavigation = getActiveHeaderTabId(location);
  const activeMainTab = visibleNavigation.find(tab => tab.id === activeNavigation);
  const activeContextualSubpages = getContextualSubpages(activeNavigation, navigationPermissions);
  const handleSignOut = async () => {
    await logout();
    setLocation("/access");
  };
  const dismissDemoNotice = () => {
    setDemoNoticeDismissed(window.localStorage, true);
    setDemoNoticeHidden(true);
  };
  const restoreDemoNotice = () => {
    setDemoNoticeDismissed(window.localStorage, false);
    setDemoNoticeHidden(false);
  };

  return <div className={`fg-shell ${profileDashboard?.preferences.compactDensity ? "is-compact-density" : ""}`}><div className="fg-frame fg-layout">
    <aside className="fg-rail" aria-label="Primary workspace navigation" style={{ position: "sticky", top: 0, height: "calc(100dvh - 48px)", minHeight: 0 }}>
      <Link className="fg-rail-brand" href="/" aria-label="FireGuard overview"><img src={markUrl} alt="" /><span className="fg-rail-brand-wordmark"><strong>Fire<span>Guard</span></strong><small>Operations hub</small></span></Link>
      <p className="rail-section-label">Operational workspace</p>
      <div className="rail-menu-wrap">
      <nav ref={railMenuRef} className="rail-menu" aria-label="Workspace sections" tabIndex={0} style={{ overflowY: "auto", overscrollBehavior: "contain" }}>{primaryNavigation.map(tab => {
        const Icon = navigationIcons[tab.icon];
        const active = activeNavigation === tab.id;
        return <Link key={tab.id} href={tab.path} className={`rail-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} aria-label={tab.label}>
          <Icon size={18} /><span className="rail-link-label">{tab.label}</span><span className="rail-command-tag"><i className="rail-command-dot" aria-hidden="true" />{tab.label}</span>
        </Link>;
      })}</nav>
      <span className={`rail-scroll-fade is-top ${railOverflow.above ? "is-visible" : ""}`} aria-hidden="true" />
      <span className={`rail-scroll-fade is-bottom ${railOverflow.below ? "is-visible" : ""}`} aria-hidden="true" />
      </div>
      <div className="rail-bottom">{supportNavigation && (() => {
        const Icon = navigationIcons[supportNavigation.icon];
        const active = activeNavigation === supportNavigation.id;
        return <Link href={supportNavigation.path} className={`rail-link rail-link-support ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} aria-label={supportNavigation.label}><Icon size={18} /><span className="rail-link-label">{supportNavigation.label}</span><span className="rail-command-tag"><i className="rail-command-dot" aria-hidden="true" />{supportNavigation.label}</span></Link>;
      })()}<span className="rail-status-dot" title={activeUserLabel} aria-label={activeUserLabel} /></div>
    </aside>
    <div className="fg-workspace">
      <header className="fg-topbar">
        <div className="fg-topbar-row">
          <div className="topbar-context" aria-label="Current workspace context"><span>{activeContextualSubpages.length ? `${activeMainTab?.label ?? "Workspace"} sections` : "Current workspace"}</span><strong>{routeTitle(location)}</strong></div>
          <div className="topbar-spacer" />
          <DesktopRouteSwitcher activeTabId={activeNavigation} permissions={navigationPermissions} />
          <span className="status-badge neutral topbar-role">{roleLabel}</span>
          <div className="active-users" aria-live="polite" aria-label={activeUserLabel} title={namedUsers.join(", ") || "No active operators"}><span className="active-users-copy"><i aria-hidden="true" />{isPresenceLoading ? "Live" : `${activeUsers.length} active`}</span><div className="active-user-stack" aria-hidden="true">{activeUsers.slice(0, 3).map(user => <span key={user.id}>{(user.name || "FG").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}</span>)}{activeUsers.length > 3 && <span>+{activeUsers.length - 3}</span>}</div></div>
          {permissions?.canManageOperations && <button type="button" className="mobile-presence-trigger" onClick={() => setPresenceDrawerOpen(true)} aria-label={activeUserLabel}><span><i aria-hidden="true" />{activeUsers.length}</span><UsersRound size={16} /></button>}
          <NotificationDropdown key={location} notifications={notifications} isLoading={isNotificationsLoading} error={notificationsError} isMarkingRead={markNotificationRead.isPending} isCurrentPage={location === "/notifications"} onMarkRead={id => markNotificationRead.mutate({ id })} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button" className={`profile-avatar ${location === "/profile" ? "is-active" : ""}`} aria-label={`Open account menu for ${currentUser?.name || "current user"}`}><span aria-hidden="true">{profileInitials}</span></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="fg-profile-menu">
              <DropdownMenuLabel className="fg-profile-menu-label"><span>{profileInitials}</span><div><strong>{currentUser?.name || "FireGuard operator"}</strong><small>{roleLabel}</small></div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setLocation("/profile")}><UserRound />My profile</DropdownMenuItem>
              {permissions?.canManageOperations && <DropdownMenuItem onSelect={() => setLocation("/settings/access")}><ShieldCheck />Admin controls</DropdownMenuItem>}
              {workspace?.isDemo && isDemoNoticeHidden && <DropdownMenuItem onSelect={restoreDemoNotice}><Eye />Show demonstration notice</DropdownMenuItem>}
              {!FIREGUARD_DIRECT_ACCESS && <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" disabled={isSigningOut} onSelect={() => { void handleSignOut(); }}><LogOut />{isSigningOut ? "Signing out…" : "Sign out"}</DropdownMenuItem></>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {activeContextualSubpages.length > 0 && <nav className="header-context-tabs" aria-label={`${activeMainTab?.label ?? "Workspace"} sections`}><span>{activeMainTab?.label ?? "Workspace"} sections</span><div>{activeContextualSubpages.map(section => <Link key={section.path} href={section.path} className={location === section.path ? "is-active" : ""} aria-current={location === section.path ? "page" : undefined}>{section.label}</Link>)}</div></nav>}
      </header>
      <DemoEnvironmentBanner isDemo={workspace?.isDemo && !isDemoNoticeHidden} onDismiss={dismissDemoNotice} />
      <main className="fg-main">{children}</main>
    </div>
    <nav className="fg-mobile-nav" aria-label="Primary workspace navigation">{visibleNavigation.map(tab => {
      const Icon = navigationIcons[tab.icon];
      const active = activeNavigation === tab.id;
      return <Link key={tab.id} href={tab.path} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}><Icon size={15} /><span>{tab.label}</span></Link>;
    })}</nav>
  </div>
  <Dialog open={isPresenceDrawerOpen} onOpenChange={setPresenceDrawerOpen}><DialogContent className="presence-drawer" showCloseButton={false}><DialogHeader className="presence-drawer-header"><div><span className="soft-label">Supervisor presence</span><DialogTitle>Active operators</DialogTitle><DialogDescription>{activeUserLabel} across FireGuard right now.</DialogDescription></div><button type="button" className="presence-drawer-close" onClick={() => setPresenceDrawerOpen(false)} aria-label="Close active users"><ChevronUp size={18} /></button></DialogHeader><div className="presence-drawer-list">{activeUsers.length ? activeUsers.map(user => <div className="presence-drawer-row" key={user.id}><span className="presence-drawer-avatar">{(user.name || "FG").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{user.name || "FireGuard operator"}</strong><span>{routeTitle(user.currentRoute)}</span></div><i aria-label="Active" /></div>) : <p className="presence-drawer-empty">No operator heartbeats are visible yet.</p>}</div></DialogContent></Dialog>
  </div>;
}
