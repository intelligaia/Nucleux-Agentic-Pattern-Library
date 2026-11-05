/* ============================================================
   SHADCN — BASIC COMPONENTS (data)

   The ShadCN base components shown on basic-components.html, grouped
   the way a reader looks for them. Each `demo` is the component itself
   in plain HTML, styled by shadcn-basics.css; the Code tab's source is in
   basics-shadcn-code.js; and `docs` points at the component's page on ui.shadcn.com.

   Overlays (dialog, sheet, drawer, popover, tooltip…) are drawn in
   their open state inside the card — a gallery that makes the reader
   click to see a component is a gallery of buttons.

   basics.js renders this; see its header for the data shape.
   ============================================================ */
(function () {
  'use strict';

  /* Lucide icons, the set ShadCN ships with. */
  var P = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    chevRight: '<path d="m9 18 6-6-6-6"/>',
    chevLeft: '<path d="m15 18-6-6 6-6"/>',
    chevsUpDown: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
    italic: '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    badgeCheck: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'
  };
  function ic(name) {
    return '<svg class="sc-ico" viewBox="0 0 24 24" aria-hidden="true">' + P[name] + '</svg>';
  }

  var DOCS = 'https://ui.shadcn.com/docs/components/';

  /* A few muted placeholder lines, drawn behind an overlay so it reads
     as sitting on top of a page rather than floating in space. */
  var BACKDROP = '<div class="sc-backdrop" aria-hidden="true">' +
    '<div class="sc-skel" style="width:40%;height:14px;animation:none"></div>' +
    '<div class="sc-skel" style="width:85%;height:10px;animation:none"></div>' +
    '<div class="sc-skel" style="width:70%;height:10px;animation:none"></div>' +
    '<div class="sc-skel" style="width:78%;height:10px;animation:none"></div>' +
    '<div class="sc-skel" style="width:55%;height:10px;animation:none"></div>' +
  '</div>';

  /* December 2026 starts on a Tuesday. */
  function calendar() {
    var dows = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    var cells = dows.map(function (d) { return '<div class="sc-calendar__dow">' + d + '</div>'; }).join('');
    [29, 30].forEach(function (d) { cells += '<button class="sc-calendar__day is-out" type="button">' + d + '</button>'; });
    for (var d = 1; d <= 31; d++) {
      var cls = d === 14 ? ' is-sel' : d === 9 ? ' is-today' : '';
      cells += '<button class="sc-calendar__day' + cls + '" type="button">' + d + '</button>';
    }
    [1, 2].forEach(function (d) { cells += '<button class="sc-calendar__day is-out" type="button">' + d + '</button>'; });
    return '<div class="sc-calendar">' +
             '<div class="sc-calendar__head">' +
               '<button class="sc-btn sc-btn--outline" type="button" aria-label="Previous month">' + ic('chevLeft') + '</button>' +
               '<strong>December 2026</strong>' +
               '<button class="sc-btn sc-btn--outline" type="button" aria-label="Next month">' + ic('chevRight') + '</button>' +
             '</div>' +
             '<div class="sc-calendar__grid">' + cells + '</div>' +
           '</div>';
  }

  var tags = '';
  for (var i = 50; i >= 1; i--) {
    tags += '<div class="sc-scroll__item">v1.2.0-beta.' + i + '</div>' + (i > 1 ? '<hr class="sc-sep" />' : '');
  }

  var groups = [
    /* ═════════════════════════ FORMS & INPUT ═════════════════════════ */
    { id: 'forms', title: 'Forms & Input', desc: 'The controls a user types into, picks from and toggles.',
      items: [
        { id: 'button', name: 'Button', docs: DOCS + 'button',
          oneline: 'Displays a button or a component that looks like a button. Six variants, three sizes, plus icon-only.',
          demo: '<div class="bx-col">' +
                  '<div class="bx-row">' +
                    '<button class="sc-btn" type="button">Default</button>' +
                    '<button class="sc-btn sc-btn--secondary" type="button">Secondary</button>' +
                    '<button class="sc-btn sc-btn--destructive" type="button">Destructive</button>' +
                  '</div>' +
                  '<div class="bx-row">' +
                    '<button class="sc-btn sc-btn--outline" type="button">Outline</button>' +
                    '<button class="sc-btn sc-btn--ghost" type="button">Ghost</button>' +
                    '<button class="sc-btn sc-btn--link" type="button">Link</button>' +
                  '</div>' +
                  '<div class="bx-row">' +
                    '<button class="sc-btn sc-btn--sm" type="button">' + ic('mail') + 'Login with Email</button>' +
                    '<button class="sc-btn sc-btn--outline sc-btn--icon" type="button" aria-label="Next">' + ic('chevRight') + '</button>' +
                    '<button class="sc-btn sc-btn--lg" type="button" disabled>Disabled</button>' +
                  '</div>' +
                '</div>' },

        { id: 'input', name: 'Input', docs: DOCS + 'input',
          oneline: 'Displays a form input field or a component that looks like an input field.',
          demo: '<div class="bx-col">' +
                  '<div class="sc-field"><label class="sc-label" for="sc-in-1">Email</label><input class="sc-input" id="sc-in-1" type="email" placeholder="m@example.com" /><span class="sc-hint">Enter your email address.</span></div>' +
                  '<div class="sc-inline"><input class="sc-input" type="email" placeholder="Email" aria-label="Email" /><button class="sc-btn sc-btn--outline" type="button">Subscribe</button></div>' +
                  '<div class="sc-field"><label class="sc-label" for="sc-in-2">Picture</label><input class="sc-input" id="sc-in-2" type="file" /></div>' +
                '</div>' },

        { id: 'textarea', name: 'Textarea', docs: DOCS + 'textarea',
          oneline: 'Displays a form textarea or a component that looks like a textarea.',
          demo: '<div class="sc-field" style="max-width:360px"><label class="sc-label" for="sc-ta">Your message</label>' +
                '<textarea class="sc-textarea" id="sc-ta" placeholder="Type your message here."></textarea>' +
                '<span class="sc-hint">Your message will be copied to the support team.</span>' +
                '<button class="sc-btn sc-btn--block" type="button">Send message</button></div>' },

        { id: 'label', name: 'Label', docs: DOCS + 'label',
          oneline: 'Renders an accessible label associated with a control.',
          demo: '<div class="sc-stack">' +
                  '<label class="sc-check"><input type="checkbox" id="sc-terms" /> Accept terms and conditions</label>' +
                  '<div class="sc-field"><label class="sc-label" for="sc-lbl-name">Display name</label><input class="sc-input" id="sc-lbl-name" value="Pedro Duarte" /></div>' +
                '</div>' },

        { id: 'select', name: 'Select', docs: DOCS + 'select',
          oneline: 'Displays a list of options for the user to pick from, triggered by a button.',
          stage: 'bx-card__stage--top',
          demo: '<div class="bx-col" style="align-items:center">' +
                  '<div class="sc-field" style="max-width:220px"><label class="sc-label" for="sc-sel">Fruit</label>' +
                  '<select class="sc-select" id="sc-sel"><option>Apple</option><option selected>Banana</option><option>Blueberry</option><option>Grapes</option><option>Pineapple</option></select></div>' +
                  '<div class="sc-menu" style="width:220px">' +
                    '<div class="sc-menu__label" style="font-size:12px;color:var(--sc-muted-foreground);font-weight:400">Fruits</div>' +
                    '<div class="sc-menu__item">Apple</div>' +
                    '<div class="sc-menu__item is-hl">Banana<span class="sc-menu__short">' + ic('check') + '</span></div>' +
                    '<div class="sc-menu__item">Blueberry</div>' +
                  '</div>' +
                '</div>' },

        { id: 'checkbox', name: 'Checkbox', docs: DOCS + 'checkbox',
          oneline: 'A control that allows the user to toggle between checked and not checked.',
          demo: '<div class="sc-stack">' +
                  '<label class="sc-check"><input type="checkbox" checked /> Accept terms and conditions</label>' +
                  '<label class="sc-check" style="align-items:flex-start"><input type="checkbox" style="margin-top:2px" />' +
                    '<span><span style="display:block">Enable notifications</span><span class="sc-hint" style="font-weight:400">You can enable or disable notifications at any time.</span></span></label>' +
                  '<label class="sc-check" style="opacity:.7"><input type="checkbox" disabled /> Disabled</label>' +
                '</div>' },

        { id: 'radio-group', name: 'Radio Group', docs: DOCS + 'radio-group',
          oneline: 'A set of checkable buttons — known as radio buttons — where no more than one can be checked at a time.',
          demo: '<div class="sc-stack" role="radiogroup">' +
                  '<label class="sc-radio"><input type="radio" name="sc-rg" /> Default</label>' +
                  '<label class="sc-radio"><input type="radio" name="sc-rg" checked /> Comfortable</label>' +
                  '<label class="sc-radio"><input type="radio" name="sc-rg" /> Compact</label>' +
                '</div>' },

        { id: 'switch', name: 'Switch', docs: DOCS + 'switch',
          oneline: 'A control that allows the user to toggle between checked and not checked.',
          demo: '<div class="sc-stack">' +
                  '<label class="sc-switch"><input type="checkbox" role="switch" /><span class="sc-switch__track"></span>Airplane Mode</label>' +
                  '<label class="sc-switch"><input type="checkbox" role="switch" checked /><span class="sc-switch__track"></span>Marketing emails</label>' +
                '</div>' },

        { id: 'slider', name: 'Slider', docs: DOCS + 'slider',
          oneline: 'An input where the user selects a value from within a given range.',
          demo: '<div class="bx-col"><input class="sc-slider" type="range" min="0" max="100" value="50" data-range aria-label="Volume" />' +
                '<input class="sc-slider" type="range" min="0" max="100" value="25" data-range aria-label="Opacity" style="max-width:200px" /></div>' },

        { id: 'input-otp', name: 'Input OTP', docs: DOCS + 'input-otp',
          oneline: 'Accessible one-time password component with copy-paste functionality.',
          demo: '<div class="bx-col"><div class="sc-otp" role="group" aria-label="One-time password">' +
                  '<div class="sc-otp__group"><div class="sc-otp__slot">4</div><div class="sc-otp__slot">2</div><div class="sc-otp__slot">7</div></div>' +
                  '<span class="sc-otp__sep">' + ic('minus') + '</span>' +
                  '<div class="sc-otp__group"><div class="sc-otp__slot is-active"><span class="sc-otp__caret"></span></div><div class="sc-otp__slot"></div><div class="sc-otp__slot"></div></div>' +
                '</div><span class="sc-hint">Enter your one-time password.</span></div>' },

        { id: 'toggle-group', name: 'Toggle & Toggle Group', docs: DOCS + 'toggle-group',
          oneline: 'A two-state button that can be on or off — alone, or as a set of toggles that act together.',
          demo: '<div class="bx-col">' +
                  '<div class="bx-row">' +
                    '<button class="sc-toggle" type="button" data-press aria-pressed="true" aria-label="Toggle bold">' + ic('bold') + '</button>' +
                    '<button class="sc-toggle sc-toggle--outline" type="button" data-press aria-pressed="false">' + ic('italic') + 'Italic</button>' +
                  '</div>' +
                  '<div class="sc-toggle-group" role="group" data-press-group="multi">' +
                    '<button class="sc-toggle" type="button" aria-pressed="true" aria-label="Bold">' + ic('bold') + '</button>' +
                    '<button class="sc-toggle" type="button" aria-pressed="false" aria-label="Italic">' + ic('italic') + '</button>' +
                    '<button class="sc-toggle" type="button" aria-pressed="true" aria-label="Underline">' + ic('underline') + '</button>' +
                  '</div>' +
                '</div>' },

        { id: 'calendar', name: 'Calendar', docs: DOCS + 'calendar',
          oneline: 'A date field component that allows users to enter and edit a date. The base of the Date Picker.',
          demo: calendar() }
      ] },

    /* ═════════════════════════ DATA DISPLAY ═════════════════════════ */
    { id: 'display', title: 'Data Display', desc: 'Containers and marks that present content and status.',
      items: [
        { id: 'card', name: 'Card', docs: DOCS + 'card',
          oneline: 'Displays a card with header, content, and footer.',
          demo: '<div class="sc-card">' +
                  '<div class="sc-card__header"><h4 class="sc-card__title">Login to your account</h4><p class="sc-card__desc">Enter your email below to login to your account.</p></div>' +
                  '<div class="sc-card__content">' +
                    '<div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-cd-e">Email</label><input class="sc-input" id="sc-cd-e" type="email" placeholder="m@example.com" /></div>' +
                    '<div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-cd-p">Password</label><input class="sc-input" id="sc-cd-p" type="password" /></div>' +
                  '</div>' +
                  '<div class="sc-card__footer" style="flex-direction:column"><button class="sc-btn sc-btn--block" type="button">Login</button><button class="sc-btn sc-btn--outline sc-btn--block" type="button">Login with Google</button></div>' +
                '</div>' },

        { id: 'badge', name: 'Badge', docs: DOCS + 'badge',
          oneline: 'Displays a badge or a component that looks like a badge.',
          demo: '<div class="bx-col"><div class="bx-row">' +
                  '<span class="sc-badge">Badge</span>' +
                  '<span class="sc-badge sc-badge--secondary">Secondary</span>' +
                  '<span class="sc-badge sc-badge--destructive">Destructive</span>' +
                  '<span class="sc-badge sc-badge--outline">Outline</span>' +
                '</div><div class="bx-row">' +
                  '<span class="sc-badge sc-badge--secondary" style="background:#3b82f6;color:#fff">' + ic('badgeCheck') + 'Verified</span>' +
                  '<span class="sc-badge sc-badge--pill">8</span>' +
                  '<span class="sc-badge sc-badge--pill sc-badge--destructive">99</span>' +
                  '<span class="sc-badge sc-badge--pill sc-badge--outline">20+</span>' +
                '</div></div>' },

        { id: 'avatar', name: 'Avatar', docs: DOCS + 'avatar',
          oneline: 'An image element with a fallback for representing the user.',
          demo: '<div class="bx-row" style="gap:24px">' +
                  '<span class="sc-avatar" style="background:linear-gradient(135deg,#21A4D7,#8B57C7);color:#fff">CN</span>' +
                  '<span class="sc-avatar sc-avatar--sq" style="background:#18181b;color:#fafafa">ER</span>' +
                  '<span class="sc-avatar-group">' +
                    '<span class="sc-avatar" style="background:#fde68a">JS</span>' +
                    '<span class="sc-avatar" style="background:#bfdbfe">PK</span>' +
                    '<span class="sc-avatar" style="background:#fbcfe8">AR</span>' +
                    '<span class="sc-avatar">+3</span>' +
                  '</span>' +
                  '<span class="sc-avatar sc-avatar--lg">' + ic('user') + '</span>' +
                '</div>' },

        { id: 'table', name: 'Table', docs: DOCS + 'table', wide: true,
          oneline: 'A responsive table component — the base of the Data Table.',
          demo: '<div class="sc-table-wrap" style="max-width:640px"><table class="sc-table">' +
                  '<caption>A list of your recent invoices.</caption>' +
                  '<thead><tr><th>Invoice</th><th>Status</th><th>Method</th><th class="num">Amount</th></tr></thead>' +
                  '<tbody>' +
                    '<tr><td style="font-weight:500">INV001</td><td><span class="sc-badge sc-badge--outline">Paid</span></td><td>Credit Card</td><td class="num">$250.00</td></tr>' +
                    '<tr><td style="font-weight:500">INV002</td><td><span class="sc-badge sc-badge--secondary">Pending</span></td><td>PayPal</td><td class="num">$150.00</td></tr>' +
                    '<tr><td style="font-weight:500">INV003</td><td><span class="sc-badge sc-badge--destructive">Unpaid</span></td><td>Bank Transfer</td><td class="num">$350.00</td></tr>' +
                    '<tr><td style="font-weight:500">INV004</td><td><span class="sc-badge sc-badge--outline">Paid</span></td><td>Credit Card</td><td class="num">$450.00</td></tr>' +
                  '</tbody>' +
                  '<tfoot><tr><td colspan="3">Total</td><td class="num">$1,200.00</td></tr></tfoot>' +
                '</table></div>' },

        { id: 'separator', name: 'Separator', docs: DOCS + 'separator',
          oneline: 'Visually or semantically separates content.',
          demo: '<div style="width:100%;max-width:300px;text-align:left">' +
                  '<div style="font-weight:500">Radix Primitives</div>' +
                  '<div class="sc-hint">An open-source UI component library.</div>' +
                  '<hr class="sc-sep" style="margin:16px 0" />' +
                  '<div class="bx-row" style="justify-content:flex-start;gap:16px;height:20px">' +
                    '<span>Blog</span><span class="sc-sep sc-sep--v"></span><span>Docs</span><span class="sc-sep sc-sep--v"></span><span>Source</span>' +
                  '</div>' +
                '</div>' },

        { id: 'skeleton', name: 'Skeleton', docs: DOCS + 'skeleton',
          oneline: 'Use to show a placeholder while content is loading.',
          demo: '<div class="bx-col">' +
                  '<div class="bx-row" style="gap:16px"><div class="sc-skel" style="width:48px;height:48px;border-radius:50%"></div>' +
                  '<div style="display:flex;flex-direction:column;gap:8px"><div class="sc-skel" style="width:220px;height:16px"></div><div class="sc-skel" style="width:180px;height:16px"></div></div></div>' +
                  '<div style="display:flex;flex-direction:column;gap:12px"><div class="sc-skel" style="width:290px;height:110px;border-radius:12px"></div></div>' +
                '</div>' },

        { id: 'progress', name: 'Progress', docs: DOCS + 'progress',
          oneline: 'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
          demo: '<div class="bx-col">' +
                  '<div class="sc-progress" role="progressbar" aria-valuenow="66" aria-valuemin="0" aria-valuemax="100"><span style="width:66%"></span></div>' +
                  '<div class="sc-progress" role="progressbar" aria-valuenow="25" style="max-width:200px"><span style="width:25%"></span></div>' +
                '</div>' },

        { id: 'aspect-ratio', name: 'Aspect Ratio', docs: DOCS + 'aspect-ratio',
          oneline: 'Displays content within a desired ratio.',
          demo: '<div class="sc-aspect"><svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-label="16 by 9 image">' +
                  '<defs><linearGradient id="sc-ar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#21A4D7"/><stop offset="1" stop-color="#8B57C7"/></linearGradient></defs>' +
                  '<rect width="160" height="90" fill="url(#sc-ar)"/><path d="M0 70 40 40l30 22 28-30 62 58H0Z" fill="rgba(255,255,255,.28)"/><circle cx="122" cy="24" r="10" fill="rgba(255,255,255,.6)"/>' +
                  '<text x="8" y="84" font-size="7" font-family="JetBrains Mono,monospace" fill="#fff">16 : 9</text></svg></div>' },

        { id: 'typography', name: 'Typography', docs: 'https://ui.shadcn.com/docs/components/typography',
          oneline: 'Styles for headings, paragraphs, lists and inline code — utility classes, not a component.',
          demo: '<div class="sc-typo">' +
                  '<h3>The King\'s Plan</h3>' +
                  '<p class="lead">A modal dialog that interrupts the user with important content.</p>' +
                  '<blockquote>"After all," he said, "everyone enjoys a good joke."</blockquote>' +
                  '<p>Install it with <code>npx shadcn add button</code>, then import it.</p>' +
                  '<p class="muted">Enter your email address.</p>' +
                '</div>' },

        { id: 'kbd', name: 'Kbd', docs: DOCS + 'kbd',
          oneline: 'Displays a keyboard key or a combination of keys.',
          demo: '<div class="bx-col">' +
                  '<div class="bx-row"><span class="sc-kbd">⌘</span><span class="sc-kbd">⇧</span><span class="sc-kbd">⌥</span><span class="sc-kbd">⌃</span></div>' +
                  '<div class="bx-row" style="gap:4px;font-size:14px;color:var(--sc-muted-foreground)">Use <span class="sc-kbd">Ctrl</span> + <span class="sc-kbd">B</span> to toggle the sidebar</div>' +
                '</div>' }
      ] },

    /* ═════════════════════════ NAVIGATION ═════════════════════════ */
    { id: 'navigation', title: 'Navigation', desc: 'Moving between views, pages and sections.',
      items: [
        { id: 'tabs', name: 'Tabs', docs: DOCS + 'tabs',
          oneline: 'A set of layered sections of content — known as tab panels — that are displayed one at a time.',
          stage: 'bx-card__stage--top',
          demo: '<div class="sc-tabs">' +
                  '<div class="sc-tabs__list" role="tablist" data-tabs>' +
                    '<button class="sc-tabs__trigger" role="tab" aria-selected="true" aria-controls="sc-tab-a" type="button">Account</button>' +
                    '<button class="sc-tabs__trigger" role="tab" aria-selected="false" aria-controls="sc-tab-b" type="button">Password</button>' +
                  '</div>' +
                  '<div class="sc-card sc-tabs__panel" id="sc-tab-a" role="tabpanel" style="max-width:none">' +
                    '<div class="sc-card__header"><h4 class="sc-card__title">Account</h4><p class="sc-card__desc">Make changes to your account here.</p></div>' +
                    '<div class="sc-card__content"><div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-tn">Name</label><input class="sc-input" id="sc-tn" value="Pedro Duarte" /></div></div>' +
                    '<div class="sc-card__footer"><button class="sc-btn" type="button">Save changes</button></div>' +
                  '</div>' +
                  '<div class="sc-card sc-tabs__panel" id="sc-tab-b" role="tabpanel" style="max-width:none" hidden>' +
                    '<div class="sc-card__header"><h4 class="sc-card__title">Password</h4><p class="sc-card__desc">Change your password here.</p></div>' +
                    '<div class="sc-card__content"><div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-tp">New password</label><input class="sc-input" id="sc-tp" type="password" /></div></div>' +
                    '<div class="sc-card__footer"><button class="sc-btn" type="button">Save password</button></div>' +
                  '</div>' +
                '</div>' },

        { id: 'breadcrumb', name: 'Breadcrumb', docs: DOCS + 'breadcrumb',
          oneline: 'Displays the path to the current resource using a hierarchy of links.',
          demo: '<nav aria-label="Breadcrumb"><ol class="sc-breadcrumb">' +
                  '<li><a href="#breadcrumb">Home</a></li><li aria-hidden="true">' + ic('chevRight') + '</li>' +
                  '<li>' + ic('more') + '</li><li aria-hidden="true">' + ic('chevRight') + '</li>' +
                  '<li><a href="#breadcrumb">Components</a></li><li aria-hidden="true">' + ic('chevRight') + '</li>' +
                  '<li><span aria-current="page">Breadcrumb</span></li>' +
                '</ol></nav>' },

        { id: 'pagination', name: 'Pagination', docs: DOCS + 'pagination',
          oneline: 'Pagination with page navigation, next and previous links.',
          demo: '<nav class="sc-pagination" aria-label="Pagination" data-press-group>' +
                  '<button class="sc-btn sc-btn--ghost" type="button">' + ic('chevLeft') + 'Previous</button>' +
                  '<button class="sc-btn sc-btn--ghost sc-btn--icon" type="button">1</button>' +
                  '<button class="sc-btn sc-btn--ghost sc-btn--icon is-active" type="button" aria-current="page">2</button>' +
                  '<button class="sc-btn sc-btn--ghost sc-btn--icon" type="button">3</button>' +
                  '<span class="sc-pagination__ellipsis">…</span>' +
                  '<button class="sc-btn sc-btn--ghost" type="button">Next' + ic('chevRight') + '</button>' +
                '</nav>' },

        { id: 'navigation-menu', name: 'Navigation Menu', docs: DOCS + 'navigation-menu',
          oneline: 'A collection of links for navigating websites.',
          stage: 'bx-card__stage--top',
          demo: '<div style="width:100%;min-height:230px;display:flex;justify-content:center"><div class="sc-navmenu">' +
                  '<button class="sc-navmenu__trigger is-open" type="button">Getting started' + ic('chevDown') + '</button>' +
                  '<button class="sc-navmenu__trigger" type="button">Components' + ic('chevDown') + '</button>' +
                  '<button class="sc-navmenu__trigger" type="button">Docs</button>' +
                  '<div class="sc-navmenu__panel">' +
                    '<a class="sc-navmenu__link" href="#navigation-menu"><strong>Introduction</strong><span>Re-usable components built using Radix UI and Tailwind CSS.</span></a>' +
                    '<a class="sc-navmenu__link" href="#navigation-menu"><strong>Installation</strong><span>How to install dependencies and structure your app.</span></a>' +
                    '<a class="sc-navmenu__link" href="#navigation-menu"><strong>Typography</strong><span>Styles for headings, paragraphs, lists…etc</span></a>' +
                    '<a class="sc-navmenu__link" href="#navigation-menu"><strong>Theming</strong><span>Using CSS variables to theme your components.</span></a>' +
                  '</div>' +
                '</div></div>' },

        { id: 'menubar', name: 'Menubar', docs: DOCS + 'menubar',
          oneline: 'A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.',
          stage: 'bx-card__stage--top',
          demo: '<div style="width:100%;min-height:240px;display:flex;justify-content:center"><div class="sc-menubar-wrap">' +
                  '<div class="sc-menubar" role="menubar">' +
                    '<button class="sc-menubar__trigger is-open" type="button">File</button><button class="sc-menubar__trigger" type="button">Edit</button>' +
                    '<button class="sc-menubar__trigger" type="button">View</button><button class="sc-menubar__trigger" type="button">Profiles</button>' +
                  '</div>' +
                  '<div class="sc-menu" role="menu">' +
                    '<div class="sc-menu__item is-hl">New Tab<span class="sc-menu__short">⌘T</span></div>' +
                    '<div class="sc-menu__item">New Window<span class="sc-menu__short">⌘N</span></div>' +
                    '<div class="sc-menu__item" style="opacity:.5">New Incognito Window</div>' +
                    '<div class="sc-menu__sep"></div>' +
                    '<div class="sc-menu__item">Share' + '<span class="sc-menu__short">' + ic('chevRight') + '</span></div>' +
                    '<div class="sc-menu__sep"></div>' +
                    '<div class="sc-menu__item">Print…<span class="sc-menu__short">⌘P</span></div>' +
                  '</div>' +
                '</div></div>' }
      ] },

    /* ═════════════════════════ OVERLAYS ═════════════════════════ */
    { id: 'overlays', title: 'Overlays', desc: 'Surfaces that sit above the page — modal, anchored, or sliding in from an edge.',
      items: [
        { id: 'dialog', name: 'Dialog', docs: DOCS + 'dialog',
          oneline: 'A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.',
          stage: 'bx-card__stage--flush',
          demo: BACKDROP + '<div class="sc-scrim"></div><div style="padding:32px 20px;width:100%;display:flex;justify-content:center"><div class="sc-dialog" role="dialog" aria-label="Edit profile">' +
                  '<button class="sc-dialog__close" type="button" aria-label="Close">' + ic('x') + '</button>' +
                  '<div><h4 class="sc-dialog__title">Edit profile</h4><p class="sc-dialog__desc">Make changes to your profile here. Click save when you\'re done.</p></div>' +
                  '<div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-dl-n">Name</label><input class="sc-input" id="sc-dl-n" value="Pedro Duarte" /></div>' +
                  '<div class="sc-dialog__footer"><button class="sc-btn sc-btn--outline" type="button">Cancel</button><button class="sc-btn" type="button">Save changes</button></div>' +
                '</div></div>' },

        { id: 'alert-dialog', name: 'Alert Dialog', docs: DOCS + 'alert-dialog',
          oneline: 'A modal dialog that interrupts the user with important content and expects a response.',
          stage: 'bx-card__stage--flush',
          demo: BACKDROP + '<div class="sc-scrim"></div><div style="padding:32px 20px;width:100%;display:flex;justify-content:center"><div class="sc-dialog" role="alertdialog" aria-label="Are you absolutely sure?">' +
                  '<div><h4 class="sc-dialog__title">Are you absolutely sure?</h4><p class="sc-dialog__desc">This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p></div>' +
                  '<div class="sc-dialog__footer"><button class="sc-btn sc-btn--outline" type="button">Cancel</button><button class="sc-btn" type="button">Continue</button></div>' +
                '</div></div>' },

        { id: 'sheet', name: 'Sheet', docs: DOCS + 'sheet',
          oneline: 'Extends the Dialog component to display content that complements the main content of the screen.',
          stage: 'bx-card__stage--flush',
          demo: '<div style="min-height:300px;width:100%"></div>' + BACKDROP + '<div class="sc-scrim"></div>' +
                '<div class="sc-sheet" role="dialog" aria-label="Edit profile">' +
                  '<button class="sc-dialog__close" type="button" aria-label="Close">' + ic('x') + '</button>' +
                  '<div><h4 class="sc-dialog__title">Edit profile</h4><p class="sc-dialog__desc">Make changes to your profile here.</p></div>' +
                  '<div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-sh-n">Name</label><input class="sc-input" id="sc-sh-n" value="Pedro Duarte" /></div>' +
                  '<div class="sc-field" style="max-width:none"><label class="sc-label" for="sc-sh-u">Username</label><input class="sc-input" id="sc-sh-u" value="@peduarte" /></div>' +
                  '<div class="sc-sheet__footer"><button class="sc-btn" type="button">Save changes</button><button class="sc-btn sc-btn--outline" type="button">Close</button></div>' +
                '</div>' },

        { id: 'drawer', name: 'Drawer', docs: DOCS + 'drawer',
          oneline: 'A drawer component for React, built on Vaul — slides up from the bottom edge.',
          stage: 'bx-card__stage--flush',
          demo: '<div style="min-height:300px;width:100%"></div>' + BACKDROP + '<div class="sc-scrim"></div>' +
                '<div class="sc-drawer" role="dialog" aria-label="Move goal">' +
                  '<div class="sc-drawer__handle"></div>' +
                  '<div class="sc-drawer__body">' +
                    '<div><h4 class="sc-dialog__title" style="font-size:16px">Move Goal</h4><p class="sc-dialog__desc">Set your daily activity goal.</p></div>' +
                    '<div class="sc-drawer__stepper">' +
                      '<button class="sc-btn sc-btn--outline sc-btn--icon" type="button" style="border-radius:50%" aria-label="Decrease">' + ic('minus') + '</button>' +
                      '<div><div class="sc-drawer__value">350</div><div class="sc-hint" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Calories/day</div></div>' +
                      '<button class="sc-btn sc-btn--outline sc-btn--icon" type="button" style="border-radius:50%" aria-label="Increase">' + ic('plus') + '</button>' +
                    '</div>' +
                    '<button class="sc-btn sc-btn--block" type="button">Submit</button>' +
                  '</div>' +
                '</div>' },

        { id: 'popover', name: 'Popover', docs: DOCS + 'popover',
          oneline: 'Displays rich content in a portal, triggered by a button.',
          stage: 'bx-card__stage--top',
          demo: '<div style="min-height:260px;display:flex;justify-content:center"><div class="sc-anchor">' +
                  '<button class="sc-btn sc-btn--outline" type="button" aria-expanded="true">Open popover</button>' +
                  '<div class="sc-popover" role="dialog" aria-label="Dimensions">' +
                    '<div><div style="font-weight:500;line-height:1">Dimensions</div><div class="sc-hint" style="margin-top:6px">Set the dimensions for the layer.</div></div>' +
                    '<div class="sc-popover__row"><label class="sc-label" for="sc-pw">Width</label><input class="sc-input" id="sc-pw" value="100%" /></div>' +
                    '<div class="sc-popover__row"><label class="sc-label" for="sc-pmw">Max. width</label><input class="sc-input" id="sc-pmw" value="300px" /></div>' +
                    '<div class="sc-popover__row"><label class="sc-label" for="sc-ph">Height</label><input class="sc-input" id="sc-ph" value="25px" /></div>' +
                  '</div>' +
                '</div></div>' },

        { id: 'tooltip', name: 'Tooltip', docs: DOCS + 'tooltip',
          oneline: 'A popup that displays information related to an element when it receives keyboard focus or the mouse hovers over it.',
          demo: '<div class="sc-anchor" style="margin-top:32px">' +
                  '<span class="sc-tooltip" role="tooltip">Add to library</span>' +
                  '<button class="sc-btn sc-btn--outline" type="button">Hover</button>' +
                '</div>' },

        { id: 'hover-card', name: 'Hover Card', docs: DOCS + 'hover-card',
          oneline: 'For sighted users to preview content available behind a link.',
          stage: 'bx-card__stage--top',
          demo: '<div style="min-height:180px;display:flex;justify-content:center"><div class="sc-anchor">' +
                  '<button class="sc-btn sc-btn--link" type="button">@nextjs</button>' +
                  '<div class="sc-hovercard">' +
                    '<span class="sc-avatar sc-avatar--lg" style="background:#09090b;color:#fff;font-weight:700">N</span>' +
                    '<div><h4>@nextjs</h4><p>The React Framework – created and maintained by @vercel.</p><small>' + ic('calendar') + 'Joined December 2021</small></div>' +
                  '</div>' +
                '</div></div>' },

        { id: 'dropdown-menu', name: 'Dropdown Menu', docs: DOCS + 'dropdown-menu',
          oneline: 'Displays a menu to the user — such as a set of actions or functions — triggered by a button.',
          stage: 'bx-card__stage--top',
          demo: '<div style="display:flex;flex-direction:column;align-items:center;gap:6px">' +
                  '<button class="sc-btn sc-btn--outline" type="button" aria-expanded="true">Open' + ic('chevDown') + '</button>' +
                  '<div class="sc-menu" role="menu">' +
                    '<div class="sc-menu__label">My Account</div><div class="sc-menu__sep"></div>' +
                    '<div class="sc-menu__item is-hl">' + ic('user') + 'Profile<span class="sc-menu__short">⇧⌘P</span></div>' +
                    '<div class="sc-menu__item">' + ic('card') + 'Billing<span class="sc-menu__short">⌘B</span></div>' +
                    '<div class="sc-menu__item">' + ic('settings') + 'Settings<span class="sc-menu__short">⌘S</span></div>' +
                    '<div class="sc-menu__sep"></div>' +
                    '<div class="sc-menu__item sc-menu__item--destructive">' + ic('logout') + 'Log out<span class="sc-menu__short">⇧⌘Q</span></div>' +
                  '</div>' +
                '</div>' }
      ] },

    /* ═════════════════════ FEEDBACK & DISCLOSURE ═════════════════════ */
    { id: 'feedback', title: 'Feedback & Disclosure', desc: 'Telling the user what happened, and revealing content on demand.',
      items: [
        { id: 'alert', name: 'Alert', docs: DOCS + 'alert',
          oneline: 'Displays a callout for user attention.',
          demo: '<div class="bx-col">' +
                  '<div class="sc-alert" role="alert">' + ic('terminal') + '<div class="sc-alert__title">Heads up!</div><div class="sc-alert__desc">You can add components to your app using the cli.</div></div>' +
                  '<div class="sc-alert sc-alert--destructive" role="alert">' + ic('alert') + '<div class="sc-alert__title">Unable to process your payment.</div><div class="sc-alert__desc">Please verify your billing information and try again.</div></div>' +
                '</div>' },

        { id: 'sonner', name: 'Toast (Sonner)', docs: DOCS + 'sonner',
          oneline: 'An opinionated toast component. Click the button to push a new toast onto the stack.',
          stage: 'bx-card__stage--flush',
          demo: '<div style="min-height:260px;width:100%;display:flex;align-items:flex-start;justify-content:center;padding-top:40px">' +
                  '<button class="sc-btn sc-btn--outline" type="button" data-toast>Show Toast</button>' +
                '</div>' +
                '<div class="sc-toaster" data-toaster>' +
                  '<div class="sc-toast"><div class="sc-toast__body"><div class="sc-toast__title">Settings saved</div></div></div>' +
                  '<div class="sc-toast"><div class="sc-toast__body"><div class="sc-toast__title">Profile updated</div></div></div>' +
                  '<div class="sc-toast"><div class="sc-toast__body"><div class="sc-toast__title">Event has been created</div><div class="sc-toast__desc">Sunday, December 03, 2026 at 9:00 AM</div></div><button class="sc-btn" type="button">Undo</button></div>' +
                '</div>' },

        { id: 'accordion', name: 'Accordion', docs: DOCS + 'accordion',
          oneline: 'A vertically stacked set of interactive headings that each reveal a section of content.',
          stage: 'bx-card__stage--top',
          demo: '<div class="sc-accordion">' +
                  '<details open><summary>Is it accessible?' + ic('chevDown') + '</summary><div class="sc-accordion__content">Yes. It adheres to the WAI-ARIA design pattern.</div></details>' +
                  '<details><summary>Is it styled?' + ic('chevDown') + '</summary><div class="sc-accordion__content">Yes. It comes with default styles that match the other components\' aesthetic.</div></details>' +
                  '<details><summary>Is it animated?' + ic('chevDown') + '</summary><div class="sc-accordion__content">Yes. It\'s animated by default, but you can disable it if you prefer.</div></details>' +
                '</div>' },

        { id: 'collapsible', name: 'Collapsible', docs: DOCS + 'collapsible',
          oneline: 'An interactive component which expands and collapses a panel.',
          stage: 'bx-card__stage--top',
          demo: '<div class="sc-collapsible"><details open>' +
                  '<summary><h4>@peduarte starred 3 repositories</h4><span class="sc-btn sc-btn--ghost sc-btn--icon sc-btn--sm">' + ic('chevsUpDown') + '</span></summary>' +
                  '<div class="sc-collapsible__item" style="margin-top:8px">@radix-ui/primitives</div>' +
                  '<div class="sc-collapsible__list"><div class="sc-collapsible__item">@radix-ui/colors</div><div class="sc-collapsible__item">@stitches/react</div></div>' +
                '</details></div>' },

        { id: 'scroll-area', name: 'Scroll Area', docs: DOCS + 'scroll-area',
          oneline: 'Augments native scroll functionality for custom, cross-browser styling.',
          demo: '<div class="sc-scroll" tabindex="0"><h4>Tags</h4>' + tags + '</div>' },

        { id: 'command', name: 'Command', docs: DOCS + 'command',
          oneline: 'Fast, composable, unstyled command menu for React.',
          demo: '<div class="sc-command">' +
                  '<div class="sc-command__search">' + ic('search') + '<input type="text" placeholder="Type a command or search..." aria-label="Command" /></div>' +
                  '<div class="sc-command__list">' +
                    '<div class="sc-command__heading">Suggestions</div>' +
                    '<div class="sc-menu__item is-hl">' + ic('calendar') + 'Calendar</div>' +
                    '<div class="sc-menu__item">' + ic('smile') + 'Search Emoji</div>' +
                    '<div class="sc-menu__item" style="opacity:.5">' + ic('calc') + 'Calculator</div>' +
                    '<div class="sc-menu__sep"></div>' +
                    '<div class="sc-command__heading">Settings</div>' +
                    '<div class="sc-menu__item">' + ic('user') + 'Profile<span class="sc-menu__short">⌘P</span></div>' +
                    '<div class="sc-menu__item">' + ic('card') + 'Billing<span class="sc-menu__short">⌘B</span></div>' +
                    '<div class="sc-menu__item">' + ic('settings') + 'Settings<span class="sc-menu__short">⌘S</span></div>' +
                  '</div>' +
                '</div>' }
      ] }
  ];

  window.BasicsSet = {
    family: 'ShadCN',
    title: 'Basic Components',
    lede: 'The ShadCN base set — buttons, inputs, cards and the other foundational building blocks every Nucleux agentic component is composed from. Each one below is live: type in the inputs, flip the switches, drag the sliders.',
    source: { label: 'ui.shadcn.com/docs/components', href: 'https://ui.shadcn.com/docs/components' },
    root: 'sc-root',
    stageClass: '',
    groups: groups,
    extras: [
      { label: 'Agentic components', href: 'library.html' },
      { label: 'Material 3.0 basics', href: 'material-basic.html' },
      { label: 'Contact', href: 'contact.html' }
    ]
  };
})();
