# FireGuard access mode

FireGuard is currently running with **direct access enabled** in `shared/accessMode.ts`. Requests without a Manus session resolve to the provisioned `FireGuard Admin` local role account, allowing the workspace to open without a Manus OAuth redirect.

> Direct access is temporary. All visitors share the administrator context, so individual attribution and per-person session separation are intentionally paused.

To restore Manus authentication, change `FIREGUARD_DIRECT_ACCESS` from `true` to `false` in `shared/accessMode.ts`, then create a new published checkpoint. The server will resume `sdk.authenticateRequest`, the client will resume redirecting unauthorized requests to Manus OAuth, and the account menu will restore its sign-out action.
