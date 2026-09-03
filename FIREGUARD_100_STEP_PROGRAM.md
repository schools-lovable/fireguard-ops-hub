# FireGuard — 100-Step Autonomous Improvement Program

## Product intent and safety boundary

FireGuard is a **calm operating system for teams responsible for real-world fire readiness**. The program below strengthens operational reliability, compliance traceability, training, coordination, administration, and release quality without inventing customer reviews, falsifying inspection outcomes, changing shared PINs, issuing real certificates, or sending external communications without an explicit later approval.

Each prompt is deliberately small. A run should select **one unchecked prompt**, implement only that prompt, add or update focused tests, validate the related desktop and mobile interface, update `todo.md`, and checkpoint only after a coherent batch is complete. Prompts that need genuine business inputs are marked **decision gate** and must pause rather than guess.

## Wave 1 — Foundation and product clarity

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 1 | Document FireGuard’s core operational objects and their relationships: client, site, unit, work order, checklist, evidence, review, certificate, exception, operator, and notification. | A concise domain glossary is committed and matches the schema. |
| 2 | Add a workspace health panel that reports record counts and clearly labels demonstration records. | The dashboard renders live counts and an empty-state fallback. |
| 3 | Audit every primary route for a single clear operational purpose and add missing page descriptions. | All primary pages have unique headings and short outcome-oriented descriptions. |
| 4 | Standardize loading, empty, error, and success states across core operations pages. | Each state is visible in code and covered by focused tests where practical. |
| 5 | Add a non-destructive environment banner that distinguishes demonstration data from operational data. | The banner is visible only when sample records are present. |
| 6 | Add a safe “what changed” panel that summarizes recent operational records without exposing secrets. | The panel is role-aware and has an empty state. |
| 7 | Add a compact keyboard-accessible route switcher for desktop operators. | The switcher supports keyboard focus, search, and route selection. |
| 8 | Improve route-specific document titles for every FireGuard page. | Browser titles reflect the active workspace and page. |
| 9 | Add an accessible skip link that moves focus directly to the page’s primary content. | Keyboard testing confirms the link works on desktop and mobile layouts. |
| 10 | Create a baseline UX acceptance checklist for the application shell, cards, forms, tables, dialogs, and mobile navigation. | The checklist is saved in-project and used by future validation prompts. |

## Wave 2 — Client, site, and asset registry

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 11 | Add a role-gated client creation workflow with inline validation and an audit event. | Managers and sales roles can create a client; unauthorized roles are denied. |
| 12 | Add a role-gated client editing workflow that records the changed fields and editor. | The update is persistent and visible in the audit trail. |
| 13 | Add a client detail route with a site summary, work-order summary, and safety status overview. | The page handles no-sites and no-work-orders states. |
| 14 | Add a site creation workflow beneath a selected client. | Site creation validates required address and client fields. |
| 15 | Add site editing with address, contact, access instructions, and operational notes. | Updates persist and preserve prior activity history. |
| 16 | Add a site detail route that surfaces upcoming work, open exceptions, and installed units. | Each summary link routes to the correct operational record. |
| 17 | Add an extinguisher-unit creation workflow with classification, capacity, location, and hydro-test fields. | Invalid dates and incomplete equipment records are rejected. |
| 18 | Add extinguisher-unit editing and an immutable unit status-history entry. | Changes appear in an auditable history list. |
| 19 | Add unit filters for site, classification, service status, and hydro-test risk. | Filters work together and can be cleared in one action. |
| 20 | Add a unit export that contains only authorized operational fields and a clear generated-at timestamp. | Export formatting is tested with empty and populated results. |

## Wave 3 — Scheduling and dispatch

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 21 | Add a work-order creation flow that starts from a client, site, and due date. | The flow creates a traceable pending service record. |
| 22 | Add unit selection to a work order with duplicate-unit prevention. | One unit cannot be added twice to the same work order. |
| 23 | Add manager-only assignment of a technician to a work order. | Assignment is recorded and visible in the work-order activity history. |
| 24 | Add technician “my work” filtering that restricts field operators to assigned jobs. | Authorization tests confirm technicians cannot access unassigned jobs. |
| 25 | Add service status transitions with explicit allowed paths and user-friendly explanations. | Invalid status changes are rejected consistently in the API and UI. |
| 26 | Add scheduled-time and arrival-window fields with locale-aware rendering. | Dates are stored in UTC and display in the operator’s local timezone. |
| 27 | Add a dispatch board grouped by unassigned, assigned, in progress, awaiting review, and closed. | Counts and drop zones reflect live statuses. |
| 28 | Add a non-destructive dispatch note that records access or safety instructions for the field team. | Notes are timestamped and attributed. |
| 29 | Add an overdue-work indicator with clear risk language and a direct action link. | Overdue jobs are distinct from merely upcoming jobs. |
| 30 | Add dispatch CSV export with date range and status filters. | Export content and authorization are covered by tests. |

## Wave 4 — Service workflow and evidence quality

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 31 | Add a checklist template selector for new service work orders. | A service job starts with the intended checklist items. |
| 32 | Add checklist-item help text and a “not applicable” rationale field. | A rationale is required when not applicable is selected. |
| 33 | Add checklist progress percentages at unit and work-order level. | Percentages update immediately after checklist mutations. |
| 34 | Add before-evidence upload guidance with accepted file types and size feedback. | Invalid uploads receive a recoverable message. |
| 35 | Add after-evidence upload guidance with equivalent constraints and visible pairing. | Paired evidence is clearly associated to the same unit and step. |
| 36 | Add evidence captions and optional service-condition notes. | Captions are persistent, sanitized, and role-gated for editing. |
| 37 | Add evidence metadata displaying uploader, capture time, and review state. | Metadata never exposes storage credentials or internal keys. |
| 38 | Add a technician-side evidence completeness indicator before review submission. | The interface explains exactly what is missing. |
| 39 | Add a “submit for review” confirmation that summarizes checklist and evidence readiness. | The submit action is unavailable until readiness rules are satisfied. |
| 40 | Add a service activity timeline that interleaves status changes, evidence, and reviews. | Timeline entries are chronological, attributed, and empty-state safe. |

## Wave 5 — Review, certificates, and exceptions

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 41 | Add reviewer filtering for awaiting-review jobs by due date and site. | Reviewers can narrow queues without losing status context. |
| 42 | Add a structured reviewer decision form with approve, return, and flag outcomes. | Every outcome requires a valid reason where appropriate. |
| 43 | Add a return-for-correction workflow that reopens the correct field action. | Technician sees a clear correction task and reviewer note. |
| 44 | Add evidence-flag severity levels with consistent visual and written risk language. | Severity informs but never auto-certifies a service outcome. |
| 45 | Add exception generation from flagged evidence with the actual work-order site linkage. | The exception points to the correct site and source evidence. |
| 46 | Add exception ownership assignment with an explicit due date. | Unassigned exceptions remain visibly distinct in the queue. |
| 47 | Add exception acknowledgement with a timestamp and accountable operator. | Acknowledgement does not close the exception. |
| 48 | Add exception resolution notes and manager-only closure. | Closure requires a resolution record and preserves history. |
| 49 | Add a certificate-readiness explanation panel showing every satisfied and blocking rule. | The panel covers checklist, evidence, review, flags, and hydro-test status. |
| 50 | Add a certificate preview draft that is clearly marked as not issued until manager action. | Preview generation cannot be mistaken for a live certificate. |

## Wave 6 — Academy and competency

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 51 | Add Academy course categories for field practice, review practice, and management practice. | Courses can be filtered by category without losing progress state. |
| 52 | Add instructor-style lesson objectives above each lesson. | Objectives are concise and displayed for video, reading, quiz, and flashcard lessons. |
| 53 | Add a resume-learning action that returns an operator to their next incomplete lesson. | The route is safe when no course is active. |
| 54 | Add a lesson completion confirmation that distinguishes complete, incomplete, and retry states. | Completion state updates optimistically and reconciles on error. |
| 55 | Add quiz feedback that explains why a selected answer is correct or requires review. | Feedback is available after grading and remains accessible. |
| 56 | Add a retry rule display for quizzes without fabricating performance results. | Operators can see whether and when a retry is available. |
| 57 | Add spaced-repetition review reminders for completed flashcard lessons. | Reminder eligibility is deterministic and test-covered. |
| 58 | Add manager filters for learner role, active course, progress band, and overdue learning. | Filter state is clearable and readable on mobile. |
| 59 | Add a competency report that summarizes course progress without making external certification claims. | Report labels are explicit about internal learning status. |
| 60 | Add a decision-gated course authoring brief that lists the real content, approver, and expiry inputs needed before publishing a training course. | The brief pauses for approved content rather than inventing it. |

## Wave 7 — Collaboration, profile, and notifications

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 61 | Add direct-chat conversation search that matches people and recent message content safely. | Search is debounced and returns a helpful empty state. |
| 62 | Add a clear unread-message badge to the chat rail and mobile navigation where space permits. | Badge counts are accessible and update after marking read. |
| 63 | Add chat message delivery states that distinguish sending, sent, and failed. | Failed sends have a retry action that does not duplicate messages. |
| 64 | Add a work-order context link within applicable chat conversations. | Links are permission-aware and route to the right work order. |
| 65 | Add a message pin explanation and a compact pinned-message panel. | Operators can pin and unpin only authorized conversation content. |
| 66 | Add profile work preferences for route visibility and notification focus. | Preferences are stored per user and have accessible controls. |
| 67 | Add a profile audit view that explains role, PIN, and preference changes. | Sensitive values are never displayed. |
| 68 | Add notification grouping for duplicate operational alerts while retaining individual history. | Grouping is reversible and does not hide high-risk alerts. |
| 69 | Add notification deep links that open the relevant job, exception, Academy lesson, or conversation. | Missing records receive a recoverable not-found message. |
| 70 | Add notification retention guidance and an administrative clean-up proposal that requires a decision gate before destructive action. | The proposal contains scope, impact, and rollback considerations. |

## Wave 8 — Administration, security, and operational controls

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 71 | Add an admin overview of operators by role, active status, and current workload. | View respects manager and administrator access boundaries. |
| 72 | Add a role-permission matrix that describes access without exposing implementation details or PINs. | Matrix is sourced from current role predicates. |
| 73 | Add an operator activation/deactivation control with confirmation and audit history. | Deactivation cannot silently remove historical authorship. |
| 74 | Add a safe role-change proposal workflow that requires a second decision gate before applying elevated roles. | Proposed changes are reviewed, not automatically enacted. |
| 75 | Add a session status card that explains role-PIN session duration and re-entry behavior. | It never displays a shared PIN or session token. |
| 76 | Add PIN-access rate-limit guidance on the access page. | Copy is concise and does not reveal configured thresholds unnecessarily. |
| 77 | Add a permission-denied page with explanation, back navigation, and no information leakage. | Unauthorized navigation is graceful and test-covered. |
| 78 | Add audit-log filters by object type, action, actor, and date range. | Filters are indexed or paginated appropriately for scale. |
| 79 | Add a data export register that records who generated which operational export and when. | Only authorized operators can view the register. |
| 80 | Add an administrator decision-gate checklist for real-data migration, retention, operator access, and legal review. | The checklist requests business decisions rather than assuming them. |

## Wave 9 — Quality, accessibility, and resilience

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 81 | Add shared form validation patterns for required fields, date validity, and recoverable error copy. | All new forms follow one accessible pattern. |
| 82 | Add focus restoration for dialogs, menus, and destructive-action confirmations. | Keyboard tests verify focus returns to the trigger. |
| 83 | Audit visible focus states against the warm FireGuard palette. | Focus remains visible at normal and high contrast. |
| 84 | Add concise aria-live announcements for key async successes and failures. | Announcements are informative without excessive repetition. |
| 85 | Add responsive table-to-card adaptations for the largest operational lists. | Mobile interactions remain readable at 320px wide. |
| 86 | Add empty-state content for every list query used by primary routes. | Empty states include a valid next action where one exists. |
| 87 | Add retry affordances for failed non-destructive queries and uploads. | Retry retains user-entered form data. |
| 88 | Add error-boundary recovery actions that preserve navigation context. | A controlled failure does not trap the operator. |
| 89 | Add a performance budget report for initial route load and the largest application bundle. | Report includes practical code-splitting candidates. |
| 90 | Add visual regression routes for overview, service workbench, Academy, Chat, notifications, profile, and access. | Desktop and mobile screenshots are reproducible in the validation routine. |

## Wave 10 — Reporting, launch readiness, and decision gates

| # | Incremental prompt | Completion signal |
|---:|---|---|
| 91 | Add an operations readiness report with site, service, exception, review, and certificate-readiness sections. | Report is live-data based and clearly scopes its time range. |
| 92 | Add an Academy readiness report showing internal learning completion by role. | It explicitly avoids representing internal learning as external certification. |
| 93 | Add a manager weekly review page that links to overdue work, flagged evidence, and unowned exceptions. | Page includes an empty, healthy-state variant. |
| 94 | Add a pre-service briefing checklist that brings access notes, units, historical exceptions, and assigned technician into one view. | It is visible only to authorized operators. |
| 95 | Add a post-service review checklist that highlights missing evidence, decisions, and certificate blockers. | It maps directly to current readiness rules. |
| 96 | Add a launch-readiness scorecard for real-data onboarding, role access, approved training content, operational ownership, and backup process. | Scorecard contains decision gates instead of fabricated completion. |
| 97 | Add a decision-gated public communications plan for customer-facing status updates, without sending any messages. | It requires approved audience, copy, sender, and delivery channel. |
| 98 | Add a decision-gated external integration plan for accounting, CRM, mapping, or messaging systems. | Plan identifies data ownership, credentials, sync direction, and fallback behavior. |
| 99 | Create a release runbook covering schema changes, validation, checkpoint, rollback, and operator communication. | Runbook is aligned with the live project workflow. |
| 100 | Conduct a final autonomous program review, summarize completed prompts, list paused decision gates, and prepare the next 100-step backlog only from verified needs. | A final report distinguishes implemented work from proposed or blocked work. |

## Staged unattended execution rule

The backlog is intended to run in **small, validated batches**. An unattended run may implement a safe, internally scoped prompt, run focused and full tests, capture responsive evidence, update `todo.md`, and publish a checkpoint. It must stop and report rather than guess whenever a prompt needs a real training curriculum, customer data, external integration credentials, legal or retention policy, role elevation, shared-PIN change, external communication, a real certificate decision, or destructive data operation.
