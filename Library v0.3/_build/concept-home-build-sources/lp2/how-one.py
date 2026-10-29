# "From one sentence to screens you can ship" (concept): one scenario only
# (support chatbot), no tabs, taller frame, and the build is told in real
# @nucleux/* npm packages — each step names the pattern AND the package that
# renders it, and the finished screen is labelled by package.
SC_NEW = r'''    var SC = [
      { q: 'A support chatbot that answers from our help centre and hands off to a person when it isn’t sure.',
        file: 'app/support/page.tsx',
        steps: [
          ['Disclosure', '@nucleux/alert', 'says up front that it’s an AI'],
          ['Thread', '@nucleux/thread', 'the conversation, with streamed answers'],
          ['Citations', '@nucleux/chip', 'every answer points to a help article'],
          ['Confidence', '@nucleux/badge', 'says when it isn’t sure'],
          ['Recovery', '@nucleux/button', 'a clear way to reach a person'],
          ['Suggested prompts', '@nucleux/suggestions', 'the questions people ask most'],
          ['Composer', '@nucleux/agent-composer', 'where people type, attach and send']
        ],
        app: hd('Help', 'Acme support') +
          P(1, '@nucleux/alert', 'ln-ag__alert', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>You’re chatting with an <b>AI assistant</b>. A person can take over anytime.</span>') +
          '<div class="ln-ag__grow">' +
          P(2, '@nucleux/thread', 'ln-ag__thread',
            '<div class="ln-ag__msg">Can I get a refund after 30 days?</div>' +
            '<div class="ln-ag__bot"><i class="ln-ag__av" aria-hidden="true"></i><div class="ln-ag__ans">Refunds are usually available within 30 days of purchase. After that, it depends on your plan’s terms. ' +
              P(3, '@nucleux/chip', 'ln-ag__cite ln-ag__cite--chip', 'Help centre · Refunds', 'span') + '</div></div>') +
          '<div class="ln-ag__after">' + P(4, '@nucleux/badge', 'ln-ag__badge', '● Not fully sure — your plan has custom terms', 'span') + '</div>' +
          P(5, '@nucleux/button', 'ln-ag__chips', '<span class="ln-ag__btn ln-ag__btn--p">Talk to a person</span><span class="ln-ag__btn">Ask another way</span>') +
          '</div><div class="ln-ag__foot">' +
          P(6, '@nucleux/suggestions', 'ln-ag__chips', '<span class="ln-ag__chip">Reset my password</span><span class="ln-ag__chip">Change my plan</span><span class="ln-ag__chip">Where’s my refund?</span>') +
          P(7, '@nucleux/agent-composer', '', '<div class="ln-ag__in">' + CLIP + '<em>Ask anything…</em>' + SEND + '</div>') + '</div>' }
    ];
'''
STEP_OLD = """        s.steps.map(function (st) { return '<li><i class="ln-ag__ic"></i><span>Picked <span class="ln-ag__pat">' + st[0] + '</span> — ' + st[1] + '</span></li>'; }).join('');
      fileEl.innerHTML = 'Built <code>' + s.file + '</code> with ' + s.steps.length + ' nucleUX patterns';"""
STEP_NEW = """        s.steps.map(function (st) { return '<li><i class="ln-ag__ic"></i><span><span class="ln-ag__pat">' + st[0] + '</span> <code class="ln-ag__pkg">' + st[1] + '</code> — ' + st[2] + '</span></li>'; }).join('');
      fileEl.innerHTML = 'Built <code>' + s.file + '</code> from ' + s.steps.length + ' <code>@nucleux/react</code> components';"""
CSS = '''  <style>
    /* How it works (concept): single scenario, taller frame, npm packages */
    .ln-wrap .ln-ag__chat, .ln-wrap .ln-ag__canvas { height: clamp(560px, calc(100svh - 300px), 660px) !important; }
    .ln-wrap .ln-ag__app { max-height: none !important; max-width: 440px; }
    .ln-wrap .ln-ag { margin-top: clamp(8px, 1.5vh, 16px); }
    .ln-ag__pkg { padding: 1px 6px; border-radius: 6px; background: var(--ink-100); color: var(--fg); font: 500 11.5px/1.5 var(--font-mono); white-space: nowrap; }
    .ln-ag__steps li > span { min-width: 0; }
    .ln-ag__alert { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--ink-50); font-size: 12px; line-height: 1.45; color: var(--fg-mid); }
    .ln-ag__alert svg { flex: 0 0 auto; margin-top: 1px; color: var(--accent); }
    .ln-ag__alert b { color: var(--fg); font-weight: 600; }
    .ln-ag__thread { display: flex; flex-direction: column; gap: 10px; }
    .ln-ag__bot { display: flex; align-items: flex-start; gap: 8px; }
    .ln-ag__av { flex: 0 0 auto; width: 20px; height: 20px; margin-top: 1px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #21a4d7); }
    .ln-ag__cite--chip { margin: 4px 0 0; padding: 2px 8px; border-radius: 999px; font-weight: 500; }
    .ln-ag__after .ln-ag__badge { margin-top: 0; }
    .ln-ag__in svg { flex: 0 0 auto; color: var(--fg-mid); }
    @media (max-width: 899px) {
      .ln-wrap .ln-ag__chat { height: 470px !important; }
      .ln-wrap .ln-ag__canvas { height: 600px !important; }
    }
  </style>
'''

REPLAY_BTN = '<button class="ln-ag__replay" type="button" data-ag-replay aria-label="Replay the demo" title="Replay"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 4v4.5h4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
REPLAY_JS_OLD = "    win.addEventListener('pointerenter', function () { hover = true; });"
REPLAY_JS_NEW = """    var replay = $('[data-ag-replay]', win);
    if (replay) replay.addEventListener('click', function () {
      replay.classList.remove('is-spin'); void replay.offsetWidth; replay.classList.add('is-spin');
      started = true; play(cur);
    });
    win.addEventListener('pointerenter', function () { hover = true; });"""
REPLAY_CSS = """  <style>
    /* replay button in the demo window's title bar, just before the MCP badge */
    .ln-ag__replay { margin-left: auto; display: inline-grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); color: var(--fg-mid); cursor: pointer; transition: color .2s ease, border-color .2s ease, background .2s ease; }
    .ln-ag__replay:hover { color: var(--fg); border-color: var(--border-strong, rgb(12 12 10 / .25)); }
    .ln-ag__replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .ln-ag__replay.is-spin svg { animation: ln-ag-replay .6s cubic-bezier(.22,1,.36,1); }
    @keyframes ln-ag-replay { from { transform: rotate(0); } to { transform: rotate(-360deg); } }
    .ln-ag__replay + .ln-ag__mcp { margin-left: 0; }
  </style>
"""
def apply_replay(t):
    if 'data-ag-replay' not in t:
        t = t.replace('<span class="ln-ag__mcp"><i aria-hidden="true"></i>nucleUX MCP</span>', REPLAY_BTN + '<span class="ln-ag__mcp"><i aria-hidden="true"></i>nucleUX MCP</span>', 1)
    if "var replay = $('[data-ag-replay]', win);" not in t:
        assert t.count(REPLAY_JS_OLD) == 1; t = t.replace(REPLAY_JS_OLD, REPLAY_JS_NEW)
    if 'replay button in the demo window' not in t:
        t = t.replace('</head>', REPLAY_CSS + '</head>', 1)
    return t

def apply(t):
    # tabs out
    if 'class="ln-ag__tabs' in t:
        a = t.index('    <div class="ln-ag__tabs')
        b = t.index('    </div>\n', a) + len('    </div>\n')
        t = t[:a] + t[b:]
    t = t.replace('<div class="ln-ag ln-rv" id="ag-win" role="tabpanel" aria-label="An agent building with nucleUX">',
                  '<div class="ln-ag ln-rv" id="ag-win" role="region" aria-label="An agent building a support chatbot with nucleUX">')
    if "['Disclosure', '@nucleux/alert'" not in t:
        a = t.index('    var SC = [\n')
        b = t.index('    var tabsEl = ', a)
        t = t[:a] + SC_NEW + t[b:]
        assert t.count(STEP_OLD) == 1
        t = t.replace(STEP_OLD, STEP_NEW)
    if 'How it works (concept): single scenario' not in t:
        t = t.replace('</head>', CSS + '</head>', 1)
    return apply_replay(t)
