import { createFileRoute } from "@tanstack/react-router";
import { AppView } from "@/appView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FireGuard Operations Hub — Fire Readiness Command Centre" },
      {
        name: "description",
        content:
          "FireGuard Operations Hub coordinates fire-safety inspections, client sites, extinguisher compliance and field teams in one calm operations console.",
      },
      { property: "og:title", content: "FireGuard Operations Hub" },
      {
        property: "og:description",
        content: "Track inspections, compliance and field teams across every FireGuard client site.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppView,
});
