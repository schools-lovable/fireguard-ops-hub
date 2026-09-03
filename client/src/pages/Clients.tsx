/** FireGuard visual system: live client and site records share a filterable portfolio workspace. */
import { MapPinned, Plus, Search, UsersRound } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ActionButton, CorePageState, LoadSuccessCue, PageHeader, StatusBadge, SurfaceTitle, useLoadSuccessCue } from "@/components/FireGuardUI";
import { formatOperationalDate, useFireguardWorkspace } from "@/hooks/useFireguardData";
import { getClientPortfolioFilter, getClientWorkspaceView } from "@/lib/workspaceDestinations";

const titleCaseFilter = (filter: "all" | "ready" | "review") => filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1);

export default function Clients() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const search = window.location.search;
  const portfolioFilter = getClientPortfolioFilter(search);
  const workspaceView = getClientWorkspaceView(search);
  const { data, isLoading, error, refetch } = useFireguardWorkspace();
  const loadSuccessPhase = useLoadSuccessCue(isLoading || Boolean(error));
  const filteredClients = useMemo(() => (data?.clients ?? []).filter(client => (
    (portfolioFilter === "all" || (portfolioFilter === "ready" ? client.readinessStatus === "ready" : client.readinessStatus !== "ready"))
    && client.name.toLowerCase().includes(query.toLowerCase())
  )), [data?.clients, portfolioFilter, query]);

  if (isLoading) return <CorePageState state="loading" title="Loading client portfolio" description="Checking the latest account and site records." />;
  if (error || !data) return <CorePageState state="error" title="Client records unavailable" description="Try again to recover the portfolio." actionLabel="Retry portfolio" onAction={() => void refetch()} />;

  const statusTone = (status: string) => status === "ready" ? "good" : status === "risk" ? "risk" : "warning" as const;
  const clientNameById = new Map(data.clients.map(client => [client.id, client.name]));
  const setPortfolioFilter = (nextFilter: "all" | "ready" | "review") => setLocation(`/clients?filter=${nextFilter}`);
  const setWorkspaceView = (nextView: "clients" | "sites") => setLocation(nextView === "sites" ? "/clients?view=sites" : "/clients?filter=all");
  const pageTitle = workspaceView === "sites" ? "Site directory" : "Client portfolio";
  const pageDescription = workspaceView === "sites"
    ? "Every managed site is listed with its readiness signal, next inspection, and a direct map handoff."
    : "Live account and site records feed every readiness, work-order, and exception workflow.";

  return <div className="page-enter">
    <LoadSuccessCue phase={loadSuccessPhase} label="Client portfolio ready" detail="Latest account and site records are live" />
    <PageHeader eyebrow="Clients" title={pageTitle} description={pageDescription}>
      <ActionButton tone="quiet" icon={MapPinned} onClick={() => setLocation("/clients/map")}>Client Map</ActionButton>
      <ActionButton tone="quiet" icon={UsersRound} onClick={() => toast("Portfolio roles are managed from Team coordination.")}>Team coverage</ActionButton>
      <ActionButton icon={Plus} onClick={() => toast("Client creation is reserved for managers in the next workflow iteration.")}>Add client</ActionButton>
    </PageHeader>
    <section className="content-grid">
      <article className="surface-card table-card">
        <div className="table-toolbar">
          <div className="table-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={workspaceView === "sites" ? "Search sites" : "Search clients"} aria-label={workspaceView === "sites" ? "Search sites" : "Search clients"} /></div>
          <div className="filter-tabs" aria-label="Portfolio view">
            <button type="button" className={`filter-tab ${workspaceView === "clients" ? "is-active" : ""}`} onClick={() => setWorkspaceView("clients")}>Clients</button>
            <button type="button" className={`filter-tab ${workspaceView === "sites" ? "is-active" : ""}`} onClick={() => setWorkspaceView("sites")}>Sites</button>
          </div>
          {workspaceView === "clients" && <div className="filter-tabs" aria-label="Client readiness filters">{(["all", "ready", "review"] as const).map(item => <button type="button" key={item} className={`filter-tab ${portfolioFilter === item ? "is-active" : ""}`} onClick={() => setPortfolioFilter(item)}>{titleCaseFilter(item)}</button>)}</div>}
        </div>
        {workspaceView === "sites" ? <table className="client-table"><thead><tr><th>Site</th><th>Client</th><th>Readiness</th><th>Next inspection</th><th>Map</th></tr></thead><tbody>{data.sites.filter(site => `${site.name} ${clientNameById.get(site.clientId) ?? ""}`.toLowerCase().includes(query.toLowerCase())).map(site => <tr key={site.id}><td><div className="client-name"><span className="client-initial">{site.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>{site.name}</div></td><td>{clientNameById.get(site.clientId) ?? "Unknown client"}</td><td><StatusBadge tone={statusTone(site.readinessStatus)}>{site.readinessStatus === "ready" ? "Ready" : site.readinessStatus === "risk" ? "At risk" : "Review"}</StatusBadge></td><td>{formatOperationalDate(site.nextInspectionAt)}</td><td><button type="button" className="client-map-link" onClick={() => setLocation(`/clients/map?site=${site.id}`)}><MapPinned size={13} />Show</button></td></tr>)}</tbody></table> : <table className="client-table"><thead><tr><th>Client</th><th>Sites</th><th>Portfolio owner</th><th>Next visit</th><th>Status</th><th>Map</th></tr></thead><tbody>{filteredClients.map(client => { const nextSite = data.sites.filter(site => site.clientId === client.id).sort((a, b) => Number(new Date(a.nextInspectionAt ?? 0)) - Number(new Date(b.nextInspectionAt ?? 0)))[0]; return <tr key={client.id}><td><div className="client-name"><span className="client-initial">{client.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</span>{client.name}</div></td><td>{client.siteCount}</td><td>{client.portfolioOwnerName}</td><td>{formatOperationalDate(nextSite?.nextInspectionAt)}</td><td><StatusBadge tone={statusTone(client.readinessStatus)}>{client.readinessStatus === "ready" ? "Ready" : client.readinessStatus === "risk" ? "At risk" : "Review"}</StatusBadge></td><td>{nextSite ? <button type="button" className="client-map-link" onClick={() => setLocation(`/clients/map?site=${nextSite.id}`)}><MapPinned size={13} />Show</button> : "—"}</td></tr>; })}</tbody></table>}
        {workspaceView === "sites" && data.sites.length === 0 && <CorePageState compact state="empty" title="No sites available" description="Add a client site when operational coverage is ready." />}
        {workspaceView === "clients" && filteredClients.length === 0 && <CorePageState compact state="empty" title="No matching clients" description="Clear the search or readiness filter to review more of the portfolio." actionLabel="Clear filters" onAction={() => { setQuery(""); setPortfolioFilter("all"); }} />}
      </article>
      <aside className="side-summary">
        <article className="surface-card summary-card"><SurfaceTitle title={workspaceView === "sites" ? "Site readiness" : "Portfolio health"} subtitle="Current database state" /><div className="summary-row"><span>Ready for inspection</span><strong>{workspaceView === "sites" ? data.sites.filter(site => site.readinessStatus === "ready").length : data.clients.filter(client => client.readinessStatus === "ready").length}</strong></div><div className="summary-row"><span>Needs review</span><strong>{workspaceView === "sites" ? data.sites.filter(site => site.readinessStatus === "review").length : data.clients.filter(client => client.readinessStatus === "review").length}</strong></div><div className="summary-row"><span>At risk</span><strong style={{ color: "#d94a3a" }}>{workspaceView === "sites" ? data.sites.filter(site => site.readinessStatus === "risk").length : data.clients.filter(client => client.readinessStatus === "risk").length}</strong></div></article>
        <article className="surface-card image-surface"><div><SurfaceTitle title="Equipment cover" /><p>{data.workOrders.length} live work orders are linked to tracked client sites.</p></div></article>
        <article className="surface-card summary-card"><SurfaceTitle title="Data mode" subtitle="Current workspace" /><div className="summary-row"><span>Records</span><strong>{data.isDemo ? "Demo" : "Live"}</strong></div><p className="page-description">Demonstration records carry a clear database flag and can be replaced without changing the workflows.</p></article>
      </aside>
    </section>
  </div>;
}
