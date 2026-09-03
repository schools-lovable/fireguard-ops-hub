// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTemporary: vi.fn(),
  createGroup: vi.fn(),
  noop: vi.fn(),
  activeConversation: undefined as unknown,
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock("@/components/FireGuardUI", () => ({
  ActionButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => <button type="button" onClick={onClick}>{children}</button>,
  ExtinguisherLoader: () => <div>Loading</div>,
  LoadSuccessCue: () => null,
  PageHeader: ({ children, title }: { children: React.ReactNode; title: string }) => <header><h1>{title}</h1>{children}</header>,
  StatusBadge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useLoadSuccessCue: () => "idle",
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ fireguard: { chat: { inbox: { invalidate: mocks.noop }, conversation: { invalidate: mocks.noop } } } }),
    fireguard: {
      workspace: { useQuery: () => ({ data: { clients: [{ id: 7, name: "Riverside Tower" }] } }) },
      chat: {
        inbox: { useQuery: () => ({ data: { conversations: [], people: [{ id: 2, name: "Jordan Lee" }] }, isLoading: false }) },
        conversation: { useQuery: () => ({ data: mocks.activeConversation, isLoading: false, error: null }) },
        send: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        createDirect: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        createGroup: { useMutation: () => ({ mutate: mocks.createGroup, isPending: false }) },
        createTemporaryGroup: { useMutation: () => ({ mutate: mocks.createTemporary, isPending: false }) },
        extendTemporaryThread: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        archiveTemporaryThread: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        addMembers: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        toggleInboxControl: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        markRead: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
        toggleReaction: { useMutation: () => ({ mutate: mocks.noop, isPending: false }) },
      },
    },
  },
}));

import Chat from "./Chat";

describe("temporary chat thread creation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.activeConversation = undefined; });
  afterEach(cleanup);

  it("submits selected members, linked client, context, and a custom expiry duration", () => {
    render(<Chat />);
    fireEvent.click(screen.getByRole("button", { name: "New group" }));
    fireEvent.change(screen.getByLabelText("Group name"), { target: { value: "Riverside service handoff" } });
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(screen.getByLabelText("Project, client, incident, or handoff context"), { target: { value: "Riverside Tower annual service" } });
    fireEvent.change(screen.getByLabelText("Linked client"), { target: { value: "7" } });
    fireEvent.change(screen.getByLabelText("Archive after"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Custom hours (1–168)"), { target: { value: "36" } });
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Create temporary thread" }));

    expect(mocks.createTemporary).toHaveBeenCalledWith({
      title: "Riverside service handoff",
      contextLabel: "Riverside Tower annual service",
      clientId: 7,
      durationHours: 36,
      memberUserIds: [2],
    });
  });

  it("shows extend and archive controls only to the creator, while members see the lifecycle boundary", () => {
    mocks.activeConversation = {
      conversation: {
        id: 81,
        kind: "group",
        title: "Riverside handoff",
        contextLabel: "Riverside Tower annual service",
        isTemporary: true,
        isArchived: false,
        createdByUserId: 1,
        expiresAt: new Date("2026-08-26T10:00:00.000Z"),
      },
      viewer: { role: "owner", isMuted: false, pinnedAt: null, archivedAt: null },
      members: [{ id: 1, name: "FireGuard Admin", role: "owner", isActive: true }],
      messages: [],
    };
    const { rerender } = render(<Chat />);
    expect(screen.getByText("Manage timer")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Extend timer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archive for everyone" })).toBeTruthy();

    mocks.activeConversation = {
      ...mocks.activeConversation as Record<string, unknown>,
      conversation: { ...(mocks.activeConversation as { conversation: Record<string, unknown> }).conversation, createdByUserId: 2 },
      viewer: { role: "member", isMuted: false, pinnedAt: null, archivedAt: null },
    };
    rerender(<Chat />);
    expect(screen.queryByText("Manage timer")).toBeNull();
    expect(screen.getByText("Only the thread creator can extend the timer or archive this shared record early.")).toBeTruthy();
  });
});
