import { createFileRoute } from "@tanstack/react-router";
import { AppView } from "@/appView";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "FireGuard Operations Hub — Workspace" },
      {
        name: "description",
        content:
          "Open a FireGuard workspace view: clients, service jobs, exceptions, academy training, reports and team operations.",
      },
      { property: "og:title", content: "FireGuard Operations Hub — Workspace" },
      {
        property: "og:description",
        content: "Clients, service jobs, exceptions, training and reports inside the FireGuard operations console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppView,
});
