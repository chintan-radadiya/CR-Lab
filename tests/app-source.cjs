// Concatenate production ESM sources only for isolated clock/storage VM tests.
// The real-browser test loads the same modules natively and validates imports.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const modules = ['icons', 'core', 'storage', 'analytics', 'sessions', 'views', 'solutions-ui', 'exports', 'help-ui', 'ui', 'review-ui', 'library-ui', 'main'];
function loadAppScript() {
  const plugins = ['js/spaced-repetition.js', 'js/explanation-library.js'];
  return plugins.map(name => fs.readFileSync(path.join(root, name), 'utf8')).join('\n') + '\n(() => {\n' + modules.map(name => fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8')
    .replace(/^import \{[^\n]+\} from '[^']+';\r?\n/gm, '')
    .replace(/^export \{[^\n]+\};\r?\n?/gm, '')).join('\n') + '\n})();';
}
module.exports = { loadAppScript };
