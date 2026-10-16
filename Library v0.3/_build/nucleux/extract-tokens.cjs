// Pull only the :root and .dark --nx-* variable blocks out of
// @nucleux/tokens/styles.css (which also ships Tailwind's preflight).
const fs = require('fs');
const css = fs.readFileSync(require.resolve('@nucleux/tokens/styles.css'), 'utf8');
// Every :root and .dark block — light AND dark values. (The old pattern
// anchored each match on the previous block's closing brace, so a .dark
// block that directly followed a :root block was skipped.)
const blocks = css.match(/(?<=^|[}\s])(:root|\.dark)\s*\{[^}]*--nx-[^}]*\}/g) || [];
const out = blocks.map(b => b.replace(/^[}\s]+/, '').trim()).join('\n');
if (!/--nx-md-primary/.test(out)) throw new Error('token blocks not found');
// The Material 3 theme from @nucleux/md3-theme: `.nx-theme-mui` remaps the
// base --nx-* roles onto the MD3 palette, so the non-Md3 agentic components
// (AiDisclosure, AiCaveat) render in the MD3 look inside a themed subtree.
const theme = fs.readFileSync(require.resolve('@nucleux/md3-theme/theme.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
if (!/\.nx-theme-mui/.test(theme)) throw new Error('md3-theme block not found');
fs.writeFileSync(__dirname + '/tokens.css', '/* generated from @nucleux/tokens and @nucleux/md3-theme — do not edit */\n' + out + '\n' + theme + '\n');
console.log('tokens.css:', blocks.length, 'blocks');
