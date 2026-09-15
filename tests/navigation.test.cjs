const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const inline = require('./app-source.cjs').loadAppScript();
const source = inline.replace(/\}\)\(\);\s*$/, `
  globalThis.__test = { state, setupSession, selectAnswer, move, changeView,
    pauseSession, continueSession, resumeCurrent, saveCurrent, tickTimer, CURRENT };
})();`);
assert.notEqual(source, inline);
const dataContext = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(root, 'cr_app_data.js'), 'utf8'), dataContext);
const data = JSON.parse(JSON.stringify({ questions: dataContext.window.CR_DATA.questions.slice(0, 3), metadata: dataContext.window.CR_DATA.metadata.slice(0, 1) }));
const explanationSource = readFileSync(path.join(root, 'cr_explanation_engine.js'), 'utf8');
const initialTime = Date.parse('2026-09-15T12:00:00Z');

function createApp({ storage = new Map(), now = initialTime } = {}) {
  const clock = { now }, events = {};
  class FakeDate extends Date { constructor(...args) { super(...(args.length ? args : [clock.now])); } static now() { return clock.now; } }
  const appElement = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], contains: () => false };
  const context = vm.createContext({
    window: { CR_DATA: JSON.parse(JSON.stringify(data)), matchMedia: () => ({ matches: true }), addEventListener: (name, handler) => { events[name] = handler; } },
    document: { getElementById: id => id === 'app' ? appElement : null, createTreeWalker: () => ({ nextNode: () => null }) },
    NodeFilter: { SHOW_TEXT: 4 },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
    Date: FakeDate, setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: callback => callback(), confirm: () => true, TextEncoder, Blob
  });
  vm.runInContext(explanationSource, context);
  vm.runInContext(source, context, { filename: 'index.html' });
  const api = context.__test;
  return {
    api, clock, events, storage, first: data.questions[0].id,
    start() { api.setupSession(data.questions.map(q => q.id), { mode: 'test', modeLabel: 'Timed practice', section: data.questions[0].section, sectionTimes: { [data.questions[0].section]: 1 } }); },
    advance(milliseconds) { clock.now += milliseconds; api.tickTimer(); },
    reloadAfter(milliseconds = 0) { return createApp({ storage, now: clock.now + milliseconds }); }
  };
}

test('leaving practice pauses its draft; one Resume click resumes without charging dashboard time', () => {
  const app = createApp(), { api } = app;
  app.start(); app.advance(10000); api.selectAnswer('A'); api.changeView('reports');
  assert.equal(api.state.session.paused, true);
  assert.equal(api.state.session.times[app.first], 10);
  assert.equal(api.state.session.answers[app.first].submitted, false);
  app.advance(60000); api.resumeCurrent();
  assert.equal(api.state.view, 'practice');
  assert.equal(api.state.session.paused, false);
  assert.equal(api.state.session.sectionEndsAt - app.clock.now, 50000);
  api.selectAnswer('B'); app.advance(5000); api.move(1);
  assert.equal(api.state.session.times[app.first], 15);
  assert.equal(api.state.session.answers[app.first].selected, 'B');
});

test('reloading freezes at the latest saved instant and excludes offline and dashboard time', () => {
  let app = createApp();
  app.start(); app.advance(7000); app.api.saveCurrent();
  app = app.reloadAfter(120000);
  assert.equal(app.api.state.view, 'dashboard');
  assert.equal(app.api.state.session.paused, true);
  assert.equal(app.api.state.session._qStartedAt, null);
  assert.equal(app.api.state.session.times[app.first], 7);
  assert.equal(app.api.state.session.pausedSectionRemainingMs, 53000);
  app.advance(40000); app.api.resumeCurrent();
  assert.equal(app.api.state.session.paused, false);
  assert.equal(app.api.state.session.sectionEndsAt - app.clock.now, 53000);
  app.advance(3000); app.api.selectAnswer('A'); app.api.move(1);
  assert.equal(app.api.state.session.times[app.first], 10);
});

test('saving and reloading while on dashboard cannot charge more time or use the section budget', () => {
  let app = createApp();
  app.start(); app.advance(9000); app.api.saveCurrent();
  app = app.reloadAfter(20000);
  app.advance(30000); app.api.saveCurrent();
  app = app.reloadAfter(60000);
  app.api.resumeCurrent();
  assert.equal(app.api.state.session.paused, false);
  assert.equal(app.api.state.session.sectionEndsAt - app.clock.now, 51000);
  app.advance(1000); app.api.selectAnswer('A'); app.api.move(1);
  assert.equal(app.api.state.session.times[app.first], 10);
});

test('explicit Pause stays paused on return until Resume practice is pressed', () => {
  const app = createApp(), { api } = app;
  app.start(); app.advance(4000); api.pauseSession();
  const pausedAt = api.state.session.pausedAt;
  api.changeView('dashboard'); app.advance(20000); api.resumeCurrent();
  assert.equal(api.state.view, 'practice');
  assert.equal(api.state.session.paused, true);
  assert.equal(api.state.session.pausedAt, pausedAt);
  assert.equal(api.state.session._qStartedAt, null);
  app.advance(100000); api.continueSession();
  assert.equal(api.state.session.sectionEndsAt - app.clock.now, 56000);
  app.advance(3000); api.selectAnswer('A'); api.move(1);
  assert.equal(api.state.session.times[app.first], 7);
});

test('explicit pause survives reload and cannot silently turn into automatic resume', () => {
  let app = createApp();
  app.start(); app.advance(6000); app.api.pauseSession();
  app = app.reloadAfter(120000);
  app.api.resumeCurrent();
  assert.equal(app.api.state.session.paused, true);
  assert.equal(app.api.state.session.times[app.first], 6);
  assert.equal(app.api.state.session.pausedSectionRemainingMs, 54000);
  app.api.continueSession();
  assert.equal(app.api.state.session.sectionEndsAt - app.clock.now, 54000);
});

test('auto-pausing a locked review preserves its frozen answer time and section remainder', () => {
  const app = createApp(), { api } = app;
  app.start(); app.advance(10000); api.selectAnswer('A'); api.move(1);
  app.advance(5000); api.move(-1); api.changeView('dashboard');
  app.advance(40000); api.resumeCurrent();
  assert.equal(api.state.session.paused, false);
  assert.equal(api.state.session._qStartedAt, null);
  assert.equal(api.state.session.times[app.first], 10);
  assert.equal(api.state.session.reviewSectionRemainingMs, 45000);
  api.move(1);
  assert.equal(api.state.session.sectionEndsAt - app.clock.now, 45000);
});

test('pagehide saves the final active interval before the browser leaves', () => {
  let app = createApp();
  app.start(); app.advance(4500); app.api.saveCurrent(); app.advance(2200);
  app.events.pagehide();
  assert.equal(app.api.state.session.paused, true);
  assert.equal(app.api.state.session.times[app.first], 6.7);
  app = app.reloadAfter(120000);
  app.api.resumeCurrent();
  assert.equal(app.api.state.session.paused, false);
  assert.equal(app.api.state.session.sectionEndsAt - app.clock.now, 53300);
  app.advance(3300); app.api.selectAnswer('A'); app.api.move(1);
  assert.equal(app.api.state.session.times[app.first], 10);
});

test('back-forward restoration offers Resume without overriding an explicit pause', () => {
  const app = createApp();
  app.start(); app.advance(3000); app.api.pauseSession();
  app.events.pagehide(); app.advance(10000); app.events.pageshow({ persisted: true });
  assert.equal(app.api.state.view, 'dashboard');
  app.api.resumeCurrent();
  assert.equal(app.api.state.session.paused, true);
  assert.equal(app.api.state.session.times[app.first], 3);
  assert.equal(app.api.state.session.pausedSectionRemainingMs, 57000);
});
