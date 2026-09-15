const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const inlineScript = require('./app-source.cjs').loadAppScript();
const exposedScript = inlineScript.replace(/\}\)\(\);\s*$/, `
  globalThis.__test = { state, setupSession, selectAnswer, move, finishSession,
    loadStore, saveStore, loadCurrent, saveCurrent, clearCurrent, clearPersistenceCache,
    exportBackupData, restoreBackupData, restoreJson, buildReportSheets, validateHistory, qById, STORE, CURRENT };
})();`);
assert.notEqual(exposedScript, inlineScript);
const bankContext = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(root, 'cr_app_data.js'), 'utf8'), bankContext);
const fixture = JSON.parse(JSON.stringify({ questions: bankContext.window.CR_DATA.questions.slice(0, 3), metadata: bankContext.window.CR_DATA.metadata.slice(0, 1) }));
const engine = readFileSync(path.join(root, 'cr_explanation_engine.js'), 'utf8');
const now = Date.parse('2026-09-15T12:00:00Z');
const clone = value => JSON.parse(JSON.stringify(value));

function createApp({ storage = new Map(), failRead = false, failWrite = false } = {}) {
  const faults = { read: failRead, write: failWrite }, clock = { now };
  class FakeDate extends Date { constructor(...args) { super(...(args.length ? args : [clock.now])); } static now() { return clock.now; } }
  class FileReader {
    readAsText(file) { this.result = file.text; this.onload(); }
  }
  const app = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], contains: () => false };
  const context = vm.createContext({
    window: { CR_DATA: clone(fixture), matchMedia: () => ({ matches: true }), scrollTo: () => {}, scrollX: 0, scrollY: 0 },
    document: { getElementById: id => id === 'app' ? app : null, createTreeWalker: () => ({ nextNode: () => null }), body: { style: {} } },
    NodeFilter: { SHOW_TEXT: 4 },
    localStorage: {
      getItem(key) { if (faults.read) throw new Error('Storage denied'); return storage.get(key) ?? null; },
      setItem(key, value) { if (faults.write) throw new Error('QuotaExceededError'); storage.set(key, String(value)); },
      removeItem: key => storage.delete(key)
    },
    Date: FakeDate, FileReader, setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: callback => callback(), confirm: () => true, TextEncoder, Blob
  });
  vm.runInContext(engine, context);
  vm.runInContext(exposedScript, context, { filename: 'index.html' });
  return { api: context.__test, storage, faults, clock };
}

function session(id = 'sess_first') {
  const q = fixture.questions[0];
  return { id, createdAt: now - 1000, updatedAt: now, mode: 'topic', modeLabel: 'Practice', corpus: q.corpus, test: q.test, section: q.section, questionIds: [q.id], index: 0, answers: { [q.id]: { selected: 'A', correct: false } }, times: { [q.id]: 12.5 }, flags: {}, sectionTimes: {} };
}
function errorEntry(s, id = 'err_first') {
  const q = fixture.questions[0];
  return { id, sessionId: s.id, qid: q.id, selected: 'A', answer: q.answer, time: 12.5, status: 'Open', note: 'Original note', createdAt: now };
}
function history(s = session()) { return { sessions: [s], errors: [errorEntry(s)], notes: {} }; }

test('legacy backups normalize answers and merge without replacing saved records or notes', () => {
  const { api } = createApp(), original = history(); original.notes.lesson = 'Keep mine';
  assert.equal(api.saveStore(original), true);
  const incoming = history(); incoming.sessions[0].answers[fixture.questions[0].id].selected = 'B'; incoming.errors[0].note = 'Replace mine'; incoming.notes = { lesson: 'Incoming', another: 'New note' };
  incoming.sessions.push(session('sess_second'));
  incoming.errors.push(errorEntry(incoming.sessions[1], 'err_second'));
  const result = api.restoreBackupData(incoming), saved = api.loadStore();
  assert.equal(result.saved, true);
  assert.equal(result.addedSessions, 1);
  assert.equal(saved.sessions.length, 2);
  assert.equal(saved.sessions[0].answers[fixture.questions[0].id].selected, 'A');
  assert.equal(saved.sessions[0].answers[fixture.questions[0].id].qid, fixture.questions[0].id);
  assert.equal(saved.sessions[0].answers[fixture.questions[0].id].time, 12.5);
  assert.equal(saved.errors[0].note, 'Original note');
  assert.equal(saved.notes.lesson, 'Keep mine');
  assert.equal(saved.notes.another, 'New note');
  api.restoreBackupData(incoming);
  assert.equal(api.loadStore().sessions.length, 2);
  assert.equal(api.loadStore().errors.length, 2);
});

test('invalid nested backups are rejected entirely before writing history or active session', () => {
  const { api, storage } = createApp(); api.saveStore(history()); const before = new Map(storage);
  const mutations = [
    value => { value.sessions[0].id = 'bad" onclick="x'; },
    value => { value.sessions[0].questionIds = ['missing-question']; },
    value => { value.sessions[0].questionIds.push(value.sessions[0].questionIds[0]); },
    value => { value.sessions[0].answers[fixture.questions[0].id].selected = 'Z'; },
    value => { value.sessions[0].answers[fixture.questions[0].id].qid = 'wrong-question'; },
    value => { value.sessions[0].times[fixture.questions[0].id] = -1; },
    value => { value.sessions[0].times[fixture.questions[0].id] = '15'; },
    value => { value.sessions[0].index = 99; },
    value => { value.sessions[0].paused = 'false'; },
    value => { value.errors[0].qid = fixture.questions[1].id; },
    value => { value.errors[0].sessionId = 'sess_missing'; },
    value => { value.errors[0].selected = 'Z'; },
    value => { value.errors[0].note = {}; },
    value => { value.activeSession = { ...session('sess_active'), answers: [] }; },
    value => { value.version = 999; },
    value => { value.sessions.push(clone(value.sessions[0])); }
  ];
  for (const mutate of mutations) {
    const incoming = history(session('sess_incoming')); mutate(incoming);
    assert.throws(() => api.restoreBackupData(incoming));
    assert.deepEqual(storage, before);
    assert.equal(api.state.session, null);
  }
});

test('versioned backup includes paused active snapshot without changing live timing', () => {
  const { api, clock } = createApp(), q = fixture.questions[0];
  api.setupSession([q.id], { mode: 'test', modeLabel: 'Timed', section: q.section, sectionTimes: { [q.section]: 1 } });
  const startedAt = api.state.session._qStartedAt;
  clock.now += 6500;
  api.selectAnswer('A');
  const backup = api.exportBackupData();
  assert.equal(backup.format, 'cr-practice-lab');
  assert.equal(backup.version, 3);
  assert.equal(backup.activeSession.times[q.id], 6.5);
  assert.equal(backup.activeSession.paused, true);
  assert.equal(backup.activeSession.pausedSectionRemainingMs, 53500);
  assert.equal(backup.activeSession._qStartedAt, null);
  assert.equal(api.state.session._qStartedAt, startedAt);
  assert.notEqual(api.state.session.paused, true);
  const destination = createApp();
  assert.equal(destination.api.restoreBackupData(backup).restoredActive, true);
  assert.equal(destination.api.state.session.paused, true);
  assert.equal(destination.api.state.session.times[q.id], 6.5);
  assert.equal(destination.api.loadCurrent().pausedSectionRemainingMs, 53500);
});

test('restoring a backup preserves an already active practice', () => {
  const { api } = createApp(), active = session('sess_active');
  api.state.session = active; api.saveCurrent();
  const result = api.restoreBackupData({ ...history(), activeSession: session('sess_imported_active'), version: 2 });
  assert.equal(result.restoredActive, false);
  assert.equal(api.state.session.id, 'sess_active');
  assert.equal(api.loadCurrent().id, 'sess_active');
});

test('storage quota failure returns false and keeps current/history available in memory', () => {
  const { api, faults, storage } = createApp();
  faults.write = true;
  assert.equal(api.saveStore(history()), false);
  assert.equal(api.loadStore().sessions.length, 1);
  api.state.session = session('sess_active');
  assert.equal(api.saveCurrent(), false);
  assert.equal(api.loadCurrent().id, 'sess_active');
  assert.match(api.state.storageWarning, /only in this tab/);
  assert.equal(storage.size, 0);
  const backup = api.exportBackupData();
  assert.equal(backup.sessions.length, 1);
  assert.equal(backup.activeSession.id, 'sess_active');
  faults.write = false;
  assert.equal(api.saveStore(api.loadStore()), true);
  assert.equal(api.saveCurrent(), true);
  assert.equal(api.state.storageWarning, '');
});

test('storage access denied does not stop practice or discard unsaved state', () => {
  const { api } = createApp({ failRead: true, failWrite: true });
  assert.match(api.state.storageWarning, /storage is unavailable/);
  assert.equal(api.saveStore(history()), false);
  assert.equal(api.loadStore().sessions.length, 1);
  api.state.session = session('sess_active');
  assert.equal(api.saveCurrent(), false);
  assert.equal(api.loadCurrent().id, 'sess_active');
});

test('malformed stored JSON is protected from overwrite and exported for recovery', () => {
  const storage = new Map([['cr_practice_lab_v1', '{broken history'], ['cr_practice_current_v1', '{broken current']]);
  const { api } = createApp({ storage });
  assert.match(api.state.storageWarning, /protected from overwrite/);
  assert.equal(api.saveStore(history()), false);
  api.state.session = session('sess_new');
  assert.equal(api.saveCurrent(), false);
  assert.equal(storage.get(api.STORE), '{broken history');
  assert.equal(storage.get(api.CURRENT), '{broken current');
  const backup = api.exportBackupData();
  assert.equal(backup.sessions.length, 1);
  assert.equal(backup.recoveryData[api.STORE], '{broken history');
  assert.equal(backup.recoveryData[api.CURRENT], '{broken current');
  storage.clear(); api.clearPersistenceCache();
  assert.equal(api.saveStore(history()), true);
  assert.equal(api.saveCurrent(), true);
});

test('malformed nested persisted data is protected just like malformed JSON', () => {
  const storage = new Map([['cr_practice_lab_v1', JSON.stringify({ sessions: [null], errors: [] })]]);
  const { api } = createApp({ storage });
  assert.equal(api.loadStore().sessions.length, 0);
  assert.equal(api.saveStore(history()), false);
  assert.equal(JSON.parse(storage.get(api.STORE)).sessions[0], null);
});

test('clearing the active key also clears unsaved cache without losing history cache', () => {
  const { api, faults } = createApp(); faults.write = true;
  api.saveStore(history()); api.state.session = session('sess_active'); api.saveCurrent();
  assert.equal(api.clearCurrent(), true);
  assert.equal(api.loadCurrent(), null);
  assert.equal(api.loadStore().sessions.length, 1);
});

test('failed session finish retains active practice and retry does not duplicate history', () => {
  const { api, faults, clock } = createApp(), q = fixture.questions[0];
  api.setupSession([q.id], { mode: 'topic', modeLabel: 'Practice', section: q.section });
  clock.now += 7000; api.selectAnswer('A'); faults.write = true;
  api.finishSession();
  assert.ok(api.state.session);
  assert.equal(api.loadStore().sessions.length, 1);
  faults.write = false; api.finishSession();
  assert.equal(api.state.session, null);
  assert.equal(api.loadStore().sessions.length, 1);
  assert.equal(api.loadStore().sessions[0].times[q.id], 7);
});

test('file restore reports invalid JSON and supports selecting the same file again', () => {
  const { api, storage } = createApp(), target = { files: [{ text: '{bad JSON' }], value: 'backup.json' };
  api.restoreJson({ target });
  assert.match(api.state.toast, /Restore failed/);
  assert.equal(target.value, '');
  assert.equal(storage.size, 0);
});

function reviewEvent(id = 'rev_first', qid = fixture.questions[0].id) {
  return { id, version: 1, qid, rating: 'good', reviewedAt: now, dueAt: now + 3 * 86400000, intervalDays: 3, repetitions: 1, lapses: 0 };
}

test('legacy progress and backups default to an empty review history without losing saved review events', () => {
  const { api } = createApp();
  assert.deepEqual(clone(api.loadStore().reviewEvents), []);
  api.restoreBackupData(history());
  assert.deepEqual(clone(api.loadStore().reviewEvents), []);
  const withReviews = api.loadStore(); withReviews.reviewEvents.push(reviewEvent()); api.saveStore(withReviews);
  api.restoreBackupData({ ...history(session('legacy_v2')), format: 'cr-practice-lab', version: 2 });
  assert.equal(api.loadStore().reviewEvents.length, 1);
  assert.equal(api.loadStore().reviewEvents[0].id, 'rev_first');
});

test('version 3 backups round-trip all review events and their schedule metadata', () => {
  const origin = createApp(), data = history(); data.reviewEvents = [reviewEvent()];
  origin.api.saveStore(data);
  const backup = origin.api.exportBackupData();
  assert.equal(backup.version, 3);
  assert.deepEqual(clone(backup.reviewEvents), data.reviewEvents);
  const destination = createApp(), result = destination.api.restoreBackupData(backup);
  assert.equal(result.saved, true);
  assert.equal(result.addedReviews, 1);
  assert.deepEqual(clone(destination.api.loadStore().reviewEvents), data.reviewEvents);
  assert.deepEqual(clone(createApp({ storage: destination.storage }).api.loadStore().reviewEvents), data.reviewEvents);
});

test('review imports merge idempotently by ID while preserving an existing rating', () => {
  const { api } = createApp(), data = history(); data.reviewEvents = [reviewEvent()]; api.saveStore(data);
  const incoming = { ...history(), version: 3, reviewEvents: [{ ...reviewEvent(), rating: 'easy' }, reviewEvent('rev_second', fixture.questions[1].id)] };
  assert.equal(api.restoreBackupData(incoming).addedReviews, 1);
  assert.equal(api.restoreBackupData(incoming).addedReviews, 0);
  const saved = api.loadStore();
  assert.equal(saved.reviewEvents.length, 2);
  assert.equal(saved.reviewEvents.find(event => event.id === 'rev_first').rating, 'good');
});

test('invalid review records reject the entire backup before writes or active-session restoration', () => {
  const { api, storage } = createApp(); api.saveStore(history()); const before = new Map(storage);
  const mutations = [
    data => { data.reviewEvents = {}; },
    data => { data.reviewEvents[0] = null; },
    data => { delete data.reviewEvents[0].id; },
    data => { data.reviewEvents[0].id = 'bad" onclick="x'; },
    data => { data.reviewEvents[0].qid = 'unknown-question'; },
    data => { data.reviewEvents[0].rating = 'perfect'; },
    data => { data.reviewEvents[0].reviewedAt = '2026-09-15'; },
    data => { data.reviewEvents[0].reviewedAt = NaN; },
    data => { data.reviewEvents[0].reviewedAt = -1; },
    data => { data.reviewEvents[0].dueAt = now - 1; },
    data => { data.reviewEvents[0].intervalDays = 366; },
    data => { data.reviewEvents[0].repetitions = 1.5; },
    data => { data.reviewEvents[0].lapses = -1; },
    data => { data.reviewEvents[0].version = 999; },
    data => { data.reviewEvents.push(clone(data.reviewEvents[0])); }
  ];
  for (const mutate of mutations) {
    const incoming = { ...history(session('sess_incoming')), activeSession: session('sess_restore_active'), version: 3, reviewEvents: [reviewEvent()] };
    mutate(incoming);
    assert.throws(() => api.restoreBackupData(incoming));
    assert.deepEqual(storage, before);
    assert.equal(api.state.session, null);
  }
});

test('unreadable persisted review events are protected and preserved in recovery backups', () => {
  const malformed = { ...history(), reviewEvents: [{ ...reviewEvent(), rating: 'invalid' }] };
  const raw = JSON.stringify(malformed), storage = new Map([['cr_practice_lab_v1', raw]]);
  const { api } = createApp({ storage });
  assert.match(api.state.storageWarning, /protected from overwrite/);
  assert.equal(api.saveStore(history()), false);
  assert.equal(storage.get(api.STORE), raw);
  assert.equal(api.exportBackupData().recoveryData[api.STORE], raw);
});

test('review history survives a storage-quota failure in memory and in downloaded backups', () => {
  const { api, faults } = createApp(); faults.write = true;
  const data = history(); data.reviewEvents = [reviewEvent()];
  assert.equal(api.saveStore(data), false);
  assert.equal(api.loadStore().reviewEvents.length, 1);
  assert.deepEqual(clone(api.exportBackupData().reviewEvents), data.reviewEvents);
  faults.write = false;
  assert.equal(api.saveStore(api.loadStore()), true);
  assert.equal(api.loadStore().reviewEvents.length, 1);
});

test('Excel reports include recall-rating history and the derived review schedule', () => {
  const { api } = createApp(), data = history(); data.reviewEvents = [reviewEvent()];
  const sheets = api.buildReportSheets(data), log = sheets.find(sheet => sheet.name === 'Review History'), schedule = sheets.find(sheet => sheet.name === 'Review Schedule');
  assert.ok(log); assert.ok(schedule);
  assert.equal(log.rows.length, 2);
  assert.equal(log.rows[1][0], 'rev_first');
  assert.equal(log.rows[1][3], 'good');
  assert.equal(log.rows[1][5], 3);
  assert.equal(schedule.rows.length, 2);
  assert.equal(schedule.rows[1][0], fixture.questions[0].id);
  assert.equal(schedule.rows[1][4], false);
  assert.equal(schedule.rows[1][5], 3);
});
