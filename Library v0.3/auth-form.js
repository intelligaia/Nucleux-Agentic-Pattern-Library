/* ══════════════════════════════════════════════════════════
   AUTH FORMS — validation, authentication, loading

   One engine for all four screens. Sign in, sign up, reset and
   set-a-new-password are the same interaction with different
   fields, and the rules below are the reason they behave identically:

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

   WHERE THE ANSWER COMES FROM. The Nucleux MCP service at /mcp
   holds the accounts (see services/mcp-http in the nucleux repo):
   the forms post JSON to /mcp/account/… and the session comes
   back as a cookie. A refusal names what to fix in the words the
   product uses, and never mentions tokens, status codes or servers.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var API = '/mcp/account';
  /* Where to go once signed in: the page that sent us here (?next=, a
     path on this site only), else the account card on the MCP page. */
  var ACCOUNT = '/mcp#account';
  var NEXT = (function () {
    var m = /[?&]next=([^&]+)/.exec(location.search);
    if (!m) return '';
    try {
      var v = decodeURIComponent(m[1]);
      return /^\/(?![\/\\])/.test(v) ? v : '';
    } catch (e) { return ''; }
  })();
  var DESTINATION = NEXT || ACCOUNT;
  /* The reset link from the email carries the token. */
  var RESET_TOKEN = (function () {
    var m = /[?&]t=([^&]+)/.exec(location.search);
    try { return m ? decodeURIComponent(m[1]) : ''; } catch (e) { return ''; }
  })();

  /* "Continue with Google" goes through the same service and comes back
     to the same place. */
  Array.prototype.forEach.call(document.querySelectorAll('.auth-btn--google'), function (a) {
    a.href = '/mcp/auth/login?provider=google&next=' + encodeURIComponent(DESTINATION);
  });

  /* The reset page has two steps: ask for a link, or — arriving from the
     email — set the new password. The token decides which one shows. */
  var steps = document.querySelectorAll('[data-reset-step]');
  if (steps.length) {
    Array.prototype.forEach.call(steps, function (el) {
      el.hidden = el.getAttribute('data-reset-step') !== (RESET_TOKEN ? 'confirm' : 'request');
    });
  }

  var form = (function () {
    var all = document.querySelectorAll('.auth-fields[data-auth]');
    for (var i = 0; i < all.length; i++) {
      var step = all[i].closest('[data-reset-step]');
      if (!step || !step.hidden) return all[i];
    }
    return null;
  })();
  if (!form) return;

  /* Deliberately permissive: something@something.something. A stricter
     pattern rejects addresses that are perfectly valid, and the only
     authority on whether an address exists is the server. This catches
     alex@company — a typo the reader can see — and nothing else. */
  var SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MIN_PASSWORD = 8;

  /* The states board (signin-states.html) captures the refusals the
     server would give by selecting them on purpose with ?outcome=…;
     a forced outcome never touches the network. */
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

  /* The refusals, in the words the product uses. Each names what to
     fix — the whole reason to distinguish them — and none of them
     mentions tokens, status codes or servers. Keyed by the server's
     error code; the first four are also the states board's outcomes. */
  var REFUSED = {
    email:    'Invalid email. Try again.',
    password: 'Invalid password. Try again.',
    both:     'Invalid email and password. Try again.',
    exists:   'Email already in use. Sign in instead.',
    invalid_credentials: 'Invalid email or password. Try again.',
    no_password: 'This account signs in with Google. Use Continue with Google.',
    account_disabled: 'This account has been disabled.',
    email_exists: 'Email already in use. Sign in instead.',
    invalid_email: 'Enter a valid email address.',
    weak_password: 'Use at least ' + MIN_PASSWORD + ' characters.',
    missing_name: 'Enter your name.',
    invalid_token: 'This reset link has expired or was already used. Request a new one.',
    mail_unavailable: 'Password reset by email is not set up yet. Contact us and we will reset it for you.',
    mail_failed: 'We couldn’t send the email just now. Try again in a minute.',
    rate_limited: 'Too many attempts. Try again in a few minutes.',
    offline: 'We couldn’t reach the server. Check your connection and try again.',
    unknown: 'Something went wrong on our side. Try again in a minute.'
  };
  /* Which field a refusal is about: the shake and the caret go there. */
  var BLAME = {
    email: ['email'], password: ['password'], both: ['email', 'password'], exists: ['email'],
    invalid_credentials: ['email', 'password'], no_password: ['email'], email_exists: ['email'],
    invalid_email: ['email'], weak_password: ['newPassword'], missing_name: ['name']
  };

  var SCREENS = {
    signin: {
      fields: [['signin-email', 'email'], ['signin-password', 'password']],
      idle: 'Sign In', busy: 'Signing in…', done: 'Signed in',
      request: function (v) { return { path: '/signin', body: { email: v['signin-email'], password: v['signin-password'] } }; },
      success: function () { location.assign(DESTINATION); }
    },
    signup: {
      fields: [['signup-name', 'name'], ['signup-email', 'email'],
               ['signup-password', 'newPassword']],
      idle: 'Create Account', busy: 'Creating account…', done: 'Account created',
      request: function (v) { return { path: '/signup', body: { name: v['signup-name'], email: v['signup-email'], password: v['signup-password'] } }; },
      success: function () { location.assign(DESTINATION); }
    },
    reset: {
      fields: [['reset-email', 'email']],
      idle: 'Send reset link', busy: 'Sending…', done: 'Link sent',
      request: function (v) { return { path: '/password/forgot', body: { email: v['reset-email'] } }; },
      /* The same answer whether or not the address has an account —
         saying otherwise is how a reset form becomes a way to enumerate
         accounts — so the button holds the outcome and the note says
         what to do next. */
      success: function () {
        showAlert('If that address has an account, a link to set a new password is on its way. It works once, for 30 minutes.', 'ok');
      }
    },
    'reset-confirm': {
      fields: [['reset-new-password', 'newPassword']],
      idle: 'Set new password', busy: 'Saving…', done: 'Password updated',
      request: function (v) { return { path: '/password/reset', body: { token: RESET_TOKEN, password: v['reset-new-password'] } }; },
      success: function () { location.assign(ACCOUNT); }
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

  function byKind(kind) {
    return FIELDS.filter(function (f) { return f.kind === kind; })[0];
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
  function showAlert(text, tone) {
    if (!alert_) return;
    alert_.querySelector('[data-alert-text]').textContent = text;
    alert_.classList.toggle('auth-alert--ok', tone === 'ok');
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

  /* The request. Resolves to '' (accepted) or a refusal code. */
  function send(req) {
    if (FORCED) {
      /* The states board: no network, the chosen outcome after the same
         pause a real answer takes. */
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(FORCED === 'success' ? '' : (REFUSED[FORCED] ? FORCED : '')); }, 1600);
      });
    }
    return fetch(API + req.path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(req.body)
    }).then(function (res) {
      if (res.ok) return '';
      if (res.status === 429) return 'rate_limited';
      return res.json().then(function (j) {
        var code = j && j.error;
        if (code && !REFUSED[code] && j.error_description) REFUSED[code] = j.error_description;
        return code && REFUSED[code] ? code : 'unknown';
      }, function () { return 'unknown'; });
    }, function () { return 'offline'; });
  }

  function refuse(code) {
    setBusy(false);
    showAlert(REFUSED[code] || REFUSED.unknown);

    /* No inline marking: these faults were found by the server, not by
       reading the form, and a message under a field means "this value
       is malformed". What the message DOES do is name what to fix, so
       the shake and the caret go there — and the shake leaves nothing
       behind when it stops. */
    var blamed = (BLAME[code] || []).map(byKind).filter(Boolean);
    blamed.forEach(function (f) { shake(f.shell); });
    if (blamed[0]) {
      blamed[0].input.focus({ preventScroll: true });
      blamed[0].input.select();
    }
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

    send(screen.request(values())).then(function (refused) {
      if (refused) { refuse(refused); return; }
      /* Accepted. The button holds the outcome for the beat before the
         next page (or, on the states board and the reset request, for
         good), so the answer is read before anything moves. */
      btn.disabled = true;
      label.textContent = screen.done;
      busy = false;
      if (!FORCED && screen.success) screen.success();
    });
  });

  /* Already signed in? Then the entry screens have nothing to ask. The
     hint cookie says whether it is worth checking. */
  if (!FORCED && !RESET_TOKEN && /(?:^|; )nx_acct=1/.test(document.cookie) && (screen === SCREENS.signin || screen === SCREENS.signup)) {
    fetch(API + '/me', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
      .then(function (res) { if (res.ok) location.replace(DESTINATION); })
      .catch(function () {});
  }

  sync();
})();
