export type ClientPortfolioFilter = "all" | "ready" | "review";
export type ServiceStatusFilter = "all" | "active" | "complete";
export type ExceptionStatusFilter = "all" | "open" | "resolved";
export type ClientWorkspaceView = "clients" | "sites";

export function getClientPortfolioFilter(search: string): ClientPortfolioFilter {
  const filter = new URLSearchParams(search).get("filter");
  return filter === "ready" || filter === "review" ? filter : "all";
}

export function getClientWorkspaceView(search: string): ClientWorkspaceView {
  return new URLSearchParams(search).get("view") === "sites" ? "sites" : "clients";
}

export function getServiceStatusFilter(search: string): ServiceStatusFilter {
  const status = new URLSearchParams(search).get("status");
  return status === "active" || status === "complete" ? status : "all";
}

export function getExceptionStatusFilter(search: string): ExceptionStatusFilter {
  const status = new URLSearchParams(search).get("status");
  return status === "all" || status === "resolved" ? status : "open";
}
