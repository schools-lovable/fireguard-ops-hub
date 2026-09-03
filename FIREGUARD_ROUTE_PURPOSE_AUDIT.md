# FireGuard Primary Route Purpose Audit

This completed audit defines a **single operational outcome** for every route registered in `client/src/App.tsx`. It preserves the Quiet Incident Command model: the desktop sidebar is primary navigation, and contextual links expose only the active workflow’s subpages.

| Route | Visible heading | Outcome-oriented purpose copy | Verification |
|---|---|---|---|
| `/` | Safety overview | See site readiness, work underway, and the few operational items that need an owner. | Browser route review |
| `/service` | Service schedule | Coordinate scheduled work, field progress, evidence readiness, and review handoffs. | Browser route review |
| `/service/:id` | Dynamic job identifier | Complete the selected service record with its checklist, evidence, readiness, and review history. | Browser route review on a live record |
| `/reviews` | Evidence review | Return accountable review decisions to the field workflow. | Browser route review |
| `/clients` | Client portfolio or Site directory | Locate the account or managed site that anchors readiness, service work, and exceptions. | Browser route review |
| `/clients/map` | Client Map | Locate managed sites and hand off to the correct operational record. | Browser route review |
| `/academy` | Learn with confidence | Progress through approved internal learning paths and visible learning status. | Browser route review |
| `/team` and `/staff` | Team supervision | Monitor operator presence, routes, and arrival alerts for active coverage. | Canonical route-table test and browser review of `/team` |
| `/chat` | FireGuard Chat | Keep incident updates, handoffs, and coordination inside the accountable operating workspace. | Browser route review |
| `/notifications` | In-app notifications | Review durable operational alerts, reminders, and exception history in one recoverable queue. | Browser route review |
| `/exceptions` | Exceptions | Assign, acknowledge, and track open safety gaps without losing their operational context. | Browser route review |
| `/reports` | Operational reporting | Prepare authorized operational exports with current readiness context. | Browser route review |
| `/profile` | Your operating profile | Maintain identity, access context, work readiness, and delivery settings. | Browser route review |
| `/settings` | Personal preferences | Choose how FireGuard delivers assignment, exception, and Academy prompts. | Browser route review and server-rendered header test |
| `/settings/access` | Access controls | Review role, access-PIN status, and permission history without exposing credentials. | Browser route review and server-rendered header test |
| `/support` | Operational support | Find the correct FireGuard help path for current work, learning, or account access. | Browser route review |
| `/access` | Enter operations with a role PIN | Start an approved time-limited operational role session with the required access code. | Browser route review |

The canonical catalog in `client/src/lib/routePurpose.ts` is covered by Vitest. Its route list is checked against the current route table, including the `/staff` alias. The delegated Settings header is rendered in Vitest and asserted for both Preferences and Access states.
