// Pull only the :root and .dark --nx-* variable blocks out of
// @nucleux/tokens/styles.css (which also ships Tailwind's preflight).
const fs = require('fs');
const css = fs.readFileSync(require.resolve('@nucleux/tokens/styles.css'), 'utf8');
const blocks = css.match(/(?:^|})\s*(:root|\.dark)\s*\{[^}]*--nx-[^}]*\}/g) || [];
const out = blocks.map(b => b.replace(/^}\s*/, '').trim()).join('\n');
if (!/--nx-md-primary/.test(out)) throw new Error('token blocks not found');
fs.writeFileSync(__dirname + '/tokens.css', '/* generated from @nucleux/tokens — do not edit */\n' + out + '\n');
console.log('tokens.css:', blocks.length, 'blocks');
