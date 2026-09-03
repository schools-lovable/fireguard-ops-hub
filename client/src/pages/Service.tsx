/** FireGuard visual system: service work updates durable work-order status through field-team and reviewer role gates. */
import React from "react";
import { CalendarClock, ChevronRight, Filter, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ActionButton, CorePageState, LoadSuccessCue, PageHeader, StatusBadge, SurfaceTitle, useLoadSuccessCue } from "@/components/FireGuardUI";
import { formatOperationalDate, useFireguardPermissions, useFireguardWorkspace } from "@/hooks/useFireguardData";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getServiceStatusFilter } from "@/lib/workspaceDestinations";

const workStatusLabel = (status: "scheduled" | "in_progress" | "awaiting_review" | "blocked" | "complete") => ({
  scheduled: "Scheduled", in_progress: "In progress", awaiting_review: "Awaiting review", blocked: "Blocked", complete: "Complete",
})[status];

const workStatusTone = (status: "scheduled" | "in_progress" | "awaiting_review" | "blocked" | "complete") => (
  status === "complete" ? "good" : status === "blocked" ? "risk" : status === "awaiting_review" ? "warning" : "neutral"
) as "good" | "risk" | "warning" | "neutral";

export default function Service() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const serviceFilter = getServiceStatusFilter(window.location.search);
  const { data, isLoading, error, refetch } = useFireguardWorkspace();
  const { data: permissions } = useFireguardPermissions();
  const loadSuccessPhase = useLoadSuccessCue(isLoading || Boolean(error));
  const refresh = () => utils.fireguard.workspace.invalidate();
  const start = trpc.fireguard.workOrders.start.useMutation({ onSuccess: () => { toast.success("Work order started."); refresh(); }, onError: issue => toast.error(issue.message) });
  const submit = trpc.fireguard.workOrders.submitForReview.useMutation({ onSuccess: () => { toast.success("Evidence submitted for review."); refresh(); }, onError: issue => toast.error(issue.message) });
  const approve = trpc.fireguard.workOrders.approve.useMutation({ onSuccess: () => { toast.success("Work order approved and completed."); refresh(); }, onError: issue => toast.error(issue.message) });

  if (isLoading) return <CorePageState state="loading" title="Loading scheduled work" description="Checking the latest work-order queue." />;
  if (error || !data) return <CorePageState state="error" title="Work orders unavailable" description="Try again to recover the service schedule." actionLabel="Retry schedule" onAction={() => void refetch()} />;

  const displayedWorkOrders = (serviceFilter === "active" ? data.workOrders.filter(work => work.status !== "complete") : serviceFilter === "complete" ? data.workOrders.filter(work => work.status === "complete") : data.workOrders)
    .slice()
    .sort((left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime());
  const activeCount = data.workOrders.filter(work => work.status !== "complete").length;
  const actionFor = (work: typeof data.workOrders[number]) => {
    if (work.status === "awaiting_review") return permissions?.canReviewEvidence ? <ActionButton tone="dark" size="compact" onClick={() => approve.mutate({ id: work.id })}>Approve</ActionButton> : <StatusBadge tone="warning">Review queue</StatusBadge>;
    if (work.status === "complete") return <StatusBadge tone="good">Complete</StatusBadge>;
    if (work.status === "in_progress") return permissions?.canPerformFieldWork ? <ActionButton tone="quiet" size="compact" onClick={() => submit.mutate({ id: work.id })}>Submit</ActionButton> : <StatusBadge tone="neutral">Assigned</StatusBadge>;
    return permissions?.canPerformFieldWork ? <ActionButton tone="quiet" size="compact" onClick={() => start.mutate({ id: work.id })}>Start</ActionButton> : <StatusBadge tone={work.status === "blocked" ? "risk" : "neutral"}>{work.status === "blocked" ? "Blocked" : "Scheduled"}</StatusBadge>;
  };

  return <div className="page-enter"><LoadSuccessCue phase={loadSuccessPhase} label="Service schedule ready" detail="Latest work-order records are live" />
    <PageHeader eyebrow="Work" title="Service schedule" description="A live, time-ordered work queue. Field teams start and submit evidence; reviewers sign completed work off."><ActionButton tone="quiet" icon={Filter} onClick={() => setLocation(serviceFilter === "active" ? "/service?status=all" : "/service?status=active")}>{serviceFilter === "active" ? "All work orders" : "Active work orders"}</ActionButton><ActionButton icon={Plus} onClick={() => toast("New work-order creation is the next manager workflow to connect.")}>New work order</ActionButton></PageHeader>
    <section className="content-grid"><article className="surface-card service-schedule-card"><div className="service-schedule-toolbar"><div><SurfaceTitle title="Scheduled work" subtitle={`${displayedWorkOrders.length} ${serviceFilter === "active" ? "active" : serviceFilter === "complete" ? "completed" : "live"} work orders · earliest first`} /><p className="service-schedule-note">Select <strong>Inspect</strong> to review equipment, evidence, review state, and certificate readiness.</p></div><StatusBadge tone="good">Live data</StatusBadge></div><div className="service-table-wrap"><table className="service-table"><caption className="sr-only">Live FireGuard service work orders, ordered by scheduled time.</caption><thead><tr><th scope="col">Time</th><th scope="col">Work / site</th><th scope="col">Status</th><th scope="col">Evidence</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{displayedWorkOrders.length ? displayedWorkOrders.map(work => { const date = new Date(work.scheduledFor); return <tr key={work.id}><td data-label="Scheduled" className="service-date-cell"><time dateTime={date.toISOString()}><strong>{date.getDate()}</strong><span>{new Intl.DateTimeFormat(undefined, { month: "short" }).format(date)}</span></time><small>{formatOperationalDate(work.scheduledFor)}</small></td><td data-label="Work order" className="service-work-cell"><h3>{work.title}</h3><p>{work.clientName} <span aria-hidden="true">·</span> {work.siteName}</p></td><td data-label="Status" className="service-status-cell"><StatusBadge tone={workStatusTone(work.status)}>{workStatusLabel(work.status)}</StatusBadge></td><td data-label="Evidence" className="service-evidence-cell"><div className="progress-caption"><span>Verified evidence</span><strong>{work.evidenceProgress}%</strong></div><div className="progress-track" role="progressbar" aria-label={`${work.title} evidence progress`} aria-valuenow={work.evidenceProgress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${work.evidenceProgress}%` }} /></div></td><td data-label="Actions" className="service-action-cell"><div className="work-actions">{actionFor(work)}<ActionButton tone="quiet" size="compact" ariaLabel={`Inspect compliance for ${work.title}`} onClick={() => setLocation(`/service/${work.id}`)}>Inspect <ChevronRight size={14} /></ActionButton></div></td></tr>; }) : <tr><td colSpan={5} className="service-table-empty"><CorePageState compact state="empty" title="No work orders in this view" description="Choose a different status filter to review the complete service schedule." actionLabel="Show all work orders" onAction={() => setLocation("/service?status=all")} /></td></tr>}</tbody></table></div></article><aside className="side-summary"><article className="surface-card summary-card"><SurfaceTitle title="Schedule state" subtitle="Current live work queue" action={<CalendarClock size={16} color="#817c76" />} /><div className="summary-row"><span>Scheduled</span><strong>{data.workOrders.filter(work => work.status === "scheduled").length}</strong></div><div className="summary-row"><span>In progress</span><strong>{data.workOrders.filter(work => work.status === "in_progress").length}</strong></div><div className="summary-row"><span>Awaiting review</span><strong>{data.workOrders.filter(work => work.status === "awaiting_review").length}</strong></div><div className="summary-row"><span>Blocked</span><strong style={{ color: "#d94a3a" }}>{data.workOrders.filter(work => work.status === "blocked").length}</strong></div></article><article className="surface-card image-surface"><div><SurfaceTitle title="Service signal" /><p>{activeCount} work orders need a field or review action. Permissions remain server-enforced for every state change.</p></div></article><article className="surface-card summary-card"><SurfaceTitle title="Your role" subtitle="Current access" /><div className="summary-row"><span>Role</span><strong>{permissions?.role ?? "…"}</strong></div><ActionButton tone="quiet" icon={Wrench} onClick={() => toast("Field users can start and submit; reviewers can approve; managers can do both.")}>View access</ActionButton></article></aside></section>
  </div>;
}
