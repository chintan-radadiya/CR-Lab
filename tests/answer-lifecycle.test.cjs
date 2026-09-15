const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const inlineScript = require('./app-source.cjs').loadAppScript();
assert.ok(inlineScript, 'The production application script must be present');

// Expose the real application functions only inside this test VM. No production
// implementation is replaced, and no test hooks are shipped to the browser.
const exposedScript = inlineScript.replace(/\}\)\(\);\s*$/, `
  globalThis.__test = {
    state, setupSession, selectAnswer, clearResponse, checkAnswer, move, goTo,
    startQuestionTimer, stopQuestionTimer, tickTimer, pauseSession,
    continueSession, resumeCurrent, saveCurrent, finishSession, practiceView,
    loadStore, loadCurrent, qById, STORE, CURRENT
  };
})();`);
assert.notEqual(exposedScript, inlineScript, 'The application closure must be exposed');

const bankContext = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(root, 'cr_app_data.js'), 'utf8'), bankContext);
const fixture = JSON.parse(JSON.stringify({
  questions: bankContext.window.CR_DATA.questions.slice(0, 3),
  metadata: bankContext.window.CR_DATA.metadata.slice(0, 1)
}));
const explanationScript = readFileSync(path.join(root, 'cr_explanation_engine.js'), 'utf8');
const initialTime = Date.parse('2026-09-15T12:00:00Z');

function createApp({ storage = new Map(), now = initialTime } = {}) {
  const clock = { now };
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  // These tests exercise session state and generated markup, not browser layout.
  const appElement = {
    innerHTML: '',
    querySelector: () => null,
    querySelectorAll: () => []
  };
  const context = vm.createContext({
    window: { CR_DATA: JSON.parse(JSON.stringify(fixture)), matchMedia: () => ({ matches: true }) },
    document: {
      getElementById: id => id === 'app' ? appElement : null,
      createTreeWalker: () => ({ nextNode: () => null })
    },
    NodeFilter: { SHOW_TEXT: 4 },
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    Date: FakeDate,
    setInterval: () => 0,
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: callback => callback(),
    confirm: () => true,
    TextEncoder,
    Blob
  });
  vm.runInContext(explanationScript, context, { filename: 'cr_explanation_engine.js' });
  vm.runInContext(exposedScript, context, { filename: 'index.html' });
  const api = context.__test;
  return {
    api,
    clock,
    storage,
    ids: fixture.questions.map(question => question.id),
    start({ count = 3, timed = false } = {}) {
      api.setupSession(this.ids.slice(0, count), {
        mode: timed ? 'test' : 'topic',
        modeLabel: 'Regression practice',
        section: fixture.questions[0].section,
        sectionTimes: timed ? { [fixture.questions[0].section]: 1 } : {}
      });
      return api.state.session;
    },
    advance(milliseconds) {
      clock.now += milliseconds;
      api.tickTimer();
    },
    reload() { return createApp({ storage, now: clock.now }); }
  };
}

function answerInputs(markup) {
  return [...markup.matchAll(/<input\b[^>]*name="answer"[^>]*>/g)].map(match => match[0]);
}

test('selection stays editable and clearable until navigating away', () => {
  const app = createApp(), { api } = app, session = app.start(), [first] = app.ids;
  app.advance(2000);
  api.selectAnswer('A');
  api.selectAnswer('B');
  assert.equal(session.answers[first].selected, 'B');
  assert.equal(Boolean(session.answers[first].submitted), false);
  assert.equal(session.answers[first].checked, false);
  assert.match(api.practiceView(), /0\/3 answered/);
  assert.ok(answerInputs(api.practiceView()).every(input => !/\bdisabled\b/.test(input)));
  api.clearResponse();
  assert.equal(session.answers[first], undefined);
  app.advance(3000);
  api.selectAnswer('C');
  api.move(1);
  assert.equal(session.times[first], 5);
  assert.equal(session.answers[first].selected, 'C');
});

test('Next commits the chosen answer and its exact time without revealing it', () => {
  const app = createApp(), { api } = app, session = app.start(), [first] = app.ids;
  app.advance(2500);
  api.selectAnswer('A');
  app.advance(10000);
  const committedAt = app.clock.now;
  api.move(1);
  assert.equal(session.index, 1);
  assert.equal(session.answers[first].submitted, true);
  assert.equal(session.answers[first].committedAt, committedAt);
  assert.equal(session.answers[first].checked, false);
  assert.equal(session.answers[first].time, 12.5);
  assert.equal(session.times[first], 12.5);
  assert.match(api.practiceView(), /1\/3 answered/);
  const saved = JSON.parse(app.storage.get(api.CURRENT));
  assert.equal(saved.answers[first].submitted, true);
  assert.equal(saved.times[first], 12.5);
});

test('review freezes recorded time and disables changing or clearing the committed choice', () => {
  const app = createApp(), { api } = app, session = app.start(), [first, second] = app.ids;
  app.advance(10000);
  api.selectAnswer('A');
  api.move(1);
  app.advance(3000);
  api.move(-1);
  assert.equal(session.times[second], 3);
  assert.equal(session._qStartedAt, null);
  const inputs = answerInputs(api.practiceView());
  assert.equal(inputs.length, fixture.questions[0].choices.length);
  assert.ok(inputs.every(input => /\bdisabled\b/.test(input)));
  api.selectAnswer('B');
  api.clearResponse();
  app.advance(60000);
  api.stopQuestionTimer();
  assert.equal(session.answers[first].selected, 'A');
  assert.equal(session.answers[first].time, 10);
  assert.equal(session.times[first], 10);
  assert.equal(session.answers[first].checked, false);
});

test('skipped questions remain unanswered and accumulate only active time on return', () => {
  const app = createApp(), { api } = app, session = app.start(), [first, second] = app.ids;
  app.advance(4000);
  api.move(1);
  assert.equal(session.answers[first], undefined);
  assert.match(api.practiceView(), /0\/3 answered/);
  app.advance(3000);
  api.move(-1);
  assert.ok(answerInputs(api.practiceView()).every(input => !/\bdisabled\b/.test(input)));
  app.advance(6000);
  api.selectAnswer('B');
  api.move(1);
  assert.equal(session.times[first], 10);
  assert.equal(session.answers[first].time, 10);
  assert.equal(session.times[second], 3);
});

test('Previous and navigator jumps commit responses, while same-question navigation does not', () => {
  const app = createApp(), { api } = app, session = app.start(), [first, second] = app.ids;
  app.advance(2000);
  api.selectAnswer('A');
  api.goTo(0);
  assert.equal(Boolean(session.answers[first].submitted), false);
  app.advance(1000);
  api.goTo(1);
  assert.equal(session.answers[first].submitted, true);
  assert.equal(session.times[first], 3);
  app.advance(4000);
  api.selectAnswer('C');
  api.move(-1);
  assert.equal(session.answers[second].submitted, true);
  assert.equal(session.answers[second].time, 4);
});

test('Check answer commits immediately; checking a submitted answer cannot add review time', () => {
  const app = createApp(), { api } = app, session = app.start(), [first] = app.ids;
  app.advance(9000);
  api.selectAnswer('A');
  api.checkAnswer();
  assert.equal(session.answers[first].submitted, true);
  assert.equal(session.answers[first].checked, true);
  assert.equal(session.times[first], 9);
  app.advance(40000);
  api.checkAnswer();
  api.move(1);
  api.move(-1);
  assert.equal(session.times[first], 9);
  assert.equal(session.answers[first].time, 9);

  api.goTo(1);
  app.advance(5000);
  api.selectAnswer('B');
  api.goTo(2);
  api.goTo(1);
  app.advance(30000);
  api.checkAnswer();
  assert.equal(session.answers[app.ids[1]].checked, true);
  assert.equal(session.times[app.ids[1]], 5);
});

test('a submitted answer remains locked and untimed across reload and Resume', () => {
  let app = createApp();
  const [first] = app.ids;
  app.start();
  app.advance(8000);
  app.api.selectAnswer('A');
  app.api.move(1);
  app.api.move(-1);
  app.advance(50000);
  app = app.reload();
  assert.equal(app.api.state.session._qStartedAt, null);
  app.api.resumeCurrent();
  app.advance(20000);
  app.api.selectAnswer('B');
  app.api.clearResponse();
  app.api.move(1);
  const session = app.api.state.session;
  assert.equal(session.answers[first].selected, 'A');
  assert.equal(session.answers[first].time, 8);
  assert.equal(session.times[first], 8);
});

test('legacy checked responses remain immutable even with a stale saved timer', () => {
  let app = createApp();
  const session = app.start(), [first] = app.ids;
  session.answers[first] = { selected: 'A', checked: true, correct: true };
  session.times[first] = 7;
  session._qStartedAt = app.clock.now - 50000;
  app.api.saveCurrent();
  app = app.reload();
  assert.equal(app.api.state.session._qStartedAt, null);
  app.api.resumeCurrent();
  app.advance(15000);
  app.api.selectAnswer('B');
  app.api.clearResponse();
  app.api.move(1);
  assert.equal(app.api.state.session.times[first], 7);
  assert.equal(app.api.state.session.answers[first].selected, 'A');
});

test('pause/resume excludes paused time and does not restart locked question timers', () => {
  const app = createApp(), { api } = app, session = app.start(), [first] = app.ids;
  app.advance(3000);
  api.pauseSession();
  app.advance(60000);
  api.continueSession();
  app.advance(7000);
  api.selectAnswer('A');
  api.move(1);
  api.move(-1);
  api.pauseSession();
  app.advance(60000);
  api.continueSession();
  app.advance(30000);
  assert.equal(session._qStartedAt, null);
  assert.equal(session.times[first], 10);
  assert.equal(session.answers[first].time, 10);
});

test('timed sections freeze during committed-answer review and restore the exact remainder', () => {
  const app = createApp(), { api } = app, session = app.start({ timed: true });
  const [first, second] = app.ids;
  app.advance(10000);
  api.selectAnswer('A');
  api.move(1);
  app.advance(5000);
  api.move(-1);
  assert.equal(session.sectionEndsAt, null);
  assert.equal(session.reviewSectionRemainingMs, 45000);
  app.advance(20000);
  api.pauseSession();
  app.advance(40000);
  api.continueSession();
  assert.equal(session.sectionEndsAt, null);
  assert.equal(session.reviewSectionRemainingMs, 45000);
  api.goTo(1);
  assert.equal(session.sectionEndsAt - app.clock.now, 45000);
  app.advance(5000);
  api.selectAnswer('B');
  api.move(1);
  assert.equal(session.times[first], 10);
  assert.equal(session.times[second], 10);
  assert.equal(session.sectionEndsAt - app.clock.now, 40000);
});

test('Finish commits the final choice and saves its frozen time in history', () => {
  const app = createApp(), { api } = app, [first] = app.ids;
  app.start({ count: 1 });
  app.advance(8000);
  api.selectAnswer('A');
  app.advance(2000);
  api.move(1);
  assert.equal(api.state.session, null);
  assert.equal(app.storage.has(api.CURRENT), false);
  const saved = api.loadStore().sessions;
  assert.equal(saved.length, 1);
  assert.equal(saved[0].answers[first].submitted, true);
  assert.equal(saved[0].answers[first].selected, 'A');
  assert.equal(saved[0].answers[first].time, 10);
  assert.equal(saved[0].times[first], 10);
  assert.equal(api.state._result.answers[first].time, 10);
});

test('ending a session commits a selected response and preserves skips', () => {
  const app = createApp(), { api } = app, [first, second] = app.ids;
  app.start({ count: 2 });
  app.advance(3000);
  api.move(1);
  app.advance(6000);
  api.selectAnswer('B');
  api.finishSession();
  const saved = api.loadStore().sessions[0];
  assert.equal(saved.answers[first], undefined);
  assert.equal(saved.times[first], 3);
  assert.equal(saved.answers[second].submitted, true);
  assert.equal(saved.answers[second].time, 6);
});

test('returning across sections restores their remaining time without refilling them', () => {
  let app = createApp();
  const { api } = app, [first, , third] = app.ids;
  api.qById.get(third).section = 'Second';
  const session = app.start({ timed: true });
  session.sectionTimes.Second = 2;
  app.advance(10000);
  api.selectAnswer('A');
  api.goTo(2);
  assert.equal(session.sectionEndsAt - app.clock.now, 120000);
  app.advance(5000);
  api.goTo(0);
  assert.equal(session.reviewSectionRemainingMs, 50000);
  assert.equal(session.sectionRemainingMs.Second, 115000);
  app.advance(30000);
  app = app.reload();
  app.api.qById.get(third).section = 'Second';
  app.api.resumeCurrent();
  app.api.goTo(2);
  assert.equal(app.api.state.session.sectionEndsAt - app.clock.now, 115000);
  assert.equal(app.api.state.session.times[first], 10);
  assert.equal(app.api.state.session.times[third], 5);
});

test('section expiry commits a selected answer and caps its time at the deadline', () => {
  const app = createApp(), { api } = app, [first, , third] = app.ids;
  api.qById.get(third).section = 'Second';
  const session = app.start({ timed: true });
  session.sectionTimes.Second = 2;
  app.advance(5000);
  api.selectAnswer('A');
  app.advance(65000);
  assert.equal(session.index, 2);
  assert.equal(session.answers[first].submitted, true);
  assert.equal(session.answers[first].checked, false);
  assert.equal(session.answers[first].time, 60);
  assert.equal(session.times[first], 60);
  assert.equal(session.sectionEndsAt - app.clock.now, 120000);
});

test('expiry on the final section saves the selected response once with capped time', () => {
  const app = createApp(), { api } = app, [first] = app.ids;
  app.start({ timed: true, count: 1 });
  app.advance(5000);
  api.selectAnswer('A');
  app.advance(65000);
  assert.equal(api.state.session, null);
  app.advance(30000);
  const sessions = api.loadStore().sessions;
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].answers[first].submitted, true);
  assert.equal(sessions[0].answers[first].time, 60);
  assert.equal(sessions[0].times[first], 60);
});

test('repeated Resume and reload preserve elapsed time on an active question', () => {
  let app = createApp();
  const [first] = app.ids;
  const startedAt = app.start({ timed: true })._qStartedAt;
  app.advance(5000);
  app.api.resumeCurrent();
  app.advance(7000);
  app.api.resumeCurrent();
  assert.equal(app.api.state.session._qStartedAt, startedAt);
  app = app.reload();
  app.api.resumeCurrent();
  assert.equal(app.api.state.session._qStartedAt, app.clock.now);
  assert.equal(app.api.state.session.sectionEndsAt - app.clock.now, 48000);
  app.advance(3000);
  app.api.selectAnswer('A');
  app.api.move(1);
  assert.equal(app.api.state.session.answers[first].time, 15);
  assert.equal(app.api.state.session.times[first], 15);
});
