import React from "react";
import { Camera, CheckCircle2, CircleAlert, ClipboardCheck, Clock3, FileText, ShieldAlert } from "lucide-react";
import { formatOperationalDate } from "@/hooks/useFireguardData";

type TimelineEvent = {
  id: string;
  kind: "planned" | "field" | "evidence" | "review" | "exception";
  occurredAt: Date;
  title: string;
  detail: string;
};

export type SiteDrilldownDetail = {
  isIllustrative: boolean;
  evidence: { id: string; imageUrl: string; alt: string; title: string; caption: string; capturedLabel: string }[];
  workOrders: { id: number; title: string; workType: string; status: "scheduled" | "in_progress" | "awaiting_review" | "blocked" | "complete"; evidenceProgress: number; scheduledFor: Date; dueAt: Date | null; illustrativeHistory: TimelineEvent[] }[];
};

const eventIcon = {
  planned: Clock3,
  field: ClipboardCheck,
  evidence: Camera,
  review: CheckCircle2,
  exception: CircleAlert,
};

const statusLabel = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  awaiting_review: "Awaiting review",
  blocked: "Blocked",
  complete: "Complete",
};

export function SiteDrilldown({ detail, isLoading }: { detail?: SiteDrilldownDetail; isLoading: boolean }) {
  if (isLoading) return <section className="site-drilldown site-drilldown-loading" aria-label="Loading site drill-down" aria-busy="true"><span className="soft-label">Site drill-down</span><div /><div /><div /></section>;
  if (!detail) return null;
  const demoWork = detail.workOrders.filter(workOrder => workOrder.illustrativeHistory.length > 0);
  return <section className="site-drilldown" aria-label="Site evidence and work order history"><div className="site-drilldown-heading"><div><span className="soft-label">Site drill-down</span><h3>Evidence &amp; service history</h3></div>{detail.isIllustrative ? <span className="site-drilldown-demo">Demo examples</span> : null}</div>{detail.isIllustrative ? <p className="site-drilldown-notice"><ShieldAlert size={14} />Illustrative evidence and activity only. No field image or real operational history is implied.</p> : null}{detail.isIllustrative && detail.evidence.length ? <div className="site-evidence-grid">{detail.evidence.map(item => <figure className="site-evidence-card" key={item.id}><img src={item.imageUrl} alt={item.alt} loading="lazy" /><figcaption><span>{item.capturedLabel}</span><strong>{item.title}</strong><p>{item.caption}</p></figcaption></figure>)}</div> : null}{demoWork.length ? <div className="site-work-history"><span className="soft-label">Work-order history</span>{demoWork.map(workOrder => <article className="site-work-order" key={workOrder.id}><div className="site-work-order-head"><div><span>{workOrder.workType}</span><h4>{workOrder.title}</h4></div><b className={`site-work-status is-${workOrder.status}`}>{statusLabel[workOrder.status]}</b></div><div className="site-evidence-progress"><div><span>Illustrative evidence</span><strong>{workOrder.evidenceProgress}%</strong></div><i><b style={{ width: `${workOrder.evidenceProgress}%` }} /></i></div><ol>{workOrder.illustrativeHistory.map(event => { const Icon = eventIcon[event.kind]; return <li key={event.id}><span className={`site-history-icon is-${event.kind}`}><Icon size={13} /></span><div><strong>{event.title}</strong><time>{formatOperationalDate(event.occurredAt)}</time><p>{event.detail}</p></div></li>; })}</ol></article>)}</div> : <div className="site-drilldown-empty"><FileText size={16} /><p>{detail.isIllustrative ? "No illustrative work history has been staged for this demo site yet." : "No captured evidence or work-order history is available for this operational site."}</p></div>}</section>;
}
