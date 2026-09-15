// storage — one responsibility, with explicit module dependencies.
import { DATA, STORE, CURRENT, state, qById, copyData, isAnswerLocked } from './core.js';

const persistence = { cache: new Map(), dirty: new Set(), blocked: new Map(), inspected: new Set(), warnings: new Map() };

function storageWarning(key, message) { if (message) persistence.warnings.set(key, message); else persistence.warnings.delete(key); state.storageWarning = [...new Set(persistence.warnings.values())].join(' ') }

function clearPersistenceCache(key) {
  if (key) { persistence.cache.delete(key); persistence.dirty.delete(key); persistence.blocked.delete(key); persistence.inspected.delete(key); storageWarning(key, '') }
  else { persistence.cache.clear(); persistence.dirty.clear(); persistence.blocked.clear(); persistence.inspected.clear(); persistence.warnings.clear(); state.storageWarning = '' }
}

function dataObject(value, name) { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`); if (Object.keys(value).some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) throw new Error(`${name} contains an invalid field`); return value }

function dataId(value, name) { if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/.test(value)) throw new Error(`${name} is invalid`); return value }

function dataNumber(value, name) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 8640000000000000) throw new Error(`${name} must be a finite, non-negative number`); return value }

function dataText(value, name, fallback = '') { if (value == null) return fallback; if (typeof value !== 'string') throw new Error(`${name} must be text`); return value }

function validateSession(value) {
  const s = dataObject(value, 'Session'); dataId(s.id, 'Session ID'); dataNumber(s.createdAt, 'Session date');
  if (!Array.isArray(s.questionIds) || !s.questionIds.length || s.questionIds.length > DATA.questions.length || new Set(s.questionIds).size !== s.questionIds.length || s.questionIds.some(qid => !qById.has(qid))) throw new Error('Session contains invalid or duplicate question IDs');
  const ids = new Set(s.questionIds), answers = {}, times = {}, flags = {};
  Object.entries(dataObject(s.times ?? {}, 'Question times')).forEach(([qid, time]) => { if (!ids.has(qid)) throw new Error('Question time is outside its session'); times[qid] = dataNumber(time, 'Question time') });
  Object.entries(dataObject(s.answers ?? {}, 'Answers')).forEach(([qid, value]) => {
    if (!ids.has(qid)) throw new Error('Answer is outside its session'); const a = dataObject(value, 'Answer'), q = qById.get(qid), selected = dataText(a.selected, 'Selected option');
    if ((a.qid != null && a.qid !== qid) || (selected && !q.choices.some(choice => choice.label === selected))) throw new Error('Answer contains an invalid question or option');
    ['submitted', 'checked'].forEach(key => { if (a[key] != null && typeof a[key] !== 'boolean') throw new Error(`Answer ${key} must be true or false`) });
    ['time', 'committedAt', 'checkedAt'].forEach(key => { if (a[key] != null) dataNumber(a[key], `Answer ${key}`) });
    times[qid] ??= a.time ?? 0;
    answers[qid] = { ...a, qid, selected, correct: selected && q.answer ? selected === q.answer : null, time: times[qid] };
  });
  Object.entries(dataObject(s.flags ?? {}, 'Flags')).forEach(([qid, flag]) => { if (!ids.has(qid) || typeof flag !== 'boolean') throw new Error('Question flag is invalid'); flags[qid] = flag });
  const normalized = { ...s, questionIds: [...s.questionIds], answers, times, flags, index: s.index ?? 0 };
  if (!Number.isInteger(normalized.index) || normalized.index < 0 || normalized.index >= normalized.questionIds.length) throw new Error('Session question index is invalid');
  ['mode', 'modeLabel', 'corpus', 'test', 'section', 'sectionLabel', 'currentSection'].forEach(key => { normalized[key] = dataText(s[key], `Session ${key}`) });
  ['updatedAt', 'startedAt', 'completedAt', 'sectionStartedAt', 'sectionEndsAt', 'pausedAt', 'pausedSectionRemainingMs', 'reviewSectionRemainingMs', '_qStartedAt'].forEach(key => { if (s[key] != null) dataNumber(s[key], `Session ${key}`) });
  ['sectionTimes', 'sectionRemainingMs'].forEach(key => { normalized[key] = { ...dataObject(s[key] ?? {}, key) }; Object.values(normalized[key]).forEach(number => { if (number != null) dataNumber(number, key) }) });
  if (s.paused != null && typeof s.paused !== 'boolean') throw new Error('Session pause status is invalid');
  if (isAnswerLocked(answers[normalized.questionIds[normalized.index]])) normalized._qStartedAt = null;
  return normalized;
}

function validateHistory(value, existingSessions = []) {
  const data = dataObject(value, 'Progress'); if (!Array.isArray(data.sessions) || !Array.isArray(data.errors)) throw new Error('Progress must contain sessions and errors');
  const sessions = data.sessions.map(validateSession), sessionMap = new Map(existingSessions.map(s => [s.id, s]));
  if (new Set(sessions.map(s => s.id)).size !== sessions.length) throw new Error('Duplicate session IDs in backup');
  sessions.forEach(s => sessionMap.set(s.id, s));
  const errors = data.errors.map(value => {
    const e = dataObject(value, 'Error-log entry'); dataId(e.id, 'Error ID'); dataId(e.sessionId, 'Error session ID');
    const session = sessionMap.get(e.sessionId), q = qById.get(e.qid); if (!q || !session?.questionIds.includes(e.qid)) throw new Error('Error-log question does not belong to its session');
    const selected = dataText(e.selected, 'Error selected option'); if (selected && !q.choices.some(choice => choice.label === selected)) throw new Error('Error-log option is invalid');
    if (e.answer != null && e.answer !== '' && !q.choices.some(choice => choice.label === e.answer)) throw new Error('Error-log answer key is invalid');
    const status = e.status ?? 'Open'; if (!['Open', 'Reviewed'].includes(status)) throw new Error('Error review status is invalid');
    return { ...e, selected, answer: q.answer || '', time: dataNumber(e.time ?? 0, 'Error time'), createdAt: dataNumber(e.createdAt ?? session.createdAt, 'Error date'), status, note: dataText(e.note, 'Error note'), category: dataText(e.category, 'Error category'), corpus: dataText(e.corpus, 'Error source', q.corpus), test: dataText(e.test, 'Error test', q.test), section: dataText(e.section, 'Error section', q.section), number: q.number };
  });
  if (new Set(errors.map(e => e.id)).size !== errors.length) throw new Error('Duplicate error IDs in backup');
  const notes = { ...dataObject(data.notes ?? {}, 'Notes') }; Object.entries(notes).forEach(([key, note]) => dataText(note, `Note ${key}`));
  if (data.reviewEvents != null && !Array.isArray(data.reviewEvents)) throw new Error('Review history must be an array');
  const reviewEvents = (data.reviewEvents ?? []).map(value => {
    const event = dataObject(value, 'Review event'); dataId(event.id, 'Review event ID');
    return window.CRSpacedRepetition.validateReviewEvent(event, qById);
  });
  if (new Set(reviewEvents.map(event => event.id)).size !== reviewEvents.length) throw new Error('Duplicate review event IDs in backup');
  return { sessions, errors, notes, reviewEvents };
}

function readPersisted(key, fallback, validate) {
  if (persistence.dirty.has(key) || persistence.blocked.has(key)) return copyData(persistence.cache.get(key) ?? fallback);
  let raw;
  try { raw = localStorage.getItem(key) } catch { storageWarning(key, 'Browser storage is unavailable. Progress is kept only in this tab; download a backup before closing.'); return copyData(persistence.cache.get(key) ?? fallback) }
  persistence.inspected.add(key);
  try { const data = raw == null ? fallback : validate(JSON.parse(raw)); persistence.cache.set(key, data); return copyData(data) }
  catch { persistence.blocked.set(key, raw); persistence.cache.set(key, fallback); storageWarning(key, 'Saved browser data could not be read and has been protected from overwrite. Download a recovery backup before clearing progress.'); return copyData(fallback) }
}

function writePersisted(key, value) {
  if (!persistence.inspected.has(key)) { if (key === STORE) loadStore(); else loadCurrent() }
  let serialized; try { serialized = JSON.stringify(value); persistence.cache.set(key, JSON.parse(serialized)); persistence.dirty.add(key) } catch { storageWarning(key, 'Progress could not be prepared for saving. Keep this tab open and download a backup.'); return false }
  if (persistence.blocked.has(key)) return false;
  try { localStorage.setItem(key, serialized); persistence.dirty.delete(key); storageWarning(key, ''); return true }
  catch { storageWarning(key, 'Browser storage could not save progress. It is kept only in this tab; download a backup before closing.'); return false }
}

function loadStore() { return readPersisted(STORE, { sessions: [], errors: [], notes: {}, reviewEvents: [] }, validateHistory) }

function saveStore(s) { return writePersisted(STORE, { ...s, reviewEvents: s.reviewEvents ?? [] }) }

function loadCurrent() { return readPersisted(CURRENT, null, value => value == null ? null : validateSession(value)) }

function saveCurrent() { if (!state.session) return true; state.session.updatedAt = Date.now(); return writePersisted(CURRENT, state.session) }

function clearCurrent() {
  try { localStorage.removeItem(CURRENT); clearPersistenceCache(CURRENT); return true }
  catch { state.storageWarning = 'The saved session could not be cleared. Download a backup and check browser storage access.'; return false }
}

function store() { return loadStore() }

export { persistence, storageWarning, clearPersistenceCache, dataObject, dataId, dataNumber, dataText, validateSession, validateHistory, readPersisted, writePersisted, loadStore, saveStore, loadCurrent, saveCurrent, clearCurrent, store };
