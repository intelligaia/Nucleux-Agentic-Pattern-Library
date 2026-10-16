import { DEMO_NOW } from "@/data";

/**
 * The app runs on a fixed demo clock so "Today", "Due Friday" and "Overdue"
 * stay meaningful whenever the demo is opened.
 */
export const NOW = new Date(DEMO_NOW);

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from today to `d` (negative = past). */
export function dayDiff(d: Date | string): number {
  const date = typeof d === "string" ? parseDate(d) : d;
  return Math.round((startOfDay(date).getTime() - startOfDay(NOW).getTime()) / DAY_MS);
}

/** Parses "YYYY-MM-DD" as a local date (not UTC) and full ISO strings as-is. */
export function parseDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "long" });
const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const TIME = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** "Today", "Yesterday", "Tomorrow", "Monday" (within a week ahead), else "Oct 12". */
export function relativeDay(d: Date | string): string {
  const date = typeof d === "string" ? parseDate(d) : d;
  const diff = dayDiff(date);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return WEEKDAY.format(date);
  return MONTH_DAY.format(date);
}

export function monthDay(d: Date | string): string {
  return MONTH_DAY.format(typeof d === "string" ? parseDate(d) : d);
}

export function weekdayShort(d: Date | string): string {
  return WEEKDAY_SHORT.format(typeof d === "string" ? parseDate(d) : d);
}

export function clockTime(d: Date | string): string {
  return TIME.format(typeof d === "string" ? parseDate(d) : d);
}

/** "10:00–10:42 AM" */
export function timeRange(startIso: string, durationMin: number): string {
  const start = parseDate(startIso);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const s = TIME.format(start);
  const e = TIME.format(end);
  const sameMeridiem = s.slice(-2) === e.slice(-2);
  return `${sameMeridiem ? s.slice(0, -3) : s}–${e}`;
}

/** Offset seconds → "14:02" or "1:02:10". */
export function formatOffset(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`;
}

/** Spoken form for screen readers: "14 minutes 2 seconds". */
export function spokenOffset(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (r || parts.length === 0) parts.push(`${r} second${r === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** "Due Friday", "Due today", "Overdue · Oct 12", "No due date". */
export function dueLabel(due: string | null): { text: string; overdue: boolean; soon: boolean } {
  if (!due) return { text: "No due date", overdue: false, soon: false };
  const diff = dayDiff(due);
  if (diff < 0) return { text: `Overdue · ${monthDay(due)}`, overdue: true, soon: false };
  if (diff === 0) return { text: "Due today", overdue: false, soon: true };
  return { text: `Due ${relativeDay(due)}`, overdue: false, soon: diff <= 3 };
}

export function greeting(): string {
  const h = NOW.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function isThisWeek(d: Date | string): boolean {
  const date = typeof d === "string" ? parseDate(d) : d;
  const day = NOW.getDay() === 0 ? 7 : NOW.getDay();
  const monday = addDays(startOfDay(NOW), 1 - day);
  const nextMonday = addDays(monday, 7);
  return date >= monday && date < nextMonday;
}

export function nowIso(): string {
  // Real elapsed time on top of the demo clock keeps ordering correct within a session.
  return new Date(NOW.getTime() + (performance.now() | 0)).toISOString();
}
