export type DrilldownSite = {
  id: number;
  name: string;
  clientName: string;
  readinessStatus: "ready" | "review" | "risk";
  isDemo: boolean;
};

export type SiteDrilldownWorkOrder = {
  id: number;
  title: string;
  workType: string;
  status: "scheduled" | "in_progress" | "awaiting_review" | "blocked" | "complete";
  evidenceProgress: number;
  scheduledFor: Date;
  dueAt: Date | null;
};

export type IllustrativeEvidence = {
  id: string;
  kind: "equipment" | "control_panel";
  imageUrl: string;
  alt: string;
  title: string;
  caption: string;
  capturedLabel: string;
};

export type WorkOrderTimelineEvent = {
  id: string;
  kind: "planned" | "field" | "evidence" | "review" | "exception";
  occurredAt: Date;
  title: string;
  detail: string;
};

export type DrilldownWorkOrder = SiteDrilldownWorkOrder & {
  illustrativeHistory: WorkOrderTimelineEvent[];
};

const hoursBefore = (date: Date, hours: number) => new Date(date.getTime() - hours * 60 * 60 * 1000);

function timelineFor(workOrder: SiteDrilldownWorkOrder): WorkOrderTimelineEvent[] {
  const scheduledFor = new Date(workOrder.scheduledFor);
  const shared: WorkOrderTimelineEvent[] = [
    {
      id: `${workOrder.id}-planned`,
      kind: "planned",
      occurredAt: hoursBefore(scheduledFor, 72),
      title: "Scope confirmed",
      detail: `${workOrder.workType} scope, access notes, and device list were prepared for the Kigali demonstration visit.`,
    },
    {
      id: `${workOrder.id}-assigned`,
      kind: "field",
      occurredAt: hoursBefore(scheduledFor, 24),
      title: "Field visit scheduled",
      detail: "Illustrative field-team assignment and site access window recorded for training review.",
    },
  ];
  const statusEvent: Record<SiteDrilldownWorkOrder["status"], Omit<WorkOrderTimelineEvent, "id" | "occurredAt">> = {
    scheduled: { kind: "planned", title: "Visit window pending", detail: "The planned service window is open; no fictional field evidence has been recorded yet." },
    in_progress: { kind: "field", title: "Site activity underway", detail: "Illustrative technician progress is being reviewed against the planned service scope." },
    awaiting_review: { kind: "evidence", title: "Evidence pack submitted", detail: "Illustrative evidence is ready for a reviewer to validate before the work order can close." },
    blocked: { kind: "exception", title: "Exception routed for action", detail: "A fictional follow-up is preventing completion until the exception owner confirms the corrective action." },
    complete: { kind: "review", title: "Service review complete", detail: "Illustrative evidence and checklist outcomes have been accepted for this training record." },
  };
  const latest = statusEvent[workOrder.status];
  return [...shared, { id: `${workOrder.id}-${workOrder.status}`, occurredAt: workOrder.status === "scheduled" ? scheduledFor : hoursBefore(new Date(), 2), ...latest }];
}

export function buildIllustrativeSiteDrilldown(site: DrilldownSite, workOrders: SiteDrilldownWorkOrder[]) {
  if (!site.isDemo) return { isIllustrative: false, evidence: [] as IllustrativeEvidence[], workOrders: workOrders.map(workOrder => ({ ...workOrder, illustrativeHistory: [] as WorkOrderTimelineEvent[] })) };
  const primaryWork = workOrders[0];
  return {
    isIllustrative: true,
    evidence: [
      {
        id: `${site.id}-equipment`,
        kind: "equipment" as const,
        imageUrl: "/manus-storage/fireguard-demo-equipment-station_85dd1d91.svg",
        alt: "Illustrative demonstration placeholder showing a fire equipment station",
        title: "Equipment station check",
        caption: `${primaryWork?.workType ?? "Fire safety"} point visually verified during the illustrative site walk-through.`,
        capturedLabel: "Illustrative evidence · Demo only",
      },
      {
        id: `${site.id}-control-panel`,
        kind: "control_panel" as const,
        imageUrl: "/manus-storage/fireguard-demo-control-point_84a79b25.svg",
        alt: "Illustrative demonstration placeholder showing a fire control panel",
        title: "Control point condition",
        caption: `Readiness context: ${site.readinessStatus}. This is a non-operational example for ${site.clientName}.`,
        capturedLabel: "Placeholder visual · No field image",
      },
    ],
    workOrders: workOrders.map(workOrder => ({ ...workOrder, illustrativeHistory: timelineFor(workOrder) })),
  };
}
