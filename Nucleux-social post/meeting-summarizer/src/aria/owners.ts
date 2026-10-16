import type { ActionItem, Person } from "@/domain/types";
import type { AppState } from "@/state/store";
import { formatOffset } from "@/lib/time";

/** Keyword → job-title hints used to propose an owner. Proposals are never applied automatically. */
const ROLE_HINTS: [RegExp, RegExp][] = [
  [/\b(analytics|event|dashboard|metric|data|qa)\b/i, /data|analyst/i],
  [/\b(rollback|deploy|flag|release|schema|engineering|api|bug)\b/i, /engineer/i],
  [/\b(help center|customer|support|sso|guide)\b/i, /customer success/i],
  [/\b(positioning|copy|email|messaging|sales|launch brief)\b/i, /marketing/i],
  [/\b(design|mock|empty state|screens?|checklist)\b/i, /design/i],
  [/\b(finance|budget|ops|process)\b/i, /operations/i],
];

export interface OwnerProposal {
  personId: string;
  reason: string;
}

export function proposeOwner(action: ActionItem, state: AppState): OwnerProposal | null {
  const meeting = state.meetings.find((m) => m.id === action.meetingId);
  const internal = (p: Person | undefined) => p && p.team !== "external";
  const candidates = state.people.filter((p) => internal(p) && (!meeting || meeting.participantIds.includes(p.id)));

  // 1. Someone who spoke about it right around the cited moment.
  if (meeting && action.sources.length) {
    const idx = meeting.transcript.findIndex((s) => s.id === action.sources[0].segmentId);
    const window = meeting.transcript.slice(Math.max(0, idx - 2), idx + 3);
    for (const [topic, role] of ROLE_HINTS) {
      if (!topic.test(action.title)) continue;
      const speaker = window
        .map((s) => state.people.find((p) => p.id === s.speakerId))
        .find((p) => internal(p) && role.test(p!.title) && !p!.isMe);
      if (speaker) {
        const seg = window.find((s) => s.speakerId === speaker.id)!;
        return { personId: speaker.id, reason: `${speaker.name.split(" ")[0]} discussed this at ${formatOffset(seg.startSec)} and is the ${speaker.title}` };
      }
    }
  }

  // 2. A participant whose role matches the work.
  for (const [topic, role] of ROLE_HINTS) {
    if (!topic.test(action.title)) continue;
    const p = candidates.find((c) => role.test(c.title) && !c.isMe);
    if (p) return { personId: p.id, reason: `${p.title}${meeting ? ` · attended ${meeting.title}` : ""}` };
  }
  return null;
}
