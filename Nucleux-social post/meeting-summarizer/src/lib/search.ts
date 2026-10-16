import type { ActionItem, Decision, Meeting, MeetingType, Person, TeamId, TranscriptSegment } from "@/domain/types";
import { addDays, NOW, parseDate } from "@/lib/time";

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export type DateRange = "any" | "today" | "this-week" | "last-7" | "last-30" | "upcoming";

export interface SearchFilters {
  date: DateRange;
  team: TeamId | "any";
  participantId: string | "any";
  type: MeetingType | "any";
}

export const EMPTY_FILTERS: SearchFilters = { date: "any", team: "any", participantId: "any", type: "any" };

export const DATE_LABELS: Record<DateRange, string> = {
  any: "Any time",
  today: "Today",
  "this-week": "This week",
  "last-7": "Last 7 days",
  "last-30": "Last 30 days",
  upcoming: "Upcoming",
};

export const TEAM_LABELS: Record<TeamId, string> = {
  product: "Product",
  design: "Design",
  engineering: "Engineering",
  growth: "Growth",
  marketing: "Marketing",
  "customer-success": "Customer Success",
  external: "External",
};

export const TYPE_LABELS: Record<MeetingType, string> = {
  sync: "Sync",
  review: "Review",
  research: "Customer research",
  planning: "Planning",
  critique: "Critique",
  "one-on-one": "1:1",
};

export function matchesDate(m: Meeting, range: DateRange): boolean {
  if (range === "any") return true;
  const start = parseDate(m.start);
  const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  switch (range) {
    case "today":
      return start >= today && start < addDays(today, 1);
    case "this-week": {
      const day = today.getDay() === 0 ? 7 : today.getDay();
      const monday = addDays(today, 1 - day);
      return start >= monday && start < addDays(monday, 7);
    }
    case "last-7":
      return start >= addDays(today, -7) && start <= NOW;
    case "last-30":
      return start >= addDays(today, -30) && start <= NOW;
    case "upcoming":
      return start > NOW;
  }
}

export function matchesFilters(m: Meeting, f: SearchFilters): boolean {
  return (
    matchesDate(m, f.date) &&
    (f.team === "any" || m.team === f.team) &&
    (f.participantId === "any" || m.participantIds.includes(f.participantId)) &&
    (f.type === "any" || m.type === f.type)
  );
}

/* ------------------------------------------------------------------ */
/* Natural-language interpretation                                     */
/* ------------------------------------------------------------------ */

export interface Interpretation {
  /** Remaining search terms after filter phrases are lifted out. */
  terms: string[];
  /** Filters implied by the phrasing. Shown to the user; never override explicit filters. */
  implied: Partial<SearchFilters>;
  /** Implied values that conflicted with an explicit filter and were not applied. */
  conflicts: { key: keyof SearchFilters; implied: string; kept: string }[];
}

const STOP = new Set(
  "a an the and or of to in on at for from with about was were is are be been being did do does we our us i me my you your it its that this these those what which who whom when where why how there their them they he she his her as by into than then so if not no yes all any some meeting meetings call calls discussed discuss discussion talked talk mentioned mention said say says where find show me give list".split(
    " ",
  ),
);

export function stem(w: string): string {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

const DATE_PHRASES: [RegExp, DateRange][] = [
  [/\b(last|past)\s+(30|thirty)\s+days\b|\blast month\b|\bthis month\b/i, "last-30"],
  [/\b(last|past)\s+(7|seven)\s+days\b|\blast week\b/i, "last-7"],
  [/\bthis week\b/i, "this-week"],
  [/\btoday\b|\bthis morning\b/i, "today"],
  [/\bupcoming\b|\bnext week\b|\bscheduled\b/i, "upcoming"],
];

const TEAM_PHRASES: [RegExp, TeamId][] = [
  [/\bproduct team\b|\bteam:? ?product\b/i, "product"],
  [/\bdesign team\b|\bteam:? ?design\b/i, "design"],
  [/\bengineering\b|\beng team\b/i, "engineering"],
  [/\bgrowth team\b/i, "growth"],
  [/\bmarketing team\b/i, "marketing"],
];

const TYPE_PHRASES: [RegExp, MeetingType][] = [
  [/\bcustomer (research|interviews?|calls?)\b|\bresearch\b/i, "research"],
  [/\bcritiques?\b/i, "critique"],
  [/\b1:1s?\b|\bone[- ]on[- ]ones?\b/i, "one-on-one"],
  [/\bplanning\b/i, "planning"],
];

export function interpret(query: string, explicit: SearchFilters, people: Person[]): Interpretation {
  let rest = ` ${query} `;
  const implied: Partial<SearchFilters> = {};
  const conflicts: Interpretation["conflicts"] = [];

  const lift = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K], re: RegExp, label: (v: SearchFilters[K]) => string) => {
    rest = rest.replace(re, " ");
    if (explicit[key] !== "any" && explicit[key] !== value) {
      conflicts.push({ key, implied: label(value), kept: label(explicit[key]) });
      return;
    }
    implied[key] = value;
  };

  for (const [re, v] of DATE_PHRASES) if (re.test(rest)) { lift("date", v, re, (x) => DATE_LABELS[x as DateRange]); break; }
  for (const [re, v] of TEAM_PHRASES) if (re.test(rest)) { lift("team", v, re, (x) => (x === "any" ? "Any team" : TEAM_LABELS[x as TeamId])); break; }
  for (const [re, v] of TYPE_PHRASES) if (re.test(rest)) { lift("type", v, re, (x) => (x === "any" ? "Any type" : TYPE_LABELS[x as MeetingType])); break; }
  for (const p of people) {
    const first = p.name.split(" ")[0];
    const re = new RegExp(`\\b(with|by|from)\\s+(${p.name}|${first})\\b`, "i");
    if (re.test(rest)) {
      lift("participantId", p.id, re, (x) => (x === "any" ? "Anyone" : people.find((pp) => pp.id === x)?.name ?? String(x)));
      break;
    }
  }

  return { terms: tokenize(rest), implied, conflicts };
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

/** Fraction of query terms present in the text (0–1), with a phrase bonus. */
export function scoreText(text: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const tokens = new Set(tokenize(text));
  let hit = 0;
  for (const t of terms) if (tokens.has(t)) hit += 1;
  const ratio = hit / terms.length;
  const phrase = terms.length > 1 && tokenize(text).join(" ").includes(terms.join(" ")) ? 0.25 : 0;
  return ratio + phrase;
}

const MIN_SCORE = 0.66;

export interface SegmentHit {
  meeting: Meeting;
  segment: TranscriptSegment;
  score: number;
}

export interface SearchResults {
  meetings: { meeting: Meeting; score: number; hits: number }[];
  moments: SegmentHit[];
  decisions: { decision: Decision; score: number }[];
  actions: { action: ActionItem; score: number }[];
  people: Person[];
  /** Effective filters: explicit ∧ implied. */
  filters: SearchFilters;
  interpretation: Interpretation;
}

export interface Corpus {
  meetings: Meeting[];
  decisions: Decision[];
  actions: ActionItem[];
  people: Person[];
}

export function search(corpus: Corpus, query: string, explicit: SearchFilters): SearchResults {
  const interpretation = interpret(query, explicit, corpus.people);
  const filters: SearchFilters = { ...explicit, ...interpretation.implied };
  const terms = interpretation.terms;
  const inScope = corpus.meetings.filter((m) => matchesFilters(m, filters));
  const scopeIds = new Set(inScope.map((m) => m.id));

  const moments: SegmentHit[] = [];
  const meetingScores = new Map<string, { score: number; hits: number }>();
  for (const m of inScope) {
    const topicScore = Math.max(0, ...m.topics.map((t) => scoreText(t, terms)), scoreText(m.title, terms));
    let best = topicScore;
    let hits = 0;
    for (const seg of m.transcript) {
      const s = scoreText(seg.text, terms);
      if (s >= MIN_SCORE) {
        moments.push({ meeting: m, segment: seg, score: s });
        hits += 1;
        best = Math.max(best, s);
      }
    }
    if (terms.length === 0 || best >= MIN_SCORE) meetingScores.set(m.id, { score: best + Math.min(hits, 5) * 0.05, hits });
  }

  const meetings = [...meetingScores.entries()]
    .map(([id, v]) => ({ meeting: inScope.find((m) => m.id === id)!, ...v }))
    .sort((a, b) => b.score - a.score || parseDate(b.meeting.start).getTime() - parseDate(a.meeting.start).getTime());

  const decisions = corpus.decisions
    .filter((d) => scopeIds.has(d.meetingId))
    .map((decision) => ({ decision, score: Math.max(scoreText(decision.text, terms), ...decision.topics.map((t) => scoreText(t, terms))) }))
    .filter((d) => terms.length > 0 && d.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  const actions = corpus.actions
    .filter((a) => a.status !== "dismissed" && (a.meetingId === null || scopeIds.has(a.meetingId)))
    .map((action) => ({ action, score: scoreText(action.title, terms) }))
    .filter((a) => terms.length > 0 && a.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  const q = query.trim().toLowerCase();
  const people =
    q.length >= 2
      ? corpus.people.filter((p) => p.name.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || (p.org ?? "").toLowerCase().includes(q))
      : [];

  moments.sort((a, b) => b.score - a.score || parseDate(b.meeting.start).getTime() - parseDate(a.meeting.start).getTime());

  return { meetings, moments, decisions, actions, people, filters, interpretation };
}
