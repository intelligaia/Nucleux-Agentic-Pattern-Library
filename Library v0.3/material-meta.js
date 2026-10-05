/* ============================================================
   MATERIAL 3.0 — PATTERN CLASSIFICATION

   Three questions a reader has before they read anything else,
   and which the library could not previously answer:

     WHAT KIND of thing is this?   → type
     HOW ESTABLISHED is it?        → maturity
     WHO SHIPS IT?                 → seen

   ── Why this is a separate file ──────────────────────────────
   Classification is a judgement about a pattern, not part of its
   documentation, and the two change for different reasons. A
   pattern's anatomy changes when the component changes; its
   maturity changes when the industry does. Keeping them apart
   means the evidence can be revised without touching the prose,
   and it means this file can be read on its own as the library's
   position on what is real — which is the thing worth being able
   to review in one sitting.

   ── The rule on maturity ─────────────────────────────────────
   MATURITY IS DERIVED FROM `seen`, NEVER ASSERTED BESIDE IT. A
   pattern with two products named cannot be Established however
   confident the writing is. The regression suite enforces the
   thresholds below, so the only way to promote a pattern is to
   find more evidence for it.

     established  named in FOUR OR MORE mature products, AND the
                  shape has converged — they are solving it the
                  same way
     emerging     named in TWO OR MORE, but the shape has not
                  settled. The count is a floor, not a trigger:
                  a pattern can be widely shipped and still be
                  Emerging because everybody is doing it
                  differently. Where that is the case the entry
                  carries a `holdBack` saying why, and the test
                  requires it — otherwise "Emerging" becomes a
                  place to park a pattern nobody wanted to defend
     specialized  real, but bounded to a device, input method or
                  domain — the count does not decide this one,
                  the boundary does
     experimental not mature enough for the core library; belongs
                  in Labs

   `seen` is INTERACTION EVIDENCE. It records that a product has
   solved this problem in its interface. It is not an endorsement
   of their solution, and none of their visual design is copied.

   ── The rule on `whenNot` ────────────────────────────────────
   Every pattern gets one, and it has to name a real situation
   where using this pattern makes the product worse. "Do not use
   it when you do not need it" is not an answer. This is the
   field product teams actually need and the one pattern
   libraries habitually leave out.
   ============================================================ */
(function () {
  'use strict';

  /* The eight types. A pattern may carry at most two — beyond
     that it is doing more than one job and should be split. */
  var TYPES = {
    interaction: { label: 'Interaction', what: 'Something a person does, and what answers.' },
    component:   { label: 'Component',   what: 'A reusable piece of interface.' },
    workflow:    { label: 'Workflow',    what: 'A sequence with a beginning and an end.' },
    behavior:    { label: 'Behavior',    what: 'How the agent conducts itself over time.' },
    signal:      { label: 'System Signal', what: 'The product telling you something about itself.' },
    capability:  { label: 'Capability',  what: 'Something the agent can now do that it could not before.' },
    control:     { label: 'Control',     what: 'A decision the person takes away from the agent.' },
    safety:      { label: 'Safety',      what: 'A pattern whose job is to prevent harm or misunderstanding.' }
  };

  /* Four levels, each with a non-colour carrier: its own word and
     its own mark. Colour here is an accelerator for people who
     already know the scale, never the thing carrying the meaning. */
  var MATURITY = {
    established: {
      label: 'Established', mark: '●●●●',
      what: 'Shipping in four or more mature AI products. Safe to build on.' },
    emerging: {
      label: 'Emerging', mark: '●●●○',
      what: 'Shipping in mature products, but they have not converged on one shape yet.' },
    specialized: {
      label: 'Specialized', mark: '●●○○',
      what: 'Real, but bounded to a device, input method or domain. Do not assume it generalises.' },
    experimental: {
      label: 'Experimental', mark: '●○○○',
      what: 'Not enough evidence for the core library. Documented here so the reasoning is visible.' }
  };

  /* ── The classification ───────────────────────────────────── */
  var META = {

    /* ══ ONBOARDING · Trust & Disclosure ══════════════════════ */
    'disclosure': {
      type: ['signal', 'safety'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity'],
      seenWhat: 'Every one of them marks AI-authored surfaces at the point of contact rather than ' +
                'in a settings page, which is the part that makes it a pattern.',
      whenNot: 'When the surface is unmistakably the assistant already &mdash; a dedicated chat ' +
               'window does not need a label saying it is a chat window. Repeating the disclosure ' +
               'everywhere is how it stops being read anywhere.'
    },
    'consent': {
      type: ['safety', 'interaction'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Copilot'],
      seenWhat: 'All four ask before data leaves the session or feeds training, and all four ' +
                'separate the ask from the terms it refers to.',
      whenNot: 'For a decision the person can reverse instantly and at no cost. A consent gate ' +
               'in front of something harmless trains people to dismiss the ones that matter.'
    },
    'caveat': {
      type: ['signal', 'safety'], maturity: 'established',
      seen: ['ChatGPT', 'Gemini', 'Copilot', 'Perplexity'],
      seenWhat: 'A short standing line attached to the answer surface, not a modal &mdash; the ' +
                'convergent solution to a warning that has to survive being seen a thousand times.',
      whenNot: 'On an answer the product can actually stand behind, such as a value read straight ' +
               'out of a record. A caveat on something verifiable teaches people the caveat is ' +
               'decorative.'
    },
    'disclaimer': {
      type: ['signal', 'safety'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Copilot'],
      seenWhat: 'Each states its general limits once, up front, in the product rather than only ' +
                'in policy documents.',
      whenNot: 'As a substitute for the per-answer caveat. General limits and this answer&rsquo;s ' +
               'limits are different claims, and collapsing them means neither is trusted.'
    },

    /* ══ ONBOARDING · Agent Identity System ═══════════════════ */
    'avatar': {
      type: ['component'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Copilot'],
      seenWhat: 'One consistent mark for agent-authored turns, held stable across every surface ' +
                'the agent appears on.',
      whenNot: 'When it would imply a person. A photographic or humanoid avatar reads as a human ' +
               'correspondent, which is the exact misunderstanding Disclosure exists to prevent.'
    },
    'name': {
      type: ['behavior'], maturity: 'established',
      seen: ['Copilot', 'Gemini', 'Alexa', 'Siri'],
      seenWhat: 'A stable proper name that the person can address, refer to and remember between ' +
                'sessions.',
      whenNot: 'When the agent is a feature rather than a participant. Naming a rewrite button ' +
               'makes it harder to describe, not easier.'
    },
    'personality': {
      type: ['behavior'], maturity: 'emerging',
      seen: ['ChatGPT', 'Claude', 'Gemini'],
      seenWhat: 'A declared and user-adjustable voice &mdash; custom instructions, writing styles, ' +
                'per-assistant persona &mdash; rather than a tone that merely happens.',
      whenNot: 'In high-stakes or regulated output. Warmth in a medication instruction or a legal ' +
               'finding reads as an opinion about the content.'
    },
    'iconography': {
      type: ['signal'], maturity: 'established',
      seen: ['Gemini', 'Copilot', 'Notion AI', 'Perplexity'],
      seenWhat: 'A reserved glyph used only where the agent is involved, so its presence is itself ' +
                'information.',
      whenNot: 'On everything. A mark that appears on every button in the product has stopped ' +
               'marking anything.'
    },
    'color': {
      type: ['signal'], maturity: 'emerging',
      seen: ['Copilot', 'Gemini', 'Notion AI'],
      seenWhat: 'A reserved accent that signals agent activity, distinct from the product&rsquo;s ' +
                'own primary.',
      whenNot: 'As the only carrier of a state. Colour is the fastest signal to read and the one ' +
               'some people cannot read at all &mdash; it accelerates a label, it does not replace it.'
    },

    /* ══ ONBOARDING · Capability Discovery ════════════════════ */
    'example-gallery': {
      type: ['capability'], maturity: 'established',
      seen: ['Midjourney', 'Gemini', 'ChatGPT', 'Perplexity'],
      seenWhat: 'Finished outputs shown before the person writes anything, so capability is ' +
                'demonstrated rather than described.',
      whenNot: 'When the examples are better than what the product typically produces. A gallery ' +
               'of best-case output is a promise the first real attempt will break.'
    },
    'templates': {
      type: ['capability', 'workflow'], maturity: 'established',
      seen: ['Copilot', 'Gemini', 'Notion AI', 'ChatGPT'],
      seenWhat: 'Named starting points that carry structure, shipped as a browsable library rather ' +
                'than buried in help.',
      whenNot: 'When the task is genuinely open-ended. A template answers a question the person has ' +
               'not asked yet, and offering one too early narrows the thinking instead of starting it.'
    },
    'nudges': {
      type: ['behavior', 'signal'], maturity: 'emerging',
      seen: ['Copilot', 'Notion AI', 'Gemini'],
      seenWhat: 'A contextual hint tied to what the person is doing right now, with a way to stop ' +
                'seeing it.',
      whenNot: 'Without a suppression rule. A hint that cannot be dismissed, or that returns after ' +
               'being dismissed, is an interruption wearing a hint&rsquo;s clothes.'
    },

    /* ══ INITIALLY · Entry Points ═════════════════════════════ */
    'initial-cta': {
      type: ['interaction', 'component'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'],
      seenWhat: 'One large, centred composer on the empty state that becomes the docked working ' +
                'composer after the first message.',
      whenNot: 'Once there is work in progress. A large empty-state invitation next to a running ' +
               'task competes with the thing the person came back for.'
    },
    'open-input': {
      type: ['component'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity', 'Cursor'],
      seenWhat: 'The canonical surface of the category: one persistent field that accepts anything, ' +
                'carrying its controls inside it and keeping the draft through all of them.',
      whenNot: 'When the set of things the person can ask for is genuinely small and known. A free ' +
               'text box in front of four possible actions is a guessing game with four answers.'
    },
    'suggested-prompts': {
      type: ['interaction'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Copilot'],
      seenWhat: 'A few starting points on an empty conversation, drawn from the open context, ' +
                'that fill the composer to be edited and go once the conversation begins.',
      whenNot: 'When the suggestions are generic. A context-free suggestion is worse than none: it ' +
               'occupies the space where a useful one would have gone and teaches people not to look.'
    },
    'ai-icons': {
      type: ['signal'], maturity: 'emerging',
      seen: ['Gemini', 'Copilot', 'Claude', 'ChatGPT', 'AWS (Cloudscape)', 'IBM (Carbon)'],
      seenWhat: 'Separate marks for separate AI meanings: a reserved mark on AI action triggers, ' +
                'a distinct label on AI-generated content, and activity shown only while the agent works.',
      holdBack: 'The glyphs have not converged across products (sparkles, wands, labels), but the ' +
                'rule has: one meaning per mark, always with words.',
      whenNot: 'For “new”, “premium” or decoration, or as the agent’s identity. Those get words, ' +
               'or the avatar and name.'
    },


    'autocomplete': {
      type: ['interaction', 'component'], maturity: 'established',
      seen: ['Gmail', 'GitHub Copilot', 'Claude', 'ChatGPT', 'Cursor', 'Slack'],
      seenWhat: 'The rest of what is being typed, offered after the caret or in a / @ menu, accepted ' +
                'with one key that is not Enter, and never sent on accept.',
      whenNot: 'Where a wrong completion is costly and easy to miss — contract, financial or clinical ' +
               'wording — or before anything is typed, where Suggested Prompts belongs.'
    },

    'proactive': {
      type: ['interaction', 'workflow'], maturity: 'established',
      seen: ['Linear', 'Gmail', 'GitHub Copilot', 'Microsoft 365 Copilot'],
      seenWhat: 'A suggestion raised from evidence in the work, with its reason, that the person can ' +
                'accept, decline or ignore — and nothing applied until they do.',
      whenNot: 'On a timer with no new evidence, or for low-value tips. A suggestion that keeps coming ' +
               'back after being dismissed teaches people to dismiss everything.'
    },

    'randomize': {
      type: ['interaction'], maturity: 'specialized',
      seen: ['Krea', 'Scenario', 'Coolors'],
      seenWhat: 'A one-press random starting point in creative tools — a prompt, style or palette — that ' +
                'the person keeps, edits or regenerates.',
      whenNot: 'In deterministic or high-stakes work — finance, legal, medical, destructive operations — ' +
               'where a random direction has no value and invites a misleading one.'
    },


    /* ══ INITIALLY · Expressive Input ═════════════════════════ */
    'voice-input': {
      type: ['component', 'interaction'], maturity: 'established',
      seen: ['Gemini Live', 'ChatGPT', 'Claude', 'Copilot'],
      seenWhat: 'Voice as a MODE of the existing composer rather than a separate screen &mdash; ' +
                'the convergent answer, and the one this implementation follows.',
      whenNot: 'Where the person cannot speak or cannot be heard &mdash; an open office, a quiet ' +
               'carriage, a shared room. Voice is an addition to typing and never a replacement for it.'
    },
    'visual-input': {
      type: ['capability', 'interaction'], maturity: 'established',
      seen: ['ChatGPT', 'Gemini', 'Claude', 'Copilot'],
      seenWhat: 'Several genuinely different sources behind one affordance: a stored image, the ' +
                'camera, a screenshot, and a selected region of what is on screen.',
      whenNot: 'For image GENERATION. Sending a picture in and getting a picture out are opposite ' +
               'directions, and one control for both is the most common confusion in this area.'
    },
    'handwriting': {
      type: ['interaction'], maturity: 'specialized',
      seen: ['Apple Scribble', 'Samsung Notes', 'Nebo', 'Goodnotes'],
      seenWhat: 'The full chain, and the reason this is Specialized rather than Established: ink → ' +
                'recognition → editable content → agent. Every product shipping it is stylus-first.',
      whenNot: 'On any surface without a stylus. Finger handwriting recognition is slower than ' +
               'typing for everyone who can type, and presenting it as a general input method ' +
               'misrepresents what it is for.'
    },
    'gesture': {
      type: ['interaction'], maturity: 'specialized',
      seen: ['Circle to Search', 'ChatGPT', 'Claude', 'Notion AI'],
      seenWhat: 'Selection as the real mechanism: circle, highlight, scribble or drag over existing ' +
                'content, which then becomes the agent&rsquo;s context. Not mid-air gestures, which ' +
                'no mature product ships.',
      whenNot: 'As free-form gesture vocabulary. An invisible gesture with no affordance is a ' +
               'feature only its designers know exists; every shipping case attaches to content ' +
               'the person is already touching.'
    },
    'structured-input': {
      type: ['interaction', 'workflow'], maturity: 'emerging',
      seen: ['Gemini Gems', 'ChatGPT', 'Copilot'],
      seenWhat: 'Natural language carrying the intent, with parameters surfaced only where the ' +
                'sentence left something genuinely undecided.',
      whenNot: 'When every field would be shown regardless of what was said. At that point it is a ' +
               'form with a text box on top, and the person is filling in answers they already gave.'
    },

    /* ══ INITIALLY · Context Expansion ════════════════════════ */
    'attachments': {
      type: ['interaction', 'capability'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'],
      seenWhat: 'Uploading, reading and ready held as three visibly different states, and removal ' +
                'documented as forward-only &mdash; taking a file out does not unwrite the answers ' +
                'it already shaped.',
      whenNot: 'For material the person will need again next week. An attachment lives with one ' +
               'conversation; anything durable belongs in a knowledge base, and the difference is ' +
               'the whole distinction between the two patterns.'
    },
    'connectors': {
      type: ['capability', 'control'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'],
      seenWhat: 'An account-level grant to an external service, carrying scope, freshness and a ' +
                'way out &mdash; not a file picker with a logo on it.',
      whenNot: 'For a one-off file the person already has. Asking somebody to connect an entire ' +
               'account so the agent can read one document is a permission the task did not need.'
    },
    'mcp': {
      type: ['capability', 'control'], maturity: 'emerging',
      seen: ['Claude', 'Claude Code', 'Cursor', 'VS Code'],
      seenWhat: 'A server connection exposing tools, resources and prompts, with per-capability ' +
                'permission and a human in the loop on invocation. The protocol is public and its ' +
                'revisions are dated, which is what makes this evidence rather than a guess.',
      holdBack: 'The clients are real and there are more than four, but the protocol is still ' +
                'deprecating primitives between revisions &mdash; Roots, Sampling and Logging went ' +
                'in one of them. A surface built on a moving specification is Emerging however ' +
                'many products have adopted it.',
      whenNot: 'As a prettier connector card. A connector is access to a service; an MCP connection ' +
               'is a set of CAPABILITIES with individual risk, and flattening the second into the ' +
               'first hides the part that needed reviewing.'
    },
    'knowledge-base': {
      type: ['capability', 'workflow'], maturity: 'established',
      seen: ['Claude Projects', 'Gemini Gems', 'Perplexity Spaces', 'NotebookLM'],
      seenWhat: 'Curated material that persists across conversations, with per-source inclusion ' +
                'and visible attribution to the sources actually used.',
      whenNot: 'For material relevant to exactly one question. Persistent context that nobody ' +
               'curates becomes a slow-growing pile that quietly degrades every answer.'
    },
    'model-selection': {
      type: ['control'], maturity: 'established',
      seen: ['ChatGPT', 'Claude', 'Copilot', 'Perplexity'],
      seenWhat: 'A short list described by what each model is FOR, with an automatic option and a ' +
                'separate effort axis &mdash; the two-value control the industry converged on.',
      whenNot: 'When the product can choose correctly on its own. A picker offered to somebody with ' +
               'no basis for choosing is a decision handed over rather than a control given.'
    }
  };

  /* ── Derivation, so the labels cannot drift from the evidence ── */
  function level(id) {
    var m = META[id];
    if (!m) return null;
    return MATURITY[m.maturity] || null;
  }

  function types(id) {
    var m = META[id];
    if (!m) return [];
    return (m.type || []).map(function (t) {
      return TYPES[t] ? { id: t, label: TYPES[t].label, what: TYPES[t].what } : null;
    }).filter(Boolean);
  }

  function get(id) { return META[id] || null; }

  window.MaterialMeta = {
    TYPES: TYPES, MATURITY: MATURITY, META: META,
    get: get, types: types, level: level
  };
})();
