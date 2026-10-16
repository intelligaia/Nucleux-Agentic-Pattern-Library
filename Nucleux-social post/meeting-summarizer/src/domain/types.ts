/**
 * Domain contract for the Meeting Summarizer.
 *
 * Meetings are the primary content object. Everything Aria produces
 * (summaries, decisions, action items, answers) points back to transcript
 * segments through `SourceRef`, so every claim is traceable to a moment.
 *
 * Two distinctions are carried in the data, not just the UI:
 *  - `origin`: "aria" (extracted/generated) vs "user" (written by a person).
 *  - ActionItem.status "suggested" (Aria found it, nobody confirmed it) vs
 *    "open"/"done" (a confirmed task). External tasks only exist after an
 *    approved ExternalAction.
 */

/* ------------------------------------------------------------------ */
/* People & teams                                                      */
/* ------------------------------------------------------------------ */

export type TeamId = "product" | "design" | "engineering" | "growth" | "marketing" | "customer-success" | "external";

export interface Person {
  id: string;
  name: string;
  /** Job title, e.g. "Product Lead". */
  title: string;
  team: TeamId;
  email: string;
  /** Organisation for external participants (e.g. "Acme Logistics"). */
  org?: string;
  /** The signed-in user. Exactly one person has this. */
  isMe?: boolean;
}

/* ------------------------------------------------------------------ */
/* Meetings                                                            */
/* ------------------------------------------------------------------ */

export type MeetingType = "sync" | "review" | "research" | "planning" | "critique" | "one-on-one";

/**
 * scheduled  — on the calendar, not started
 * processing — recorded, Aria is transcribing/summarising
 * ready      — transcript + summary available
 * failed     — processing failed; recoverable via retry
 */
export type ProcessingStatus = "scheduled" | "processing" | "ready" | "failed";

export type MeetingPlatform = "zoom" | "google-meet" | "teams" | "upload";

export interface TranscriptSegment {
  id: string;
  meetingId: string;
  speakerId: string;
  /** Offset from the start of the recording, in seconds. */
  startSec: number;
  endSec: number;
  text: string;
}

export interface SummaryPoint {
  id: string;
  text: string;
  /** Transcript segments that support this point. */
  sources: SourceRef[];
}

export interface MeetingSummary {
  /** One or two sentences. Plain, factual, no filler. */
  overview: string;
  keyPoints: SummaryPoint[];
  nextSteps: SummaryPoint[];
  /** ISO timestamp the summary was generated. */
  generatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  team: TeamId;
  /** ISO start time (local wall time, no Z — demo data is single-timezone). */
  start: string;
  durationMin: number;
  hostId: string;
  participantIds: string[];
  platform: MeetingPlatform;
  status: ProcessingStatus;
  /** 0–100, only meaningful while status === "processing". */
  processingProgress?: number;
  /** Human-readable failure reason when status === "failed". */
  failureReason?: string;
  /** Short agenda/description shown for scheduled meetings. */
  agenda?: string;
  topics: string[];
  summary?: MeetingSummary;
  transcript: TranscriptSegment[];
  /** Free-form notes written by the user (not generated). */
  notes?: string;
}

/* ------------------------------------------------------------------ */
/* Provenance                                                          */
/* ------------------------------------------------------------------ */

/** A pointer to a transcript moment — the unit of provenance. */
export interface SourceRef {
  meetingId: string;
  segmentId: string;
}

/** A pointer to an external document (e.g. a Google Drive file). */
export interface DocRef {
  integrationId: IntegrationId;
  docId: string;
  /** Section heading inside the document, when the claim comes from one part. */
  section?: string;
}

export type Origin = "aria" | "user";

/* ------------------------------------------------------------------ */
/* Decisions, questions, action items                                  */
/* ------------------------------------------------------------------ */

export type DecisionStatus = "confirmed" | "unresolved";

export interface Decision {
  id: string;
  meetingId: string;
  text: string;
  /** One line of supporting context ("Event naming still blocks implementation"). */
  rationale?: string;
  status: DecisionStatus;
  topics: string[];
  sources: SourceRef[];
  origin: Origin;
  createdAt: string;
}

export interface OpenQuestion {
  id: string;
  meetingId: string;
  text: string;
  askedById: string;
  resolved: boolean;
  sources: SourceRef[];
  origin: Origin;
}

export type ActionStatus = "suggested" | "open" | "done" | "dismissed";
export type Priority = "high" | "medium" | "low";

export type TaskSystem = "linear" | "jira" | "asana" | "notion";

export interface ExternalLink {
  system: TaskSystem;
  /** e.g. "PROD-482" */
  key: string;
  url: string;
  syncedAt: string;
}

export interface ChangeRecord {
  at: string;
  by: Origin;
  /** Human-readable, e.g. "Owner: Unassigned → Sam Patel". */
  summary: string;
}

export interface ActionItem {
  id: string;
  title: string;
  ownerId: string | null;
  /** ISO date (YYYY-MM-DD) or null. */
  due: string | null;
  priority: Priority;
  status: ActionStatus;
  /** null for tasks created manually outside a meeting. */
  meetingId: string | null;
  sources: SourceRef[];
  origin: Origin;
  external?: ExternalLink;
  createdAt: string;
  history: ChangeRecord[];
}

/* ------------------------------------------------------------------ */
/* Integrations / data sources                                         */
/* ------------------------------------------------------------------ */

export type IntegrationId =
  | "google-calendar"
  | "outlook"
  | "zoom"
  | "google-meet"
  | "teams"
  | "slack"
  | "notion"
  | "google-drive"
  | "linear"
  | "jira"
  | "asana"
  | "mcp-workspace";

export type IntegrationCategory = "calendar" | "conferencing" | "messaging" | "documents" | "tasks" | "mcp";

export type IntegrationStatus = "connected" | "available" | "error";

export interface IntegrationScope {
  id: string;
  /** What Aria can do, in plain language ("Read meeting events"). */
  label: string;
  /** Why Aria needs it. */
  reason: string;
  /** Read-only scopes are pre-selected; write scopes are opt-in. */
  access: "read" | "write";
  required: boolean;
}

export interface Integration {
  id: IntegrationId;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  scopes: IntegrationScope[];
  /** Scope ids the user granted (subset of scopes). */
  grantedScopeIds: string[];
  account?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  /** For the MCP server connection only. */
  mcp?: { url: string; tools: string[] };
}

/** A document that becomes available once its integration is connected. */
export interface ExternalDoc {
  id: string;
  integrationId: IntegrationId;
  title: string;
  owner: string;
  updatedAt: string;
  url: string;
  sections: { heading: string; body: string }[];
}

/* ------------------------------------------------------------------ */
/* Aria — context, runs, answers                                       */
/* ------------------------------------------------------------------ */

/** Everything Aria can be pointed at. Always visible and removable as chips. */
export type ContextItem =
  | { kind: "meeting"; id: string; meetingId: string }
  | { kind: "meeting-set"; id: string; label: string; meetingIds: string[] }
  | {
      kind: "selection";
      id: string;
      meetingId: string;
      segmentIds: string[];
      startSec: number;
      endSec: number;
      text: string;
    }
  | { kind: "file"; id: string; name: string; sizeKb: number; mime: string }
  | { kind: "doc"; id: string; ref: DocRef; label: string };

export type AgentRunStatus = "working" | "needs-input" | "done" | "error" | "stopped";

/** A meaningful unit of system activity — never chain-of-thought. */
export interface AgentRunStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error" | "skipped";
  /** Optional factual detail, e.g. "6 meetings · 41 segments". */
  detail?: string;
}

/** Structured answer content. Prose is kept short; structure carries meaning. */
export type AnswerBlock =
  | { kind: "text"; text: string }
  | { kind: "bullets"; items: { text: string; sources: SourceRef[] }[] }
  | { kind: "decisions"; decisionIds: string[] }
  | { kind: "actions"; actionIds: string[] }
  | { kind: "action-draft"; draft: ActionDraft; resolution?: DraftResolution }
  | { kind: "decision-draft"; draft: DecisionDraft; resolution?: DraftResolution }
  | { kind: "comparison"; rows: ComparisonRow[]; docRef: DocRef }
  | { kind: "email-draft"; to: string[]; subject: string; body: string }
  | { kind: "owner-review"; actionIds: string[]; resolution?: DraftResolution };

/** What the user did with something Aria prepared. Drafts never apply themselves. */
export interface DraftResolution {
  state: "added" | "discarded";
  /** Id of the record created when state === "added". */
  recordId?: string;
  at: string;
}

/** Why Aria inferred a draft value — shown next to the field so the user can judge it. */
export interface Inference {
  field: "owner" | "due" | "priority" | "title";
  reason: string;
}

export interface ActionDraft {
  title: string;
  ownerId: string | null;
  due: string | null;
  priority: Priority;
  meetingId: string;
  sources: SourceRef[];
  inferences: Inference[];
}

export interface DecisionDraft {
  text: string;
  rationale?: string;
  meetingId: string;
  sources: SourceRef[];
}

export interface ComparisonRow {
  topic: string;
  meeting: string;
  brief: string;
  verdict: "aligned" | "conflict" | "not-in-brief" | "not-discussed";
  sources: SourceRef[];
  docSection?: string;
}

/** What Aria is blocked on. The user always resolves gates explicitly. */
export type AgentGate =
  | { kind: "connect"; integrationId: IntegrationId; reason: string }
  | { kind: "approve"; action: ExternalAction };

/** A consequential write to another system. Never executed without approval. */
export interface ExternalAction {
  id: string;
  system: TaskSystem;
  /** "Create 1 issue in Linear · Team PROD" */
  summary: string;
  actionIds: string[];
  /** Field/value pairs shown in the approval ("Project", "Assignee", "Due"…). */
  fields: { label: string; value: string }[];
}

export interface UserTurn {
  id: string;
  role: "user";
  text: string;
  /** Snapshot of the context chips at send time. */
  context: ContextItem[];
  at: string;
}

export interface AgentTurn {
  id: string;
  role: "assistant";
  status: AgentRunStatus;
  steps: AgentRunStep[];
  blocks: AnswerBlock[];
  sources: SourceRef[];
  docSources: DocRef[];
  followUps: string[];
  gate?: AgentGate;
  error?: string;
  at: string;
}

export type AriaTurn = UserTurn | AgentTurn;

export interface AriaThread {
  id: string;
  title: string;
  turns: AriaTurn[];
  createdAt: string;
  updatedAt: string;
}

/** A proactive observation Aria surfaces. Dismissible; never acts on its own. */
export interface ProactiveSuggestion {
  id: string;
  text: string;
  /** Label for the primary affordance, e.g. "Review". */
  actionLabel: string;
  /** Where the primary affordance leads. */
  target:
    | { kind: "owner-review"; actionIds: string[] }
    | { kind: "decisions"; meetingIds: string[] }
    | { kind: "meeting"; meetingId: string };
  sources: SourceRef[];
}
