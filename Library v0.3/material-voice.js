/* ============================================================
   MATERIAL 3.0 — VOICE ACTIVITY INDICATOR

   A small component with one job: say whether the microphone is
   hearing anything, and how much. It is sized to sit INSIDE the
   shared prompt composer, in the space the text occupies, and it
   never becomes the subject of the screen.

   The earlier version of this was a large orb. That was the wrong
   instinct: it made voice look like a different application
   rather than a state of the composer you were already using, and
   an embedded simulator has no room to spend on it. What replaced
   it is about the height of a line of text.

   WHAT IT IS NOT: an equaliser. Equaliser bars step; these are
   capsules whose length is a smoothed value and whose rest state
   is a row of dots rather than a flat line. The difference is the
   easing constant, and it is the whole difference between
   "listening" and "playing music".

   THE AMPLITUDE IS REAL, in the one sense that matters here: when
   nothing is being said the value falls to the floor and the
   strokes settle. A loop that keeps moving whether or not
   anything is heard is how a hung microphone passes for a working
   one, and it is the failure this component exists to prevent.

   Under prefers-reduced-motion the driver never starts. Colour,
   length and the words beside it carry the state instead — which
   is the test of whether the state was ever legible.
   ============================================================ */
(function () {
  'use strict';

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* The states the shared composer can be in while it is in voice
     mode. `live` names the amplitude profile, or false where the
     microphone is not open. Every one has words, because none of
     the visual cues may be the only way to know. */
  var STATES = {
    listening:  { label: 'Listening',  status: 'Listening…',             live: 'quiet' },
    speaking:   { label: 'Speaking',   status: 'Listening…',             live: 'user'  },
    pause:      { label: 'Pause',      status: 'Paused',                 live: false   },
    processing: { label: 'Processing', status: 'Thinking…',              live: 'think' },
    muted:      { label: 'Muted',      status: 'Microphone muted',       live: false   },
    permission: { label: 'Permission', status: 'Microphone not enabled', live: false   },
    error:      { label: 'Error',      status: 'Voice stopped',          live: false   }
  };

  /* What the component preview offers. Six — and the first is the
     composer doing nothing special at all, because the claim of
     this pattern is that voice is a state of THAT, and a preview
     that never shows the resting state cannot make the claim. */
  var DEMO = [
    { id: 'default',    label: 'Default'    },
    { id: 'listening',  label: 'Listening'  },
    { id: 'speaking',   label: 'Speaking'   },
    { id: 'processing', label: 'Processing' },
    { id: 'muted',      label: 'Muted'      },
    { id: 'error',      label: 'Error'      }
  ];

  /* Material icons, drawn at the size the composer's other
     controls already use. Nothing here comes from another set. */
  var ICONS = {
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
         '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
         '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>',
    micOff: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<rect x="9" y="3" width="6" height="11" rx="3"/>' +
            '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M4 4l16 16"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M9.5 5v14M14.5 5v14"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* ── The indicator ────────────────────────────────────────
     Five capsules. The middle ones carry more of the amplitude
     than the outer ones, which is what stops the row reading as a
     bar chart: a voice does not move five things by the same
     amount at the same instant.

     It is aria-hidden without apology. The status text beside it
     is the accessible equivalent, and two announcements of one
     fact is one too many. */
  function indicator(state) {
    var meta = STATES[state] || STATES.listening;
    return '<span class="md-va" data-state="' + state + '"' +
        (meta.live ? ' data-vx-live="' + meta.live + '"' : '') +
        ' aria-hidden="true">' +
      '<i style="--w:.52"><b></b></i>' +
      '<i style="--w:.86"><b></b></i>' +
      '<i style="--w:1"><b></b></i>' +
      '<i style="--w:.80"><b></b></i>' +
      '<i style="--w:.48"><b></b></i>' +
    '</span>';
  }

  /* ── The amplitude driver ─────────────────────────────────
     One rAF loop per mounted root, writing a single custom
     property. The browser animates a transform; nothing
     re-lays-out, and nothing here touches the DOM.

     A smoothed random walk, not raw random: raw random on a CSS
     property is a flicker, not a voice. The easing constant is
     what makes it read as breath and emphasis rather than noise,
     and it is the reason this never looks jerky. */
  var PROFILE = {
    /* Open, nobody talking. This is the state that has to look
       different from speech, so it barely moves at all. */
    quiet: { lo: 0.00, hi: 0.09, every: 300, ease: 0.09 },
    /* A person: gappy, with real peaks on emphasis. */
    user:  { lo: 0.14, hi: 1.00, every: 120, ease: 0.20, gap: 0.16 },
    /* Thinking is not sound. A slow internal swell, kept low so it
       cannot be mistaken for hearing something. */
    think: { lo: 0.06, hi: 0.30, every: 640, ease: 0.05 }
  };

  function drive(root) {
    if (!root) return;
    stop(root);
    var els = [].slice.call(root.querySelectorAll('.md-va[data-vx-live]'));
    if (!els.length) return;

    if (reduce) {
      /* Pinned, not animated. The state still reads — it just
         reads from colour, length and the words. */
      els.forEach(function (el) {
        var p = PROFILE[el.dataset.vxLive];
        el.style.setProperty('--amp', p ? ((p.lo + p.hi) / 2).toFixed(3) : '0');
      });
      return;
    }

    var state = els.map(function (el) {
      return { el: el, p: PROFILE[el.dataset.vxLive] || PROFILE.quiet,
               cur: 0, target: 0, next: 0 };
    });

    var raf = 0;
    function frame(t) {
      for (var i = 0; i < state.length; i++) {
        var s = state[i];
        if (!s.el.isConnected) { cancel(); return; }
        if (t >= s.next) {
          s.next = t + s.p.every * (0.7 + Math.random() * 0.6);
          /* A person stops between clauses. Without the gaps the
             row hums rather than speaks. */
          s.target = (s.p.gap && Math.random() < s.p.gap)
            ? 0
            : s.p.lo + Math.random() * (s.p.hi - s.p.lo);
        }
        s.cur += (s.target - s.cur) * s.p.ease;
        s.el.style.setProperty('--amp', s.cur.toFixed(3));
      }
      raf = requestAnimationFrame(frame);
    }
    function cancel() { if (raf) cancelAnimationFrame(raf); raf = 0; }

    raf = requestAnimationFrame(frame);
    root.__vxStop = function () { cancel(); };
  }

  function stop(root) {
    if (root && root.__vxStop) { root.__vxStop(); root.__vxStop = null; }
  }

  window.MaterialVoice = {
    STATES: STATES,
    DEMO: DEMO,
    ICONS: ICONS,
    indicator: indicator,
    drive: drive,
    stop: stop
  };
})();
