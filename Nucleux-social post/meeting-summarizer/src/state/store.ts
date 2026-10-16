import { useRef, useSyncExternalStore } from "react";
import { seed } from "@/data";
import type {
  ActionItem,
  AgentTurn,
  AriaThread,
  AriaTurn,
  ChangeRecord,
  ContextItem,
  Decision,
  ExternalLink,
  Integration,
  IntegrationId,
  Meeting,
  OpenQuestion,
  Origin,
  Person,
} from "@/domain/types";
import { nowIso } from "@/lib/time";

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export interface Settings {
  /** Shown in the composer's model selector. */
  model: string;
  /** Aria surfaces proactive suggestions on the dashboard. */
  proactive: boolean;
  /** Aria extracts suggested action items automatically after processing. */
  autoExtract: boolean;
  /** Days transcripts are retained. */
  retentionDays: number;
  theme: "system" | "light" | "dark";
}

export interface AppState {
  people: Person[];
  meetings: Meeting[];
  decisions: Decision[];
  questions: OpenQuestion[];
  actions: ActionItem[];
  integrations: Integration[];
  threads: AriaThread[];
  activeThreadId: string | null;
  /** Context chips attached to the shared Aria composer. Always visible. */
  context: ContextItem[];
  /** Unsent composer text — user work is preserved across navigation. */
  draft: string;
  /** Whether the contextual Aria panel is open (meeting detail, tasks…). */
  ariaPanelOpen: boolean;
  dismissedSuggestionIds: string[];
  onboarded: boolean;
  settings: Settings;
}

const STORAGE_KEY = "msz:v1";

function initialState(): AppState {
  return {
    people: seed.people,
    meetings: seed.meetings,
    decisions: seed.decisions,
    questions: seed.questions,
    actions: seed.actions,
    integrations: seed.integrations,
    threads: seed.threads,
    activeThreadId: null,
    context: [],
    draft: "",
    ariaPanelOpen: false,
    dismissedSuggestionIds: [],
    onboarded: false,
    settings: { model: "aria-standard", proactive: true, autoExtract: true, retentionDays: 365, theme: "system" },
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Agent runs that were mid-flight when the page closed resume as "stopped".
    const threads = (parsed.threads ?? seed.threads).map((t) => ({
      ...t,
      turns: t.turns.map((turn) =>
        turn.role === "assistant" && turn.status === "working" ? { ...turn, status: "stopped" as const } : turn,
      ),
    }));
    return { ...initialState(), ...parsed, threads, ariaPanelOpen: false };
  } catch {
    return initialState();
  }
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type Action =
  | { type: "action/add"; item: ActionItem }
  | { type: "action/update"; id: string; patch: Partial<Pick<ActionItem, "title" | "ownerId" | "due" | "priority" | "status">>; by: Origin }
  | { type: "action/link"; ids: string[]; link: Omit<ExternalLink, "key">; keys: string[] }
  | { type: "decision/add"; decision: Decision }
  | { type: "decision/update"; id: string; patch: Partial<Pick<Decision, "text" | "status">> }
  | { type: "question/resolve"; id: string; resolved: boolean }
  | { type: "meeting/update"; id: string; patch: Partial<Pick<Meeting, "status" | "processingProgress" | "failureReason" | "notes">> }
  | { type: "integration/connect"; id: IntegrationId; grantedScopeIds: string[]; account?: string }
  | { type: "integration/disconnect"; id: IntegrationId }
  | { type: "thread/new"; thread: AriaThread }
  | { type: "thread/select"; id: string | null }
  | { type: "thread/delete"; id: string }
  | { type: "thread/append"; threadId: string; turn: AriaTurn }
  | { type: "thread/update-turn"; threadId: string; turnId: string; patch: Partial<AgentTurn> }
  | { type: "context/set"; items: ContextItem[] }
  | { type: "context/add"; item: ContextItem }
  | { type: "context/remove"; id: string }
  | { type: "draft/set"; text: string }
  | { type: "aria-panel/set"; open: boolean }
  | { type: "suggestion/dismiss"; id: string }
  | { type: "onboarding/complete" }
  | { type: "settings/update"; patch: Partial<Settings> }
  | { type: "demo/reset" };

function describePatch(item: ActionItem, patch: Partial<ActionItem>, people: Person[]): string[] {
  const name = (id: string | null) => (id ? people.find((p) => p.id === id)?.name ?? id : "Unassigned");
  const out: string[] = [];
  if ("ownerId" in patch && patch.ownerId !== item.ownerId) out.push(`Owner: ${name(item.ownerId)} → ${name(patch.ownerId ?? null)}`);
  if ("due" in patch && patch.due !== item.due) out.push(`Due: ${item.due ?? "none"} → ${patch.due ?? "none"}`);
  if (patch.title && patch.title !== item.title) out.push(`Title changed`);
  if (patch.priority && patch.priority !== item.priority) out.push(`Priority: ${item.priority} → ${patch.priority}`);
  if (patch.status && patch.status !== item.status) {
    const verb: Record<string, string> = { open: "Confirmed", done: "Completed", dismissed: "Dismissed", suggested: "Suggested" };
    out.push(item.status === "done" && patch.status === "open" ? "Reopened" : verb[patch.status] ?? patch.status);
  }
  return out;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "action/add":
      return { ...state, actions: [action.item, ...state.actions] };

    case "action/update": {
      return {
        ...state,
        actions: state.actions.map((a) => {
          if (a.id !== action.id) return a;
          const changes = describePatch(a, action.patch, state.people);
          const history: ChangeRecord[] = changes.map((summary) => ({ at: nowIso(), by: action.by, summary }));
          return { ...a, ...action.patch, history: [...a.history, ...history] };
        }),
      };
    }

    case "action/link":
      return {
        ...state,
        actions: state.actions.map((a) => {
          const i = action.ids.indexOf(a.id);
          if (i === -1) return a;
          const external: ExternalLink = { ...action.link, key: action.keys[i] };
          return {
            ...a,
            status: a.status === "suggested" ? "open" : a.status,
            external,
            history: [...a.history, { at: nowIso(), by: "user", summary: `Created ${external.key} in ${external.system}` }],
          };
        }),
      };

    case "decision/add":
      return { ...state, decisions: [action.decision, ...state.decisions] };

    case "decision/update":
      return { ...state, decisions: state.decisions.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)) };

    case "question/resolve":
      return { ...state, questions: state.questions.map((q) => (q.id === action.id ? { ...q, resolved: action.resolved } : q)) };

    case "meeting/update":
      return { ...state, meetings: state.meetings.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)) };

    case "integration/connect":
      return {
        ...state,
        integrations: state.integrations.map((i) =>
          i.id === action.id
            ? {
                ...i,
                status: "connected",
                grantedScopeIds: action.grantedScopeIds,
                account: action.account ?? i.account ?? "maya@lumen.app",
                connectedAt: nowIso(),
                lastSyncAt: nowIso(),
                errorMessage: undefined,
              }
            : i,
        ),
      };

    case "integration/disconnect":
      return {
        ...state,
        integrations: state.integrations.map((i) =>
          i.id === action.id ? { ...i, status: "available", grantedScopeIds: [], connectedAt: undefined, lastSyncAt: undefined } : i,
        ),
      };

    case "thread/new":
      return { ...state, threads: [action.thread, ...state.threads], activeThreadId: action.thread.id };

    case "thread/select":
      return { ...state, activeThreadId: action.id };

    case "thread/delete":
      return {
        ...state,
        threads: state.threads.filter((t) => t.id !== action.id),
        activeThreadId: state.activeThreadId === action.id ? null : state.activeThreadId,
      };

    case "thread/append":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId ? { ...t, turns: [...t.turns, action.turn], updatedAt: nowIso() } : t,
        ),
      };

    case "thread/update-turn":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                updatedAt: nowIso(),
                turns: t.turns.map((turn) =>
                  turn.id === action.turnId && turn.role === "assistant" ? { ...turn, ...action.patch } : turn,
                ),
              }
            : t,
        ),
      };

    case "context/set":
      return { ...state, context: action.items };

    case "context/add": {
      const without = state.context.filter((c) => c.id !== action.item.id && !(c.kind === "selection" && action.item.kind === "selection"));
      return { ...state, context: [...without, action.item] };
    }

    case "context/remove":
      return { ...state, context: state.context.filter((c) => c.id !== action.id) };

    case "draft/set":
      return { ...state, draft: action.text };

    case "aria-panel/set":
      return { ...state, ariaPanelOpen: action.open };

    case "suggestion/dismiss":
      return { ...state, dismissedSuggestionIds: [...state.dismissedSuggestionIds, action.id] };

    case "onboarding/complete":
      return { ...state, onboarded: true };

    case "settings/update":
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case "demo/reset":
      return { ...initialState(), onboarded: true };
  }
}

/* ------------------------------------------------------------------ */
/* Store with undo                                                     */
/* ------------------------------------------------------------------ */

interface UndoEntry {
  label: string;
  state: AppState;
}

let state: AppState = typeof window === "undefined" ? initialState() : load();
let undoStack: UndoEntry[] = [];
const listeners = new Set<() => void>();
let persistTimer: number | undefined;

function emit() {
  listeners.forEach((l) => l());
  if (typeof window === "undefined") return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — the session still works in memory */
    }
  }, 250);
}

export function getState(): AppState {
  return state;
}

export function dispatch(action: Action) {
  state = reducer(state, action);
  emit();
}

/**
 * Dispatch one or more actions as a single undoable change. Returns the undo
 * id; pass it to `undo()` (e.g. from a toast's Undo button).
 */
export function commit(label: string, ...actions: Action[]): number {
  undoStack = [...undoStack.slice(-19), { label, state }];
  for (const a of actions) state = reducer(state, a);
  emit();
  return undoStack.length - 1;
}

/** Restores the state captured by `commit`. No-op if a later commit already moved on past it. */
export function undo(id?: number) {
  const index = id ?? undoStack.length - 1;
  const entry = undoStack[index];
  if (!entry) return;
  // Keep agent conversation state; restore only user-facing records.
  state = {
    ...entry.state,
    threads: state.threads,
    activeThreadId: state.activeThreadId,
    context: state.context,
    draft: state.draft,
    ariaPanelOpen: state.ariaPanelOpen,
  };
  undoStack = undoStack.slice(0, index);
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Subscribe to a slice of state. Derived selectors (filters, maps) are safe:
 * the snapshot is cached per (state, selector) so React sees a stable value
 * until the state actually changes.
 */
export function useAppState<T>(selector: (s: AppState) => T): T {
  const cache = useRef<{ s: AppState; sel: (s: AppState) => T; v: T } | null>(null);
  const getSnapshot = () => {
    const c = cache.current;
    if (c && c.s === state && c.sel === selector) return c.v;
    const v = selector(state);
    cache.current = { s: state, sel: selector, v };
    return v;
  };
  return useSyncExternalStore(subscribe, getSnapshot);
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectMe = (s: AppState): Person => s.people.find((p) => p.isMe) ?? s.people[0];

export function personById(s: AppState, id: string | null | undefined): Person | undefined {
  return id ? s.people.find((p) => p.id === id) : undefined;
}

export function meetingById(s: AppState, id: string | null | undefined): Meeting | undefined {
  return id ? s.meetings.find((m) => m.id === id) : undefined;
}

export function integrationById(s: AppState, id: IntegrationId): Integration | undefined {
  return s.integrations.find((i) => i.id === id);
}

let idCounter = 0;
/** Unique id for records created in this session. */
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
