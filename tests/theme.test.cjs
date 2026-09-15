const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.resolve(__dirname, '../js/theme.js'), 'utf8');
const THEME_KEY = 'cr_practice_theme_v1';

function createTheme({ stored = null, dark = false, blockedRead = false, blockedWrite = false, legacyMedia = false, missingMedia = false, blockedStorageAccess = false } = {}) {
  const values = new Map([
    ['cr_practice_lab_v1', '{"sessions":[{"id":"keep-me"}]}'],
    ['cr_practice_current_v1', '{"startedAt":123,"questionIds":["q-1"]}']
  ]);
  if (stored !== null) values.set(THEME_KEY, stored);
  const writes = [];
  const listeners = new Map();
  const dispatched = [];
  const mediaListeners = [];
  const element = { dataset: {}, style: {} };
  const meta = { content: '', setAttribute(name, value) { this[name] = value; } };
  const storage = {
    getItem(key) { if (blockedRead) throw new Error('Storage blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (blockedWrite) throw new Error('Quota exceeded'); writes.push([key, value]); values.set(key, String(value)); }
  };
  const media = { matches: dark };
  if (legacyMedia) media.addListener = callback => mediaListeners.push(callback);
  else media.addEventListener = (name, callback) => { assert.equal(name, 'change'); mediaListeners.push(callback); };
  const window = {
    document: { documentElement: element, querySelector: selector => selector === 'meta[name="theme-color"]' ? meta : null },
    matchMedia: missingMedia ? undefined : query => { assert.equal(query, '(prefers-color-scheme: dark)'); return media; },
    addEventListener: (name, callback) => listeners.set(name, callback),
    dispatchEvent: event => { dispatched.push(event); },
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  };
  Object.defineProperty(window, 'localStorage', { get() { if (blockedStorageAccess) throw new Error('SecurityError'); return storage; } });
  vm.runInNewContext(source, { window }, { filename: 'js/theme.js' });
  return {
    api: window.CRTheme, values, writes, dispatched, element, meta, storage,
    changeSystem(isDark) { media.matches = isDark; mediaListeners.forEach(callback => callback({ matches: isDark })); },
    storageEvent(key, newValue, storageArea = storage) { listeners.get('storage')({ key, newValue, storageArea }); }
  };
}

test('theme applies the light system preference before any application code runs', () => {
  const theme = createTheme();
  assert.equal(theme.api.getPreference(), 'system');
  assert.equal(theme.api.getResolved(), 'light');
  assert.equal(theme.element.dataset.theme, 'light');
  assert.equal(theme.element.style.colorScheme, 'light');
  assert.equal(theme.meta.content, '#f5f3ed');
  assert.equal(theme.writes.length, 0);
  assert.equal(theme.dispatched.length, 0);
});

test('theme initially follows a dark operating-system preference', () => {
  const theme = createTheme({ dark: true });
  assert.equal(theme.api.getResolved(), 'dark');
  assert.equal(theme.element.dataset.theme, 'dark');
  assert.equal(theme.element.style.colorScheme, 'dark');
  assert.equal(theme.meta.content, '#121e26');
});

test('explicit light and dark preferences override the operating system', () => {
  const light = createTheme({ stored: 'light', dark: true });
  const dark = createTheme({ stored: 'dark', dark: false });
  assert.equal(light.api.getPreference(), 'light');
  assert.equal(light.api.getResolved(), 'light');
  assert.equal(dark.api.getPreference(), 'dark');
  assert.equal(dark.api.getResolved(), 'dark');
  light.changeSystem(false);
  light.changeSystem(true);
  dark.changeSystem(true);
  dark.changeSystem(false);
  assert.equal(light.api.getResolved(), 'light');
  assert.equal(dark.api.getResolved(), 'dark');
});

test('system preference follows OS changes including the legacy listener API', () => {
  for (const legacyMedia of [false, true]) {
    const theme = createTheme({ stored: 'system', legacyMedia });
    theme.changeSystem(true);
    assert.equal(theme.api.getResolved(), 'dark');
    theme.changeSystem(false);
    assert.equal(theme.api.getResolved(), 'light');
    assert.equal(theme.writes.length, 0);
  }
});

test('preference changes apply immediately, persist, and emit their current state once', () => {
  const theme = createTheme();
  const updates = [];
  const unsubscribe = theme.api.subscribe(detail => updates.push(detail.preference + ':' + detail.resolved));
  assert.equal(theme.api.setPreference('dark'), true);
  assert.equal(theme.api.getResolved(), 'dark');
  assert.equal(theme.values.get(THEME_KEY), 'dark');
  assert.deepEqual(updates, ['dark:dark']);
  assert.equal(theme.dispatched.length, 1);
  assert.equal(theme.dispatched[0].type, 'cr-theme-change');
  assert.equal(theme.dispatched[0].detail.preference, 'dark');
  theme.api.setPreference('dark');
  assert.equal(theme.dispatched.length, 1);
  unsubscribe();
  theme.api.setPreference('light');
  assert.equal(updates.length, 1);
  theme.changeSystem(true);
  theme.api.setPreference('system');
  assert.equal(theme.api.getResolved(), 'dark');
});

test('invalid saved preferences safely default to system and invalid updates are rejected', () => {
  for (const stored of ['DARK', 'auto', '', 'null', '{"theme":"light"}']) {
    const theme = createTheme({ stored, dark: true });
    assert.equal(theme.api.getPreference(), 'system');
    assert.equal(theme.api.getResolved(), 'dark');
    for (const value of ['blue', null, {}, undefined]) assert.equal(theme.api.setPreference(value), false);
    assert.equal(theme.writes.length, 0);
  }
});

test('blocked storage reads, writes, and accessors never prevent theme changes', () => {
  for (const options of [{ blockedRead: true }, { blockedWrite: true }, { blockedStorageAccess: true }]) {
    const theme = createTheme(options);
    assert.equal(theme.api.getPreference(), 'system');
    assert.equal(theme.api.setPreference('dark'), true);
    assert.equal(theme.api.getResolved(), 'dark');
    assert.equal(theme.element.dataset.theme, 'dark');
    theme.api.setPreference('system');
    theme.changeSystem(true);
    assert.equal(theme.api.getResolved(), 'dark');
  }
});

test('missing matchMedia falls back to light without breaking explicit theme choices', () => {
  const theme = createTheme({ missingMedia: true });
  assert.equal(theme.api.getResolved(), 'light');
  theme.api.setPreference('dark');
  assert.equal(theme.api.getResolved(), 'dark');
});

test('cross-tab changes, removal, and clear synchronize without writing back', () => {
  const theme = createTheme({ dark: true });
  theme.storageEvent(THEME_KEY, 'light');
  assert.equal(theme.api.getPreference(), 'light');
  assert.equal(theme.api.getResolved(), 'light');
  theme.storageEvent(THEME_KEY, 'dark');
  assert.equal(theme.api.getResolved(), 'dark');
  theme.storageEvent(THEME_KEY, null);
  assert.equal(theme.api.getPreference(), 'system');
  theme.storageEvent(THEME_KEY, 'light');
  theme.storageEvent(null, null);
  assert.equal(theme.api.getPreference(), 'system');
  assert.equal(theme.api.getResolved(), 'dark');
  theme.storageEvent(THEME_KEY, 'bogus');
  assert.equal(theme.api.getPreference(), 'system');
  assert.equal(theme.writes.length, 0);
});

test('theme ignores unrelated cross-tab changes and other storage areas', () => {
  const theme = createTheme({ stored: 'dark' });
  theme.storageEvent('cr_practice_lab_v1', null);
  theme.storageEvent(THEME_KEY, 'light', {});
  assert.equal(theme.api.getPreference(), 'dark');
});

test('theme changes never mutate saved progress or the active timer session', () => {
  const theme = createTheme();
  const progress = theme.values.get('cr_practice_lab_v1');
  const activeSession = theme.values.get('cr_practice_current_v1');
  theme.api.setPreference('dark');
  theme.api.setPreference('light');
  theme.api.setPreference('system');
  theme.changeSystem(true);
  assert.equal(theme.values.get('cr_practice_lab_v1'), progress);
  assert.equal(theme.values.get('cr_practice_current_v1'), activeSession);
  assert.ok(theme.writes.every(([key]) => key === THEME_KEY));
});

test('a failing subscriber cannot prevent other listeners or theme changes', () => {
  const theme = createTheme();
  theme.api.subscribe(() => { throw new Error('Unrelated listener failure'); });
  const updates = [];
  theme.api.subscribe(detail => updates.push(detail.resolved));
  assert.doesNotThrow(() => theme.api.setPreference('dark'));
  assert.deepEqual(updates, ['dark']);
});
