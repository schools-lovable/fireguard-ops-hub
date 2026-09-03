import { useEffect, useMemo, useState, type FormEvent } from "react";
import React from "react";
import { Archive, BellOff, CheckCheck, CirclePlus, Loader2, MessageCircleMore, Pin, Search, SendHorizontal, ShieldCheck, SmilePlus, Timer, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { ActionButton, ExtinguisherLoader, LoadSuccessCue, PageHeader, StatusBadge, useLoadSuccessCue } from "@/components/FireGuardUI";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

type InboxFilter = "all" | "unread" | "archived";

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function relativeTime(value: Date) {
  const delta = Date.now() - new Date(value).getTime();
  if (delta < 60_000) return "now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

export default function Chat() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [isGroupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<number[]>([]);
  const [isTemporaryGroup, setTemporaryGroup] = useState(false);
  const [contextLabel, setContextLabel] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const [customDurationHours, setCustomDurationHours] = useState("");
  const [linkedClientId, setLinkedClientId] = useState("");
  const [extensionHours, setExtensionHours] = useState(24);
  const [isArchiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const inbox = trpc.fireguard.chat.inbox.useQuery(undefined, { staleTime: 10_000, refetchOnWindowFocus: true });
  const inboxSuccessPhase = useLoadSuccessCue(inbox.isLoading);
  const workspace = trpc.fireguard.workspace.useQuery(undefined, { staleTime: 60_000 });
  const thread = trpc.fireguard.chat.conversation.useQuery({ conversationId: selectedConversationId ?? 0 }, { enabled: Boolean(selectedConversationId), staleTime: 5_000 });
  const refreshChat = () => {
    void utils.fireguard.chat.inbox.invalidate();
    if (selectedConversationId) void utils.fireguard.chat.conversation.invalidate({ conversationId: selectedConversationId });
  };
  const send = trpc.fireguard.chat.send.useMutation({ onSuccess: () => { setComposer(""); refreshChat(); }, onError: error => toast.error(error.message) });
  const createDirect = trpc.fireguard.chat.createDirect.useMutation({ onSuccess: detail => { setSelectedConversationId(detail.conversation.id); refreshChat(); }, onError: error => toast.error(error.message) });
  const resetGroupForm = () => { setGroupDialogOpen(false); setGroupTitle(""); setGroupMemberIds([]); setTemporaryGroup(false); setContextLabel(""); setDurationHours(24); setCustomDurationHours(""); setLinkedClientId(""); };
  const createGroup = trpc.fireguard.chat.createGroup.useMutation({ onSuccess: detail => { setSelectedConversationId(detail.conversation.id); resetGroupForm(); refreshChat(); }, onError: error => toast.error(error.message) });
  const createTemporaryGroup = trpc.fireguard.chat.createTemporaryGroup.useMutation({ onSuccess: detail => { setSelectedConversationId(detail.conversation.id); toast.success("Temporary coordination thread created."); resetGroupForm(); refreshChat(); }, onError: error => toast.error(error.message) });
  const extendTemporaryThread = trpc.fireguard.chat.extendTemporaryThread.useMutation({ onSuccess: () => { toast.success(`Thread extended by ${extensionHours} hour${extensionHours === 1 ? "" : "s"}.`); refreshChat(); }, onError: error => toast.error(error.message) });
  const archiveTemporaryThread = trpc.fireguard.chat.archiveTemporaryThread.useMutation({ onSuccess: () => { setArchiveConfirmOpen(false); toast.success("Temporary thread archived for every member."); refreshChat(); }, onError: error => toast.error(error.message) });
  const addMembers = trpc.fireguard.chat.addMembers.useMutation({ onSuccess: () => { toast.success("Teammate added to the coordination group."); refreshChat(); }, onError: error => toast.error(error.message) });
  const updateControl = trpc.fireguard.chat.toggleInboxControl.useMutation({ onSuccess: refreshChat, onError: error => toast.error(error.message) });
  const markRead = trpc.fireguard.chat.markRead.useMutation({ onSuccess: () => void utils.fireguard.chat.inbox.invalidate() });
  const toggleReaction = trpc.fireguard.chat.toggleReaction.useMutation({ onSuccess: refreshChat, onError: error => toast.error(error.message) });

  useEffect(() => {
    const firstConversation = inbox.data?.conversations.find(conversation => !conversation.viewer.archivedAt) ?? inbox.data?.conversations[0];
    if (!selectedConversationId && firstConversation) setSelectedConversationId(firstConversation.id);
  }, [inbox.data?.conversations, selectedConversationId]);

  useEffect(() => {
    const latestMessageId = thread.data?.messages.at(-1)?.id;
    if (selectedConversationId && latestMessageId) markRead.mutate({ conversationId: selectedConversationId });
  }, [selectedConversationId, thread.data?.messages.at(-1)?.id]);

  const conversations = useMemo(() => (inbox.data?.conversations ?? []).filter(conversation => {
    const matchesSearch = conversation.displayName.toLowerCase().includes(search.trim().toLowerCase());
    const matchesFilter = filter === "archived" ? Boolean(conversation.viewer.archivedAt) : filter === "unread" ? conversation.unreadCount > 0 && !conversation.viewer.archivedAt : !conversation.viewer.archivedAt;
    return matchesSearch && matchesFilter;
  }), [filter, inbox.data?.conversations, search]);
  const active = thread.data;
  const isArchivedThread = Boolean(active?.conversation.isArchived);
  const isThreadCreator = Boolean(active?.conversation.isTemporary && !isArchivedThread && active.conversation.createdByUserId === user?.id);
  const canAdministerGroup = active?.conversation.kind === "group" && ["owner", "admin"].includes(active.viewer.role);
  const availableMembers = (inbox.data?.people ?? []).filter(person => !active?.members.some(member => member.id === person.id));

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || !composer.trim()) return;
    send.mutate({ conversationId: selectedConversationId, body: composer.trim() });
  }

  function submitGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!groupTitle.trim() || !groupMemberIds.length) return;
    if (isTemporaryGroup) {
      if (!contextLabel.trim()) return;
      const selectedDuration = durationHours === 0 ? Number(customDurationHours) : durationHours;
      if (!Number.isInteger(selectedDuration) || selectedDuration < 1 || selectedDuration > 168) {
        toast.error("Choose a whole-number expiry from 1 hour to 7 days.");
        return;
      }
      createTemporaryGroup.mutate({ title: groupTitle.trim(), contextLabel: contextLabel.trim(), clientId: linkedClientId ? Number(linkedClientId) : null, durationHours: selectedDuration, memberUserIds: groupMemberIds });
      return;
    }
    createGroup.mutate({ title: groupTitle.trim(), memberUserIds: groupMemberIds });
  }

  return <div className="chat-page page-enter"><LoadSuccessCue phase={inboxSuccessPhase} label="Coordination ready" detail="The latest team handoffs are live" />
    <PageHeader eyebrow="Coordination" title="Fireguard Chat" description="Keep incident updates, handoffs, and on-site coordination inside the operational record.">
      <ActionButton icon={UsersRound} onClick={() => setGroupDialogOpen(true)}>New group</ActionButton>
    </PageHeader>

    <section className="chat-workspace" aria-label="Fireguard Chat">
      <aside className="surface-card chat-inbox" aria-label="Conversation inbox">
        <div className="chat-inbox-heading"><div><span className="soft-label">Inbox</span><h2>Coordination</h2></div><span className="chat-inbox-count">{inbox.data?.conversations.length ?? 0}</span></div>
        <label className="chat-search"><Search size={15} /><span className="sr-only">Search conversations</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search inbox" /></label>
        <div className="chat-filter-tabs" aria-label="Inbox filters"><button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>Current</button><button type="button" className={filter === "unread" ? "is-active" : ""} onClick={() => setFilter("unread")}>Unread</button><button type="button" className={filter === "archived" ? "is-active" : ""} onClick={() => setFilter("archived")}>Archived</button></div>
        <div className="chat-conversation-list" aria-live="polite">
          {inbox.isLoading && <ExtinguisherLoader compact label="Loading conversations" detail="Clearing a secure line to the team" />}
          {!inbox.isLoading && conversations.length === 0 && <p className="chat-empty"><MessageCircleMore size={18} /> No conversations match this view.</p>}
          {conversations.map(conversation => <div className={`chat-conversation-row ${conversation.id === selectedConversationId ? "is-active" : ""}`} key={conversation.id}>
            <button type="button" className="chat-conversation-select" onClick={() => setSelectedConversationId(conversation.id)} aria-current={conversation.id === selectedConversationId ? "page" : undefined}>
              <span className="chat-avatar" aria-hidden="true">{initials(conversation.displayName)}</span><span className="chat-conversation-copy"><span><strong>{conversation.displayName}</strong>{conversation.isTemporary && <em className="chat-temporary-pill"><Timer size={11} />Temporary</em>}{conversation.lastMessage && <time dateTime={conversation.lastMessage.createdAt.toISOString()}>{relativeTime(conversation.lastMessage.createdAt)}</time>}</span><small>{conversation.contextLabel ? `${conversation.contextLabel} · ` : ""}{conversation.lastMessage ? `${conversation.lastMessage.authorName}: ${conversation.lastMessage.body}` : conversation.isArchived ? "Archived temporary thread" : "No messages yet"}</small></span>{conversation.unreadCount > 0 && <span className="chat-unread-count" aria-label={`${conversation.unreadCount} unread messages`}>{conversation.unreadCount}</span>}
            </button>
            <div className="chat-row-controls"><button type="button" onClick={() => updateControl.mutate({ conversationId: conversation.id, action: "pin" })} aria-label={conversation.viewer.pinnedAt ? "Unpin conversation" : "Pin conversation"} className={conversation.viewer.pinnedAt ? "is-on" : ""}><Pin size={13} /></button><button type="button" onClick={() => updateControl.mutate({ conversationId: conversation.id, action: "archive" })} aria-label={conversation.viewer.archivedAt ? "Restore conversation" : "Archive conversation"}><Archive size={13} /></button></div>
          </div>)}
        </div>
        <div className="chat-start-direct"><span className="soft-label">Start a direct chat</span>{(inbox.data?.people ?? []).slice(0, 5).map(person => <button type="button" key={person.id} onClick={() => createDirect.mutate({ recipientUserId: person.id })} disabled={createDirect.isPending}><span className="chat-avatar is-small">{initials(person.name ?? "FireGuard operator")}</span><span>{person.name ?? "FireGuard operator"}</span><CirclePlus size={14} /></button>)}</div>
      </aside>

      <main className="surface-card chat-thread" aria-label="Conversation thread">
        {!selectedConversationId && <div className="chat-thread-empty"><MessageCircleMore size={28} /><h2>Choose a conversation</h2><p>Select a teammate to begin a direct chat, or create a group for a shared operational handoff.</p></div>}
        {selectedConversationId && thread.isLoading && <div className="chat-thread-empty"><ExtinguisherLoader label="Opening secure conversation" detail="Charging the protected operational record" /></div>}
        {selectedConversationId && thread.error && <div className="chat-thread-empty is-error"><h2>Conversation unavailable</h2><p>{thread.error.message}</p><button type="button" className="quiet-button" onClick={() => void thread.refetch()}>Try again</button></div>}
        {active && <><header className="chat-thread-header"><div><div className="chat-thread-title"><span className="chat-avatar">{initials(active.conversation.kind === "group" ? (active.conversation.title ?? "Group") : active.members.find(member => member.id !== user?.id)?.name ?? "Direct")}</span><div><span className="soft-label">{active.conversation.isTemporary ? `Temporary coordination · ${active.conversation.contextLabel}` : active.conversation.kind === "group" ? "Group coordination" : "Direct coordination"}</span><h2>{active.conversation.kind === "group" ? active.conversation.title : active.members.find(member => member.id !== user?.id)?.name ?? "Direct coordination"}</h2>{active.conversation.isTemporary && <p className={`chat-expiry-note ${isArchivedThread ? "is-archived" : ""}`}><Timer size={13} />{isArchivedThread ? "Archived automatically after its timer ended." : `Archives automatically ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(active.conversation.expiresAt!)}`}</p>}</div></div></div><div className="chat-thread-actions"><button type="button" className={active.viewer.pinnedAt ? "is-active" : ""} onClick={() => updateControl.mutate({ conversationId: active.conversation.id, action: "pin" })} aria-label={active.viewer.pinnedAt ? "Unpin conversation" : "Pin conversation"}><Pin size={16} /></button><button type="button" className={active.viewer.isMuted ? "is-active" : ""} onClick={() => updateControl.mutate({ conversationId: active.conversation.id, action: "mute" })} aria-label={active.viewer.isMuted ? "Unmute conversation" : "Mute conversation for seven days"}><BellOff size={16} /></button><button type="button" onClick={() => updateControl.mutate({ conversationId: active.conversation.id, action: "archive" })} aria-label="Archive conversation" disabled={isArchivedThread}><Archive size={16} /></button></div></header>
          <div className="chat-message-list" aria-live="polite">{active.messages.length === 0 && <div className="chat-thread-empty is-compact"><ShieldCheck size={23} /><h2>Start the operational record</h2><p>Messages are visible only to members of this conversation.</p></div>}{active.messages.map(message => { const isMine = message.authorUserId === user?.id; return <article className={`chat-message ${isMine ? "is-mine" : ""}`} key={message.id}><span className="chat-avatar is-small" aria-hidden="true">{initials(message.authorName)}</span><div className="chat-message-content"><div className="chat-message-meta"><strong>{isMine ? "You" : message.authorName}</strong><span>{relativeTime(message.createdAt)}</span></div><p>{message.body}</p><div className="chat-reactions">{message.reactions.map(reaction => <button type="button" key={reaction.emoji} onClick={() => toggleReaction.mutate({ messageId: message.id, emoji: reaction.emoji })} className={reaction.reactedByViewer ? "is-reacted" : ""} aria-label={`Toggle ${reaction.emoji} reaction`}><span>{reaction.emoji}</span>{reaction.count}</button>)}<button type="button" className="chat-add-reaction" onClick={() => toggleReaction.mutate({ messageId: message.id, emoji: "👍" })} aria-label="Add acknowledgement reaction"><SmilePlus size={13} /></button></div></div></article>; })}</div>
          <form className="chat-composer" onSubmit={submitMessage}><label className="sr-only" htmlFor="chat-message">Write a message</label><textarea id="chat-message" value={composer} onChange={event => setComposer(event.target.value)} placeholder={isArchivedThread ? "This temporary thread is archived and kept as a read-only record." : active.viewer.isMuted ? "Conversation muted for seven days. You can still send a message." : "Write a concise operational update…"} rows={2} maxLength={5000} disabled={isArchivedThread} /><button type="submit" className="command-button" disabled={isArchivedThread || !composer.trim() || send.isPending}>{send.isPending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}<span className="sr-only">Send message</span></button></form>
        </>}
      </main>

      <aside className="surface-card chat-inspector" aria-label="Conversation details">
        {active ? <><div className="chat-inspector-heading"><div><span className="soft-label">Thread details</span><h2>{active.members.length} member{active.members.length === 1 ? "" : "s"}</h2></div>{active.viewer.isMuted && <StatusBadge tone="neutral">Muted</StatusBadge>}</div><div className="chat-member-list">{active.members.map(member => <div key={member.id} className="chat-member"><span className="chat-avatar is-small">{initials(member.name)}</span><span><strong>{member.id === user?.id ? "You" : member.name}</strong><small>{member.role}{member.isActive ? " · active" : ""}</small></span><i className={member.isActive ? "is-active" : ""} aria-label={member.isActive ? "Active" : "Away"} /></div>)}</div>{isThreadCreator && <section className="chat-temporary-controls" aria-label="Temporary thread controls"><div><span className="soft-label">Creator controls</span><h3>Manage timer</h3></div><label>Extend by<select value={extensionHours} onChange={event => setExtensionHours(Number(event.target.value))}><option value={1}>1 hour</option><option value={6}>6 hours</option><option value={12}>12 hours</option><option value={24}>24 hours</option><option value={48}>48 hours</option></select></label><button type="button" className="quiet-button" onClick={() => extendTemporaryThread.mutate({ conversationId: active.conversation.id, additionalHours: extensionHours })} disabled={extendTemporaryThread.isPending}><Timer size={14} />{extendTemporaryThread.isPending ? "Extending…" : "Extend timer"}</button><button type="button" className="chat-archive-all" onClick={() => setArchiveConfirmOpen(true)}><Archive size={14} />Archive for everyone</button><p>Only the creator can change this temporary thread. Archiving keeps the record readable but locks activity for every member.</p></section>}{active.conversation.isTemporary && !isArchivedThread && !isThreadCreator && <div className="chat-temporary-viewer-note"><Timer size={14} /><p>Only the thread creator can extend the timer or archive this shared record early.</p></div>}{canAdministerGroup && <div className="chat-add-members"><span className="soft-label">Add operator</span>{availableMembers.length ? availableMembers.map(person => <button key={person.id} type="button" onClick={() => addMembers.mutate({ conversationId: active.conversation.id, memberUserIds: [person.id] })} disabled={addMembers.isPending}><span>{person.name ?? "FireGuard operator"}</span><CirclePlus size={14} /></button>) : <p>All known operators are already in this group.</p>}</div>}<div className="chat-record-note"><ShieldCheck size={15} /><p>Conversation membership, read state, reactions, and inbox controls are stored with the FireGuard workspace.</p></div></> : <div className="chat-thread-empty is-compact"><UsersRound size={23} /><h2>Team coordination</h2><p>Open a conversation to see its members and message record.</p></div>}
      </aside>
    </section>

    <Dialog open={isGroupDialogOpen} onOpenChange={setGroupDialogOpen}><DialogContent className="chat-group-dialog"><DialogHeader><DialogTitle>Start a coordination group</DialogTitle><DialogDescription>Create a durable group, or set up a short-lived client, project, incident, or handoff thread that archives automatically when its timer ends.</DialogDescription></DialogHeader><form onSubmit={submitGroup} className="chat-group-form"><label>Group name<input value={groupTitle} onChange={event => setGroupTitle(event.target.value)} placeholder="e.g. Riverside evidence review" maxLength={120} autoFocus /></label><label className="chat-temporary-toggle"><input type="checkbox" checked={isTemporaryGroup} onChange={event => setTemporaryGroup(event.target.checked)} /><span><strong>Temporary thread</strong><small>Archive the full thread for every member when the timer ends.</small></span></label>{isTemporaryGroup && <div className="chat-temporary-fields"><label>Project, client, incident, or handoff context<input value={contextLabel} onChange={event => setContextLabel(event.target.value)} placeholder="e.g. Riverside Tower · annual service" maxLength={160} /></label><label>Linked client <select value={linkedClientId} onChange={event => setLinkedClientId(event.target.value)}><option value="">No client link</option>{(workspace.data?.clients ?? []).map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label>Archive after<select value={durationHours} onChange={event => setDurationHours(Number(event.target.value))}><option value={24}>24 hours</option><option value={48}>48 hours</option><option value={72}>72 hours</option><option value={168}>7 days</option><option value={0}>Custom duration…</option></select></label>{durationHours === 0 && <label>Custom hours (1–168)<input type="number" min="1" max="168" step="1" inputMode="numeric" value={customDurationHours} onChange={event => setCustomDurationHours(event.target.value)} placeholder="e.g. 36" /></label>}<p><Timer size={14} />The thread will remain readable to its members and will archive automatically within 15 minutes of this expiry.</p></div>}<fieldset><legend>Select teammates</legend><div className="chat-group-people">{(inbox.data?.people ?? []).map(person => <label key={person.id}><input type="checkbox" checked={groupMemberIds.includes(person.id)} onChange={() => setGroupMemberIds(current => current.includes(person.id) ? current.filter(id => id !== person.id) : [...current, person.id])} /><span className="chat-avatar is-small">{initials(person.name ?? "FireGuard operator")}</span><span>{person.name ?? "FireGuard operator"}</span></label>)}</div></fieldset><div className="chat-group-actions"><button type="button" className="quiet-button" onClick={resetGroupForm}>Cancel</button><button type="submit" className="command-button" disabled={!groupTitle.trim() || !groupMemberIds.length || (isTemporaryGroup && (!contextLabel.trim() || (durationHours === 0 && !customDurationHours))) || createGroup.isPending || createTemporaryGroup.isPending}>{(createGroup.isPending || createTemporaryGroup.isPending) && <Loader2 size={15} className="animate-spin" />}{isTemporaryGroup ? "Create temporary thread" : "Create group"}</button></div></form></DialogContent></Dialog>
    <Dialog open={isArchiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}><DialogContent className="chat-archive-dialog"><DialogHeader><DialogTitle>Archive this thread for everyone?</DialogTitle><DialogDescription>This permanently ends activity in the temporary coordination thread. Every member can still read the record from Archived conversations.</DialogDescription></DialogHeader><div className="chat-group-actions"><button type="button" className="quiet-button" onClick={() => setArchiveConfirmOpen(false)}>Keep thread active</button><button type="button" className="command-button is-danger" onClick={() => active && archiveTemporaryThread.mutate({ conversationId: active.conversation.id })} disabled={archiveTemporaryThread.isPending}>{archiveTemporaryThread.isPending && <Loader2 size={15} className="animate-spin" />}Archive for everyone</button></div></DialogContent></Dialog>
  </div>;
}
