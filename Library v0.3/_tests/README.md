# Regression suites

These drive the real pages in headless Chromium and assert on what is
**on screen** — computed styles, geometry, colour, ARIA — rather than on
markup. They are the reason a change to one pattern does not quietly
break another.

## Running

```bash
chmod +x _tests/run.sh
./_tests/run.sh                    # all twelve, ~12 min
./_tests/run.sh ms.test.js         # one suite
./_tests/run.sh probes/spark.js    # one probe
```

`run.sh` starts a static server on `127.0.0.1:8901` from the site root and
resolves Chromium and `playwright-core` from wherever the container has
them (override with `CHROME=` / `PW=`). **The server dies often** — a
suite that reports a blank page usually means the server, not the code;
re-run.

`onb.js` is slow (~10 min). Run it in the background:
`nohup node _tests/suites/onb.js > /tmp/onb.out 2>&1 &`

Suites are noisy in parallel: `modstate.js` reports phantom failures when
another browser suite is running alongside it, and passes 36/36 alone.
Run them one at a time.

## The suites

| File | Covers | Assertions |
|---|---|---|
| `ms.test.js` | Model Selection — Live Preview, nine states | 104 |
| `mssim.test.js` | Model Selection — simulator | 34 |
| `kb12.test.js` | Knowledge Base — Live Preview, twelve states | 72 |
| `kbsim3.test.js` | Knowledge Base — simulator | 46 |
| `onb.js` | Onboarding customize | 586 |
| `conn.js` | Connect a data source | 112 |
| `connsim2.test.js` | Connect a data source — simulator | 89 |
| `mcp.js` | MCP server connection | 87 |
| `disc.js` | Disclosure customize | 74 |
| `toolbar.js` | Live Preview toolbar | 34 |
| `modstate.js` | Modified-state panel | 36 |
| `dline.js` | Dividers | 11 |

**1,285 assertions, all green** as of the spark-animation change.

## The probes

Not assertions — measuring instruments, kept because they were expensive
to get right and answer questions that recur.

- **`kbsweep.js`** — the dead-control sweep. Takes a geometry-and-colour
  fingerprint of the preview, toggles every customizer control in turn
  with a full reset between each, and reports any control that changes
  nothing. Written after an earlier probe reported *zero* dead controls
  falsely: it clicked segments with `:not(.is-on)` instead of
  `[aria-pressed="false"]`, so every segment looked alive. This one has
  since found nine genuinely inert controls across three passes.
- **`spark.js` / `sparksim.js`** — the Max-effort particles: present only
  at the top notch, actually painting, pixels changing between frames,
  correct hue, nothing under reduced motion.
- **`mseff5.js`** — the five-notch effort slider end to end.
- **`msglow.js`** — the travelling highlight follows pointer *and* keyboard.
- **`mstoggle.js`** — the Auto switch and the collapse animation.
- **`msnarrow.js` / `mswide.js`** — the composer at both extremes; both
  chips must survive below 430px.
- **`msa11y.js`** — roles, names, and values on the picker and the slider.
- **`msshot.js`** — screenshots of each state.

## Writing more

Two things these suites learned the hard way, worth keeping:

1. **Assert on effect, not on markup.** A test that reads a class name
   passes while the thing is invisible. Read `getBoundingClientRect`,
   `getComputedStyle`, canvas pixels, `aria-valuetext`.
2. **When a test fails, first decide whether the test is wrong.** Several
   "failures" here were artefacts: `reset` deliberately preserves scenario
   toggles, so state had to be cleared explicitly; the chip's effort half
   is hidden at narrow widths, so assertions moved to `aria-label`.
   Correcting the test is legitimate; loosening it to go green is not.
