import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileBarChart, FolderKanban, GraduationCap, Grid2X2, LifeBuoy, MessageCircleMore, Search, Settings2, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { getContextualSubpages, getSidebarTabs, type HeaderTab, type NavigationPermissions } from "@shared/navigation";

type RouteSwitcherDestination = {
  label: string;
  path: string;
  group: "Primary workspaces" | "Current workspace";
  icon: HeaderTab["icon"];
};

const routeIcons = {
  overview: Grid2X2,
  work: Wrench,
  clients: FolderKanban,
  people: GraduationCap,
  coordination: MessageCircleMore,
  intelligence: FileBarChart,
  settings: Settings2,
  support: LifeBuoy,
};

const routeDescriptions: Record<string, string> = {
  "/": "Live operations overview",
  "/service": "Service schedule",
  "/reviews": "Evidence review",
  "/clients": "Client portfolio",
  "/clients/map": "Client map",
  "/academy": "Training and learning",
  "/team": "Operator routes and activity",
  "/chat": "Team chat",
  "/notifications": "Exception centre",
  "/exceptions": "Risk queue",
  "/reports": "Operational reports",
  "/profile": "Profile and work",
  "/settings": "Preferences",
  "/settings/access": "Access controls",
  "/support": "Support resources",
};

/** Returns only navigation destinations already permitted by the FireGuard role model. */
export function getRouteSwitcherDestinations(activeTabId: HeaderTab["id"], permissions: NavigationPermissions): RouteSwitcherDestination[] {
  const primary = getSidebarTabs(permissions).map(tab => ({
    label: tab.label,
    path: tab.path,
    group: "Primary workspaces" as const,
    icon: tab.icon,
  }));
  const primaryPaths = new Set(primary.map(destination => destination.path));
  const contextual = getContextualSubpages(activeTabId, permissions)
    .filter(destination => !primaryPaths.has(destination.path))
    .map(destination => ({
      label: destination.label,
      path: destination.path,
      group: "Current workspace" as const,
      icon: activeTabId,
    }));

  return [...primary, ...contextual];
}

export function isDesktopRouteSwitcherAvailable() {
  return typeof window === "undefined" || typeof window.matchMedia !== "function" || window.matchMedia("(min-width: 681px)").matches;
}

export function DesktopRouteSwitcher({ activeTabId, permissions }: { activeTabId: HeaderTab["id"]; permissions: NavigationPermissions }) {
  const [, setLocation] = useLocation();
  const [isOpen, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const destinations = useMemo(() => getRouteSwitcherDestinations(activeTabId, permissions), [activeTabId, permissions]);
  const primaryDestinations = destinations.filter(destination => destination.group === "Primary workspaces");
  const contextualDestinations = destinations.filter(destination => destination.group === "Current workspace");

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!isDesktopRouteSwitcherAvailable()) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const selectDestination = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  const renderDestination = (destination: RouteSwitcherDestination) => {
    const Icon = routeIcons[destination.icon];
    return <CommandItem key={destination.path} asChild value={`${destination.label} ${routeDescriptions[destination.path] ?? ""}`} onSelect={() => selectDestination(destination.path)}>
      <a className="fg-route-switcher-item" href={destination.path} onClick={event => { event.preventDefault(); selectDestination(destination.path); }}>
        <span className="fg-route-switcher-item-icon"><Icon size={16} aria-hidden="true" /></span>
        <span><strong>{destination.label}</strong><small>{routeDescriptions[destination.path] ?? "Open workspace"}</small></span>
        <ArrowRight size={15} aria-hidden="true" />
      </a>
    </CommandItem>;
  };

  return <>
    <button type="button" className="fg-route-switcher-trigger" onClick={() => setOpen(true)} aria-label="Open route switcher. Press Control or Command K.">
      <Search size={14} aria-hidden="true" /><span>Go to</span><kbd>⌘K</kbd>
    </button>
    <CommandDialog open={isOpen} onOpenChange={setOpen} title="FireGuard route switcher" description="Search permitted FireGuard workspaces and press Enter to move." className="fg-route-switcher-dialog">
      <CommandInput ref={inputRef} autoFocus aria-label="Search permitted FireGuard routes" placeholder="Search permitted routes…" />
      <CommandList>
        <CommandEmpty>No permitted route matches this search.</CommandEmpty>
        <CommandGroup heading="Primary workspaces">{primaryDestinations.map(renderDestination)}</CommandGroup>
        {contextualDestinations.length > 0 && <CommandGroup heading="Current workspace">{contextualDestinations.map(renderDestination)}</CommandGroup>}
      </CommandList>
      <div className="fg-route-switcher-footer"><span>Use ↑ ↓ to move</span><CommandShortcut>↵ Open</CommandShortcut></div>
    </CommandDialog>
  </>;
}
