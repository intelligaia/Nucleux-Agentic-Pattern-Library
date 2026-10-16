import type {
  ActionItem,
  AgentGate,
  AgentRunStep,
  AgentTurn,
  AnswerBlock,
  AriaThread,
  ContextItem,
  Decision,
  DocRef,
  ExternalAction,
  ExternalDoc,
  IntegrationId,
  Meeting,
  SourceRef,
  TaskSystem,
  UserTurn,
} from "@/domain/types";
import { seed } from "@/data";
import { dispatch, getState, newId, type AppState } from "@/state/store";
import { EMPTY_FILTERS, interpret, matchesFilters, scoreText, search, tokenize } from "@/lib/search";
import { dayDiff, formatOffset, monthDay, nowIso, parseDate, relativeDay, weekdayShort } from "@/lib/time";
import { inferDecision, inferDue, inferOwner, inferPriority, inferTitle } from "@/aria/infer";
import { compareWithDoc } from "@/aria/compare";

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

type Outcome =
  | { kind: "answer"; blocks: AnswerBlock[]; sources: SourceRef[]; docSources?: DocRef[]; followUps: string[] }
  | { kind: "gate"; gate: AgentGate; blocks: AnswerBlock[]; followUps?: string[] }
  | { kind: "error"; error: string; followUps?: string[] };

interface Plan {
  steps: { label: string; detail?: string }[];
  produce: (s: AppState) => Outcome;
}

const STEP_MS = 760;
const timers = new Map<string, number[]>();

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export function count(n: number, noun: string, plural = `${noun}s`): string {
  return `${n <= 10 ? WORDS[n] : n} ${n === 1 ? noun : plural}`;
}
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const plural = (n: number, noun: string, p = `${noun}s`) => `${n} ${n === 1 ? noun : p}`;

function firstName(s: AppState, id: string | null): string {
  if (!id) return "Unassigned";
  return s.people.find((p) => p.id === id)?.name.split(" ")[0] ?? id;
}

function readyMeetings(s: AppState): Meeting[] {
  return s.meetings.filter((m) => m.status === "ready");
}

function meetingsFromContext(s: AppState, context: ContextItem[]): Meeting[] {
  const ids = new Set<string>();
  for (const c of context) {
    if (c.kind === "meeting" || c.kind === "selection") ids.add(c.meetingId);
    if (c.kind === "meeting-set") c.meetingIds.forEach((id) => ids.add(id));
  }
  return s.meetings.filter((m) => ids.has(m.id));
}

/** Meeting title mentioned in the prompt, most recent instance. */
function mentionedMeeting(s: AppState, text: string): Meeting | undefined {
  const t = text.toLowerCase();
  return [...s.meetings]
    .filter((m) => m.status === "ready")
    .sort((a, b) => parseDate(b.start).getTime() - parseDate(a.start).getTime())
    .find((m) => t.includes(m.title.toLowerCase()) || t.includes(m.title.toLowerCase().split(" — ")[0]));
}

/** Resolves which meetings a question is about — context first, then phrasing, then everything. */
function scope(s: AppState, text: string, context: ContextItem[]): { meetings: Meeting[]; label: string } {
  const fromContext = meetingsFromContext(s, context);
  if (fromContext.length) return { meetings: fromContext, label: fromContext.length === 1 ? fromContext[0].title : plural(fromContext.length, "meeting") };
  const named = mentionedMeeting(s, text);
  if (named) return { meetings: [named], label: named.title };
  if (/\btoday'?s\b|\btoday\b/i.test(text)) {
    const today = readyMeetings(s).filter((m) => dayDiff(m.start) === 0);
    if (today.length) return { meetings: today, label: today.length === 1 ? today[0].title : "today's meetings" };
  }
  const { implied } = interpret(text, EMPTY_FILTERS, s.people);
  const filters = { ...EMPTY_FILTERS, ...implied };
  const ms = readyMeetings(s).filter((m) => matchesFilters(m, filters));
  return { meetings: ms, label: plural(ms.length, "meeting") };
}

const INTENT_WORDS = /^(decid|decide|decision|agre|agree|conclu|settl|made|make|happen|summar|summary|recap|overview|action|item|task|todo|overdue|owner|own|question|open|unanswer|unresolv|email|draft|compar|compare|brief|tell|know|latest|still|week|today)$/;

function topicTerms(text: string): string[] {
  return tokenize(text).filter((t) => !INTENT_WORDS.test(t));
}

/** Meetings relevant to the topic: topic/title matches first, transcript matches as fallback. */
function relevantMeetings(meetings: Meeting[], terms: string[]): Meeting[] {
  if (!terms.length) return meetings;
  const byTopic = meetings.filter((m) => Math.max(scoreText(m.title, terms), ...m.topics.map((t) => scoreText(t, terms))) >= 0.99);
  if (byTopic.length) return byTopic;
  return meetings.filter((m) => m.transcript.some((seg) => scoreText(seg.text, terms) >= 0.99));
}

function segmentsMatching(meetings: Meeting[], terms: string[]) {
  return meetings.flatMap((m) => m.transcript.filter((seg) => terms.length === 0 || scoreText(seg.text, terms) >= 0.5).map((seg) => ({ m, seg })));
}

function byDateDesc<T>(get: (x: T) => string) {
  return (a: T, b: T) => parseDate(get(b)).getTime() - parseDate(get(a)).getTime();
}

function decisionMeeting(s: AppState, d: Decision): Meeting | undefined {
  return s.meetings.find((m) => m.id === d.meetingId);
}

function uniqSources(list: SourceRef[]): SourceRef[] {
  const seen = new Set<string>();
  return list.filter((r) => (seen.has(r.segmentId) ? false : (seen.add(r.segmentId), true)));
}

/* ------------------------------------------------------------------ */
/* Intents                                                             */
/* ------------------------------------------------------------------ */

function planSelection(s: AppState, text: string, sel: Extract<ContextItem, { kind: "selection" }>): Plan {
  const meeting = s.meetings.find((m) => m.id === sel.meetingId)!;
  const segments = meeting.transcript.filter((seg) => sel.segmentIds.includes(seg.id));
  const range = `${formatOffset(sel.startSec)}–${formatOffset(sel.endSec)}`;
  const sources = segments.map((seg) => ({ meetingId: meeting.id, segmentId: seg.id }));

  if (/\b(action item|action|task|to-?do|follow[- ]?up|assign)\b/i.test(text)) {
    return {
      steps: [
        { label: "Reading the selected transcript", detail: `${meeting.title} · ${range}` },
        { label: "Identifying owner and timing" },
        { label: "Preparing action item" },
      ],
      produce: (st) => {
        const t = inferTitle(segments);
        const o = inferOwner(segments, st.people);
        const d = inferDue(segments);
        const p = inferPriority(segments);
        const owner = o.ownerId ? st.people.find((pp) => pp.id === o.ownerId)?.name : null;
        return {
          kind: "answer",
          blocks: [
            {
              kind: "text",
              text: owner
                ? `${owner} took this on${d.due ? `, ${d.inference.reason.replace(/[“”]/g, "")}` : ""}. Review the details before adding it.`
                : "Nobody took this on in the selection. Choose an owner before adding it.",
            },
            {
              kind: "action-draft",
              draft: {
                title: t.title,
                ownerId: o.ownerId,
                due: d.due,
                priority: p.priority,
                meetingId: meeting.id,
                sources,
                inferences: [t.inference, o.inference, d.inference, p.inference],
              },
            },
          ],
          sources,
          followUps: ["Create it in Linear", "Who else discussed this?", "Turn this into a decision"],
        };
      },
    };
  }

  if (/\bdecision\b/i.test(text)) {
    return {
      steps: [
        { label: "Reading the selected transcript", detail: `${meeting.title} · ${range}` },
        { label: "Checking for agreement in the discussion" },
        { label: "Preparing decision" },
      ],
      produce: () => ({
        kind: "answer",
        blocks: [
          { kind: "text", text: "Here is the decision as stated in the selection. Edit the wording before adding it to the meeting record." },
          { kind: "decision-draft", draft: { text: inferDecision(segments), meetingId: meeting.id, sources } },
        ],
        sources,
        followUps: ["Turn this into an action item", "Has this come up in other meetings?"],
      }),
    };
  }

  // Explain / summarise the selection, or answer a free question about it.
  return {
    steps: [
      { label: "Reading the selected transcript", detail: `${meeting.title} · ${range}` },
      { label: "Preparing answer" },
    ],
    produce: (st) => {
      const speakers = [...new Set(segments.map((seg) => seg.speakerId))].map((id) => firstName(st, id));
      return {
        kind: "answer",
        blocks: [
          {
            kind: "text",
            text: `${plural(segments.length, "line")} from ${speakers.join(", ")} in ${meeting.title} (${range}).`,
          },
          {
            kind: "bullets",
            items: segments.map((seg) => ({
              text: `${firstName(st, seg.speakerId)}: ${seg.text.split(/(?<=[.?!])\s/).slice(0, 2).join(" ")}`,
              sources: [{ meetingId: meeting.id, segmentId: seg.id }],
            })),
          },
        ],
        sources,
        followUps: ["Turn this into an action item", "Turn this into a decision", "Who else discussed this?"],
      };
    },
  };
}

function planCompare(s: AppState, text: string, context: ContextItem[]): Plan {
  const drive = s.integrations.find((i) => i.id === "google-drive");
  const { meetings } = scope(s, /today/i.test(text) ? text : `today ${text}`, context);
  const meeting = meetings[0] ?? readyMeetings(s).sort(byDateDesc((m) => m.start))[0];
  const doc = getDocForCompare(s);
  const decisionsHere = s.decisions.filter((d) => d.meetingId === meeting.id);

  if (!drive || drive.status !== "connected") {
    return {
      steps: [
        { label: "Finding today's decisions", detail: `${meeting.title} · ${plural(decisionsHere.length, "decision")}` },
        { label: "Looking for the product brief", detail: "Not in meeting data" },
      ],
      produce: () => ({
        kind: "gate",
        gate: {
          kind: "connect",
          integrationId: "google-drive",
          reason: "The product brief lives in Google Drive, which isn't connected. I need read access to the file to compare it with today's decisions.",
        },
        blocks: [
          {
            kind: "text",
            text: `I found ${count(decisionsHere.length, "decision").toLowerCase()} from ${meeting.title}, but the product brief isn't in your meeting data. Connect Google Drive to continue — I'll pick up where I stopped.`,
          },
        ],
      }),
    };
  }

  return {
    steps: [
      { label: "Finding today's decisions", detail: `${meeting.title} · ${plural(decisionsHere.length, "decision")}` },
      { label: doc ? `Reading “${doc.title}”` : "Searching Google Drive", detail: "Google Drive" },
      { label: "Comparing decisions with the brief" },
      { label: "Preparing comparison" },
    ],
    produce: (st) => {
      if (!doc) return { kind: "error", error: "I couldn't find a product brief in the Drive files I can access.", followUps: ["Show me today's decisions"] };
      const rows = compareWithDoc(st, meeting, doc);
      const conflicts = rows.filter((r) => r.verdict === "conflict").length;
      const docRef: DocRef = { integrationId: "google-drive", docId: doc.id };
      return {
        kind: "answer",
        blocks: [
          {
            kind: "text",
            text: conflicts
              ? `${count(conflicts, "decision")} from ${meeting.title} ${conflicts === 1 ? "conflicts" : "conflict"} with the product brief. The brief was last updated ${monthDay(doc.updatedAt)}, before these decisions.`
              : `Today's decisions are consistent with the product brief.`,
          },
          { kind: "comparison", rows, docRef },
        ],
        sources: uniqSources(rows.flatMap((r) => r.sources)),
        docSources: rows.filter((r) => r.docSection).map((r) => ({ ...docRef, section: r.docSection })),
        followUps: ["Draft an update to the brief", "Who owns updating the launch brief?", "Email the team about the date change"],
      };
    },
  };
}

function getDocForCompare(_s: AppState): ExternalDoc | undefined {
  return seed.externalDocs.find((d) => /brief/i.test(d.title));
}

const SYSTEM_NAMES: Record<TaskSystem, string> = { linear: "Linear", jira: "Jira", asana: "Asana", notion: "Notion" };

function planExternal(s: AppState, text: string, context: ContextItem[], thread: AriaThread | undefined): Plan {
  const system = (["linear", "jira", "asana", "notion"] as TaskSystem[]).find((x) => new RegExp(`\\b${x}\\b`, "i").test(text)) ?? "linear";
  const integration = s.integrations.find((i) => i.id === system);
  // Which items: the last action draft that was added in this thread, else open items in scope without a link.
  const lastAdded = thread?.turns
    .flatMap((t) => (t.role === "assistant" ? t.blocks : []))
    .filter((b): b is Extract<AnswerBlock, { kind: "action-draft" }> => b.kind === "action-draft")
    .map((b) => b.resolution?.recordId)
    .filter(Boolean)
    .pop();
  const { meetings, label } = scope(s, text, context);
  const ids = lastAdded
    ? [lastAdded]
    : s.actions
        .filter((a) => a.status === "open" && !a.external && meetings.some((m) => m.id === a.meetingId))
        .map((a) => a.id);
  const items = s.actions.filter((a) => ids.includes(a.id));

  if (!integration || integration.status !== "connected") {
    return {
      steps: [{ label: `Checking ${SYSTEM_NAMES[system]} access` }],
      produce: () => ({
        kind: "gate",
        gate: { kind: "connect", integrationId: system as IntegrationId, reason: `${SYSTEM_NAMES[system]} ${integration?.status === "error" ? "needs to be reconnected" : "isn't connected"}. Creating issues requires write access.` },
        blocks: [{ kind: "text", text: `I can't reach ${SYSTEM_NAMES[system]} yet. Connect it and I'll prepare the issues for your review.` }],
      }),
    };
  }
  if (!items.length) {
    return {
      steps: [{ label: "Collecting action items", detail: label }],
      produce: () => ({ kind: "answer", blocks: [{ kind: "text", text: `There are no open action items in ${label} that aren't already linked to ${SYSTEM_NAMES[system]}.` }], sources: [], followUps: ["Show overdue action items"] }),
    };
  }
  const action: ExternalAction = {
    id: newId("ext"),
    system,
    summary: `Create ${plural(items.length, "issue")} in ${SYSTEM_NAMES[system]} · Team PROD`,
    actionIds: items.map((a) => a.id),
    fields: [
      { label: "Destination", value: `${SYSTEM_NAMES[system]} › PROD › Onboarding launch` },
      ...items.map((a, i) => ({
        label: items.length > 1 ? `Issue ${i + 1}` : "Issue",
        value: `${a.title} — ${firstName(s, a.ownerId)}${a.due ? ` · due ${weekdayShort(a.due)} ${monthDay(a.due)}` : ""}`,
      })),
      { label: "Link back", value: "Each issue links to the transcript moment" },
    ],
  };
  return {
    steps: [
      { label: "Collecting action items", detail: plural(items.length, "item") },
      { label: `Preparing ${SYSTEM_NAMES[system]} issues` },
    ],
    produce: () => ({
      kind: "gate",
      gate: { kind: "approve", action },
      blocks: [{ kind: "text", text: `Ready to create ${plural(items.length, "issue")} in ${SYSTEM_NAMES[system]}. Nothing is created until you confirm.` }],
    }),
  };
}

function planEmail(s: AppState, text: string, context: ContextItem[]): Plan {
  const { meetings } = scope(s, text, context);
  const m = [...(meetings.length ? meetings : readyMeetings(s))].sort(byDateDesc((x) => x.start))[0];
  return {
    steps: [
      { label: "Collecting decisions and action items", detail: m.title },
      { label: "Drafting email" },
    ],
    produce: (st) => {
      const me = st.people.find((p) => p.isMe)!;
      const decisions = st.decisions.filter((d) => d.meetingId === m.id && d.status === "confirmed");
      const actions = st.actions.filter((a) => a.meetingId === m.id && (a.status === "open" || a.status === "done"));
      const questions = st.questions.filter((q) => q.meetingId === m.id && !q.resolved);
      const to = m.participantIds.filter((id) => id !== me.id).map((id) => st.people.find((p) => p.id === id)?.email ?? id);
      const lines = [
        `Hi all,`,
        ``,
        `Recap of ${m.title} (${weekdayShort(m.start)}, ${monthDay(m.start)}).`,
        ``,
        ...(decisions.length ? [`Decisions`, ...decisions.map((d) => `• ${d.text}`), ``] : []),
        ...(actions.length
          ? [`Action items`, ...actions.map((a) => `• ${a.title} — ${firstName(st, a.ownerId)}${a.due ? `, ${weekdayShort(a.due)} ${monthDay(a.due)}` : ""}${a.status === "done" ? " (done)" : ""}`), ``]
          : []),
        ...(questions.length ? [`Open questions`, ...questions.map((q) => `• ${q.text}`), ``] : []),
        `Thanks,`,
        me.name.split(" ")[0],
      ];
      return {
        kind: "answer",
        blocks: [
          { kind: "text", text: `Draft ready for ${plural(to.length, "participant")}. Nothing is sent from here — copy it into your email client.` },
          { kind: "email-draft", to, subject: `${m.title} — decisions and next steps (${monthDay(m.start)})`, body: lines.join("\n") },
        ],
        sources: uniqSources(decisions.flatMap((d) => d.sources)),
        followUps: ["Make it shorter", "Add the open questions as asks"],
      };
    },
  };
}

function planActions(s: AppState, text: string, context: ContextItem[]): Plan {
  const { meetings, label } = scope(s, text, context);
  const meetingIds = new Set(meetings.map((m) => m.id));
  const all = s.actions.filter((a) => a.status === "open" && (a.meetingId === null || meetingIds.has(a.meetingId) || meetingsFromContext(s, context).length === 0));
  const me = s.people.find((p) => p.isMe)!;

  let picked: ActionItem[];
  let lead: (n: number) => string;
  let review = false;
  if (/overdue|late|past due|behind/i.test(text)) {
    picked = all.filter((a) => a.due && dayDiff(a.due) < 0);
    lead = (n) => (n ? `${count(n, "action item")} ${n === 1 ? "is" : "are"} overdue.` : "Nothing is overdue.");
  } else if (/no owner|without (an )?owner|unassigned|unowned|nobody owns/i.test(text)) {
    picked = all.filter((a) => !a.ownerId);
    lead = (n) => (n ? `${count(n, "action item")} ${n === 1 ? "doesn't" : "don't"} have an owner yet.` : "Every open action item has an owner.");
    review = true;
  } else if (/\b(my|mine|me|assigned to me)\b/i.test(text)) {
    picked = all.filter((a) => a.ownerId === me.id);
    lead = (n) => `You own ${count(n, "open action item").toLowerCase()}.`;
  } else if (/due (soon|this week)|this week/i.test(text)) {
    picked = all.filter((a) => a.due && dayDiff(a.due) >= 0 && dayDiff(a.due) <= 7);
    lead = (n) => `${count(n, "action item")} ${n === 1 ? "is" : "are"} due in the next 7 days.`;
  } else {
    picked = all;
    lead = (n) => `${count(n, "open action item")} in ${label}.`;
  }
  picked.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  return {
    steps: [
      { label: `Checking ${plural(all.length, "open action item")}`, detail: label },
      { label: "Preparing list" },
    ],
    produce: () => {
      const unowned = picked.filter((a) => !a.ownerId);
      const blocks: AnswerBlock[] = [{ kind: "text", text: lead(picked.length) }];
      if (picked.length) blocks.push({ kind: "actions", actionIds: picked.map((a) => a.id) });
      if (review && unowned.length) blocks.push({ kind: "owner-review", actionIds: unowned.map((a) => a.id) });
      const followUps = review ? ["Which action items are overdue?"] : unowned.length ? ["Which action items don't have an owner?"] : ["What decisions were made this week?"];
      return { kind: "answer", blocks, sources: uniqSources(picked.flatMap((a) => a.sources).slice(0, 8)), followUps: [...followUps, "Draft a follow-up email"] };
    },
  };
}

function planQuestions(s: AppState, text: string, context: ContextItem[]): Plan {
  const { meetings, label } = scope(s, text, context);
  const ids = new Set(meetings.map((m) => m.id));
  const qs = s.questions.filter((q) => !q.resolved && ids.has(q.meetingId));
  return {
    steps: [
      { label: `Reviewing ${plural(meetings.length, "meeting")}`, detail: label },
      { label: "Checking which questions were answered later" },
      { label: "Preparing answer" },
    ],
    produce: (st) => ({
      kind: "answer",
      blocks: [
        { kind: "text", text: qs.length ? `${count(qs.length, "question")} ${qs.length === 1 ? "is" : "are"} still open.` : "No open questions." },
        ...(qs.length
          ? [{
              kind: "bullets" as const,
              items: qs.map((q) => ({
                text: `${q.text} — asked by ${firstName(st, q.askedById)}, ${st.meetings.find((m) => m.id === q.meetingId)?.title ?? ""}`,
                sources: q.sources,
              })),
            }]
          : []),
      ],
      sources: uniqSources(qs.flatMap((q) => q.sources)),
      followUps: ["Draft a follow-up email with these questions", "What decisions were made this week?"],
    }),
  };
}

function planDecisions(s: AppState, text: string, context: ContextItem[]): Plan {
  const { meetings: scoped, label } = scope(s, text, context);
  const terms = topicTerms(interpret(text, EMPTY_FILTERS, s.people).terms.join(" "));
  const relevant = relevantMeetings(scoped, terms);
  const segs = segmentsMatching(relevant, terms);
  const termLabel = terms.length ? `“${text.replace(/^.*\babout\s+(the\s+)?/i, "").replace(/[?.!]+$/, "")}”` : label;

  return {
    steps: [
      { label: `Searching ${plural(relevant.length, "relevant meeting")}`, detail: terms.length ? `Matched on ${termLabel}` : label },
      { label: "Reviewing transcript segments", detail: plural(segs.length, "segment") },
      { label: "Preparing summary" },
    ],
    produce: (st) => {
      const ids = new Set(relevant.map((m) => m.id));
      let found = st.decisions.filter((d) => ids.has(d.meetingId));
      if (terms.length) {
        const focused = found.filter((d) => Math.max(scoreText(d.text, terms), ...d.topics.map((t) => scoreText(t, terms))) >= 0.5);
        if (focused.length) found = focused;
      }
      found.sort(byDateDesc((d) => decisionMeeting(st, d)?.start ?? d.createdAt));
      if (!found.length) {
        return {
          kind: "answer",
          blocks: [{ kind: "text", text: `I couldn't find a recorded decision about ${termLabel} in ${plural(relevant.length, "meeting")}.` }],
          sources: [],
          followUps: ["Search transcripts for this topic", "Which questions are still open?"],
        };
      }
      const confirmed = found.filter((d) => d.status === "confirmed");
      const unresolved = found.filter((d) => d.status === "unresolved");
      const blocks: AnswerBlock[] = [];
      if (terms.length && confirmed.length) {
        const latest = confirmed[0];
        const lm = decisionMeeting(st, latest)!;
        blocks.push({ kind: "text", text: `The team agreed: ${lc(latest.text)}` });
        // Was the same topic proposed earlier and confirmed later?
        const earlier = unresolved
          .filter((u) => parseDate(decisionMeeting(st, u)!.start) < parseDate(lm.start))
          .find((u) => u.topics.some((t) => latest.topics.includes(t)));
        if (earlier) {
          const em = decisionMeeting(st, earlier)!;
          blocks.push({ kind: "text", text: `It was first proposed at ${em.title} on ${monthDay(em.start)} and confirmed at ${lm.title} on ${monthDay(lm.start)}.` });
        } else {
          blocks.push({ kind: "text", text: `Decided at ${lm.title} on ${monthDay(lm.start)}.` });
        }
      } else {
        const ms = new Set(found.map((d) => d.meetingId)).size;
        blocks.push({
          kind: "text",
          text: `${count(confirmed.length, "decision")} ${confirmed.length === 1 ? "was" : "were"} made across ${plural(ms, "meeting")}${unresolved.length ? `; ${count(unresolved.length, "more is", "more are").toLowerCase()} still unresolved` : ""}.`,
        });
      }
      blocks.push({ kind: "decisions", decisionIds: found.map((d) => d.id) });
      return {
        kind: "answer",
        blocks,
        sources: uniqSources(found.flatMap((d) => d.sources)),
        followUps: terms.length
          ? ["Who owns the follow-ups?", "What's still unresolved?", "Compare today's decisions with the product brief"]
          : ["Which decisions are still unresolved?", "Draft a follow-up email", "Which action items are overdue?"],
      };
    },
  };
}

function planSummary(s: AppState, text: string, context: ContextItem[]): Plan {
  const { meetings, label } = scope(s, text, context);
  const ms = [...meetings].filter((m) => m.summary).sort(byDateDesc((m) => m.start)).slice(0, 6);
  return {
    steps: [
      { label: `Reading ${plural(ms.length, "summary", "summaries")}`, detail: label },
      { label: "Collecting decisions and open items" },
      { label: "Preparing summary" },
    ],
    produce: (st) => {
      if (!ms.length) return { kind: "answer", blocks: [{ kind: "text", text: "There are no processed meetings that match." }], sources: [], followUps: ["Show recent meetings"] };
      if (ms.length === 1) {
        const m = ms[0];
        const d = st.decisions.filter((x) => x.meetingId === m.id && x.status === "confirmed").length;
        const a = st.actions.filter((x) => x.meetingId === m.id && (x.status === "open" || x.status === "done")).length;
        const q = st.questions.filter((x) => x.meetingId === m.id && !x.resolved).length;
        return {
          kind: "answer",
          blocks: [
            { kind: "text", text: m.summary!.overview },
            { kind: "bullets", items: m.summary!.keyPoints.map((p) => ({ text: p.text, sources: p.sources })) },
            { kind: "text", text: `${count(d, "decision")} · ${count(a, "action item").toLowerCase()} · ${count(q, "open question").toLowerCase()}.` },
          ],
          sources: uniqSources(m.summary!.keyPoints.flatMap((p) => p.sources)),
          followUps: ["What was decided?", "Draft a follow-up email", "Which questions are still open?"],
        };
      }
      return {
        kind: "answer",
        blocks: [
          { kind: "text", text: `${count(ms.length, "meeting")} in ${label}.` },
          {
            kind: "bullets",
            items: ms.map((m) => ({ text: `${m.title} (${relativeDay(m.start)}): ${m.summary!.overview}`, sources: m.summary!.keyPoints[0]?.sources ?? [] })),
          },
        ],
        sources: uniqSources(ms.flatMap((m) => m.summary!.keyPoints[0]?.sources ?? [])),
        followUps: ["What decisions were made?", "What themes came up more than once?"],
      };
    },
  };
}

function planSearch(s: AppState, text: string, context: ContextItem[]): Plan {
  const scoped = meetingsFromContext(s, context);
  const corpus = { meetings: scoped.length ? scoped : s.meetings, decisions: s.decisions, actions: s.actions, people: s.people };
  const results = search(corpus, text, EMPTY_FILTERS);
  const n = corpus.meetings.filter((m) => m.status === "ready").length;
  return {
    steps: [
      { label: `Searching ${plural(n, "meeting")}`, detail: results.interpretation.terms.length ? `Terms: ${results.interpretation.terms.join(", ")}` : undefined },
      { label: "Reviewing transcript segments", detail: plural(results.moments.length, "match", "matches") },
      { label: "Preparing answer" },
    ],
    produce: (st) => {
      const top = results.moments.slice(0, 5);
      if (!top.length) {
        return {
          kind: "answer",
          blocks: [{ kind: "text", text: "I couldn't find that in your meetings. Try a topic, a person's name, or a meeting title." }],
          sources: [],
          followUps: ["What decisions were made this week?", "Summarize my customer meetings"],
        };
      }
      const meetingsHit = new Set(results.moments.map((h) => h.meeting.id)).size;
      return {
        kind: "answer",
        blocks: [
          { kind: "text", text: `This came up ${plural(results.moments.length, "time")} across ${plural(meetingsHit, "meeting")}. Most relevant:` },
          {
            kind: "bullets",
            items: top.map((h) => ({
              text: `${firstName(st, h.segment.speakerId)} in ${h.meeting.title} (${monthDay(h.meeting.start)}): “${h.segment.text.split(/(?<=[.?!])\s/).slice(0, 2).join(" ")}”`,
              sources: [{ meetingId: h.meeting.id, segmentId: h.segment.id }],
            })),
          },
        ],
        sources: top.map((h) => ({ meetingId: h.meeting.id, segmentId: h.segment.id })),
        followUps: ["Was anything decided about this?", "Summarize those meetings"],
      };
    },
  };
}

function planFor(s: AppState, text: string, context: ContextItem[], thread: AriaThread | undefined): Plan {
  const failed = meetingsFromContext(s, context).find((m) => m.status === "failed");
  if (failed) {
    return {
      steps: [{ label: `Opening ${failed.title}` }],
      produce: () => ({
        kind: "error",
        error: `${failed.title} has no transcript — processing failed (${failed.failureReason ?? "unknown error"}). Retry processing, or remove it from context and ask again.`,
        followUps: [],
      }),
    };
  }
  const sel = context.find((c): c is Extract<ContextItem, { kind: "selection" }> => c.kind === "selection");
  if (sel) return planSelection(s, text, sel);
  if (/\bcompar/i.test(text) && /\b(brief|doc|document|spec|prd)\b/i.test(text)) return planCompare(s, text, context);
  if (/\b(linear|jira|asana|notion)\b/i.test(text)) return planExternal(s, text, context, thread);
  if (/\b(email|e-mail|draft (a )?(follow[- ]?up|recap|message|note))\b/i.test(text)) return planEmail(s, text, context);
  if (/\b(overdue|action items?|tasks?|to-?dos?|owner|unassigned|assigned|due)\b/i.test(text)) return planActions(s, text, context);
  if (/\b(open questions?|unanswered|questions? (are )?still open|unresolved questions?)\b/i.test(text)) return planQuestions(s, text, context);
  if (/\b(decid|decision|agreed|agree on|conclu|settled|unresolved)/i.test(text)) return planDecisions(s, text, context);
  if (/\b(summar|recap|overview|tl;?dr|catch me up|what happened)/i.test(text)) return planSummary(s, text, context);
  return planSearch(s, text, context);
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

function threadById(id: string) {
  return getState().threads.find((t) => t.id === id);
}

function turnById(threadId: string, turnId: string): AgentTurn | undefined {
  const t = threadById(threadId)?.turns.find((x) => x.id === turnId);
  return t && t.role === "assistant" ? t : undefined;
}

function userTurnBefore(threadId: string, turnId: string): UserTurn | undefined {
  const turns = threadById(threadId)?.turns ?? [];
  const i = turns.findIndex((t) => t.id === turnId);
  for (let j = i - 1; j >= 0; j -= 1) {
    const t = turns[j];
    if (t.role === "user") return t;
  }
  return undefined;
}

function clearTimers(turnId: string) {
  (timers.get(turnId) ?? []).forEach((t) => window.clearTimeout(t));
  timers.delete(turnId);
}

function execute(threadId: string, turnId: string, plan: Plan, keepSteps: AgentRunStep[] = []) {
  const steps: AgentRunStep[] = [
    ...keepSteps,
    ...plan.steps.map((st, i) => ({ id: `${turnId}-step-${keepSteps.length + i}`, label: st.label, detail: st.detail, status: (i === 0 ? "active" : "pending") as AgentRunStep["status"] })),
  ];
  dispatch({ type: "thread/update-turn", threadId, turnId, patch: { status: "working", steps, blocks: [], gate: undefined, error: undefined } });

  const list: number[] = [];
  plan.steps.forEach((_, i) => {
    list.push(
      window.setTimeout(() => {
        const turn = turnById(threadId, turnId);
        if (!turn || turn.status !== "working") return;
        const idx = keepSteps.length + i;
        const next = turn.steps.map((st, j) => (j === idx ? { ...st, status: "done" as const } : j === idx + 1 ? { ...st, status: "active" as const } : st));
        dispatch({ type: "thread/update-turn", threadId, turnId, patch: { steps: next } });
        if (i === plan.steps.length - 1) finish(threadId, turnId, plan);
      }, STEP_MS * (i + 1) + (i === plan.steps.length - 1 ? 240 : 0)),
    );
  });
  timers.set(turnId, list);
}

function finish(threadId: string, turnId: string, plan: Plan) {
  clearTimers(turnId);
  let outcome: Outcome;
  try {
    outcome = plan.produce(getState());
  } catch (e) {
    outcome = { kind: "error", error: "Something went wrong while preparing this answer. Your question and context are kept — try again." };
    console.error(e);
  }
  if (outcome.kind === "answer") {
    dispatch({
      type: "thread/update-turn",
      threadId,
      turnId,
      patch: { status: "done", blocks: outcome.blocks, sources: outcome.sources, docSources: outcome.docSources ?? [], followUps: outcome.followUps },
    });
  } else if (outcome.kind === "gate") {
    dispatch({ type: "thread/update-turn", threadId, turnId, patch: { status: "needs-input", gate: outcome.gate, blocks: outcome.blocks, followUps: outcome.followUps ?? [] } });
  } else {
    const turn = turnById(threadId, turnId);
    dispatch({
      type: "thread/update-turn",
      threadId,
      turnId,
      patch: {
        status: "error",
        error: outcome.error,
        followUps: outcome.followUps ?? [],
        steps: (turn?.steps ?? []).map((st, i, arr) => (i === arr.length - 1 ? { ...st, status: "error" as const } : st)),
      },
    });
  }
}

function titleFrom(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}

/** Ask Aria. Creates a thread if needed; returns where the answer will appear. */
export function ask(text: string, opts: { threadId?: string | null; context?: ContextItem[]; newThread?: boolean } = {}): { threadId: string; turnId: string } {
  const s = getState();
  const context = opts.context ?? s.context;
  let threadId = opts.newThread ? null : opts.threadId ?? s.activeThreadId;
  if (!threadId || !threadById(threadId)) {
    const thread: AriaThread = { id: newId("thread"), title: titleFrom(text), turns: [], createdAt: nowIso(), updatedAt: nowIso() };
    dispatch({ type: "thread/new", thread });
    threadId = thread.id;
  } else {
    dispatch({ type: "thread/select", id: threadId });
  }
  const userTurn: UserTurn = { id: newId("turn"), role: "user", text, context, at: nowIso() };
  dispatch({ type: "thread/append", threadId, turn: userTurn });
  const turnId = newId("turn");
  const turn: AgentTurn = { id: turnId, role: "assistant", status: "working", steps: [], blocks: [], sources: [], docSources: [], followUps: [], at: nowIso() };
  dispatch({ type: "thread/append", threadId, turn });
  execute(threadId, turnId, planFor(getState(), text, context, threadById(threadId)));
  return { threadId, turnId };
}

/** Stop a running turn. Completed steps stay visible; the question is kept. */
export function stop(threadId: string, turnId: string) {
  clearTimers(turnId);
  const turn = turnById(threadId, turnId);
  if (!turn || turn.status !== "working") return;
  dispatch({
    type: "thread/update-turn",
    threadId,
    turnId,
    patch: { status: "stopped", steps: turn.steps.map((st) => (st.status === "active" || st.status === "pending" ? { ...st, status: "skipped" as const } : st)) },
  });
}

/** Re-run a stopped/failed turn with the same question and context. */
export function retry(threadId: string, turnId: string, contextOverride?: ContextItem[]) {
  const user = userTurnBefore(threadId, turnId);
  if (!user) return;
  execute(threadId, turnId, planFor(getState(), user.text, contextOverride ?? user.context, threadById(threadId)));
}

/**
 * Continue after the user resolved a connect gate. The completed steps stay;
 * new steps record the connection and the rest of the original task runs.
 */
export function resume(threadId: string, turnId: string) {
  const user = userTurnBefore(threadId, turnId);
  const turn = turnById(threadId, turnId);
  if (!user || !turn) return;
  const gate = turn.gate;
  const name = gate?.kind === "connect" ? getState().integrations.find((i) => i.id === gate.integrationId)?.name : undefined;
  const kept: AgentRunStep[] = [
    ...turn.steps.map((st) => ({ ...st, status: "done" as const })),
    ...(name ? [{ id: `${turnId}-connected`, label: `Connected ${name}`, status: "done" as const, detail: "Read-only access" }] : []),
  ];
  const plan = planFor(getState(), user.text, user.context, threadById(threadId));
  // Skip steps already shown before the gate.
  const already = new Set(turn.steps.map((st) => st.label));
  execute(threadId, turnId, { steps: plan.steps.filter((st) => !already.has(st.label)), produce: plan.produce }, kept);
}

/** The user declined a gate. Nothing happens; Aria says so plainly. */
export function decline(threadId: string, turnId: string, message: string) {
  clearTimers(turnId);
  const turn = turnById(threadId, turnId);
  if (!turn) return;
  dispatch({
    type: "thread/update-turn",
    threadId,
    turnId,
    patch: { status: "done", gate: undefined, blocks: [...turn.blocks, { kind: "text", text: message }], followUps: ["What decisions were made this week?"] },
  });
}

/** Approval granted for an external write. Creates the links and records it on the turn. */
export function approveExternal(threadId: string, turnId: string) {
  const turn = turnById(threadId, turnId);
  if (!turn || turn.gate?.kind !== "approve") return;
  const action = turn.gate.action;
  const base = 512 + Math.floor(getState().actions.filter((a) => a.external).length);
  const keys = action.actionIds.map((_, i) => `PROD-${base + i}`);
  dispatch({ type: "action/link", ids: action.actionIds, keys, link: { system: action.system, url: "https://linear.app/lumen/team/PROD", syncedAt: nowIso() } });
  dispatch({
    type: "thread/update-turn",
    threadId,
    turnId,
    patch: {
      status: "done",
      gate: undefined,
      blocks: [...turn.blocks, { kind: "text", text: `Created ${keys.join(", ")} in ${SYSTEM_NAMES[action.system]}. Each issue links back to its transcript moment.` }, { kind: "actions", actionIds: action.actionIds }],
      followUps: ["Which action items are overdue?", "Draft a follow-up email"],
    },
  });
}

/** Update a draft block's resolution (added / discarded) so the transcript of the run stays truthful. */
export function resolveDraft(threadId: string, turnId: string, blockIndex: number, resolution: { state: "added" | "discarded"; recordId?: string }) {
  const turn = turnById(threadId, turnId);
  if (!turn) return;
  const blocks = turn.blocks.map((b, i) => {
    if (i !== blockIndex) return b;
    if (b.kind === "action-draft" || b.kind === "decision-draft" || b.kind === "owner-review") return { ...b, resolution: { ...resolution, at: nowIso() } };
    return b;
  });
  dispatch({ type: "thread/update-turn", threadId, turnId, patch: { blocks } });
}

export function isBusy(thread: AriaThread | undefined): boolean {
  const last = thread?.turns[thread.turns.length - 1];
  return !!last && last.role === "assistant" && last.status === "working";
}
