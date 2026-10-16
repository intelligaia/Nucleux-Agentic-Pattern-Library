import type { ComparisonRow, Decision, ExternalDoc, Meeting } from "@/domain/types";
import type { AppState } from "@/state/store";
import { scoreText, tokenize } from "@/lib/search";

/**
 * Compares a meeting's decisions with an external document, section by
 * section. Dates are compared explicitly — a decision that moves a date the
 * document states is a conflict, not a paraphrase.
 */

const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?";
const DATE_RE = new RegExp(`\\b${MONTH}\\s+(\\d{1,2})\\b`, "gi");

function dates(text: string): string[] {
  return [...text.matchAll(DATE_RE)].map((m) => `${m[1].slice(0, 3).toLowerCase()} ${Number(m[2])}`);
}

function sentences(body: string): string[] {
  return body.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

function bestSentence(doc: ExternalDoc, terms: string[]): { heading: string; sentence: string; score: number } | null {
  let best: { heading: string; sentence: string; score: number } | null = null;
  for (const section of doc.sections) {
    for (const sentence of sentences(section.body)) {
      const score = scoreText(`${section.heading} ${sentence}`, terms);
      if (!best || score > best.score) best = { heading: section.heading, sentence, score };
    }
  }
  return best;
}

function topicLabel(d: Decision): string {
  const t = d.topics[0] ?? d.text.split(" ").slice(0, 3).join(" ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function compareWithDoc(state: AppState, meeting: Meeting, doc: ExternalDoc): ComparisonRow[] {
  const decisions = state.decisions.filter((d) => d.meetingId === meeting.id && d.status === "confirmed");
  const rows: ComparisonRow[] = [];
  const usedHeadings = new Set<string>();

  for (const d of decisions) {
    const terms = [...new Set(tokenize(`${d.text} ${d.topics.join(" ")}`))].filter((t) => !/^\d+$/.test(t) && t.length > 2);
    const match = bestSentence(doc, terms);
    if (!match || match.score < 0.2) {
      rows.push({ topic: topicLabel(d), meeting: d.text, brief: "Not covered in the brief.", verdict: "not-in-brief", sources: d.sources });
      continue;
    }
    usedHeadings.add(match.heading);
    const dd = dates(d.text);
    const bd = dates(match.sentence);
    const conflict = dd.length > 0 && bd.length > 0 && !dd.some((x) => bd.includes(x));
    rows.push({
      topic: topicLabel(d),
      meeting: d.text,
      brief: match.sentence,
      verdict: conflict ? "conflict" : "aligned",
      sources: d.sources,
      docSection: match.heading,
    });
  }

  // Brief commitments the meeting never touched — useful, not alarming.
  const transcript = meeting.transcript.map((s) => s.text).join(" ");
  for (const section of doc.sections) {
    if (usedHeadings.has(section.heading) || /goal|success|metric|open items?|risk/i.test(section.heading)) continue;
    const terms = tokenize(section.heading);
    if (terms.length && scoreText(transcript, terms) < 0.5) {
      rows.push({
        topic: section.heading,
        meeting: "Not discussed in this meeting.",
        brief: sentences(section.body)[0] ?? section.body,
        verdict: "not-discussed",
        sources: [],
        docSection: section.heading,
      });
    }
  }

  const order: Record<ComparisonRow["verdict"], number> = { conflict: 0, "not-in-brief": 1, aligned: 2, "not-discussed": 3 };
  return rows.sort((a, b) => order[a.verdict] - order[b.verdict]);
}
