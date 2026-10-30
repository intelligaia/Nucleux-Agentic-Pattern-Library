/* ============================================================
   MATERIAL 3.0 — BASIC COMPONENTS (data)

   The Material 3 base components shown on material-basic.html, in
   the six groups m3.material.io itself files them under: Actions,
   Communication, Containment, Navigation, Selection, Text inputs.
   Each `demo` is the component in plain HTML, styled by
   material-basics.css on --md-sys-* tokens; the Code tab's source is in
   basics-material-code.js; `docs` points at the component's spec page.

   Overlays (dialog, sheets, menus, tooltips) are drawn open inside
   the card — a gallery that makes the reader click to see a
   component is a gallery of buttons.

   basics.js renders this; see its header for the data shape.
   ============================================================ */
(function () {
  'use strict';

  function ms(name, extra) {
    return '<span class="msym' + (extra ? ' ' + extra : '') + '" aria-hidden="true">' + name + '</span>';
  }

  var DOCS = 'https://m3.material.io/components/';

  var BACKDROP = '<div class="m3b-backdrop" aria-hidden="true">' +
    '<div class="m3b-bar" style="width:45%;height:14px"></div>' +
    '<div class="m3b-bar" style="width:88%"></div><div class="m3b-bar" style="width:72%"></div>' +
    '<div class="m3b-bar" style="width:80%"></div><div class="m3b-bar" style="width:60%"></div>' +
    '<div class="m3b-bar" style="width:84%"></div><div class="m3b-bar" style="width:50%"></div>' +
  '</div>';

  /* December 2026 starts on a Tuesday. */
  function dateGrid() {
    var cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (d) { return '<div class="m3b-date__dow">' + d + '</div>'; }).join('');
    cells += '<span class="m3b-date__day is-out"></span><span class="m3b-date__day is-out"></span>';
    for (var d = 1; d <= 31; d++) {
      var cls = d === 17 ? ' is-sel' : d === 9 ? ' is-today' : '';
      cells += '<button class="m3b-date__day' + cls + '" type="button">' + d + '</button>';
    }
    return cells;
  }

  /* A clock dial: twelve numbers on a 104px ring, hand on 7. */
  function dial() {
    var out = '', R = 104, C = 128;
    for (var h = 1; h <= 12; h++) {
      var a = (h / 12) * 2 * Math.PI - Math.PI / 2;
      var x = C + R * Math.cos(a), y = C + R * Math.sin(a);
      out += '<span class="m3b-time__num' + (h === 7 ? ' is-sel' : '') + '" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px">' + h + '</span>';
    }
    var ang = (7 / 12) * 360 - 90;
    return out + '<span class="m3b-time__hand" style="width:' + (R - 24) + 'px;transform:rotate(' + ang + 'deg)"></span><span class="m3b-time__center"></span>';
  }

  var NAV = [['home', 'Home'], ['explore', 'Explore'], ['inbox', 'Inbox'], ['person', 'Profile']];
  function navItems(cur, badge) {
    return NAV.map(function (n, i) {
      var b = i === 2 && badge ? '<span class="m3b-badge">3</span>' : i === 1 && badge ? '<span class="m3b-badge m3b-badge--small"></span>' : '';
      return '<button class="m3b-navbar__item" type="button" data-nav' + (i === cur ? ' aria-current="page"' : '') + '>' +
               '<span class="m3b-navbar__pill">' + ms(n[0]) + b + '</span>' +
               '<span class="m3b-navbar__label">' + n[1] + '</span>' +
             '</button>';
    }).join('');
  }

  var groups = [
    /* ═════════════════════════ ACTIONS ═════════════════════════ */
    { id: 'actions', title: 'Actions', desc: 'Buttons in every emphasis, from the one primary action on a screen to a quiet icon.',
      items: [
        { id: 'buttons', name: 'Common buttons', docs: DOCS + 'buttons/overview',
          oneline: 'Buttons let people take action with a tap. Five styles — filled, tonal, elevated, outlined and text — in descending emphasis.',
          demo: '<div class="bx-col">' +
                  '<div class="bx-row">' +
                    '<button class="m3b-btn m3b-btn--filled" type="button">Filled</button>' +
                    '<button class="m3b-btn m3b-btn--tonal" type="button">Tonal</button>' +
                    '<button class="m3b-btn m3b-btn--elevated" type="button">Elevated</button>' +
                  '</div>' +
                  '<div class="bx-row">' +
                    '<button class="m3b-btn m3b-btn--outlined" type="button">Outlined</button>' +
                    '<button class="m3b-btn m3b-btn--text" type="button">Text</button>' +
                  '</div>' +
                  '<div class="bx-row">' +
                    '<button class="m3b-btn m3b-btn--filled" type="button">' + ms('send') + 'Send</button>' +
                    '<button class="m3b-btn m3b-btn--outlined" type="button">' + ms('upload') + 'Upload</button>' +
                    '<button class="m3b-btn m3b-btn--filled" type="button" disabled>Disabled</button>' +
                  '</div>' +
                '</div>' },

        { id: 'fab', name: 'Floating action button', docs: DOCS + 'floating-action-button/overview',
          oneline: 'The most important action on a screen. Small, standard and large sizes, in the primary, secondary, tertiary and surface colour roles.',
          demo: '<div class="bx-row" style="gap:20px;align-items:center">' +
                  '<button class="m3b-fab m3b-fab--small" type="button" aria-label="Add">' + ms('add') + '</button>' +
                  '<button class="m3b-fab" type="button" aria-label="Edit">' + ms('edit') + '</button>' +
                  '<button class="m3b-fab m3b-fab--secondary" type="button" aria-label="Navigate">' + ms('navigation') + '</button>' +
                  '<button class="m3b-fab m3b-fab--tertiary" type="button" aria-label="Star">' + ms('star') + '</button>' +
                  '<button class="m3b-fab m3b-fab--large m3b-fab--surface" type="button" aria-label="Create">' + ms('add') + '</button>' +
                '</div>' },

        { id: 'extended-fab', name: 'Extended FAB', docs: DOCS + 'extended-fab/overview',
          oneline: 'A FAB with a text label — for when the action needs saying, not just showing.',
          demo: '<div class="bx-col">' +
                  '<button class="m3b-fab m3b-fab--ext" type="button">' + ms('edit') + 'Compose</button>' +
                  '<div class="bx-row" style="gap:16px">' +
                    '<button class="m3b-fab m3b-fab--ext m3b-fab--secondary" type="button">' + ms('navigation') + 'Navigate</button>' +
                    '<button class="m3b-fab m3b-fab--ext m3b-fab--surface" type="button">' + ms('add') + 'New chat</button>' +
                  '</div>' +
                '</div>' },

        { id: 'icon-buttons', name: 'Icon buttons', docs: DOCS + 'icon-buttons/overview',
          oneline: 'Compact buttons for supplementary actions. Standard, filled, tonal and outlined — each can also toggle on and off (click them).',
          demo: '<div class="bx-col">' +
                  '<div class="bx-row" style="gap:12px">' +
                    '<button class="m3b-icon-btn" type="button" aria-label="Settings">' + ms('settings') + '</button>' +
                    '<button class="m3b-icon-btn m3b-icon-btn--filled" type="button" aria-label="Add">' + ms('add') + '</button>' +
                    '<button class="m3b-icon-btn m3b-icon-btn--tonal" type="button" aria-label="Share">' + ms('share') + '</button>' +
                    '<button class="m3b-icon-btn m3b-icon-btn--outlined" type="button" aria-label="Delete">' + ms('delete') + '</button>' +
                  '</div>' +
                  '<div class="bx-row" style="gap:12px">' +
                    '<button class="m3b-icon-btn" type="button" data-press aria-pressed="true" aria-label="Favorite" style="color:var(--md-sys-color-primary)">' + ms('favorite') + '</button>' +
                    '<button class="m3b-icon-btn m3b-icon-btn--filled" type="button" data-press aria-pressed="false" aria-label="Bookmark">' + ms('bookmark') + '</button>' +
                    '<button class="m3b-icon-btn m3b-icon-btn--outlined" type="button" data-press aria-pressed="true" aria-label="Notifications">' + ms('notifications') + '</button>' +
                  '</div>' +
                '</div>' },

        { id: 'segmented-buttons', name: 'Segmented buttons', docs: DOCS + 'segmented-buttons/overview',
          oneline: 'Help people select options, switch views, or sort elements. Single-select or multi-select.',
          demo: '<div class="bx-col">' +
                  '<div class="m3b-seg" role="group" aria-label="Range" data-press-group>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="false">' + ms('check') + 'Day</button>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="true">' + ms('check') + 'Week</button>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="false">' + ms('check') + 'Month</button>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="false">' + ms('check') + 'Year</button>' +
                  '</div>' +
                  '<div class="m3b-seg" role="group" aria-label="Sizes" data-press-group="multi">' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="true">' + ms('check') + 'S</button>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="true">' + ms('check') + 'M</button>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="false">' + ms('check') + 'L</button>' +
                    '<button class="m3b-seg__btn" type="button" aria-pressed="false">' + ms('check') + 'XL</button>' +
                  '</div>' +
                '</div>' }
      ] },

    /* ═════════════════════════ COMMUNICATION ═════════════════════════ */
    { id: 'communication', title: 'Communication', desc: 'Status, progress and brief messages about what the system is doing.',
      items: [
        { id: 'badges', name: 'Badges', docs: DOCS + 'badges/overview',
          oneline: 'Show notifications, counts, or status information on navigation items and icons.',
          demo: '<div class="bx-row" style="gap:40px">' +
                  '<span class="m3b-badged">' + ms('notifications') + '<span class="m3b-badge m3b-badge--small" aria-label="New"></span></span>' +
                  '<span class="m3b-badged">' + ms('mail') + '<span class="m3b-badge">3</span></span>' +
                  '<span class="m3b-badged">' + ms('chat') + '<span class="m3b-badge">99</span></span>' +
                  '<span class="m3b-badged">' + ms('shopping_cart') + '<span class="m3b-badge">999+</span></span>' +
                '</div>' },

        { id: 'progress', name: 'Progress indicators', docs: DOCS + 'progress-indicators/overview',
          oneline: 'Show the status of a process in real time — linear or circular, determinate or indeterminate.',
          demo: '<div class="bx-col" style="gap:28px">' +
                  '<div class="m3b-linear" role="progressbar" aria-valuenow="60"><span class="m3b-linear__active" style="width:60%"></span><span class="m3b-linear__track"></span><span class="m3b-linear__stop"></span></div>' +
                  '<div class="m3b-linear m3b-linear--indeterminate" role="progressbar" aria-label="Loading"></div>' +
                  '<div class="bx-row" style="gap:32px">' +
                    '<svg class="m3b-circular" viewBox="0 0 48 48" role="progressbar" aria-valuenow="70"><circle class="track" cx="24" cy="24" r="20" stroke-dasharray="30 200" transform="rotate(197 24 24)"/><circle class="active" cx="24" cy="24" r="20" stroke-dasharray="84 200" transform="rotate(-90 24 24)"/></svg>' +
                    '<svg class="m3b-circular m3b-circular--spin" viewBox="0 0 48 48" role="progressbar" aria-label="Loading"><circle class="active" cx="24" cy="24" r="20" stroke-dasharray="60 200"/></svg>' +
                  '</div>' +
                '</div>' },

        { id: 'snackbar', name: 'Snackbar', docs: DOCS + 'snackbar/overview',
          oneline: 'Show short updates about app processes at the bottom of the screen, with an optional action.',
          demo: '<div class="bx-col">' +
                  '<div class="m3b-snackbar" role="status"><span class="m3b-snackbar__text">Photo has been archived</span><button class="m3b-snackbar__action" type="button">Undo</button></div>' +
                  '<div class="m3b-snackbar" role="status"><span class="m3b-snackbar__text">Can\'t send photo. Retry in 5 seconds.</span><button class="m3b-snackbar__action" type="button">Retry</button><button class="m3b-icon-btn" type="button" aria-label="Dismiss">' + ms('close', 'msym--20') + '</button></div>' +
                '</div>' },

        { id: 'tooltips', name: 'Tooltips', docs: DOCS + 'tooltips/overview',
          oneline: 'Brief labels or messages that appear on hover, focus or long-press. Plain for a label; rich for a title, text and actions.',
          stage: 'bx-card__stage--top',
          demo: '<div class="bx-row" style="gap:64px;align-items:flex-start;padding-top:34px;min-height:220px">' +
                  '<span class="m3b-anchor"><span class="m3b-tooltip" role="tooltip">Save to favorites</span><button class="m3b-icon-btn" type="button" aria-label="Favorite">' + ms('favorite') + '</button></span>' +
                  '<span class="m3b-anchor"><button class="m3b-icon-btn m3b-icon-btn--tonal" type="button" aria-label="Info">' + ms('info') + '</button>' +
                    '<span class="m3b-rich-tooltip" role="tooltip"><div class="m3b-rich-tooltip__title">Grant value is calculated using the closing stock price</div>' +
                    '<div class="m3b-rich-tooltip__text">from the day before the grant date. Amounts do not reflect tax withholdings.</div>' +
                    '<div class="m3b-rich-tooltip__actions"><button class="m3b-btn m3b-btn--text" type="button">Learn more</button></div></span>' +
                  '</span>' +
                '</div>' }
      ] },

    /* ═════════════════════════ CONTAINMENT ═════════════════════════ */
    { id: 'containment', title: 'Containment', desc: 'Surfaces that hold and group related content.',
      items: [
        { id: 'cards', name: 'Cards', docs: DOCS + 'cards/overview',
          oneline: 'Display content and actions about a single subject. Elevated, filled and outlined.',
          wide: true,
          demo: '<div class="bx-row" style="gap:20px;align-items:stretch">' +
                  '<div class="m3b-card m3b-card--elevated"><div class="m3b-card__media">' + ms('landscape') + '</div>' +
                    '<div class="m3b-card__body"><span class="m3b-card__kicker">Elevated</span><div class="m3b-card__head">Glacier hike</div><div class="m3b-card__sub">Three days across the Khumbu icefall.</div></div>' +
                    '<div class="m3b-card__actions"><button class="m3b-btn m3b-btn--outlined" type="button">Save</button><button class="m3b-btn m3b-btn--filled" type="button">Book</button></div></div>' +
                  '<div class="m3b-card m3b-card--filled"><div class="m3b-card__body"><span class="m3b-card__kicker">Filled</span><div class="m3b-card__head">Weekly summary</div><div class="m3b-card__sub">You met your step goal on 5 of 7 days. Keep the streak going.</div></div>' +
                    '<div class="m3b-card__actions" style="margin-top:auto"><button class="m3b-btn m3b-btn--text" type="button">Details</button></div></div>' +
                  '<div class="m3b-card m3b-card--outlined"><div class="m3b-card__body"><span class="m3b-card__kicker">Outlined</span><div class="m3b-card__head">Storage almost full</div><div class="m3b-card__sub">14.2 GB of 15 GB used. Free up space or upgrade.</div></div>' +
                    '<div class="m3b-card__actions" style="margin-top:auto"><button class="m3b-btn m3b-btn--tonal" type="button">Manage</button></div></div>' +
                '</div>' },

        { id: 'carousel', name: 'Carousel', docs: DOCS + 'carousel/overview',
          oneline: 'Show a collection of items that can be scrolled on and off the screen. Multi-browse layout: large, medium and small items.',
          demo: '<div class="m3b-carousel" aria-label="Destinations">' +
                  '<div class="m3b-carousel__item is-lg" style="background:linear-gradient(160deg,#6750A4,#21A4D7)"><span>Northern lights</span></div>' +
                  '<div class="m3b-carousel__item is-md" style="background:linear-gradient(160deg,#7D5260,#F2B8B5)"><span>Desert</span></div>' +
                  '<div class="m3b-carousel__item is-sm" style="background:linear-gradient(160deg,#625B71,#CCC2DC)"><span>Coast</span></div>' +
                '</div>' },

        { id: 'dialogs', name: 'Dialogs', docs: DOCS + 'dialogs/overview',
          oneline: 'Provide important prompts in a user flow. Basic dialogs sit over a scrim and ask for a decision.',
          stage: 'bx-card__stage--flush',
          demo: BACKDROP + '<div class="m3b-scrim"></div><div data-demo-wrap style="padding:32px 20px;width:100%;display:flex;justify-content:center">' +
                  '<div class="m3b-dialog m3b-dialog--hero" role="dialog" aria-label="Reset settings?">' +
                    '<span class="m3b-dialog__icon">' + ms('restart_alt') + '</span>' +
                    '<h4 class="m3b-dialog__headline">Reset settings?</h4>' +
                    '<p class="m3b-dialog__body">This will reset your app preferences back to their default settings. The following accounts will also be signed out.</p>' +
                    '<div class="m3b-dialog__actions"><button class="m3b-btn m3b-btn--text" type="button">Cancel</button><button class="m3b-btn m3b-btn--text" type="button">Accept</button></div>' +
                  '</div></div>' },

        { id: 'divider', name: 'Divider', docs: DOCS + 'divider/overview',
          oneline: 'Thin lines that group content in lists or other containers. Full-width, inset, or vertical.',
          demo: '<div style="width:100%;max-width:340px;text-align:left">' +
                  '<div class="m3b-list__headline" style="padding:8px 0">Full-width</div><hr class="m3b-divider" />' +
                  '<div class="m3b-list__headline" style="padding:8px 0 8px 56px">Inset</div><hr class="m3b-divider m3b-divider--inset" />' +
                  '<div class="bx-row" style="justify-content:flex-start;gap:16px;padding-top:16px">' +
                    '<button class="m3b-icon-btn" type="button" aria-label="Bold">' + ms('format_bold') + '</button><span class="m3b-divider m3b-divider--v"></span>' +
                    '<button class="m3b-icon-btn" type="button" aria-label="Link">' + ms('link') + '</button><span class="m3b-divider m3b-divider--v"></span>' +
                    '<button class="m3b-icon-btn" type="button" aria-label="Image">' + ms('image') + '</button>' +
                  '</div>' +
                '</div>' },

        { id: 'lists', name: 'Lists', docs: DOCS + 'lists/overview',
          oneline: 'Continuous, vertical indexes of text and images — one, two and three-line items with leading and trailing elements.',
          demo: '<ul class="m3b-list">' +
                  '<li class="m3b-list__item"><span class="m3b-list__lead">' + ms('inbox') + '</span><div class="m3b-list__text"><div class="m3b-list__headline">Inbox</div></div><span class="m3b-list__trail">24</span></li>' +
                  '<li class="m3b-list__item"><span class="m3b-list__avatar">A</span><div class="m3b-list__text"><div class="m3b-list__headline">Ali Connors</div><div class="m3b-list__supporting">Brunch this weekend?</div></div><span class="m3b-list__trail">10 min</span></li>' +
                  '<li class="m3b-list__item m3b-list__item--3"><span class="m3b-list__avatar" style="background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container)">S</span><div class="m3b-list__text"><div class="m3b-list__overline">Summer BBQ</div><div class="m3b-list__headline">Sandra Adams</div><div class="m3b-list__supporting">Wish I could come, but I\'m out of town this weekend.</div></div>' +
                    '<label class="m3b-check" style="margin:-11px -11px 0 0"><input type="checkbox" checked aria-label="Select" /></label></li>' +
                '</ul>' },

        { id: 'sheets', name: 'Bottom & side sheets', docs: DOCS + 'bottom-sheets/overview',
          oneline: 'Sheets show secondary content anchored to the bottom or the side of the screen. Modal sheets sit over a scrim.',
          stage: 'bx-card__stage--flush',
          demo: '<div style="min-height:300px;width:100%"></div>' + BACKDROP + '<div class="m3b-scrim"></div>' +
                '<div class="m3b-bottom-sheet" role="dialog" aria-label="Share">' +
                  '<div class="m3b-bottom-sheet__handle"></div>' +
                  '<ul class="m3b-list">' +
                    '<li class="m3b-list__item"><span class="m3b-list__lead">' + ms('share') + '</span><div class="m3b-list__text"><div class="m3b-list__headline">Share</div></div></li>' +
                    '<li class="m3b-list__item"><span class="m3b-list__lead">' + ms('link') + '</span><div class="m3b-list__text"><div class="m3b-list__headline">Get link</div></div></li>' +
                    '<li class="m3b-list__item"><span class="m3b-list__lead">' + ms('edit') + '</span><div class="m3b-list__text"><div class="m3b-list__headline">Edit name</div></div></li>' +
                  '</ul>' +
                '</div>' }
      ] },

    /* ═════════════════════════ NAVIGATION ═════════════════════════ */
    { id: 'navigation', title: 'Navigation', desc: 'Moving between the top-level destinations and views of an app.',
      items: [
        { id: 'navigation-bar', name: 'Navigation bar', docs: DOCS + 'navigation-bar/overview',
          oneline: 'Lets people switch between UI views on smaller devices. The active destination sits in a pill indicator (click to move it).',
          demo: '<nav class="m3b-navbar" aria-label="Primary" data-current-group>' + navItems(0, true) + '</nav>' },

        { id: 'navigation-rail', name: 'Navigation rail', docs: DOCS + 'navigation-rail/overview',
          oneline: 'Lets people switch between UI views on mid-sized devices — a vertical strip with an optional FAB at the top.',
          demo: '<div class="m3b-rail-wrap">' +
                  '<nav class="m3b-rail" aria-label="Primary" data-current-group>' +
                    '<button class="m3b-icon-btn" type="button" aria-label="Menu">' + ms('menu') + '</button>' +
                    '<button class="m3b-fab m3b-fab--tertiary m3b-rail__fab" type="button" aria-label="Compose" style="box-shadow:none">' + ms('edit') + '</button>' +
                    navItems(2, true) +
                  '</nav>' +
                  '<div class="m3b-rail__content"><div class="m3b-bar" style="width:50%;height:14px"></div><div class="m3b-bar" style="width:90%"></div><div class="m3b-bar" style="width:75%"></div><div class="m3b-bar" style="width:82%"></div></div>' +
                '</div>' },

        { id: 'navigation-drawer', name: 'Navigation drawer', docs: DOCS + 'navigation-drawer/overview',
          oneline: 'Lets people switch between UI views on larger devices, with room for labels, counts and section headlines.',
          demo: '<nav class="m3b-drawer" aria-label="Mail" data-current-group>' +
                  '<div class="m3b-drawer__headline">Mail</div>' +
                  '<a class="m3b-drawer__item" href="#navigation-drawer" data-nav aria-current="page">' + ms('inbox') + 'Inbox<span class="m3b-drawer__badge">24</span></a>' +
                  '<a class="m3b-drawer__item" href="#navigation-drawer" data-nav>' + ms('send') + 'Outbox</a>' +
                  '<a class="m3b-drawer__item" href="#navigation-drawer" data-nav>' + ms('favorite') + 'Favorites</a>' +
                  '<a class="m3b-drawer__item" href="#navigation-drawer" data-nav>' + ms('delete') + 'Trash</a>' +
                  '<hr class="m3b-divider" />' +
                  '<div class="m3b-drawer__headline">Labels</div>' +
                  '<a class="m3b-drawer__item" href="#navigation-drawer" data-nav>' + ms('bookmark') + 'Family</a>' +
                '</nav>' },

        { id: 'tabs', name: 'Tabs', docs: DOCS + 'tabs/overview',
          oneline: 'Organize content across different screens and views. Primary tabs carry icons and a short indicator; secondary tabs a full-width one.',
          stage: 'bx-card__stage--top',
          demo: '<div class="bx-col" style="gap:24px">' +
                  '<div class="m3b-tabs">' +
                    '<div class="m3b-tabs__list" role="tablist" data-tabs>' +
                      '<button class="m3b-tabs__tab m3b-tabs__tab--icon" role="tab" aria-selected="true" aria-controls="m3-tab-v" type="button">' + ms('videocam') + 'Video</button>' +
                      '<button class="m3b-tabs__tab m3b-tabs__tab--icon" role="tab" aria-selected="false" aria-controls="m3-tab-p" type="button">' + ms('photo') + 'Photos</button>' +
                      '<button class="m3b-tabs__tab m3b-tabs__tab--icon" role="tab" aria-selected="false" aria-controls="m3-tab-a" type="button">' + ms('headphones') + 'Audio</button>' +
                    '</div>' +
                    '<div class="m3b-tabs__panel" id="m3-tab-v" role="tabpanel">12 videos from this week.</div>' +
                    '<div class="m3b-tabs__panel" id="m3-tab-p" role="tabpanel" hidden>348 photos, 3 albums.</div>' +
                    '<div class="m3b-tabs__panel" id="m3-tab-a" role="tabpanel" hidden>No recordings yet.</div>' +
                  '</div>' +
                  '<div class="m3b-tabs m3b-tabs--secondary">' +
                    '<div class="m3b-tabs__list" role="tablist" data-tabs>' +
                      '<button class="m3b-tabs__tab" role="tab" aria-selected="true" aria-controls="m3-tab-o" type="button">Overview</button>' +
                      '<button class="m3b-tabs__tab" role="tab" aria-selected="false" aria-controls="m3-tab-s" type="button">Specifications</button>' +
                    '</div>' +
                    '<div class="m3b-tabs__panel" id="m3-tab-o" role="tabpanel" hidden></div>' +
                    '<div class="m3b-tabs__panel" id="m3-tab-s" role="tabpanel" hidden></div>' +
                  '</div>' +
                '</div>' },

        { id: 'top-app-bar', name: 'Top app bar', docs: DOCS + 'top-app-bar/overview',
          oneline: 'Displays navigation, actions and text at the top of a screen. Small, center-aligned and medium; tints to surface-container on scroll.',
          demo: '<div class="bx-col">' +
                  '<header class="m3b-appbar"><button class="m3b-icon-btn" type="button" aria-label="Back">' + ms('arrow_back') + '</button><span class="m3b-appbar__title">Small</span>' +
                    '<button class="m3b-icon-btn" type="button" aria-label="Attach">' + ms('attach_file') + '</button><button class="m3b-icon-btn" type="button" aria-label="More">' + ms('more_vert') + '</button></header>' +
                  '<header class="m3b-appbar m3b-appbar--center m3b-appbar--scrolled"><button class="m3b-icon-btn" type="button" aria-label="Menu">' + ms('menu') + '</button><span class="m3b-appbar__title">Center-aligned</span>' +
                    '<span class="m3b-search__avatar" style="margin:0 6px">AS</span></header>' +
                  '<header class="m3b-appbar m3b-appbar--medium"><div class="m3b-appbar__row"><button class="m3b-icon-btn" type="button" aria-label="Back">' + ms('arrow_back') + '</button><span><button class="m3b-icon-btn" type="button" aria-label="Bookmark">' + ms('bookmark') + '</button><button class="m3b-icon-btn" type="button" aria-label="More">' + ms('more_vert') + '</button></span></div><span class="m3b-appbar__title">Medium</span></header>' +
                '</div>' },

        { id: 'bottom-app-bar', name: 'Bottom app bar', docs: DOCS + 'bottom-app-bar/overview',
          oneline: 'Displays navigation and key actions at the bottom of mobile screens, with an optional embedded FAB.',
          demo: '<div class="m3b-appbar m3b-appbar--bottom" role="toolbar" aria-label="Actions">' +
                  '<button class="m3b-icon-btn" type="button" aria-label="Check">' + ms('check_box') + '</button>' +
                  '<button class="m3b-icon-btn" type="button" aria-label="Edit">' + ms('edit') + '</button>' +
                  '<button class="m3b-icon-btn" type="button" aria-label="Mic">' + ms('mic') + '</button>' +
                  '<button class="m3b-icon-btn" type="button" aria-label="Image">' + ms('image') + '</button>' +
                  '<button class="m3b-fab m3b-fab--secondary" type="button" aria-label="Add">' + ms('add') + '</button>' +
                '</div>' }
      ] },

    /* ═════════════════════════ SELECTION ═════════════════════════ */
    { id: 'selection', title: 'Selection', desc: 'Choosing options, toggling settings and picking values.',
      items: [
        { id: 'checkbox', name: 'Checkbox', docs: DOCS + 'checkbox/overview',
          oneline: 'Let users select one or more items from a list, or turn an item on or off. Checked, unchecked, indeterminate and error.',
          demo: '<div class="m3b-stack">' +
                  '<label class="m3b-check"><input type="checkbox" checked /> Remember me</label>' +
                  '<label class="m3b-check"><input type="checkbox" class="js-indet" /> Select all (partial)</label>' +
                  '<label class="m3b-check"><input type="checkbox" /> Email me updates</label>' +
                  '<label class="m3b-check m3b-check--error"><input type="checkbox" checked /> Accept terms (error)</label>' +
                  '<label class="m3b-check" style="opacity:.6"><input type="checkbox" disabled /> Disabled</label>' +
                '</div>' },

        { id: 'chips', name: 'Chips', docs: DOCS + 'chips/overview',
          oneline: 'Help people enter information, make selections, filter content, or trigger actions. Assist, filter, input and suggestion.',
          demo: '<div class="bx-col" style="gap:16px">' +
                  '<div class="m3b-chips"><button class="m3b-chip m3b-chip--assist m3b-chip--lead" type="button">' + ms('event') + 'Add to calendar</button><button class="m3b-chip m3b-chip--assist m3b-chip--lead m3b-chip--elevated" type="button">' + ms('local_taxi') + 'Book a ride</button></div>' +
                  '<div class="m3b-chips" data-press-group="multi"><button class="m3b-chip" type="button" aria-pressed="true">' + ms('check', 'msym--check') + 'Vegan</button><button class="m3b-chip" type="button" aria-pressed="false">' + ms('check', 'msym--check') + 'Gluten-free</button><button class="m3b-chip" type="button" aria-pressed="true">' + ms('check', 'msym--check') + 'Nut-free</button></div>' +
                  '<div class="m3b-chips"><span class="m3b-chip m3b-chip--input m3b-chip--trail">Paris' + ms('close') + '</span><span class="m3b-chip m3b-chip--input m3b-chip--trail has-avatar"><span class="m3b-chip__avatar">AS</span>Ali Swift' + ms('close') + '</span></div>' +
                  '<div class="m3b-chips"><button class="m3b-chip" type="button">Sounds good</button><button class="m3b-chip" type="button">See you then!</button></div>' +
                '</div>' },

        { id: 'radio-button', name: 'Radio button', docs: DOCS + 'radio-button/overview',
          oneline: 'Let people select one option from a set of options.',
          demo: '<div class="m3b-stack" role="radiogroup" aria-label="Delivery">' +
                  '<label class="m3b-radio"><input type="radio" name="m3-rb" /> Standard (5–7 days)</label>' +
                  '<label class="m3b-radio"><input type="radio" name="m3-rb" checked /> Express (2 days)</label>' +
                  '<label class="m3b-radio"><input type="radio" name="m3-rb" /> Overnight</label>' +
                  '<label class="m3b-radio" style="opacity:.6"><input type="radio" name="m3-rb" disabled /> Drone (unavailable)</label>' +
                '</div>' },

        { id: 'sliders', name: 'Sliders', docs: DOCS + 'sliders/overview',
          oneline: 'Let users make selections from a range of values. M3 Expressive: a 16dp track with a gap around a 4dp bar handle.',
          demo: '<div class="bx-col">' +
                  '<div class="m3b-slider-row">' + ms('volume_down') + '<input class="m3b-slider" type="range" min="0" max="100" value="60" data-range aria-label="Volume" />' + ms('volume_up') + '</div>' +
                  '<div class="m3b-slider-row"><input class="m3b-slider" type="range" min="0" max="100" value="30" data-range aria-label="Brightness" /><output>30</output></div>' +
                '</div>' },

        { id: 'switch', name: 'Switch', docs: DOCS + 'switch/overview',
          oneline: 'Toggle the selection of an item on or off. The handle grows when selected, and can carry an icon.',
          demo: '<div class="m3b-stack" style="gap:20px">' +
                  '<label class="m3b-switch"><input type="checkbox" role="switch" checked /><span class="m3b-switch__track"><span class="m3b-switch__handle"></span></span>Wi-Fi</label>' +
                  '<label class="m3b-switch"><input type="checkbox" role="switch" /><span class="m3b-switch__track"><span class="m3b-switch__handle"></span></span>Bluetooth</label>' +
                  '<label class="m3b-switch m3b-switch--icons"><input type="checkbox" role="switch" checked /><span class="m3b-switch__track"><span class="m3b-switch__handle">' + ms('check') + '</span></span>Dark theme (with icon)</label>' +
                '</div>' },

        { id: 'date-picker', name: 'Date picker', docs: DOCS + 'date-pickers/overview',
          oneline: 'Let people select a date, or a range of dates. The modal picker shows a headline of the selection over the month grid.',
          demo: '<div class="m3b-date" role="dialog" aria-label="Select date">' +
                  '<div class="m3b-date__head"><div class="m3b-date__kicker">Select date</div><div class="m3b-date__big">Thu, Dec 17</div></div>' +
                  '<div class="m3b-date__nav"><span class="m3b-date__month">December 2026' + ms('arrow_drop_down') + '</span><span><button class="m3b-icon-btn" type="button" aria-label="Previous">' + ms('chevron_left') + '</button><button class="m3b-icon-btn" type="button" aria-label="Next">' + ms('chevron_right') + '</button></span></div>' +
                  '<div class="m3b-date__grid">' + dateGrid() + '</div>' +
                  '<div class="m3b-date__actions"><button class="m3b-btn m3b-btn--text" type="button">Cancel</button><button class="m3b-btn m3b-btn--text" type="button">OK</button></div>' +
                '</div>' },

        { id: 'time-picker', name: 'Time picker', docs: DOCS + 'time-pickers/overview',
          oneline: 'Help users select and set a specific time — the dial variant, with separate hour and minute segments.',
          demo: '<div class="m3b-time" role="dialog" aria-label="Select time">' +
                  '<div class="m3b-time__kicker">Select time</div>' +
                  '<div class="m3b-time__row"><span class="m3b-time__seg is-sel">07</span><span class="m3b-time__colon">:</span><span class="m3b-time__seg">00</span>' +
                    '<span class="m3b-time__ampm"><span class="is-sel">AM</span><span>PM</span></span></div>' +
                  '<div class="m3b-time__dial">' + dial() + '</div>' +
                  '<div class="m3b-date__actions" style="padding-top:20px"><button class="m3b-btn m3b-btn--text" type="button">Cancel</button><button class="m3b-btn m3b-btn--text" type="button">OK</button></div>' +
                '</div>' }
      ] },

    /* ═════════════════════════ TEXT INPUTS ═════════════════════════ */
    { id: 'text-inputs', title: 'Text inputs', desc: 'Entering and searching text, and picking from a menu.',
      items: [
        { id: 'filled-text-field', name: 'Filled text field', docs: DOCS + 'text-fields/overview',
          oneline: 'Filled text fields have more visual emphasis than outlined ones, making them stand out when surrounded by other content. Type to see the label float.',
          demo: '<div class="bx-col">' +
                  '<div class="m3b-field m3b-field--filled"><input class="m3b-field__input" id="m3-f1" placeholder=" " /><label class="m3b-field__label" for="m3-f1">First name</label><div class="m3b-field__support"><span>Supporting text</span></div></div>' +
                  '<div class="m3b-field m3b-field--filled has-lead"><span class="m3b-field__lead">' + ms('search') + '</span><input class="m3b-field__input" id="m3-f2" placeholder=" " value="Kyoto" /><label class="m3b-field__label" for="m3-f2">City</label><span class="m3b-field__trail">' + ms('cancel') + '</span></div>' +
                  '<div class="m3b-field m3b-field--filled m3b-field--error"><input class="m3b-field__input" id="m3-f3" placeholder=" " value="ali@" /><label class="m3b-field__label" for="m3-f3">Email</label><span class="m3b-field__trail">' + ms('error') + '</span><div class="m3b-field__support"><span>Enter a valid email</span></div></div>' +
                '</div>' },

        { id: 'outlined-text-field', name: 'Outlined text field', docs: DOCS + 'text-fields/overview',
          oneline: 'Outlined text fields have less visual emphasis than filled ones — good for forms with many fields.',
          demo: '<div class="bx-col">' +
                  '<div class="m3b-field m3b-field--outlined"><input class="m3b-field__input" id="m3-o1" placeholder=" " /><label class="m3b-field__label" for="m3-o1">Label text</label><div class="m3b-field__support"><span>Supporting text</span></div></div>' +
                  '<div class="m3b-field m3b-field--outlined"><input class="m3b-field__input" id="m3-o2" type="password" placeholder=" " value="hunter22" /><label class="m3b-field__label" for="m3-o2">Password</label><span class="m3b-field__trail">' + ms('visibility') + '</span></div>' +
                  '<div class="m3b-field m3b-field--outlined"><textarea class="m3b-field__input" id="m3-o3" placeholder=" " maxlength="120"></textarea><label class="m3b-field__label" for="m3-o3">Message</label><div class="m3b-field__support"><span>Optional</span><span>0/120</span></div></div>' +
                '</div>' },

        { id: 'search', name: 'Search', docs: DOCS + 'search/overview',
          oneline: 'Lets people enter a keyword or phrase to get relevant information. The bar expands into a search view with suggestions.',
          demo: '<div class="bx-col">' +
                  '<div class="m3b-search"><button class="m3b-icon-btn" type="button" aria-label="Menu">' + ms('menu') + '</button><input type="search" placeholder="Search messages" aria-label="Search messages" /><span class="m3b-search__avatar">AS</span></div>' +
                  '<div class="m3b-search-view">' +
                    '<div class="m3b-search"><button class="m3b-icon-btn" type="button" aria-label="Back">' + ms('arrow_back') + '</button><input type="search" value="kyoto" aria-label="Search" /><button class="m3b-icon-btn" type="button" aria-label="Clear">' + ms('close') + '</button></div>' +
                    '<ul class="m3b-list" style="padding:4px 0">' +
                      '<li class="m3b-list__item" style="min-height:48px">' + '<span class="m3b-list__lead">' + ms('history') + '</span><div class="m3b-list__text"><div class="m3b-list__headline">kyoto temples</div></div></li>' +
                      '<li class="m3b-list__item" style="min-height:48px">' + '<span class="m3b-list__lead">' + ms('history') + '</span><div class="m3b-list__text"><div class="m3b-list__headline">kyoto in autumn</div></div></li>' +
                    '</ul>' +
                  '</div>' +
                '</div>' },

        { id: 'menus', name: 'Menus', docs: DOCS + 'menus/overview',
          oneline: 'Display a list of choices on a temporary surface, opened from a button, field or icon.',
          stage: 'bx-card__stage--top',
          demo: '<div data-demo-wrap style="min-height:300px;display:flex;justify-content:center"><div class="m3b-menu-anchor">' +
                  '<button class="m3b-btn m3b-btn--outlined" type="button" aria-expanded="true">Edit' + ms('arrow_drop_down') + '</button>' +
                  '<div class="m3b-menu" role="menu">' +
                    '<div class="m3b-menu__item">' + ms('content_cut') + 'Cut<span class="m3b-menu__short">⌘X</span></div>' +
                    '<div class="m3b-menu__item is-focus">' + ms('content_copy') + 'Copy<span class="m3b-menu__short">⌘C</span></div>' +
                    '<div class="m3b-menu__item">' + ms('content_paste') + 'Paste<span class="m3b-menu__short">⌘V</span></div>' +
                    '<hr class="m3b-divider" />' +
                    '<div class="m3b-menu__item">' + ms('settings') + 'Settings</div>' +
                    '<div class="m3b-menu__item">' + ms('help') + 'Help &amp; feedback</div>' +
                  '</div>' +
                '</div></div>' }
      ] }
  ];

  window.BasicsSet = {
    family: 'Material 3.0',
    title: 'Basic Components',
    lede: 'The Material 3 base set — buttons, chips, fields, navigation and the other building blocks the Material agentic components are composed from. Every one below is drawn on Material’s own system tokens and is live: type in the fields, flip the switches, pick a tab.',
    source: { label: 'm3.material.io/components', href: 'https://m3.material.io/components' },
    root: 'm3b-root',
    stageClass: 'm3b-stage',
    groups: groups,
    extras: [
      { label: 'Agentic components', href: 'material-agentic.html' },
      { label: 'ShadCN basics', href: 'basic-components.html' },
      { label: 'Contact', href: 'contact.html' }
    ]
  };

  /* The indeterminate state has no HTML attribute; set it once the
     demo markup is in the page. */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.js-indet').forEach(function (el) { el.indeterminate = true; });
  });
})();
