import { useSyncExternalStore } from "react";

/**
 * Minimal hash router. Hash routing keeps the app a static bundle with deep
 * links (a citation is a URL: #/meetings/pw-oct14?tab=transcript&seg=pw-oct14-s031).
 */

export type RouteName =
  | "dashboard"
  | "meetings"
  | "meeting"
  | "tasks"
  | "aria"
  | "search"
  | "integrations"
  | "settings"
  | "welcome"
  | "not-found";

export interface Route {
  name: RouteName;
  /** Path params, e.g. { id: "pw-oct14" }. */
  params: Record<string, string>;
  query: URLSearchParams;
  /** The raw hash path, e.g. "/meetings/pw-oct14". */
  path: string;
}

function parse(hash: string): Route {
  const raw = hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart = ""] = raw.split("?");
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const query = new URLSearchParams(queryPart);
  const seg = path.split("/").filter(Boolean);

  const route = (name: RouteName, params: Record<string, string> = {}): Route => ({ name, params, query, path });

  if (seg.length === 0) return route("dashboard");
  switch (seg[0]) {
    case "meetings":
      return seg[1] ? route("meeting", { id: decodeURIComponent(seg[1]) }) : route("meetings");
    case "tasks":
      return route("tasks");
    case "aria":
      return route("aria", seg[1] ? { threadId: decodeURIComponent(seg[1]) } : {});
    case "search":
      return route("search");
    case "integrations":
      return route("integrations");
    case "settings":
      return route("settings");
    case "welcome":
      return route("welcome");
    default:
      return route("not-found");
  }
}

let current = parse(typeof window === "undefined" ? "" : window.location.hash);
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    current = parse(window.location.hash);
    listeners.forEach((l) => l());
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, () => current);
}

export function getRoute(): Route {
  return current;
}

/** Navigate to an app path like "/meetings/pw-oct14?tab=transcript". */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const hash = `#${to.startsWith("/") ? to : `/${to}`}`;
  if (opts.replace) {
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(null, "", url);
    current = parse(hash);
    listeners.forEach((l) => l());
  } else if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

/** Builds an href for anchors: href={href("/tasks")}. */
export function href(to: string): string {
  return `#${to.startsWith("/") ? to : `/${to}`}`;
}

/** Update query params on the current route without adding history entries. */
export function setQuery(patch: Record<string, string | null>) {
  const q = new URLSearchParams(current.query);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") q.delete(k);
    else q.set(k, v);
  }
  const qs = q.toString();
  navigate(`${current.path}${qs ? `?${qs}` : ""}`, { replace: true });
}

/** Deep link to a transcript moment — the target of every citation. */
export function sourceHref(meetingId: string, segmentId: string): string {
  return href(`/meetings/${encodeURIComponent(meetingId)}?tab=transcript&seg=${encodeURIComponent(segmentId)}`);
}
