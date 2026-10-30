cd /home/claude/lp && python3 - <<'PY'
import re
b=open('body.html').read()
b=re.sub(r'<span><h3>(.*?)</h3><p>(.*?)</p></span>(\s*<span class="ln-step__bar")', r'<span><span class="ln-step__t">\1</span><span class="ln-step__d">\2</span></span>\3', b)
src=open('brand.svg').read() if __import__('os').path.exists('brand.svg') else None
if src is None:
    s=open('/mnt/user-data/uploads/Nucleux-Agentic-Pattern-Library/Library v0.3/index-new-concept.html').read()
    i=s.index('<svg class="brand__mark'); j=s.index('</svg>',i)+6; src=s[i:j]; open('brand.svg','w').write(src)
b=b.replace('{{BRAND}}',src)
c=open('style.css').read()
c=c.replace('.ln-step h3 { margin: 0 0 6px; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; }\n    .ln-step p { margin: 0; font-size: 15px; line-height: 1.6; color: var(--fg-mid); }',
 '.ln-step__t { display: block; margin: 0 0 6px; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; }\n    .ln-step__d { display: block; margin: 0; font-size: 15px; line-height: 1.6; color: var(--fg-mid); }')
open('Library v0.3/index-new-concept.html','w').write(open('head.html').read()+c+b+open('script.html').read())
PY
