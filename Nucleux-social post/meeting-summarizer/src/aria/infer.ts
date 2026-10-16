import type { Inference, Person, Priority, TranscriptSegment } from "@/domain/types";
import { addDays, NOW, toIsoDate, formatOffset } from "@/lib/time";

/**
 * Deterministic extraction used by Aria to turn transcript selections into
 * drafts. Every inferred value carries a human-readable reason so the user can
 * judge it before confirming.
 */

const COMMIT_RE = /\b(?:someone should|somebody should|we should|we need to|need to|needs to|let'?s|we'll|we will|can you|could you|you should|should)\s+([^.?!]+)/i;
const SELF_ASSIGN_RE = /\b(I can take (?:that|it|this)|I'll take (?:that|it|this)|I can do (?:that|it)|I'll do (?:that|it)|I'll handle|I can handle|leave it with me|I can look (?:at|into) (?:that|it)|I'll look (?:at|into)|I'm on it|I'll own)/i;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cleanTitle(raw: string): string {
  let t = raw
    .replace(/^(?:make sure|go ahead and|probably|just|also)\s+/i, "")
    .replace(/\s*[—–-]\s.*$/, "") // drop trailing clauses after a dash
    .replace(/\s+(?:before|if|because|so that|so)\s.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/\bwhether\b/i, "if");
  if (t.length > 72) t = `${t.slice(0, 69).replace(/\s+\S*$/, "")}…`;
  return capitalize(t);
}

export function inferTitle(segments: TranscriptSegment[]): { title: string; inference: Inference } {
  for (const s of segments) {
    const m = s.text.match(COMMIT_RE);
    if (m && m[1].split(" ").length >= 3) {
      return { title: cleanTitle(m[1]), inference: { field: "title", reason: `From “${m[0].trim().slice(0, 80)}”` } };
    }
  }
  const first = segments[0]?.text ?? "Follow up";
  const sentence = first.split(/(?<=[.?!])\s/)[0];
  return { title: cleanTitle(sentence), inference: { field: "title", reason: "Summarised from the first selected line" } };
}

export function inferOwner(segments: TranscriptSegment[], people: Person[]): { ownerId: string | null; inference: Inference } {
  for (const s of segments) {
    if (SELF_ASSIGN_RE.test(s.text)) {
      const p = people.find((pp) => pp.id === s.speakerId);
      return {
        ownerId: s.speakerId,
        inference: { field: "owner", reason: `${p?.name.split(" ")[0] ?? "The speaker"} volunteered at ${formatOffset(s.startSec)}` },
      };
    }
  }
  for (const s of segments) {
    for (const p of people) {
      const first = p.name.split(" ")[0];
      if (new RegExp(`\\b${first}\\b,? (?:will|can|should|to)\\b`, "i").test(s.text)) {
        return { ownerId: p.id, inference: { field: "owner", reason: `${first} was named at ${formatOffset(s.startSec)}` } };
      }
    }
  }
  return { ownerId: null, inference: { field: "owner", reason: "Nobody took this on in the selection" } };
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function nextWeekday(target: number, minDaysAhead = 1): Date {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  let n = minDaysAhead;
  while ((d.getDay() + n) % 7 !== target) n += 1;
  return addDays(d, n);
}

export function inferDue(segments: TranscriptSegment[]): { due: string | null; inference: Inference } {
  const text = segments.map((s) => s.text).join(" ").toLowerCase();
  const say = (due: Date, phrase: string) => ({ due: toIsoDate(due), inference: { field: "due" as const, reason: `“${phrase}”` } });
  if (/\bearly next week\b/.test(text)) return say(nextWeekday(2, 2), "early next week");
  if (/\bnext week\b/.test(text)) return say(nextWeekday(1, 2), "next week");
  if (/\bend of (?:the )?week\b|\bthis week\b/.test(text)) return say(nextWeekday(5, 0), "end of the week");
  if (/\btomorrow\b/.test(text)) return say(addDays(NOW, 1), "tomorrow");
  if (/\btoday\b|\bby eod\b/.test(text)) return say(NOW, "today");
  for (let i = 0; i < 7; i += 1) {
    const m = text.match(new RegExp(`\\b(?:by |on |before )?${WEEKDAYS[i]}\\b`));
    if (m) return say(nextWeekday(i, 1), m[0].trim());
  }
  return { due: null, inference: { field: "due", reason: "No timing was mentioned" } };
}

export function inferPriority(segments: TranscriptSegment[]): { priority: Priority; inference: Inference } {
  const text = segments.map((s) => s.text).join(" ").toLowerCase();
  const hit = text.match(/\b(breaks?|blocker|blocking|urgent|revenue|critical|doesn'?t slip|can'?t slip|asap)\b/);
  if (hit) return { priority: "high", inference: { field: "priority", reason: `Flagged as risky (“${hit[0]}”)` } };
  return { priority: "medium", inference: { field: "priority", reason: "No urgency was stated" } };
}

/** A decision sentence from a selection: prefers lines with agreement language. */
export function inferDecision(segments: TranscriptSegment[]): string {
  const agree = /\b(?:let'?s|we'll|we will|agreed|decided|going with|we're going to|the plan is to)\s+([^.?!]+)/i;
  for (const s of segments) {
    const m = s.text.match(agree);
    if (m) return cleanTitle(m[1]);
  }
  return cleanTitle(segments[segments.length - 1]?.text.split(/(?<=[.?!])\s/)[0] ?? "Decision");
}
