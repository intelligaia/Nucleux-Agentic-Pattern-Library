/* Tailwind for the Nucleux components the library's own scripts render
   (Md3Chip in MaterialSim.suggestions, …).

   - Preflight is OFF: the library pages carry their own base styles,
     and Tailwind's reset would restyle every page.
   - Content is ONLY the components' class strings, i.e. the `var MD3_*`
     constants in material-sim.js. Scanning the whole script would turn
     ordinary words (hidden, table, visible, container…) into global
     utilities that collide with the library's own class names. */
const fs = require('fs');
const path = require('path');
const preset = require('@nucleux/tokens/preset');
const sim = fs.readFileSync(path.join(__dirname, '../../material-sim.js'), 'utf8');
const strings = [];
sim.replace(/var (MD3_[A-Z_]+) = ((?:"[^"]*"\s*\+?\s*)+);/g, (_, name, body) => {
  body.replace(/"([^"]*)"/g, (_, s) => strings.push(s));
});
if (!strings.length) throw new Error('no MD3_* class strings found in material-sim.js');

module.exports = {
  presets: [preset.default || preset],
  corePlugins: { preflight: false },
  content: [{ raw: strings.join(' '), extension: 'html' }]
};
