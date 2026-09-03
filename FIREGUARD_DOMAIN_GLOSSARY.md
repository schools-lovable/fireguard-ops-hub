# FireGuard Operational Domain Glossary

This glossary describes the **implemented FireGuard data model** for operators, reviewers, managers, and future contributors. It is descriptive only: it does not issue certificates, alter customer records, expose PINs, or make business decisions.

## Core operational chain

> **Client → Site → Unit → Work order → Checklist / Evidence → Review → Certificate readiness or Exception → Notification**

| Object | Meaning in FireGuard | Primary relationship | Schema representation |
|---|---|---|---|
| **Client** | A commercial account boundary that owns one or more managed locations. | A client has many sites and may be referenced by a work order, certificate, or temporary coordination thread. | `clients` |
| **Site** | A physical location with an address, readiness state, inspection cadence, installed units, and safety gaps. | A site belongs to a client and has many units, work orders, and exceptions. | `sites.clientId` |
| **Unit** | A uniquely serialised extinguisher asset, including type, capacity, classification, service dates, hydrostatic-test date, and service status. | A unit belongs to a site and may appear on multiple service checklists and evidence records over time. | `extinguisher_units.siteId` |
| **Work order** | A scheduled service visit, including timing, assignment, workflow status, evidence state, review state, and certificate-readiness state. | A work order belongs to a site; it can reference a client and operator assignees, and owns checklist, evidence, history, review, and certificate-readiness information. | `work_orders.siteId`, `work_orders.clientId`, `work_orders.assignedUserId` |
| **Checklist** | The per-unit service verification record for a work order, covering confirmed specification and physical inspection checks. | A checklist item binds exactly one work order to one unit; the work-order/unit pair is unique. | `service_checklist_items.workOrderId`, `service_checklist_items.unitId` |
| **Evidence** | Managed-storage metadata for before/after service evidence. File bytes are not stored in the operational database. | Evidence belongs to a work order and unit, is attributed to an uploader, and can be flagged for review. | `service_evidence.workOrderId`, `service_evidence.unitId`, `service_evidence.uploadedByUserId` |
| **Review** | The accountable assessment of a work order’s evidence and checklist readiness. Review is a stateful decision, not a standalone table. | Review status, reviewer, note, and certificate blockers live on the work order; status changes are preserved in service history. | `work_orders.reviewStatus`, `reviewedByUserId`, `reviewNote`; `service_work_history` |
| **Certificate** | A persisted certificate record for an eligible completed work order. | A certificate is unique per work order, references the client and issuing operator, and is distinct from the boolean certificate-readiness signal. | `service_certificates.workOrderId`, `clientId`, `issuedByUserId`; `work_orders.certificateReady` |
| **Exception** | A safety gap requiring visible ownership, acknowledgement, resolution, and history. | An exception belongs to a site, may reference a source work order, and can have an accountable owner and due date. | `exceptions.siteId`, `workOrderId`, `ownerUserId` |
| **Operator** | An authenticated FireGuard user with a role, active-status flag, presence signal, and potentially separate work profile and preferences. | Operators may be assigned work, complete checklist items, upload evidence, review work, own exceptions, receive notifications, and participate in chat. | `users`; linked user IDs across operational tables |
| **Notification** | A durable in-app delivery record for operational digests, overdue risk, assignment, report, presence, and learning events. | A notification can be addressed to an operator and may reference an exception through its source ID; links route to relevant operational context. | `notifications.recipientUserId`, `sourceExceptionId`, `href` |

## Accountability and traceability

FireGuard retains the actor and timing around key operational changes. `service_work_history` records work-order status and review-state transitions; `profile_access_audits` records access-changing profile actions; `report_exports` records export generation; and conversation membership and messages preserve coordination context. The model uses identifier relationships and indexed lookup fields rather than storing redundant copies of records.

| Relationship | Operational purpose | Guardrail |
|---|---|---|
| Client → Site → Unit | Locates every asset within the commercial account and physical environment responsible for it. | A serial number uniquely identifies a unit. |
| Work order ↔ Unit through checklist | Prevents a service visit from applying the same unit checklist twice. | `(workOrderId, unitId)` is unique in `service_checklist_items`. |
| Work order → Evidence | Associates before/after evidence with both the visit and inspected unit. | Only storage references and metadata are persisted; credentials are excluded. |
| Work order → Review history | Makes review status and reviewer decisions traceable over time. | Certificate readiness remains separate from certificate issuance. |
| Site / Work order → Exception | Preserves the source context for unresolved safety gaps. | Acknowledgement and resolution are separate statuses. |
| Operator → Notifications | Delivers a durable, user-scoped in-app record of operational events. | Read state is individual to the recipient. |

## Boundary notes

The application marks sample entities with `isDemo` where that is part of the relevant operational table. Certificate readiness indicates whether stored rules are satisfied; it is **not** an authority to issue a real certificate. Role-PIN configuration, session values, storage credentials, and other secrets are intentionally outside this glossary and must never be documented in operational records.

