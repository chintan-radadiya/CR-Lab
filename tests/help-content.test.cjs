const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = readFileSync(path.join(root, 'js/help-ui.js'), 'utf8');
const views = readFileSync(path.join(root, 'js/views.js'), 'utf8');
const ui = readFileSync(path.join(root, 'js/ui.js'), 'utf8');

test('Help is a first-class navigation destination with a rendered view', () => {
  assert.match(views, /\['help', 'Help'\]/);
  assert.match(ui, /state\.view === 'help'/);
  assert.match(ui, /bindHelp\(\)/);
});

test('Help covers the complete application workflow and all question types', () => {
  const sectionIds = [...source.matchAll(/helpSection\('(help-[a-z]+)/g)].map(match => match[1]);
  assert.deepEqual(sectionIds, [
    'help-start', 'help-navigation', 'help-dashboard', 'help-tests', 'help-focused',
    'help-solving', 'help-results', 'help-review', 'help-solutions', 'help-errors',
    'help-reports', 'help-data', 'help-topics', 'help-access', 'help-trouble'
  ]);
  assert.match(source, /const topicDefinitions = \[/);
  assert.equal((source.match(/^  \['[^\n]+\],$/gm) || []).length >= 19, true);
  for (const phrase of ['Balanced random mix', 'Focus on weaker skills', 'Clear response', 'Check answer', 'Review Queue', 'Download Excel report', 'Backup JSON', 'Remove all progress', 'No account or authentication']) {
    assert.match(source, new RegExp(phrase), `Help should explain ${phrase}`);
  }
});
