const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = require('./app-source.cjs').loadAppScript();
const exposed = source.replace(/\}\)\(\);\s*$/, `
  globalThis.__test = { state, qById, loadStore, saveStore, exportBackupData,
    reviewQueue, dueLabel, reviewDashboardCard, reviewView, recallCard,
    openRecall, startDueReview, selectRecall, revealRecall, rateRecall,
    sessionSummary, setupSession, selectAnswer, resumeCurrent, finishSession };
})();`);
assert.notEqual(exposed, source);
const bankContext = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(root, 'cr_app_data.js'), 'utf8'), bankContext);
const bank = bankContext.window.CR_DATA;
const fixture = JSON.parse(JSON.stringify({ questions: [...bank.questions.slice(0, 2), bank.questions.find(q => q.id.includes('Section I'))], metadata: bank.metadata }));
const engine = readFileSync(path.join(root, 'cr_explanation_engine.js'), 'utf8');
const now = Date.parse('2026-09-15T12:00:00Z');
const clone = value => JSON.parse(JSON.stringify(value));

function createApp({ storage = new Map() } = {}) {
  const clock = { now }, faults = { write: false };
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const app = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], contains: () => false };
  const context = vm.createContext({
    window: { CR_DATA: clone(fixture), matchMedia: () => ({ matches: true }), scrollTo: () => {}, scrollX: 0, scrollY: 0 },
    document: { getElementById: id => id === 'app' ? app : null, createTreeWalker: () => ({ nextNode: () => null }), body: { style: {} } },
    NodeFilter: { SHOW_TEXT: 4 },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem(key, value) { if (faults.write) throw new Error('QuotaExceededError'); storage.set(key, String(value)); },
      removeItem: key => storage.delete(key)
    },
    Date: FakeDate, setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: callback => callback(), confirm: () => true, TextEncoder, Blob
  });
  vm.runInContext(engine, context);
  vm.runInContext(exposed, context);
  return { api: context.__test, storage, faults, clock, app };
}

function makeHistory(api) {
  const questions = [...api.qById.values()], q = questions[0];
  const wrong = q.choices.find(choice => choice.label !== q.answer).label;
  const s = { id: 'sess_review', createdAt: now - 60000, completedAt: now - 30000, mode: 'topic', modeLabel: 'Focused practice', corpus: q.corpus, test: q.test, section: q.section, questionIds: [q.id, questions[1].id], index: 0,
    answers: { [q.id]: { qid: q.id, selected: wrong, correct: false, submitted: true, time: 30, committedAt: now - 30000 } },
    times: { [q.id]: 30, [questions[1].id]: 12 }, flags: {}, sectionTimes: {} };
  return { sessions: [s], errors: [{ id: 'err_review', sessionId: s.id, qid: q.id, selected: wrong, answer: q.answer, category: 'Incorrect', status: 'Open', note: 'Keep my original note', createdAt: s.createdAt, time: 30 }], notes: {}, reviewEvents: [] };
}

function seededApp() {
  const result = createApp(); result.api.saveStore(makeHistory(result.api));
  return { ...result, qid: fixture.questions[0].id, skippedId: fixture.questions[1].id };
}

test('opening recall shows a fresh response without revealing or changing the original locked response', () => {
  const { api, qid, app } = seededApp(), original = clone(api.loadStore().sessions);
  api.openRecall(qid);
  assert.equal(api.state.view, 'review');
  assert.deepEqual(clone(api.state.recall), { qid, selected: '', revealed: false });
  assert.match(app.innerHTML, /Reveal solution/);
  assert.doesNotMatch(app.innerHTML, /data-review-rating=/);
  assert.deepEqual(clone(api.loadStore().sessions), original);
});

test('a newly completed skip resets a rating made while that practice was paused', () => {
  const { api, clock, skippedId } = seededApp(), q = api.qById.get(skippedId);
  api.setupSession([skippedId], { mode: 'topic', modeLabel: 'New practice', section: q.section, sectionTimes: {} });
  clock.now += 10000;
  api.openRecall(skippedId); api.revealRecall(); api.rateRecall('good');
  assert.equal(api.reviewQueue().find(entry => entry.qid === skippedId).isDue, false);
  clock.now += 20000;
  api.resumeCurrent(); api.finishSession();
  assert.equal(api.loadStore().sessions.at(-1).completedAt, clock.now);
  assert.equal(api.reviewQueue().find(entry => entry.qid === skippedId).isDue, true);
});

test('rating cannot be submitted before reveal and the choices remain editable until reveal', () => {
  const { api, qid } = seededApp(), q = api.qById.get(qid), first = q.choices[0].label, second = q.choices[1].label;
  api.openRecall(qid);
  api.rateRecall('good');
  assert.equal(api.loadStore().reviewEvents.length, 0);
  api.selectRecall(first); assert.equal(api.state.recall.selected, first);
  api.selectRecall(second); assert.equal(api.state.recall.selected, second);
  api.selectRecall('invalid'); assert.equal(api.state.recall.selected, second);
  api.revealRecall();
  assert.equal(api.state.recall.revealed, true);
  api.selectRecall(first); assert.equal(api.state.recall.selected, second);
  const html = api.recallCard(api.reviewQueue().find(entry => entry.qid === qid));
  assert.match(html, /data-review-rating="again"/);
  assert.match(html, /data-review-rating="easy"/);
  const inputs = html.match(/<input[^>]*name="review-answer"[^>]*>/g);
  assert.equal(inputs.length, q.choices.length);
  assert.ok(inputs.every(input => /disabled/.test(input)));
});

test('a recall rating saves a distinct event and leaves original answers, scores, times, and notes unchanged', () => {
  const { api, qid } = seededApp(), original = clone(api.loadStore()), score = clone(api.sessionSummary(original.sessions[0]));
  api.openRecall(qid); api.selectRecall(api.qById.get(qid).answer); api.revealRecall(); api.rateRecall('good');
  const after = api.loadStore();
  assert.equal(api.state.recall, null);
  assert.equal(after.reviewEvents.length, 1);
  assert.equal(after.reviewEvents[0].qid, qid);
  assert.equal(after.reviewEvents[0].rating, 'good');
  assert.match(after.reviewEvents[0].id, /^rev_/);
  assert.equal(after.reviewEvents[0].intervalDays, 3);
  assert.deepEqual(clone(after.sessions), original.sessions);
  assert.deepEqual(clone(after.errors), original.errors);
  assert.deepEqual(clone(api.sessionSummary(after.sessions[0])), score);
  assert.equal(api.reviewQueue().find(entry => entry.qid === qid).isDue, false);
});

test('reloading derives the same due schedule from persisted review events without restoring a revealed card', () => {
  const { api, qid, storage } = seededApp();
  api.openRecall(qid); api.revealRecall(); api.rateRecall('easy');
  const expected = clone(api.reviewQueue()), reload = createApp({ storage });
  assert.deepEqual(clone(reload.api.reviewQueue()), expected);
  assert.equal(reload.api.state.recall, null);
  assert.equal(reload.api.loadStore().reviewEvents.length, 1);
});

test('unknown recall question IDs and unknown ratings do not write progress', () => {
  const { api, qid, storage } = seededApp(), initial = new Map(storage);
  api.openRecall('missing-question');
  assert.equal(api.state.recall, null);
  assert.match(api.state.toast, /no longer in the review queue/);
  assert.deepEqual(storage, initial);
  api.openRecall(qid); api.revealRecall(); api.rateRecall('perfect');
  assert.deepEqual(storage, initial);
  assert.equal(api.state.recall.qid, qid);
});

test('quota failure retains one event in recovery memory and prevents a double rating', () => {
  const { api, qid, faults, storage } = seededApp(), initial = new Map(storage);
  api.openRecall(qid); api.revealRecall(); faults.write = true; api.rateRecall('hard');
  assert.equal(api.state.recall, null);
  assert.match(api.state.toast, /this tab only/);
  assert.deepEqual(storage, initial);
  assert.equal(api.loadStore().reviewEvents.length, 1);
  assert.equal(api.exportBackupData().reviewEvents.length, 1);
  api.rateRecall('hard');
  assert.equal(api.loadStore().reviewEvents.length, 1);
  faults.write = false; api.saveStore(api.loadStore());
  assert.equal(createApp({ storage }).api.loadStore().reviewEvents.length, 1);
});

test('due and upcoming filters show only matching questions, while All includes both', () => {
  const { api, qid, skippedId } = seededApp();
  api.openRecall(qid); api.revealRecall(); api.rateRecall('good');
  api.state.reviewFilter = 'due';
  let html = api.reviewView();
  assert.match(html, new RegExp(`data-review-question="${skippedId}"`));
  assert.doesNotMatch(html, new RegExp(`data-review-question="${qid}"`));
  api.state.reviewFilter = 'upcoming'; html = api.reviewView();
  assert.match(html, new RegExp(`data-review-question="${qid}"`));
  assert.doesNotMatch(html, new RegExp(`data-review-question="${skippedId}"`));
  api.state.reviewFilter = 'all'; html = api.reviewView();
  assert.equal((html.match(/data-review-question=/g) || []).length, 2);
});

test('Review due skips future cards and opens the next due question', () => {
  const { api, qid, skippedId } = seededApp();
  api.openRecall(qid); api.revealRecall(); api.rateRecall('good');
  api.startDueReview();
  assert.equal(api.state.recall.qid, skippedId);
  api.revealRecall(); api.rateRecall('good');
  api.startDueReview();
  assert.equal(api.state.recall, null);
  assert.match(api.state.toast, /No reviews are due/);
});

test('reviewing a question pauses any active practice without committing its draft selection', () => {
  const { api, qid, clock } = seededApp(), activeQuestion = fixture.questions[2];
  api.setupSession([activeQuestion.id], { mode: 'topic', modeLabel: 'Practice', section: activeQuestion.section });
  clock.now += 4200; api.selectAnswer(activeQuestion.choices[0].label);
  api.openRecall(qid);
  assert.equal(api.state.view, 'review');
  assert.equal(api.state.session.paused, true);
  assert.equal(api.state.session.pauseReason, 'navigation');
  assert.equal(api.state.session.times[activeQuestion.id], 4.2);
  assert.notEqual(api.state.session.answers[activeQuestion.id].submitted, true);
});

test('empty review history renders a useful empty state and a disabled due-review button', () => {
  const { api } = createApp();
  const html = api.reviewView();
  assert.match(html, /Complete a practice session first/);
  assert.match(html, /data-action="start-due-review" disabled/);
  assert.doesNotMatch(html, /Invalid Date/);
  assert.match(api.reviewDashboardCard(), /0 questions ready to revisit/);
});

test('empty Upcoming filter explains that existing scheduled questions are already due', () => {
  const { api } = seededApp(); api.state.reviewFilter = 'upcoming';
  const html = api.reviewView();
  assert.match(html, /All scheduled questions are currently due/);
  assert.doesNotMatch(html, /Next review: Due now|Invalid Date/);
});

test('future-dated imported reviews display a clock warning instead of crashing the revealed card', () => {
  const { api, qid } = seededApp(), data = api.loadStore();
  data.reviewEvents.push({ id: 'rev_future', qid, rating: 'good', reviewedAt: now + 60000 });
  api.saveStore(data); api.openRecall(qid);
  assert.doesNotThrow(() => api.revealRecall());
  const html = api.recallCard(api.reviewQueue().find(entry => entry.qid === qid));
  assert.match(html, /Check your device clock/);
  assert.doesNotMatch(html, /data-review-rating=/);
  api.rateRecall('good');
  assert.equal(api.loadStore().reviewEvents.length, 1);
});
