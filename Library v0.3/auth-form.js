/* ══════════════════════════════════════════════════════════
   AUTH FORMS — validation, authentication, loading

   One engine for all three screens. Sign in, sign up and reset
   are the same interaction with different fields, and the rules
   below are the reason they behave identically:

   WHEN TO VALIDATE. Never while somebody is still typing their
   first attempt at a field — an email is invalid for most of the
   time it takes to write one, and telling them so on the third
   keystroke is an accusation, not help. So: on blur, and on
   submit. Once a field HAS been marked, it re-checks as they
   type, because at that point the message is a target they are
   working towards and it should clear the moment they hit it.

   WHERE THE MESSAGE GOES follows the fault. Empty, malformed or
   too short belongs to a field, and is said under that field.
   Credentials that were not accepted belong to the ATTEMPT: the
   form could not have known, the server did, so nothing is
   marked and the message rides at the top of the window.

   WHAT THE BUTTON DOES. It is live from the start. Disabling a
   primary action is tempting — it looks like it prevents an
   error — but it leaves somebody who has missed a field with
   nothing to press and no explanation. Pressing this one always
   produces an answer: it submits, or it marks what is missing
   and puts the caret in the first field that needs attention.
   Its one disabled state is BUSY, where a second press would
   mean a second attempt.

   THE SHAKE plays once, when a fault ARRIVES on a field — never
   on the keystrokes that follow, or the field would judder while
   somebody is fixing it.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.querySelector('.auth-fields[data-auth]');
  if (!form) return;

  /* Deliberately permissive: something@something.something. A stricter
     pattern rejects addresses that are perfectly valid, and the only
     authority on whether an address exists is the server. This catches
     alex@company — a typo the reader can see — and nothing else. */
  var SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MIN_PASSWORD = 8;

  /* A real screen has a directory behind it; this one has to fake the
     answer, and the way it fakes it matters.

     It does NOT check the address against a fixture. Anyone trying
     these screens types their OWN email, and being told a correct
     address is invalid is both wrong and insulting. So any well-formed
     address is treated as an account that exists, and only the password
     decides. The refusals that are ABOUT THE ADDRESS cannot be judged
     here at all, so they are selected on purpose with ?outcome=… —
     which is how the states board captures them, and how anyone can
     inspect them deliberately. */
  var DEMO_PASSWORD = 'correct-horse';
  var FORCED = (function () {
    var m = /[?&]outcome=([a-z]+)\b/.exec(location.search);
    return m ? m[1] : '';
  })();

  /* Each kind knows the faults it can have, in the order they are
     worth saying. A field is described by its kind, so a new screen
     is a list of ids rather than a new set of rules. */
  var KIND = {
    name: function (v) { return v.trim() ? '' : 'Enter your name.'; },
    email: function (v) {
      if (!v.trim()) return 'Enter your email address.';
      if (!SHAPE.test(v.trim())) return 'Enter a valid email address.';
      return '';
    },
    password: function (v) { return v ? '' : 'Enter your password.'; },
    newPassword: function (v) {
      if (!v) return 'Enter a password.';
      if (v.length < MIN_PASSWORD) return 'Use at least ' + MIN_PASSWORD + ' characters.';
      return '';
    }
  };

  /* The three refusals, in the words the product uses. Each names what
     to fix — the whole reason to distinguish them — and none of them
     mentions tokens, status codes or servers. */
  var REFUSED = {
    email:    'Invalid email. Try again.',
    password: 'Invalid password. Try again.',
    both:     'Invalid email and password. Try again.',
    exists:   'Email already in use. Sign in instead.'
  };

  var SCREENS = {
    signin: {
      fields: [['signin-email', 'email'], ['signin-password', 'password']],
      idle: 'Sign In', busy: 'Signing in…', done: 'Signed in',
      /* Default: the account exists, the password is what was wrong. */
      refuse: function (v) {
        if (FORCED) return FORCED === 'success' ? '' : (REFUSED[FORCED] ? FORCED : '');
        return v['signin-password'] === DEMO_PASSWORD ? '' : 'password';
      }
    },
    signup: {
      fields: [['signup-name', 'name'], ['signup-email', 'email'],
               ['signup-password', 'newPassword']],
      idle: 'Create Account', busy: 'Creating account…', done: 'Account created',
      /* Creating an account succeeds unless the address is taken — the
         one refusal a sign-up screen actually has, and one this page
         cannot know, so it is selected with ?outcome=exists. */
      refuse: function () {
        if (FORCED) return FORCED === 'success' ? '' : (REFUSED[FORCED] ? FORCED : '');
        return '';
      },
      /* It names the email, so that is what the caret and the shake go to. */
      blame: 'signup-email'
    },
    reset: {
      fields: [['reset-email', 'email']],
      idle: 'Send reset link', busy: 'Sending…', done: 'Link sent',
      /* No refusal, deliberately. Telling somebody whether an address
         has an account is how a reset form becomes a way to enumerate
         accounts — so this one always says the same thing. */
      refuse: function () { return ''; }
    }
  };

  var screen = SCREENS[form.dataset.auth];
  if (!screen) return;

  var alert_ = document.querySelector('.auth-alert');
  var btn    = form.querySelector('[data-submit]');
  var label  = form.querySelector('[data-submit-label]');
  var busy   = false;

  var FIELDS = screen.fields.map(function (f) {
    var input = document.getElementById(f[0]);
    if (!input) return null;
    return {
      id: f[0],
      kind: f[1],
      input: input,
      shell: input.closest('.auth-input-shell'),
      msg: document.getElementById(f[0] + '-msg'),
      touched: false
    };
  }).filter(Boolean);

  function byId(id) {
    return FIELDS.filter(function (f) { return f.id === id; })[0];
  }
  function values() {
    var v = {};
    FIELDS.forEach(function (f) { v[f.id] = f.input.value; });
    return v;
  }

  /* ── the shake ──
     Restarting a CSS animation needs the class off and a reflow read in
     between, or a second call inside the same frame does nothing;
     `animationend` takes it off again so the next fault can play. */
  function shake(shell) {
    if (!shell) return;
    shell.classList.remove('is-shake');
    void shell.offsetWidth;
    shell.classList.add('is-shake');
  }
  document.addEventListener('animationend', function (ev) {
    if (ev.animationName === 'auth-shake') ev.target.classList.remove('is-shake');
  }, true);

  function mark(f, text) {
    /* Already marked? Then this is a re-check while the reader types,
       and the field must not judder under them. */
    var arriving = !f.input.classList.contains('auth-input--error');
    f.input.classList.add('auth-input--error');
    f.input.setAttribute('aria-invalid', 'true');
    f.shell.classList.add('auth-input-shell--error');
    f.msg.querySelector('span').textContent = text;
    f.msg.hidden = false;
    if (arriving) shake(f.shell);
  }
  function clear(f) {
    f.input.classList.remove('auth-input--error');
    f.input.removeAttribute('aria-invalid');
    f.shell.classList.remove('auth-input-shell--error');
    f.msg.hidden = true;
  }

  function fault(f) { return KIND[f.kind](f.input.value); }
  function firstFaulty() {
    return FIELDS.filter(function (f) { return fault(f); })[0];
  }

  function sync() {
    FIELDS.forEach(function (f) {
      if (!f.touched) return;          /* never judged before it is left */
      var msg = fault(f);
      msg ? mark(f, msg) : clear(f);
    });
  }

  /* Editing anything retires the authentication message. The reader is
     answering it; leaving it up while they do says their correction is
     already wrong. */
  function dismissAlert() {
    if (alert_ && !alert_.hidden) alert_.hidden = true;
  }
  function showAlert(text) {
    if (!alert_) return;
    alert_.querySelector('[data-alert-text]').textContent = text;
    alert_.hidden = false;
  }

  FIELDS.forEach(function (f) {
    f.input.addEventListener('input', function () { dismissAlert(); sync(); });
    f.input.addEventListener('blur', function () { f.touched = true; sync(); });
  });

  /* Show / hide, wherever a password field has one. */
  form.querySelectorAll('[data-reveal]').forEach(function (reveal) {
    var pw = document.getElementById(reveal.getAttribute('aria-controls'));
    if (!pw) return;
    reveal.addEventListener('click', function () {
      var shown = pw.type === 'text';
      pw.type = shown ? 'password' : 'text';
      reveal.textContent = shown ? 'Show' : 'Hide';
      reveal.setAttribute('aria-pressed', String(!shown));
      /* The caret goes back where it was — revealing a password is not a
         reason to lose your place in it. */
      var at = pw.value.length;
      pw.focus({ preventScroll: true });
      try { pw.setSelectionRange(at, at); } catch (err) {}
    });
  });

  function setBusy(on) {
    busy = on;
    btn.disabled = on;
    btn.setAttribute('aria-busy', String(on));
    label.innerHTML = on
      ? '<span class="auth-spin" aria-hidden="true"></span>' + screen.busy
      : screen.idle;
    /* The button carries the busy state; the fields stay editable and
       keep their values, because a wait is not a reason to take the
       reader's work away. */
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;                      /* no second submission */

    FIELDS.forEach(function (f) { f.touched = true; });
    sync();
    var bad = firstFaulty();
    if (bad) { bad.input.focus({ preventScroll: true }); return; }

    dismissAlert();
    setBusy(true);

    /* Stands in for the request. */
    window.setTimeout(function () {
      var refused = screen.refuse(values());

      if (!refused) {
        /* Nothing to navigate to in a pattern library, so the button
           holds the outcome rather than pretending to move on. */
        btn.disabled = true;
        label.textContent = screen.done;
        busy = false;
        return;
      }

      setBusy(false);
      showAlert(REFUSED[refused]);

      /* No inline marking: these faults were found by the server, not by
         reading the form, and a message under a field means "this value
         is malformed". What the message DOES do is name what to fix, so
         the shake and the caret go there — and the shake leaves nothing
         behind when it stops. */
      var blamed = refused === 'both'
        ? FIELDS.filter(function (f) { return f.kind === 'email' || f.kind === 'password'; })
        : [byId(screen.blame) || FIELDS.filter(function (f) {
            return f.kind === (refused === 'password' ? 'password' : 'email');
          })[0]].filter(Boolean);

      blamed.forEach(function (f) { shake(f.shell); });
      if (blamed[0]) {
        blamed[0].input.focus({ preventScroll: true });
        blamed[0].input.select();
      }
    }, 1600);
  });

  sync();
})();
