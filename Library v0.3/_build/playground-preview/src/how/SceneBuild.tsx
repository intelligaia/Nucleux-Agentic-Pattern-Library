/* Tile 3 — "Watch your UI take shape."
   A project dashboard assembled from tile 2's picks, following Nucleux's
   app-shell (SidebarProvider › Sidebar, kept to its icon rail, + SidebarInset),
   dashboard-overview (MetricCard row, a project Table with Badge status and
   Progress) and list-page (one primary Button in the header, a search Input and
   a filter in the toolbar, Checkbox row selection, ghost row actions) patterns,
   plus the app's AI assistant, Aria: an AgentAvatar launcher (Material 3: Md3AgentAvatar, the user's choice) at the bottom right
   that, clicked, dims the dashboard and opens a full-height panel built from
   Nucleux's SuggestedPrompts composition as on nucleux.in (agent header, a
   greeting Message, suggested prompts, the shadcn OpenInput composer, a Caveat).
   All real @nucleux/react components; only the pointer is drawn here.
     0.0–0.6  app frame + icon rail      (label "Sidebar")
     0.4–0.85 header actions              (label "Button")
     0.6–1.5  metric cards settle         (label "CardContainer")
     1.5–2.4  project table and rows      (label "Table")
     2.4–3.0  status badges, progress fills; the row checkboxes are named (label "Checkbox")
     3.2–3.9  Aria's launcher arrives; a pointer clicks it (label "AgentAvatar")
     3.95–4.3 the dashboard dims; the assistant panel opens (label "OpenInput")
     4.3–6.5  hold on the open panel (nothing is picked or typed) */
import type * as React from "react";
import { Download, Ellipsis, FolderKanban, LayoutDashboard, Plus, Settings, SlidersHorizontal, Users } from "lucide-react";
import {
  Caveat, Md3AgentAvatar, Message, OpenInput, OpenInputModelChip, SuggestedPrompts,
  Badge, Button, CardContainer, CardContent, CardHeader, CardTitle, Checkbox, Input, Progress,
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@nucleux/react";
import { blip, eo, rise, seg, type SceneProps } from "./time";

export const T3 = {
  frame: 0, nav: 0.18, actions: [0.45, 0.55], metrics: [0.6, 0.78, 0.96], table: 1.5, rows: [1.72, 1.88, 2.04],
  badges: [2.4, 2.5, 2.6], fill: [2.45, 2.95],
  aria: 3.2, pointer: [3.35, 3.85], click: 3.9, overlay: 3.95,
  labels: { Sidebar: [0.12, 1.05], Button: [0.4, 0.85], CardContainer: [1.0, 1.7], Table: [1.6, 2.55], Checkbox: [2.85, 3.45], AgentAvatar: [3.2, 3.85], OpenInput: [4.3, 5.1] },
} as const;

const NAV = [
  { label: "Overview", Icon: LayoutDashboard },
  { label: "Projects", Icon: FolderKanban },
  { label: "Team", Icon: Users },
  { label: "Settings", Icon: Settings },
];
/* dashboard-overview's MetricCard: label, value, change line */
const METRICS = [
  { label: "Active projects", value: "12", change: "+2 this month" },
  { label: "Tasks complete", value: "84%", change: "+6% this week" },
  { label: "Team members", value: "8", change: "2 joined this month" },
];
const ROWS = [
  { name: "Website redesign", status: "On track", variant: "success", done: 72 },
  { name: "Mobile app", status: "In review", variant: "info", done: 58 },
  { name: "Design system", status: "Done", variant: "secondary", done: 100 },
] as const;

const PROMPTS = ["Which project is at risk?", "Summarize this week"];

/** Aria's approved mark, as on nucleux.in's Md3AgentAvatar: an abstract orbit, never a face.
    (Aria's avatar is the Material 3 one by the user's choice; the rest of the scene is shadcn.) */
function AriaMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="!size-full text-md-primary">
      <path d="M29.5 14.5A11 11 0 1 0 31 20" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      <circle cx="20" cy="20" r="5.5" fill="currentColor" />
      <circle cx="30.5" cy="11.5" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** A plain pointer: it only shows where the person clicks. */
function Pointer() {
  return (
    <svg viewBox="0 0 20 22" className="h-[22px] w-5 drop-shadow" aria-hidden="true">
      <path d="M2 1.5 2 17l4.2-3.8 2.9 6.6 2.7-1.2-2.9-6.4 5.7-.3Z" className="fill-foreground stroke-background" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** One of tile 2's component names, held over its part while that part lands. */
function PartLabel({ t, name, className = "" }: { t: number; name: keyof typeof T3.labels; className?: string }) {
  const [a, b] = T3.labels[name];
  const p = blip(t, a, b);
  return (
    <span aria-hidden="true" className={"pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-nx-violet px-1.5 py-0.5 font-mono text-[11px] font-medium leading-4 text-primary-foreground shadow-sm " + className}
      style={{ opacity: p, transform: `translateY(${((1 - p) * 4).toFixed(2)}px)` }}>
      {name}
    </span>
  );
}

export function SceneBuild({ t, compact }: SceneProps) {
  const fill = eo(seg(t, T3.fill[0], T3.fill[1]));
  const frame = eo(seg(t, T3.frame, T3.frame + 0.5));
  const nav = eo(seg(t, T3.nav, T3.nav + 0.45));
  /* Aria: the launcher arrives, a pointer travels to it and clicks, the overlay opens */
  const frameW = compact ? 376 : 760, frameH = compact ? 476 : 560;
  const target = [frameW - 16 - 22, frameH - 16 - 22];
  const from = [frameW * 0.58, frameH * 0.5];
  const go = eo(seg(t, T3.pointer[0], T3.pointer[1]));
  const arc = Math.sin(go * Math.PI) * -18;
  const pointer = [from[0] + (target[0] - from[0]) * go + arc * 0.4, from[1] + (target[1] - from[1]) * go + arc];
  const pointerOn = eo(seg(t, T3.pointer[0] - 0.05, T3.pointer[0] + 0.2)) * (1 - eo(seg(t, T3.click + 0.25, T3.click + 0.5)));
  const launch = eo(seg(t, T3.aria, T3.aria + 0.35));
  const press = seg(t, T3.click, T3.click + 0.08) - seg(t, T3.click + 0.1, T3.click + 0.24);
  const ring = seg(t, T3.click, T3.click + 0.45);
  const open = eo(seg(t, T3.overlay, T3.overlay + 0.35));
  return (
    <div className={"absolute overflow-hidden rounded-xl border border-border bg-background shadow-sm " + (compact ? "inset-3" : "inset-5")}
      style={{ opacity: frame, transform: `scale(${(0.985 + 0.015 * frame).toFixed(4)})` }}>
      <SidebarProvider className="h-full min-h-0" style={{ "--sidebar-width": compact ? "44px" : "52px" } as React.CSSProperties}>
        {/* the sidebar kept to its icon rail (labels stay for screen readers) */}
        <Sidebar collapsible="none" className="relative border-r border-border"
          style={{ opacity: nav, transform: `translateX(${((1 - nav) * -10).toFixed(2)}px)` }}>
          <SidebarHeader className="items-center px-1.5 py-3">
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-foreground text-xs font-semibold text-background">A</span>
          </SidebarHeader>
          <SidebarContent>
            <nav aria-label="Primary">
              <SidebarGroup className="px-1.5">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {NAV.map(({ label, Icon }, i) => (
                      <SidebarMenuItem key={label} style={rise(t, T3.nav + 0.1 + i * 0.07, 0.35, 6)}>
                        <SidebarMenuButton isActive={i === 0} tabIndex={-1} className="justify-center">
                          <Icon aria-hidden="true" />
                          <span className="sr-only">{label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </nav>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="min-h-0 min-w-0">
          <div className={"flex min-h-0 flex-1 flex-col " + (compact ? "gap-3 p-3" : "gap-4 p-5")}>
            <header className="relative flex items-center gap-2">
              <div className="flex min-w-0 items-center gap-2" style={rise(t, 0.3, 0.4, 6)}>
                {/* app-shell's top-bar toggle (the preview is inert, so it is never pressed) */}
                <SidebarTrigger tabIndex={-1} className="-ml-1 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-base font-semibold tracking-tight text-foreground">Overview</p>
                  <p className="truncate text-xs text-muted-foreground">Where your projects stand this week</p>
                </div>
              </div>
              {/* list-page: one primary action in the header, a secondary beside it */}
              <div className="relative ml-auto flex shrink-0 items-center gap-2">
                <PartLabel t={t} name="Button" className="-top-6 right-0" />
                {!compact && (
                  <span style={rise(t, T3.actions[0], 0.35, 6)}>
                    <Button variant="secondary" size="sm" tabIndex={-1} leftIcon={<Download className="size-3.5" aria-hidden="true" />}>Export</Button>
                  </span>
                )}
                <span style={rise(t, T3.actions[1], 0.35, 6)}>
                  <Button variant="cta" size="sm" tabIndex={-1} leftIcon={<Plus className="size-3.5" aria-hidden="true" />}>{compact ? "New" : "New project"}</Button>
                </span>
              </div>
            </header>

            <section aria-label="Key metrics" className="relative grid grid-cols-3 gap-2.5">
              <PartLabel t={t} name="CardContainer" className="-top-2.5 right-2" />
              {METRICS.map((m, i) => (
                <div key={m.label} style={rise(t, T3.metrics[i], 0.45, 12)}>
                  <CardContainer className="h-full shadow-sm">
                    <CardContent className={compact ? "px-2.5 py-2" : "px-3.5 py-2.5"}>
                      <p className={"text-muted-foreground " + (compact ? "text-[11px] leading-tight" : "truncate text-xs")}>{m.label}</p>
                      <p className={"mt-0.5 font-semibold tabular-nums tracking-tight text-foreground " + (compact ? "text-lg" : "text-2xl")}>{m.value}</p>
                      {!compact && <p className="mt-0.5 text-xs text-muted-foreground">{m.change}</p>}
                    </CardContent>
                  </CardContainer>
                </div>
              ))}
            </section>

            <div className="relative" style={rise(t, T3.table, 0.45, 12)}>
              <PartLabel t={t} name="Table" className="-top-2.5 right-2" />
              <CardContainer className="overflow-hidden shadow-sm">
                <CardHeader className={"items-center " + (compact ? "px-3 py-2" : "px-4 py-2")}>
                  <CardTitle className="text-sm">Projects</CardTitle>
                  {/* toolbar: search and a filter */}
                  <div role="search" className="flex items-center gap-1.5">
                    {!compact && <Input type="search" aria-label="Search projects" placeholder="Search projects" readOnly tabIndex={-1} className="h-8 w-40 text-xs" />}
                    <Button variant="secondary" size="icon-sm" aria-label="Filter projects" tabIndex={-1}>
                      <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 w-9 pl-3 pr-0"><Checkbox aria-label="Select all projects" tabIndex={-1} checked={false} /></TableHead>
                      <TableHead className="h-8 px-3">Project</TableHead>
                      <TableHead className="h-8 px-3">Status</TableHead>
                      {!compact && <TableHead className="h-8 w-[30%] px-3">Progress</TableHead>}
                      {!compact && <TableHead className="h-8 w-9 px-0"><span className="sr-only">Actions</span></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ROWS.map((r, i) => {
                      const b = eo(seg(t, T3.badges[i], T3.badges[i] + 0.25));
                      const bar = (
                        <div className="flex items-center gap-2">
                          <Progress value={Math.round(r.done * fill)} size="sm" aria-label={`${r.name} progress`} indicatorClassName="transition-none" />
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{Math.round(r.done * fill)}%</span>
                        </div>
                      );
                      return (
                        <TableRow key={r.name} className="hover:bg-transparent" style={rise(t, T3.rows[i], 0.35, 8)}>
                          <TableCell className="w-9 py-2 pl-3 pr-0">
                            <span className="relative inline-flex">
                              {i === 1 && <PartLabel t={t} name="Checkbox" className="-top-6 left-0" />}
                              <Checkbox aria-label={`Select ${r.name}`} tabIndex={-1} checked={false} />
                            </span>
                          </TableCell>
                          <TableCell className={"px-3 font-medium " + (compact ? "py-2" : "py-3")}>
                            {r.name}
                            {compact && <div className="mt-1.5">{bar}</div>}
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <span className="inline-block" style={{ opacity: b, transform: `scale(${(0.9 + 0.1 * b).toFixed(3)})` }}>
                              <Badge variant={r.variant} className="whitespace-nowrap">{r.status}</Badge>
                            </span>
                          </TableCell>
                          {!compact && <TableCell className="px-3 py-2">{bar}</TableCell>}
                          {!compact && (
                            <TableCell className="w-9 px-0 py-2">
                              <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${r.name}`} tabIndex={-1} className="text-muted-foreground">
                                <Ellipsis className="size-4" aria-hidden="true" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {/* list-page footer: where you are in the list, and paging */}
                {!compact && (
                  <div className="flex items-center justify-between border-t border-border px-4 py-2.5" style={{ opacity: eo(seg(t, T3.rows[2] + 0.1, T3.rows[2] + 0.45)) }}>
                    <p className="text-xs text-muted-foreground">Showing 3 of 12 projects</p>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" tabIndex={-1} disabled>Previous</Button>
                      <Button variant="secondary" size="sm" tabIndex={-1}>Next</Button>
                    </div>
                  </div>
                )}
              </CardContainer>
            </div>
          </div>

        </SidebarInset>
      </SidebarProvider>

      {/* the rail is narrower than its label: the label sits over the frame so it shows whole */}
      <PartLabel t={t} name="Sidebar" className="bottom-3 left-1.5" />

      {/* the dashboard dims behind the assistant */}
      <div aria-hidden="true" className="absolute inset-0 z-20 bg-foreground" style={{ opacity: (0.32 * open).toFixed(3) }} />

      {/* the assistant panel, from the top edge down to the launcher: Nucleux's
          SuggestedPrompts composition as on nucleux.in, with a greeting */}
      <div className={"absolute z-30 origin-bottom-right " + (compact ? "bottom-[68px] right-3 top-3 w-[300px]" : "bottom-[76px] right-4 top-4 w-1/2")}
        style={{ opacity: open, transform: `translateY(${((1 - open) * 8).toFixed(2)}px) scale(${(0.96 + 0.04 * open).toFixed(4)})` }}>
        <section aria-label="Aria" className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background text-[11px] leading-[1.55] shadow-lg">
          <header className="flex items-center gap-2.5 border-b border-border px-[18px] py-3.5">
            <Md3AgentAvatar name="Aria" glyph={<AriaMark />} shape="circle" decorative />
            <div className="flex flex-col gap-px">
              <span className="text-[12px] font-semibold leading-none text-foreground">Aria</span>
              <span className="text-[10px] text-faint">AI assistant · ready</span>
            </div>
            <span className="ml-auto flex items-center gap-[5px] text-[10px] text-faint">
              <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
              Online
            </span>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-[18px] pb-2.5 pt-3.5">
            <Message role="assistant" hideAvatar className="!animate-none [&>div>div]:px-3 [&>div>div]:py-2 [&>div]:max-w-full">
              <p className="m-0 text-[11.5px] leading-[1.5]">Hi, I’m Aria. Ask me anything about your projects.</p>
            </Message>
            {/* chips at the panel's scale: smaller type and padding than the page-size default */}
            <SuggestedPrompts label="Try asking" items={PROMPTS} max={compact ? 1 : 2}
              className="text-[11px] [&_button]:min-h-7 [&_button]:px-2.5 [&_button]:py-1 [&_button]:text-[11.5px]" />
          </div>
          <div className="mx-[18px] border-t border-border" />
          <div className="relative flex flex-col gap-2 px-[18px] pb-3.5 pt-2.5">
            <PartLabel t={t} name="OpenInput" className="-top-3 right-[18px]" />
            <OpenInput
              aria-label="Message Aria"
              placeholder="Ask Aria about your projects…"
              value=""
              onSubmit={() => {}}
              onAdd={() => {}}
              model={<OpenInputModelChip name="5.5" detail="Instant" aria-haspopup="menu" />}
              onVoice={() => {}}
              readOnly
              tabIndex={-1}
              className="[&_textarea]:text-[12px]"
            />
            <Caveat className="text-[10.5px]">Aria may make mistakes. Verify important info.</Caveat>
          </div>
        </section>
      </div>

      {/* Aria's launcher, bottom right */}
      <div className="absolute bottom-4 right-4 z-30 origin-bottom-right"
        style={{ opacity: launch, transform: `scale(${((0.8 + 0.2 * launch) * (1 - 0.08 * eo(press))).toFixed(4)})` }}>
        <span className="relative block">
          <PartLabel t={t} name="AgentAvatar" className="-top-7 right-0" />
          <span className="block rounded-full shadow-md">
            <Md3AgentAvatar name="Aria" glyph={<AriaMark />} shape="circle" size="xl" status="online" statusLabel="Aria · online" />
          </span>
          <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-nx-violet"
            style={{ opacity: ring > 0 && ring < 1 ? 1 - ring : 0, transform: `scale(${(1 + 0.5 * ring).toFixed(3)})` }} />
        </span>
      </div>

      {/* the pointer that clicks it */}
      <div className="pointer-events-none absolute left-0 top-0 z-40"
        style={{ opacity: pointerOn, transform: `translate(${pointer[0].toFixed(1)}px, ${pointer[1].toFixed(1)}px) scale(${(1 - 0.1 * eo(press)).toFixed(3)})` }}>
        <Pointer />
      </div>
    </div>
  );
}
