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
   belongs to a field, and is said under that field. A pair of
   credentials that was not accepted belongs to the attempt: no
   field is at fault, so nothing is marked and the message sits
   with the form.

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

  function mark(f, text) {
    f.input.classList.add('auth-input--error');
    f.input.setAttribute('aria-invalid', 'true');
    f.shell.classList.add('auth-input-shell--error');
    f.msg.querySelector('span').textContent = text;
    f.msg.hidden = false;
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

    /* Stands in for the request. The three outcomes a sign-in screen has
       to be able to show are success, wrong credentials, and a failure
       that is nobody's fault; this playground demonstrates the second,
       because it is the one with a UI. */
    window.setTimeout(function () {
      setBusy(false);
      alert_.hidden = false;
      /* Nothing is marked: the fault belongs to the pair, not to either
         field, and the password is the one they are most likely to be
         correcting — so it gets the caret, with its value selected. */
      pass.focus({ preventScroll: true });
      pass.select();
    }, 1600);
  });

  sync();
})();
