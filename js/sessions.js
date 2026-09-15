// sessions — one responsibility, with explicit module dependencies.
import { DATA, state, app, qById, meta, uid, isAnswerLocked, fmtSec, getQuestions } from './core.js';
import { saveStore, loadCurrent, saveCurrent, clearCurrent, store } from './storage.js';
import { questionAttempts, sessionSummary } from './analytics.js';
import { notify, scrollQuestionTop, render } from './ui.js';

function discardSession() {
  if (!state.session || !confirm('Discard the unfinished session? Completed sessions and notes will be kept.')) return;
  if (!clearCurrent()) { render(); return }
  state.session = null; render()
}

function setupSession(questionIds, cfg) { if (state.session) { notify('A session is already in progress. Resume it or discard it before starting another.'); return } if (!questionIds.length || questionIds.some(id => !qById.has(id))) { notify('No valid questions are available for this session.'); return } const now = Date.now(), firstSection = cfg.firstSection || cfg.section || 'Main', sectionTimes = cfg.sectionTimes || {}, firstMinutes = Number(sectionTimes[firstSection]) || 0; state.session = { id: uid('sess'), createdAt: now, updatedAt: now, mode: cfg.mode, modeLabel: cfg.modeLabel, corpus: cfg.corpus || 'Mixed', test: cfg.test || 'Custom', section: cfg.section || 'Main', sectionLabel: cfg.sectionLabel || cfg.section || 'Main', questionIds, answers: {}, times: {}, flags: {}, index: 0, sectionTimes, currentSection: firstSection, sectionStartedAt: firstMinutes ? now : null, sectionEndsAt: cfg.sectionEndsAt || (firstMinutes ? now + firstMinutes * 60 * 1000 : null), startedAt: now }; startQuestionTimer(); state.view = 'practice'; render() }

function startQuestionTimer() {
  const s = state.session; if (!s || s.paused) return;
  const now = Date.now(), locked = isAnswerLocked(s.answers[s.questionIds[s.index]]);
  if (locked) {
    s._qStartedAt = null;
    if (s.sectionEndsAt != null) { s.reviewSectionRemainingMs = Math.max(0, s.sectionEndsAt - now); s.sectionEndsAt = null }
  } else {
    if (s.reviewSectionRemainingMs != null) { s.sectionEndsAt = now + s.reviewSectionRemainingMs; s.reviewSectionRemainingMs = null }
    if (s._qStartedAt == null) s._qStartedAt = now;
  }
  saveCurrent()
}

function stopQuestionTimer(now = Date.now()) {
  const s = state.session; if (!s) return;
  const qid = s.questionIds[s.index], began = s._qStartedAt;
  s._qStartedAt = null;
  if (!qid || began == null || s.paused || isAnswerLocked(s.answers[qid])) return;
  const ended = s.sectionEndsAt != null ? Math.min(now, s.sectionEndsAt) : now;
  s.times[qid] = (s.times[qid] || 0) + Math.max(0, (ended - began) / 1000);
  if (s.answers[qid]) s.answers[qid].time = s.times[qid]
}

function pauseSession(shouldRender = true, reason = 'manual') { const s = state.session; if (!s || s.paused) return; stopQuestionTimer(); const now = Date.now(); s.paused = true; s.pauseReason = reason; s.pausedAt = now; s._qStartedAt = null; s.pausedSectionRemainingMs = s.sectionEndsAt ? Math.max(0, s.sectionEndsAt - now) : null; if (s.sectionEndsAt) s.sectionEndsAt = null; saveCurrent(); if (shouldRender) render() }

function continueSession() { const s = state.session; if (!s || !s.paused) return; s.paused = false; s.pauseReason = null; if (s.pausedSectionRemainingMs !== null && s.pausedSectionRemainingMs !== undefined) s.sectionEndsAt = Date.now() + s.pausedSectionRemainingMs; s.pausedAt = null; s.pausedSectionRemainingMs = null; startQuestionTimer(); render() }

function currentQ() { return state.session ? getQuestions(state.session.questionIds)[state.session.index] : null }

function sectionForIndex(idx) { const q = getQuestions(state.session.questionIds)[idx]; return q?.section || 'Main' }

function setSectionTimer(sec) {
  const s = state.session; if (!s || sec === s.currentSection) return;
  const now = Date.now(); s.sectionRemainingMs ??= {};
  const remaining = s.reviewSectionRemainingMs ?? (s.sectionEndsAt != null ? Math.max(0, s.sectionEndsAt - now) : null);
  if (remaining != null) s.sectionRemainingMs[s.currentSection] = remaining;
  const minutes = Number(s.sectionTimes?.[sec]) || 0;
  s.currentSection = sec; s.reviewSectionRemainingMs = null;
  s.sectionStartedAt = minutes ? now : null;
  s.sectionEndsAt = minutes ? now + (s.sectionRemainingMs[sec] ?? minutes * 60 * 1000) : null
}

function tickTimer() { if (!state.session || state.session.paused || isAnswerLocked(state.session.answers[state.session.questionIds[state.session.index]]) || state.view !== 'practice') return; const s = state.session, timerEl = app.querySelector('[data-live-timer]'); if (s.sectionEndsAt) { const remaining = Math.max(0, Math.ceil((s.sectionEndsAt - Date.now()) / 1000)); if (timerEl) { timerEl.textContent = `Time ${fmtSec(remaining)}`; timerEl.classList.toggle('bad', remaining < 60) } if (remaining <= 0) { const qs = getQuestions(s.questionIds), nextIdx = qs.findIndex((q, i) => i > s.index && q.section !== s.currentSection); if (nextIdx >= 0) { commitCurrentResponse(); stopQuestionTimer(); s.index = nextIdx; setSectionTimer(qs[nextIdx].section); startQuestionTimer(); render() } else finishSession() } } else if (timerEl) { const qid = s.questionIds[s.index], now = Date.now(), live = (s.times[qid] || 0) + Math.max(0, (now - (s._qStartedAt ?? now)) / 1000); timerEl.textContent = `Q time ${fmtSec(live)}` } }

function finishSession() {
  if (!state.session || state.session.paused) return; commitCurrentResponse(); stopQuestionTimer(); const s = state.session; s.completedAt = Date.now(); const storeObj = store(); storeObj.sessions = storeObj.sessions.filter(saved => saved.id !== s.id); storeObj.sessions.push({ ...s, _qStartedAt: undefined, _qStart: undefined }); delete storeObj.sessions.at(-1)._qStartedAt; delete storeObj.sessions.at(-1)._qStart; // keep clean
  const errors = storeObj.errors || []; getQuestions(s.questionIds).forEach(q => { const a = s.answers[q.id], category = !a?.selected ? 'Skipped' : a.correct === false ? 'Incorrect' : s.flags[q.id] ? 'Flagged' : ''; if (category && !errors.some(e => e.sessionId === s.id && e.qid === q.id)) errors.push({ id: uid('err'), sessionId: s.id, qid: q.id, corpus: q.corpus, test: q.test, section: q.section, number: q.number, selected: a?.selected || '', answer: q.answer, time: s.times[q.id] || 0, category, status: 'Open', note: '', createdAt: s.createdAt }) }); storeObj.errors = errors; if (!saveStore(storeObj)) { notify('Your session is still open because progress could not be saved. Download a backup before closing this tab.'); return } if (!clearCurrent()) { render(); return } const completed = state.session; state.session = null; state.view = 'result'; state._result = completed; state.resultFilter = 'all'; state.pages.result = 1; render()
}

function startSelectedTest(source, test, section, full) { const ms = meta.filter(m => m.corpus === source && m.test === test); if (!ms.length) { notify('That test is unavailable.'); return } let sections = full ? ms : [ms.find(m => m.section === section) || ms[0]]; const ids = sections.flatMap(m => DATA.questions.filter(q => q.corpus === source && q.test === test && q.section === m.section).sort((a, b) => a.number - b.number).map(q => q.id)); const times = {}; sections.forEach(m => { if (m.timing_minutes) times[m.section] = m.timing_minutes }); setupSession(ids, { mode: 'test', modeLabel: full ? 'Full CAT set' : 'CAT test practice', corpus: 'CAT', test, section: sections.length === 1 ? sections[0].section : 'Full set', sectionLabel: sections.length === 1 ? sections[0].section : 'Full set', sectionTimes: times, firstSection: sections[0].section }); }

function startTopic() {
  const st = store(), selectedPool = state.topicFilter.size ? DATA.questions.filter(q => state.topicFilter.has(q.topic)) : DATA.questions.slice(), n = Math.min(Math.max(1, Math.floor(Number(state.topicCount) || 10)), Math.min(50, selectedPool.length)), attemptedIds = new Set((st.sessions || []).flatMap(s => Object.entries(s.answers || {}).filter(([, a]) => a?.selected).map(([id]) => id)));
  const pool = selectedPool.filter(q => !attemptedIds.has(q.id)).length >= n ? selectedPool.filter(q => !attemptedIds.has(q.id)) : selectedPool.slice();
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]] } return arr };
  const groups = {}; pool.forEach(q => (groups[q.topic] ??= []).push(q)); Object.values(groups).forEach(shuffle);
  let topicOrder = shuffle(Object.keys(groups)), ids = [];
  if (state.topicStrategy === 'weak' && st.sessions.length) {
    const scores = {}; (st.sessions || []).flatMap(questionAttempts).forEach(a => { const q = qById.get(a.qid); if (!q || !a.selected || !a.keyed) return; scores[q.topic] ??= { a: 0, c: 0 }; scores[q.topic].a++; scores[q.topic].c += a.correct ? 1 : 0 });
    topicOrder.sort((a, b) => ((scores[a]?.c || 0) + 2) / ((scores[a]?.a || 0) + 4) - (((scores[b]?.c || 0) + 2) / ((scores[b]?.a || 0) + 4)));
    topicOrder = topicOrder.flatMap((topic, i, all) => Array(Math.max(1, 4 - Math.floor(i * 4 / all.length))).fill(topic));
  }
  while (ids.length < n && topicOrder.length) { const nextOrder = []; topicOrder.forEach(topic => { if (ids.length < n && groups[topic].length) ids.push(groups[topic].pop().id); if (groups[topic].length) nextOrder.push(topic) }); topicOrder = nextOrder }
  if (!ids.length) { notify('No questions match that selection.'); return }
  setupSession(ids, { mode: 'topic', modeLabel: 'Focused CAT practice', corpus: 'CAT', test: 'Custom set', section: 'Custom', sectionLabel: 'Custom', sectionTimes: {} })
}

function selectAnswer(label) { const q = currentQ(); if (!q || !state.session || state.session.paused || isAnswerLocked(state.session.answers[q.id]) || !q.choices.some(c => c.label === label)) return; const previous = state.session.answers[q.id] || {}; state.session.answers[q.id] = { ...previous, qid: q.id, selected: label, correct: q.answer ? q.answer === label : null, checked: false, submitted: false }; saveCurrent(); render() }

function clearResponse() { const q = currentQ(), a = q ? state.session?.answers?.[q.id] : null; if (!q || state.session.paused || !a?.selected || isAnswerLocked(a)) return; delete state.session.answers[q.id]; saveCurrent(); render() }

function commitCurrentResponse() {
  const s = state.session, q = currentQ(), a = q ? s?.answers[q.id] : null;
  if (!s || s.paused || !a?.selected || isAnswerLocked(a)) return;
  const now = Date.now(); stopQuestionTimer(now);
  a.submitted = true; a.committedAt = now; a.time = s.times[q.id] || 0;
  saveCurrent()
}

function checkAnswer() { const q = currentQ(), a = q ? state.session?.answers?.[q.id] : null; if (!q || state.session.paused || !a?.selected || a.checked) return; commitCurrentResponse(); a.checked = true; a.checkedAt = Date.now(); startQuestionTimer(); render() }

function move(dir) { const s = state.session; if (!s || s.paused || ![-1, 1].includes(dir)) return; const ni = s.index + dir; if (ni < 0) return; if (ni >= s.questionIds.length) { finishSession(); return } goTo(ni) }

function goTo(i) { const s = state.session; if (!s || s.paused || !Number.isInteger(i) || i < 0 || i >= s.questionIds.length || i === s.index) return; commitCurrentResponse(); stopQuestionTimer(); const sec = sectionForIndex(i); if (sec !== s.currentSection) setSectionTimer(sec); s.index = i; startQuestionTimer(); render(); scrollQuestionTop() }

function jumpToQuestion(kind) {
  const s = state.session; if (!s || s.paused) return;
  for (let offset = 1; offset < s.questionIds.length; offset++) {
    const index = (s.index + offset) % s.questionIds.length, id = s.questionIds[index];
    if (kind === 'flagged' ? s.flags[id] : !isAnswerLocked(s.answers[id])) { goTo(index); return }
  }
  notify(kind === 'flagged' ? 'No other flagged questions.' : 'No other unanswered questions.')
}

function resumeCurrent() { const cur = loadCurrent(); if (!cur) { state.view = 'topics'; render(); return } state.session = cur; state.view = 'practice'; if (cur.paused && cur.pauseReason === 'navigation') { continueSession(); return } if (!cur.paused) { if (!cur.sectionEndsAt && cur.reviewSectionRemainingMs == null && cur.mode === 'test') { const sec = cur.currentSection || sectionForIndex(cur.index), minutes = Number(cur.sectionTimes?.[sec]) || 0, began = cur.sectionStartedAt || cur.startedAt || cur.createdAt; cur.currentSection = sec; cur.sectionStartedAt = began; cur.sectionEndsAt = minutes ? began + minutes * 60 * 1000 : null } startQuestionTimer() } saveCurrent(); render() }

export { discardSession, setupSession, startQuestionTimer, stopQuestionTimer, pauseSession, continueSession, currentQ, sectionForIndex, setSectionTimer, tickTimer, finishSession, startSelectedTest, startTopic, selectAnswer, clearResponse, commitCurrentResponse, checkAnswer, move, goTo, jumpToQuestion, resumeCurrent };
