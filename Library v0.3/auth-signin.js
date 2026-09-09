/* ══════════════════════════════════════════════════════════
   SIGN IN — the states

   Nine states of one screen, and the rules that move between
   them. The rules matter more than the drawings:

   WHEN TO VALIDATE. Never while somebody is still typing their
   first attempt at a field — an email is invalid for most of the
   time it takes to write one, and telling them so on the third
   keystroke is an accusation, not help. So: on blur, and on
   submit. Once a field HAS been marked, it re-checks as they
   type, because at that point the message is a target they are
   working towards and it should clear the moment they hit it.

   WHERE THE MESSAGE GOES follows the fault. Empty or malformed
   belongs to a field, and is said under that field. Credentials
   that were not accepted belong to the attempt: the form could
   not have known, the server did, so nothing is marked and the
   message sits at the top of the window. There are three of
   those — the email, the password, or both — and they are
   separate messages because "invalid email" and "invalid
   password" send the reader to different places.

   WHAT THE BUTTON DOES. It is live from the start. Disabling a
   primary action is tempting — it looks like it prevents an
   error — but it leaves somebody who has missed a field with
   nothing to press and no explanation: the form simply refuses
   to respond, and they have to work out why on their own.
   Pressing this one always produces an answer. Either it
   submits, or it marks what is missing and puts the caret in
   the first field that needs attention. Its one disabled state
   is BUSY, where a second press would mean a second attempt.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.querySelector('.auth-fields');
  if (!form) return;

  var email  = document.getElementById('signin-email');
  var pass   = document.getElementById('signin-password');
  var alert_ = document.getElementById('signin-alert');
  var btn    = form.querySelector('[data-submit]');
  var label  = form.querySelector('[data-submit-label]');
  var reveal = form.querySelector('[data-reveal]');

  /* Deliberately permissive: something@something.something. A stricter
     pattern rejects addresses that are perfectly valid, and the only
     authority on whether an address exists is the server. This catches
     alex@company — a typo the reader can see — and nothing else. */
  var SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* The account this demo knows about. A real screen has a server here;
     the point of the fixture is that the three authentication outcomes
     below are REACHABLE by typing, so the states can be inspected
     rather than described. */
  var ACCOUNT = { email: 'alex@company.com', password: 'correct-horse' };

  /* The three ways an attempt can be refused, in the words the product
     uses. Each names what to fix — which is the whole reason to
     distinguish them — and none of them says anything about tokens,
     status codes or servers. */
  var REFUSED = {
    email:    'Invalid email. Try again.',
    password: 'Invalid password. Try again.',
    both:     'Invalid email and password. Try again.'
  };

  var touched = { email: false, password: false };
  var busy = false;

  function field(input) {
    return {
      input: input,
      shell: input.closest('.auth-input-shell'),
      msg: document.getElementById(input.id + '-msg')
    };
  }
  var E = field(email), P = field(pass);

  /* One shake, on arrival. Restarting the animation needs the class off
     and a reflow read in between, or a second call inside the same frame
     does nothing; `animationend` takes it off again so the next fault
     can play. */
  function shake(shell) {
    shell.classList.remove('is-shake');
    void shell.offsetWidth;
    shell.classList.add('is-shake');
  }
  document.addEventListener('animationend', function (ev) {
    if (ev.animationName === 'auth-shake') ev.target.classList.remove('is-shake');
  }, true);

  function mark(f, text) {
    /* Was it already marked? Then this is a re-check while the reader
       types, and the field must not judder under them. */
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

  /* The fault in a field, or nothing. Kept separate from the marking so
     the same rules can answer "may this be submitted?" without writing
     anything on screen. */
  function faultEmail() {
    var v = email.value.trim();
    if (!v) return 'Enter your email address.';
    if (!SHAPE.test(v)) return 'Enter a valid email address.';
    return '';
  }
  function faultPassword() {
    return pass.value ? '' : 'Enter your password.';
  }

  function submittable() {
    return !faultEmail() && !faultPassword();
  }

  function sync() {
    /* A field that has never been left alone is not judged. One that has
       been marked is re-judged on every keystroke, so the message goes
       the moment it stops being true. The button is not touched here —
       it is available whatever the fields say. */
    if (touched.email)    { var e = faultEmail();    e ? mark(E, e) : clear(E); }
    if (touched.password) { var p = faultPassword(); p ? mark(P, p) : clear(P); }
  }

  /* Editing either credential retires the authentication error. The
     reader is answering it; leaving it up while they do says their
     correction is already wrong. */
  function dismissAlert() {
    if (!alert_.hidden) alert_.hidden = true;
  }
  function showAlert(text) {
    alert_.querySelector('[data-alert-text]').textContent = text;
    alert_.hidden = false;
  }

  /* Which of the two the server refused. Both wrong is its own answer
     rather than two messages stacked: one sentence, both nouns. */
  function refusal() {
    var emailOk = email.value.trim().toLowerCase() === ACCOUNT.email;
    var passOk  = pass.value === ACCOUNT.password;
    if (emailOk && passOk) return '';
    if (!emailOk && !passOk) return 'both';
    return emailOk ? 'password' : 'email';
  }

  [email, pass].forEach(function (el) {
    el.addEventListener('input', function () { dismissAlert(); sync(); });
    el.addEventListener('blur', function () {
      touched[el === email ? 'email' : 'password'] = true;
      sync();
    });
  });

  if (reveal) {
    reveal.addEventListener('click', function () {
      var shown = pass.type === 'text';
      pass.type = shown ? 'password' : 'text';
      reveal.textContent = shown ? 'Show' : 'Hide';
      reveal.setAttribute('aria-pressed', String(!shown));
      /* The caret goes back where it was — revealing a password is not a
         reason to lose your place in it. */
      var at = pass.value.length;
      pass.focus({ preventScroll: true });
      try { pass.setSelectionRange(at, at); } catch (err) {}
    });
  }

  function setBusy(on) {
    busy = on;
    btn.disabled = on;
    btn.setAttribute('aria-busy', String(on));
    label.innerHTML = on
      ? '<span class="auth-spin" aria-hidden="true"></span>Signing in&hellip;'
      : 'Sign In';
    /* The button carries the busy state; the fields stay editable and
       keep their values, because a wait is not a reason to take the
       reader's work away. */
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;                      /* no second submission */

    touched.email = touched.password = true;
    sync();
    if (!submittable()) {
      (faultEmail() ? email : pass).focus({ preventScroll: true });
      return;
    }

    dismissAlert();
    setBusy(true);

    /* Stands in for the request. */
    window.setTimeout(function () {
      var refused = refusal();

      if (!refused) {
        /* Nothing to navigate to in a pattern library, so the button
           holds the outcome rather than pretending to move on. */
        btn.disabled = true;
        label.textContent = 'Signed in';
        busy = false;
        return;
      }

      setBusy(false);
      showAlert(REFUSED[refused]);

      /* Still no field markings: these faults were found by the server,
         not by reading the form, and an inline message under a field
         means "this value is malformed". What the message DOES do is
         name what to fix, so the caret goes to the first thing named —
         with its value selected, ready to be typed over. */
      /* The named field shakes even though it is not marked: the shake is
         a pointer to where the sentence is looking, and it leaves nothing
         behind when it stops. Both, when both were named. */
      if (refused !== 'password') shake(E.shell);
      if (refused !== 'email')    shake(P.shell);

      var first = refused === 'password' ? pass : email;
      first.focus({ preventScroll: true });
      first.select();
    }, 1600);
  });

  sync();
})();
