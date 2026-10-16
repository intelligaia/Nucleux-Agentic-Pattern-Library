import type { ProactiveSuggestion } from "@/domain/types";
import type { AppState } from "@/state/store";
import { isThisWeek } from "@/lib/time";

/**
 * Proactive observations, computed from data — never stored, never acted on.
 * Each one only opens something for the user to review.
 */
export function computeSuggestions(s: AppState): ProactiveSuggestion[] {
  if (!s.settings.proactive) return [];
  const out: ProactiveSuggestion[] = [];
  const W = ["No", "One", "Two", "Three", "Four", "Five", "Six"];
  const n = (k: number) => (k < W.length ? W[k] : String(k));

  const unowned = s.actions.filter((a) => a.status === "open" && !a.ownerId && a.priority === "high");
  if (unowned.length) {
    out.push({
      id: `owners:${unowned.map((a) => a.id).sort().join(",")}`,
      text: `${n(unowned.length)} high-priority action item${unowned.length === 1 ? " still doesn't" : "s still don't"} have an owner.`,
      actionLabel: "Review",
      target: { kind: "owner-review", actionIds: unowned.map((a) => a.id) },
      sources: unowned.flatMap((a) => a.sources.slice(0, 1)),
    });
  }

  const unresolved = s.decisions.filter((d) => d.status === "unresolved");
  const meetingsWithOpen = [...new Set(unresolved.map((d) => d.meetingId))].filter((id) => {
    const m = s.meetings.find((x) => x.id === id);
    return m && isThisWeek(m.start);
  });
  if (meetingsWithOpen.length >= 2) {
    const launchRelated = unresolved.some((d) => d.topics.some((t) => /launch/i.test(t)));
    out.push({
      id: `decisions:${meetingsWithOpen.sort().join(",")}`,
      text: `${n(meetingsWithOpen.length)} meetings from this week have unresolved ${launchRelated ? "launch " : ""}decisions.`,
      actionLabel: "Review decisions",
      target: { kind: "decisions", meetingIds: meetingsWithOpen },
      sources: unresolved.filter((d) => meetingsWithOpen.includes(d.meetingId)).flatMap((d) => d.sources.slice(0, 1)),
    });
  }

  const suggested = s.actions.filter((a) => a.status === "suggested");
  const byMeeting = new Map<string, number>();
  suggested.forEach((a) => a.meetingId && byMeeting.set(a.meetingId, (byMeeting.get(a.meetingId) ?? 0) + 1));
  for (const [meetingId, k] of byMeeting) {
    const m = s.meetings.find((x) => x.id === meetingId);
    if (!m) continue;
    out.push({
      id: `suggested:${meetingId}:${k}`,
      text: `Aria found ${n(k).toLowerCase()} possible action item${k === 1 ? "" : "s"} in ${m.title} that nobody has confirmed.`,
      actionLabel: "Review",
      target: { kind: "meeting", meetingId },
      sources: suggested.filter((a) => a.meetingId === meetingId).flatMap((a) => a.sources.slice(0, 1)),
    });
  }

  return out.filter((x) => !s.dismissedSuggestionIds.includes(x.id));
}
