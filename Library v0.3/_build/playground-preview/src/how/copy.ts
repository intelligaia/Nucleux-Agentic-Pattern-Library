/* The section's words: each tile's left-side copy and its media description
   (the scene's accessible label). Shared by the site section, the capture
   page and the film. */
import type { SceneId } from "./time";

/** Each tile's color family (tokens in how.css): a pale surface, a dark ink
   and an accent. Headlines are two-tone: `lead` in the ink, `accent` below it. */
export type Tone = "sky" | "peach" | "lime";

export const TILES: { id: SceneId; tone: Tone; step: string; title: string; lead: string; accent: string; body: string; media: string }[] = [
  {
    id: "describe", tone: "sky", step: "01 / 03",
    title: "Describe the screen you need.", lead: "Describe the screen", accent: "you need.",
    body: "Tell Claude what you want to build. Start with your intent, in your own words.",
    media: "Animation: a chat with Claude, the Nucleux MCP connected. The request “Build a dashboard for my projects.” is typed into the prompt composer and sent. Claude answers “I’ll find the right Nucleux patterns.” and shows “Finding patterns…”.",
  },
  {
    id: "patterns", tone: "peach", step: "02 / 03",
    title: "Nucleux finds the right building blocks.", lead: "Nucleux finds the right", accent: "building blocks.",
    body: "Your agent gets patterns that fit the task, then builds with Nucleux’s shadcn components.",
    media: "Animation: the request travels to Nucleux (@nucleux/react, shadcn), which picks six matches: App shell → Sidebar, Metric cards → CardContainer, Project table → Table, Selection & actions → Checkbox and Button, and two agentic patterns, AI assistant → AgentAvatar and Ask Aria → OpenInput.",
  },
  {
    id: "build", tone: "lime", step: "03 / 03",
    title: "Watch your UI take shape.", lead: "Watch your UI", accent: "take shape.",
    body: "Your agent assembles the interface in your theme. Review the preview and plan before applying changes.",
    media: "Animation: a project dashboard assembles: a collapsed icon sidebar, a header with New project and Export buttons, three metric cards, and a project table with search, a filter button, row checkboxes, status badges, progress and row actions. Then the AI assistant Aria appears at the bottom right; clicking it dims the dashboard and opens a full-height panel with a greeting, suggested prompts and a prompt composer.",
  },
];

/** The tile bodies as the film shows them: the user shortened them by hand on
   the film's page (2026-10-30). The standalone tiles use these; the section
   above keeps the longer ones until the user asks to sync it. */
export const FILM_BODY: Record<SceneId, string> = {
  describe: "Tell Claude what you want to build. Start with your intent.",
  patterns: "Your agent gets Nucleux patterns that fit the task.",
  build: "Your agent assembles the interface in your theme.",
};
