export type VisualizationWorkOrder = {
  id: number;
  scheduledFor: Date | string;
  evidenceProgress: number;
  status: "scheduled" | "in_progress" | "awaiting_review" | "blocked" | "complete";
};

export type VisualizationDatum = {
  id: string;
  label: string;
  value: number;
  detail: string;
};

const statusLabels: Record<VisualizationWorkOrder["status"], string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  awaiting_review: "Awaiting review",
  blocked: "Blocked",
  complete: "Complete",
};

const statusOrder = Object.keys(statusLabels) as VisualizationWorkOrder["status"][];

const safeDate = (value: Date | string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateLabel = (value: Date | string) => {
  const parsed = safeDate(value);
  return parsed ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed) : "Unscheduled";
};

export function buildEvidenceProgressSeries(workOrders: readonly VisualizationWorkOrder[], maxItems = 7): VisualizationDatum[] {
  const latestWork = [...workOrders]
    .sort((left, right) => (safeDate(left.scheduledFor)?.getTime() ?? 0) - (safeDate(right.scheduledFor)?.getTime() ?? 0))
    .slice(-maxItems);

  return latestWork.length
    ? latestWork.map(workOrder => ({
      id: `work-${workOrder.id}`,
      label: dateLabel(workOrder.scheduledFor),
      value: Math.max(0, Math.min(100, Math.round(workOrder.evidenceProgress))),
      detail: statusLabels[workOrder.status],
    }))
    : [{ id: "no-work", label: "No work", value: 0, detail: "No scheduled work orders" }];
}

export function buildScheduledWorkOrderVolumeSeries(workOrders: readonly VisualizationWorkOrder[], maxItems = 7): VisualizationDatum[] {
  const groups = new Map<string, { scheduledFor: Date | string; count: number }>();
  workOrders.forEach(workOrder => {
    const parsed = safeDate(workOrder.scheduledFor);
    const key = parsed ? `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}` : "unscheduled";
    const existing = groups.get(key);
    groups.set(key, { scheduledFor: workOrder.scheduledFor, count: (existing?.count ?? 0) + 1 });
  });
  const volume = Array.from(groups.entries())
    .sort(([, left], [, right]) => (safeDate(left.scheduledFor)?.getTime() ?? 0) - (safeDate(right.scheduledFor)?.getTime() ?? 0))
    .slice(-maxItems)
    .map(([id, group]) => ({ id: `volume-${id}`, label: dateLabel(group.scheduledFor), value: group.count, detail: `${group.count} scheduled work order${group.count === 1 ? "" : "s"}` }));

  return volume.length ? volume : [{ id: "no-work", label: "No work", value: 0, detail: "No scheduled work orders" }];
}

export function buildWorkOrderStatusSeries(workOrders: readonly VisualizationWorkOrder[]): VisualizationDatum[] {
  return statusOrder.map(status => {
    const count = workOrders.filter(workOrder => workOrder.status === status).length;
    return {
      id: status,
      label: statusLabels[status],
      value: count,
      detail: `${count} live work order${count === 1 ? "" : "s"}`,
    };
  });
}

export function buildSiteCoverageSeries(siteCount: number, readySiteCount: number): VisualizationDatum[] {
  const total = Math.max(0, siteCount);
  const ready = Math.min(total, Math.max(0, readySiteCount));
  if (total === 0) return [{ id: "no-sites", label: "No sites", value: 0, detail: "No managed sites" }];
  const attention = total - ready;
  return [
    { id: "ready", label: "Ready", value: ready, detail: `${ready} site${ready === 1 ? "" : "s"} ready for inspection` },
    { id: "attention", label: "Attention", value: attention, detail: `${attention} site${attention === 1 ? "" : "s"} need readiness attention` },
  ];
}
