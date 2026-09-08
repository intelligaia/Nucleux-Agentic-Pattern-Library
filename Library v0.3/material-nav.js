/* ============================================================
   MATERIAL 3.0 — SIDEBAR TREE (shared)

   The four stages, their sub-categories and all 89 pattern
   names, in one place. Both material-agentic.html (the
   overview) and material-pattern.html (an individual
   component) render their sidebar from this, so the two can
   never drift apart the way two pasted copies would.

   BUILT is the only thing that decides whether a row is a
   link. A pattern with a page becomes an <a>; everything else
   stays a <span> — not a disabled link, because there is
   nothing to navigate to and it should not be focusable or
   advertise itself as a destination. As component pages land,
   add the id here and the row turns on by itself.
   ============================================================ */
(function () {
  'use strict';

  /* Order matters: prev/next on a component page walks this list, so
     it reads Trust & Disclosure first, then Identity, in the same
     order the two categories appear in the tree. */
  var BUILT = ['disclosure', 'consent', 'caveat',
               'avatar', 'name', 'personality', 'iconography', 'color',
               'example-gallery', 'templates', 'nudges', 'disclaimer'];

  var STAGES = [
  { id: "onboarding", num: "01", label: "Onboarding",
    lede: "Before a user types a single prompt, we set the rules: what this thing is, what it can do, who it is, and what we ask of them in return. Get this right and trust compounds across every later phase.",
    subcats: [
      { id: "trust", title: "Trust & Disclosure", desc: "What this is, what the rules are, and which data it stands on.",
        patterns: [
          { id: "disclosure", name: "Disclosure", oneline: "A clear, visible label that tells the user they are interacting with an AI, not a person." },
          { id: "consent", name: "Consent", oneline: "A first-run permission flow that asks the user before data is collected or used for training." },
          { id: "caveat", name: "Caveat", oneline: "A small, persistent reminder that AI output can be wrong and should be checked." }
        ] },
      { id: "identity", title: "Identity", desc: "Who the agent appears to be — name, face, voice, and the edges of the persona.",
        patterns: [
          { id: "avatar", name: "Avatar", oneline: "A consistent visual mark that represents the AI across every surface." },
          { id: "name", name: "Name", oneline: "A consistent name for the AI so it can be referred to, talked to, and remembered." },
          { id: "personality", name: "Personality", oneline: "A consistent voice and tone profile that governs how the AI speaks across the product." },
          { id: "iconography", name: "Iconography", oneline: "A reserved set of icons that signal 'this action is AI-powered'." },
          { id: "color", name: "Color", oneline: "A reserved accent colour or motion treatment that signals AI is active." }
        ] },
      { id: "capability", title: "Capability Discovery", desc: "Showing what it can do before a user has to guess.",
        patterns: [
          { id: "example-gallery", name: "Example Gallery", oneline: "A wall of curated outputs that shows users what's possible before they type." },
          { id: "templates", name: "Templates", oneline: "Fill-in-the-blank prompt scaffolds that turn vague intent into a good question." },
          { id: "nudges", name: "Nudges", oneline: "Tiny contextual hints that surface features the user hasn't discovered yet." },
          { id: "disclaimer", name: "Disclaimer", oneline: "A first-impression clarification of what the AI is, isn't, and what it doesn't know." }
        ] }
  ]},
  { id: "initially", num: "02", label: "Initially",
    lede: "Every request starts somewhere. These are the surfaces that invite one, shape a vague intent into something workable, and let a user hand over the material the answer depends on without an interrogation.",
    subcats: [
      { id: "entry-points", title: "Entry Points", desc: "Where a request begins, and how findable that door is.",
        patterns: [
          { id: "initial-cta", name: "Initial CTA", oneline: "The large, inviting input that anchors the empty state." },
          { id: "open-input", name: "Open Input", oneline: "Free-form text box for any natural-language ask." },
          { id: "suggested-prompts", name: "Suggested Prompts", oneline: "Smart, context-aware preset actions to jumpstart engagement." },
          { id: "ai-icons", name: "Icons", oneline: "Visual symbols that signal the AI's presence on a screen." },
          { id: "search-filter", name: "Searching & Filtering", oneline: "Natural-language search replacing click-driven filters." },
          { id: "autocomplete", name: "Autocomplete", oneline: "Ghost text that anticipates and completes user actions." },
          { id: "proactive", name: "Proactive Suggestions", oneline: "Invisible AI moments that arrive exactly when needed." },
          { id: "randomize", name: "Randomize", oneline: "A 'dice' that kickstarts the experience with a fun result." }
        ] },
      { id: "expressive-input", title: "Expressive Input", desc: "Ways in beyond typing — voice, image, sketch, selection.",
        patterns: [
          { id: "voice-input", name: "Voice Input", oneline: "Interact by talking; transcribe, converse, take action." },
          { id: "visual-input", name: "Visual Input", oneline: "Attach images, screenshots, or videos as part of the ask." },
          { id: "handwriting", name: "Handwriting Input", oneline: "Hand-drawn input recognised as text or instructions." },
          { id: "gesture", name: "Gesture Input", oneline: "Swipes, pinches, circles as expressive signals." },
          { id: "structured-input", name: "Structured Input", oneline: "Lightweight slots and hints that compose clearer prompts fast." }
        ] },
      { id: "prompt-scaffolds", title: "Prompt Scaffolds", desc: "Structure that turns a rough intent into a workable request.",
        patterns: [
          { id: "suggestions", name: "Suggestions", oneline: "Quick-action chips that reduce friction at the input." },
          { id: "madlibs", name: "Madlibs", oneline: "Sentence-with-dropdowns input for guided generation." },
          { id: "prompt-enhancer", name: "Prompt Enhancer", oneline: "A 'magic wand' that rewrites a short ask into a precise one." },
          { id: "modes", name: "Modes", oneline: "Toggle the AI's behaviour: creative vs strict, fast vs deep." },
          { id: "voice-tone", name: "Voice & Tone", oneline: "Per-user preferences for how the AI sounds." },
          { id: "preset-styles", name: "Preset Styles", oneline: "One-click aesthetic presets for creative output." }
        ] },
      { id: "context-expansion", title: "Context Expansion", desc: "Letting a user hand over the material the answer depends on.",
        patterns: [
          { id: "attachments", name: "Attachments", oneline: "Upload files, photos, docs for the AI to read." },
          { id: "connectors", name: "Connectors", oneline: "OAuth into Drive, Slack, Notion, etc. for live grounding." },
          { id: "mcp", name: "MCP Connectors", oneline: "Standardised tool access so the AI can act, not just answer." },
          { id: "knowledge-base", name: "Knowledge Bases", oneline: "Persistent organisational corpus the AI can ground in." },
          { id: "model-selection", name: "Model Selection", oneline: "Let the user pick the right model for the task." }
        ] }
  ]},
  { id: "during", num: "03", label: "During Interaction",
    lede: "The longest stage, and the one with the most ways to lose someone. Output arrives, work runs in the background, answers need correcting and evidence needs checking — and each of those moments needs a handle the user can actually reach.",
    subcats: [
      { id: "output-processing", title: "Output & Processing", desc: "How generated content arrives, and what shape it lands in.",
        patterns: [
          { id: "streaming", name: "Streaming", oneline: "Gradual reveal of output as it generates." },
          { id: "preview", name: "Preview Output", oneline: "A test-drive glimpse before committing to full generation." },
          { id: "structured-output", name: "Structured Output", oneline: "Consistent schemas (JSON, tables) instead of prose." },
          { id: "variations", name: "Variations", oneline: "Multiple alternative outputs for the same input." },
          { id: "summary", name: "Summary", oneline: "Condense long content into executive-readable takeaways." },
          { id: "multimodal", name: "Multi-modal Output", oneline: "Text + image + audio + video combined per response." },
          { id: "action-plan", name: "Action Plan", oneline: "A to-do list the AI writes out for approval before acting." },
          { id: "processing-steps", name: "Processing Steps", oneline: "Distinct stages of work, so users see what's happening." },
          { id: "stream-of-thought", name: "Stream of Thought", oneline: "Reveals the AI's reasoning, tool use, and decisions." },
          { id: "transcript", name: "Transcript", oneline: "A chronological, speaker-attributed record of a conversation." }
        ] },
      { id: "task-management", title: "Task & Agent Management", desc: "Plans, queues and long-running work the user can still steer.",
        patterns: [
          { id: "task-creation", name: "Task Creation", oneline: "AI generates discrete tasks from a prompt or conversation." },
          { id: "task-assignment", name: "Task Assignment", oneline: "Route a task to a person or back to the AI." },
          { id: "priority-ranking", name: "Priority Ranking", oneline: "AI orders tasks by urgency, impact, or deadline." },
          { id: "subtask-generation", name: "Subtask Generation", oneline: "AI breaks a large task into smaller, actionable steps." }
        ] },
      { id: "collaboration", title: "Collaboration Canvas", desc: "Surfaces where a person and an agent work the same object.",
        patterns: [
          { id: "shared-vision", name: "Shared Vision", oneline: "Split-pane chat + live canvas so the work is visible." },
          { id: "draft-mode", name: "Draft Mode", oneline: "Cheap, fast preview before paying for the final render." },
          { id: "inline-action", name: "Inline Action", oneline: "AI menus that surface right where the user is typing." },
          { id: "inpainting", name: "Inpainting", oneline: "Edit one specific region of a result without regenerating everything." },
          { id: "visual-editing", name: "Visual Editing", oneline: "Direct-manipulation refinement without prompt loops." }
        ] },
      { id: "refinement", title: "Refinement", desc: "Turning a near miss into the answer without starting again.",
        patterns: [
          { id: "regenerate", name: "Regenerate", oneline: "One-tap retry of the same prompt for a fresh result." },
          { id: "reply", name: "Reply", oneline: "Continue the conversation to refine with follow-ups." },
          { id: "transform", name: "Transform", oneline: "Change content from one modality or format to another." },
          { id: "expand", name: "Expand", oneline: "Lengthen a draft with more detail or examples." },
          { id: "restructure", name: "Restructure", oneline: "Re-organise content without changing the meaning." },
          { id: "restyle", name: "Restyle", oneline: "Rewrite tone or voice without changing structure." },
          { id: "synthesis", name: "Synthesis", oneline: "Merge insights from multiple sources into one output." }
        ] },
      { id: "explainability", title: "Explainability", desc: "Where an answer came from, and how far to trust it.",
        patterns: [
          { id: "citations", name: "Citations", oneline: "Inline source links so the user can fact-check." },
          { id: "confidence", name: "Confidence Indicators", oneline: "How sure the AI is — surfaced honestly to the user." },
          { id: "references", name: "References", oneline: "The active files and URLs the AI is reading from." },
          { id: "footprints", name: "Footprints", oneline: "History log of what the AI did and when." },
          { id: "sample-response", name: "Sample Response", oneline: "Show one example before running a bulk job." },
          { id: "prompt-details", name: "Prompt Details", oneline: "Reveal the system prompt or full instruction stack." }
        ] },
      { id: "recovery", title: "Recovery / When Wrong", desc: "What happens when it is wrong, and how fast a user can undo it.",
        patterns: [
          { id: "controls", name: "Controls", oneline: "Visible Stop / Pause so users can halt a runaway." },
          { id: "verification", name: "Verification", oneline: "Block destructive actions behind explicit confirm." },
          { id: "follow-up", name: "Follow Up", oneline: "The AI asks a clarifying question when intent is ambiguous." },
          { id: "error-empty", name: "Error & Empty States", oneline: "Graceful, actionable failure surfaces." }
        ] },
      { id: "power", title: "Power Controls", desc: "Controls for people who now know exactly what they want.",
        patterns: [
          { id: "filters", name: "Filters", oneline: "Constrain inputs or outputs by source, type, modality." },
          { id: "parameters", name: "Parameters", oneline: "Sliders for temperature, length, top-p." },
          { id: "chained-action", name: "Chained Action", oneline: "Connect multi-step AI workflows visually." },
          { id: "cost-estimates", name: "Cost Estimates", oneline: "Show projected token / dollar cost before run." },
          { id: "describe", name: "Describe", oneline: "Reverse-prompt: ask AI what an image or output contains." },
          { id: "auto-fill", name: "Auto-fill", oneline: "Predictive ghost-text completion of form fields." }
        ] }
  ]},
  { id: "overtime", num: "04", label: "Over Time",
    lede: "What the agent keeps, what it forgets, and what quietly changes underneath the person using it. Trust earned in one session is either spent or renewed here.",
    subcats: [
      { id: "memory-continuity", title: "Memory & Continuity", desc: "What carries between sessions, and who decides that.",
        patterns: [
          { id: "memory", name: "Memory", oneline: "A user-managed store of what the AI remembers about you." },
          { id: "saved-styles", name: "Saved Styles", oneline: "Reusable presets of voice, tone, output structure." },
          { id: "branches", name: "Branches", oneline: "Fork a conversation to explore a non-linear path." },
          { id: "personalization", name: "Personalization", oneline: "Tone and defaults that drift to match the user over time." }
        ] },
      { id: "privacy-control", title: "Privacy & Control", desc: "What is stored, what is trained on, and how to take it back.",
        patterns: [
          { id: "data-ownership", name: "Data Ownership", oneline: "A switch for whether your data trains the model." },
          { id: "incognito", name: "Incognito Mode", oneline: "Sessions that never persist to history." },
          { id: "watermark", name: "Watermark", oneline: "Identifiers — visible or hidden — on AI-generated content." }
        ] },
      { id: "adaptation", title: "Adaptation", desc: "How the surface changes as the agent learns the person.",
        patterns: [
          { id: "feedback", name: "Collecting Feedback", oneline: "Thumbs up / down and richer signals on each output." },
          { id: "model-mgmt", name: "Model Management", oneline: "Power-user model selection across speed / cost / quality." }
        ] },
      { id: "change-management", title: "Change Management", desc: "Telling people when the thing they rely on has moved.",
        patterns: [
          { id: "update-notice", name: "Update Notifications", oneline: "Telling users what changed, before they notice." },
          { id: "resize-context", name: "Contextual Resize", oneline: "AI proposes layout changes when it learns your habits." }
        ] }
  ]}
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function rowHTML(id, name, current) {
    var built = BUILT.indexOf(id) !== -1;
    var tag   = built ? 'a' : 'span';
    var attr  = built ? ' href="material-pattern.html?id=' + encodeURIComponent(id) + '"' : '';
    var cls   = 'tree__pattern' + (id === current ? ' is-current' : '');
    return '<' + tag + ' class="' + cls + '" data-pattern="' + id + '"' +
           ' data-status="' + (built ? 'full' : 'scaffold') + '"' + attr + '>' +
           esc(name) + '<span class="badge-dot" aria-hidden="true"></span></' + tag + '>';
  }

  function treeHTML(current) {
    return STAGES.map(function (stage) {
      /* The stage holding the current pattern opens on load; on the
         overview page (no current) the first stage opens instead, so the
         tree never renders fully collapsed. */
      var holds = stage.subcats.some(function (sub) {
        return sub.patterns.some(function (p) { return p.id === current; });
      });
      var open = current ? holds : stage.id === 'onboarding';
      return '<div class="tree__stage" data-stage="' + stage.id + '"' +
               ' aria-expanded="' + (open ? 'true' : 'false') + '" role="treeitem">' +
               '<button class="tree__stage-head" type="button" data-toggle="' + stage.id + '">' +
                 '<span class="name">' + esc(stage.label) + '</span>' +
                 '<svg class="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
                 '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
               '</button>' +
               '<div class="tree__stage-body" role="group">' +
                 stage.subcats.map(function (sub) {
                   return '<div class="tree__sub" data-sub="' + sub.id + '">' +
                            '<div class="tree__sub-head">' + esc(sub.title) + '</div>' +
                            sub.patterns.map(function (p) {
                              return rowHTML(p.id, p.name, current);
                            }).join('') +
                          '</div>';
                 }).join('') +
               '</div>' +
             '</div>';
    }).join('');
  }

  function mount(current) {
    var sb = document.getElementById('sidebar');
    if (!sb) return;

    sb.innerHTML =
      '<div class="sidebar__title"><h2>Material 3.0</h2><small>Agentic components</small></div>' +
      '<div class="tree" role="tree">' + treeHTML(current) + '</div>' +
      '<div class="sidebar__extras">' +
        '<a class="sidebar__extra" href="material-agentic.html">Overview</a>' +
        '<a class="sidebar__extra" href="library.html">ShadCN set</a>' +
        '<a class="sidebar__extra" href="contact.html">Contact</a>' +
      '</div>';

    sb.addEventListener('click', function (e) {
      var head = e.target.closest('[data-toggle]');
      if (!head) return;
      var stage = head.parentElement;
      stage.setAttribute('aria-expanded',
        stage.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });

    /* Scroll the active row into view — with 89 rows the current one is
       usually below the fold when its stage opens. */
    var cur = sb.querySelector('.tree__pattern.is-current');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
  }

  /* Moving between patterns must NOT rebuild the tree. A re-mount would
     throw away which stages the reader has opened and where they had
     scrolled to — and on a 89-row tree that is the whole of their
     place in the library. Only the current row changes. */
  function setActive(id) {
    var sb = document.getElementById('sidebar');
    if (!sb) return;

    sb.querySelectorAll('.tree__pattern').forEach(function (row) {
      row.classList.toggle('is-current', row.dataset.pattern === id);
    });

    /* Open the stage that holds it, if the reader had it closed —
       but leave every other stage exactly as they left it. */
    var holder = null;
    STAGES.forEach(function (stage) {
      stage.subcats.forEach(function (sub) {
        sub.patterns.forEach(function (p) { if (p.id === id) holder = stage.id; });
      });
    });
    if (holder) {
      var el = sb.querySelector('.tree__stage[data-stage="' + holder + '"]');
      if (el) el.setAttribute('aria-expanded', 'true');
    }
  }

  window.MaterialNav = {
    mount: mount, setActive: setActive, stages: STAGES, built: BUILT
  };
})();
