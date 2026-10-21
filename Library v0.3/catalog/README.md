# Material 3.0 agentic patterns — catalog

35 built patterns, 240 states. One folder per pattern, in sidebar order: `<stage>/<category>/<pattern>/`, each with a README (states, where the code lives, Nucleux packages) and a picture of every state in `states/`.

The code itself is not copied here: it stays in `material-preview.js`, `material-sim.js`, `material-patterns.js` and `material-pattern.html`, and each README links to the exact lines. Regenerate after any pattern change:

```sh
python3 -m http.server 8911 --bind 127.0.0.1   # from the Library root
node _build/catalog/make.js http://127.0.0.1:8911
```

## Onboarding

### Trust & Disclosure

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Disclosure](01-onboarding/01-trust-disclosure/01-disclosure/README.md) | 5 | yes | ai-disclosure, md3-button, md3-card, md3-chip, md3-icon-button, md3-progress, tokens |
| [Consent](01-onboarding/01-trust-disclosure/02-consent/README.md) | 6 | yes | md3-action-confirmation, md3-button, md3-card, md3-checkbox, md3-list, tokens |
| [Caveat](01-onboarding/01-trust-disclosure/03-caveat/README.md) | 5 | yes | ai-disclosure, md3-button, md3-card, md3-list, md3-progress, tokens |

### Identity

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Avatar](01-onboarding/02-identity/01-avatar/README.md) | 5 | yes | ai-disclosure, avatar, md3-button, md3-list, md3-message, md3-progress, md3-theme, tokens |
| [Name](01-onboarding/02-identity/02-name/README.md) | 5 | yes | ai-disclosure, avatar, md3-button, md3-card, md3-list, md3-message, md3-snackbar, md3-text-field, tokens |
| [Personality](01-onboarding/02-identity/03-personality/README.md) | 5 | yes | ai-disclosure, md3-action-confirmation, md3-button, md3-list, md3-message, md3-radio, md3-segmented-button, md3-snackbar, tokens |
| [Iconography](01-onboarding/02-identity/04-iconography/README.md) | 6 | yes | md3-button, md3-chip, md3-icon-button, md3-list, md3-tooltip, tokens |
| [Color](01-onboarding/02-identity/05-color/README.md) | 7 | yes | avatar, md3-button, md3-card, md3-list, md3-progress, md3-theme, tokens |

### Capability Discovery

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Example Gallery](01-onboarding/03-capability-discovery/01-example-gallery/README.md) | 5 | yes | md3-agent-composer, md3-button, md3-card, md3-chip, md3-list, tokens |
| [Templates](01-onboarding/03-capability-discovery/02-templates/README.md) | 6 | yes | md3-action-confirmation, md3-banner, md3-button, md3-card, md3-chip, md3-list, md3-snackbar, md3-text-field, tokens |
| [Nudges](01-onboarding/03-capability-discovery/03-nudges/README.md) | 6 | yes | md3-button, md3-card, md3-icon-button, md3-snackbar, tokens |
| [Disclaimer / Agent Limits](01-onboarding/03-capability-discovery/04-disclaimer/README.md) | 5 | yes | md3-banner, md3-button, md3-card, md3-list, tokens |

## Initially

### Entry Points

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Initial CTA](02-initially/01-entry-points/01-initial-cta/README.md) | 5 | yes | material |
| [Open Input](02-initially/01-entry-points/02-open-input/README.md) | 7 | yes | material |
| [Suggested Prompts](02-initially/01-entry-points/03-suggested-prompts/README.md) | 5 | yes | material, md3-chip, tokens |
| [Icons](02-initially/01-entry-points/04-ai-icons/README.md) | 16 | yes | — |
| [Autocomplete](02-initially/01-entry-points/05-autocomplete/README.md) | 7 | yes | — |
| [Proactive Suggestions](02-initially/01-entry-points/06-proactive/README.md) | 7 | yes | — |
| [Randomize](02-initially/01-entry-points/07-randomize/README.md) | 6 | yes | — |

### Expressive Input

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Voice Input](02-initially/02-expressive-input/01-voice-input/README.md) | 9 | yes | — |
| [Visual Input](02-initially/02-expressive-input/02-visual-input/README.md) | 9 | yes | — |
| [Handwriting Input](02-initially/02-expressive-input/03-handwriting/README.md) | 8 | yes | — |
| [Gesture Input](02-initially/02-expressive-input/04-gesture/README.md) | 7 | yes | — |
| [Structured Input](02-initially/02-expressive-input/05-structured-input/README.md) | 7 | yes | — |

### Prompt Scaffolds

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Suggestions](02-initially/03-prompt-scaffolds/01-suggestions/README.md) | 5 | yes | md3-agent-composer, md3-button, md3-chip, md3-icon-button, tokens |
| [Madlibs](02-initially/03-prompt-scaffolds/02-madlibs/README.md) | 6 | yes | md3-agent-composer, md3-button, prompt-template, tokens |
| [Prompt Enhancer](02-initially/03-prompt-scaffolds/03-prompt-enhancer/README.md) | 8 | yes | md3-agent-composer, md3-button, md3-card, prompt-enhancer, tokens |
| [Modes](02-initially/03-prompt-scaffolds/04-modes/README.md) | 5 | yes | md3-agent-composer, md3-button, md3-chip, md3-menu, tokens |
| [Voice & Tone](02-initially/03-prompt-scaffolds/05-voice-tone/README.md) | 6 | yes | md3-agent-composer, md3-chip, md3-radio, md3-segmented-button, md3-text-field, tokens |
| [Preset Styles](02-initially/03-prompt-scaffolds/06-preset-styles/README.md) | 8 | yes | md3-agent-composer, md3-button, md3-chip, md3-menu, md3-segmented-button, md3-text-field, tokens |

### Context Expansion

| Pattern | States | Simulator | Nucleux packages |
|---|---|---|---|
| [Attachments](02-initially/04-context-expansion/01-attachments/README.md) | 8 | yes | material |
| [Connect Data Source](02-initially/04-context-expansion/02-connectors/README.md) | 10 | yes | material |
| [MCP Server Connection](02-initially/04-context-expansion/03-mcp/README.md) | 5 | yes | material |
| [Knowledge Base](02-initially/04-context-expansion/04-knowledge-base/README.md) | 12 | yes | material |
| [Model Selection](02-initially/04-context-expansion/05-model-selection/README.md) | 8 | yes | material |

---

_Generated by `_build/catalog/make.js`._
