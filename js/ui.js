// ui — one responsibility, with explicit module dependencies.
import { STORE, CURRENT, TOPIC_FAMILY, state, app, esc, isAnswerLocked, displayTestTitle } from './core.js';
import { storageWarning, clearPersistenceCache, saveStore, saveCurrent, store } from './storage.js';
import { discardSession, pauseSession, continueSession, currentQ, finishSession, startSelectedTest, startTopic, selectAnswer, clearResponse, checkAnswer, move, goTo, jumpToQuestion, resumeCurrent } from './sessions.js';
import { nav, dashboard, testsView, topicsView, filteredErrors, errorsView, reportsView, pauseOverlay, practiceView, resultView, resetWarning } from './views.js';
import { solutionHTML, analysisModal } from './solutions-ui.js';
import { backupJson, restoreJson, exportXlsx } from './exports.js';
import { reviewView, reviewDashboardCard, bindReview } from './review-ui.js';
import { helpView, bindHelp } from './help-ui.js';
import { libraryView, bindLibrary } from './library-ui.js';

let toastTimer = null, saveTimer = null, renderedViewKey = '', lastModalKey = '', modalReturnFocus = null;

function notify(msg) { state.toast = msg; render(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { state.toast = null; render() }, 2200) }

function changeView(view) {
  if (state.view === 'practice' && view !== 'practice' && state.session && !state.session.paused) pauseSession(false, 'navigation');
  if (view === 'errors') state.errorSessionId = null;
  state.view = view; state.analysis = null; render()
}

function reviewMistakes() { const s = state._result; if (!s) return; changeView('errors'); state.errorSessionId = s.id; state.errorStatus = 'All'; state.errorFilter = 'All'; state.errorCategory = 'All'; state.errorSearch = ''; state.pages.errors = 1; render() }

function analyzeSession(id) { const s = (store().sessions || []).find(x => x.id === id); if (!s) { notify('That saved session could not be found.'); return } state._result = s; state.resultFilter = 'all'; state.pages.result = 1; changeView('result') }

function openQuestionAnalysis(sessionId, qid) { state.analysis = { sessionId, qid }; render() }

function bind() {
  bindReview(); bindLibrary(); bindHelp();
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) themeSelect.onchange = () => window.CRTheme?.setPreference(themeSelect.value);
  app.querySelectorAll('[data-view]').forEach(b => b.onclick = () => changeView(b.dataset.view)); app.querySelectorAll('[data-start-test]').forEach(b => b.onclick = () => startSelectedTest(b.dataset.source, b.dataset.startTest, b.dataset.section, false)); app.querySelectorAll('[data-start-fulltest]').forEach(b => b.onclick = () => startSelectedTest(b.dataset.source, b.dataset.startFulltest, null, true));
  const tcount = document.getElementById('topic-count'); if (tcount) tcount.oninput = () => { state.topicCount = Math.max(1, Math.min(50, Math.floor(Number(tcount.value) || 10))) }; app.querySelectorAll('input[name="strategy"]').forEach(r => r.onchange = () => { state.topicStrategy = r.value }); app.querySelectorAll('[data-topic]').forEach(c => c.onchange = () => { const t = c.dataset.topic; c.checked ? state.topicFilter.add(t) : state.topicFilter.delete(t); render() });
  app.querySelectorAll('[data-action="start-topic"]').forEach(b => b.onclick = startTopic); app.querySelectorAll('[data-action="resume"]').forEach(b => b.onclick = resumeCurrent); app.querySelectorAll('[data-action="discard"]').forEach(b => b.onclick = discardSession); app.querySelectorAll('[data-action="prev"]').forEach(b => b.onclick = () => move(-1)); app.querySelectorAll('[data-action="next"]').forEach(b => b.onclick = () => move(1)); app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goTo(Number(b.dataset.go))); app.querySelectorAll('[data-action="flag"]').forEach(b => b.onclick = () => { const q = currentQ(); state.session.flags[q.id] = !state.session.flags[q.id]; saveCurrent(); render() }); app.querySelectorAll('[data-action="end"]').forEach(b => b.onclick = () => { if (confirm('End this session and score it now?')) finishSession() }); app.querySelectorAll('input[name="answer"]').forEach(i => i.onchange = () => selectAnswer(i.value)); app.querySelectorAll('[data-view="result"]').forEach(b => b.onclick = () => changeView('result')); app.querySelectorAll('[data-action="review-mistakes"]').forEach(b => b.onclick = reviewMistakes);
  const ef = document.getElementById('error-filter'); if (ef) ef.onchange = () => { state.errorFilter = ef.value; state.pages.errors = 1; render() }; const es = document.getElementById('error-status'); if (es) es.onchange = () => { state.errorStatus = es.value; state.pages.errors = 1; render() }; app.querySelectorAll('[data-save-note]').forEach(b => b.onclick = () => saveNote(b.dataset.saveNote)); app.querySelectorAll('[data-toggle-error]').forEach(b => b.onclick = () => toggleError(b.dataset.toggleError));
  app.querySelectorAll('[data-action="export-xlsx"]').forEach(b => b.onclick = exportXlsx); app.querySelectorAll('[data-action="backup"]').forEach(b => b.onclick = backupJson); const rf = document.getElementById('restore-json'); if (rf) rf.onchange = restoreJson; app.querySelectorAll('[data-action="request-reset"]').forEach(b => b.onclick = () => { state.confirmReset = true; render() }); app.querySelectorAll('[data-action="cancel-reset"]').forEach(b => b.onclick = () => { state.confirmReset = false; render() }); app.querySelectorAll('[data-action="confirm-reset"]').forEach(b => b.onclick = removeAllProgress);
  app.querySelectorAll('[data-action="pause-session"]').forEach(b => b.onclick = pauseSession); app.querySelectorAll('[data-action="continue-session"]').forEach(b => b.onclick = continueSession);
  app.querySelectorAll('[data-analyze-session]').forEach(b => b.onclick = () => analyzeSession(b.dataset.analyzeSession)); app.querySelectorAll('[data-analyze-question]').forEach(b => b.onclick = () => openQuestionAnalysis(b.dataset.sessionId, b.dataset.analyzeQuestion)); app.querySelectorAll('[data-action="close-analysis"]').forEach(b => b.onclick = () => { state.analysis = null; render() });
  app.querySelectorAll('[data-page-key]').forEach(b => b.onclick = () => changePage(b.dataset.pageKey, b.dataset.page));
  app.querySelectorAll('[data-action="clear-response"]').forEach(b => b.onclick = clearResponse); app.querySelectorAll('[data-action="check-answer"]').forEach(b => b.onclick = checkAnswer);
  app.querySelectorAll('[data-note]').forEach(el => el.oninput = () => { state.noteDrafts[el.dataset.note] = el.value });
  app.querySelectorAll('[data-jump]').forEach(button => button.onclick = () => jumpToQuestion(button.dataset.jump));
  const search = document.getElementById('error-search'); if (search) search.oninput = () => { state.errorSearch = search.value; state.pages.errors = 1; render() };
  const category = document.getElementById('error-category'); if (category) category.onchange = () => { state.errorCategory = category.value; state.pages.errors = 1; render() };
  const reviewFilter = document.getElementById('result-filter'); if (reviewFilter) reviewFilter.onchange = () => { state.resultFilter = reviewFilter.value; state.pages.result = 1; render() };
  app.querySelectorAll('[data-action="all-errors"]').forEach(button => button.onclick = () => { state.errorSessionId = null; state.pages.errors = 1; render() });
  if (document.addEventListener) document.onkeydown = handleDialogKeys;
}

function saveNote(id) {
  const el = [...app.querySelectorAll('[data-note]')].find(node => node.dataset.note === id), st = store(), e = (st.errors || []).find(x => x.id === id);
  if (!e) return;
  e.note = state.noteDrafts[id] ?? el?.value ?? e.note ?? '';
  if (saveStore(st)) { delete state.noteDrafts[id]; notify('Note saved.') } else render()
}

function toggleError(id) { const st = store(), e = (st.errors || []).find(x => x.id === id); if (e) { e.status = e.status === 'Reviewed' ? 'Open' : 'Reviewed'; if (saveStore(st)) notify('Review status updated.'); else render() } }

function removeAllProgress() { try { localStorage.removeItem(STORE); localStorage.removeItem(CURRENT); clearPersistenceCache() } catch { state.storageWarning = 'Progress could not be cleared. Check browser storage access.'; render(); return } state.noteDrafts = {}; state.recall = null; state.reviewFilter = 'due'; state.libraryFilter = 'authored'; state.librarySearch = ''; state.errorSessionId = null; state.errorSearch = ''; state.errorCategory = 'All'; state.session = null; state._result = null; state.analysis = null; state.pages = {}; state.confirmReset = false; state.view = 'dashboard'; state.selectedTest = null; state.selectedSection = null; state.topicFilter.clear(); state.topicCount = 10; state.topicStrategy = 'random'; state.errorFilter = 'All'; state.errorStatus = 'Open'; notify('All progress has been removed. The app is ready for a fresh start.') }

function applyPagination(root, itemSelector, key, pageSize, scrollClass) {
  if (!root) return;
  const all = [...root.querySelectorAll(itemSelector)], items = all.filter(item => item.dataset.filteredOut !== 'true');
  const pages = Math.max(1, Math.ceil(items.length / pageSize)), page = Math.min(Math.max(1, Number(state.pages[key]) || 1), pages);
  state.pages[key] = page;
  root.classList.add('scroll-region'); if (scrollClass) root.classList.add(scrollClass);
  root.dataset.scrollKey = key; root.tabIndex = 0; root.setAttribute('role', 'region'); root.setAttribute('aria-label', key + ' list');
  all.forEach(item => item.hidden = true);
  items.forEach((item, i) => item.hidden = i < (page - 1) * pageSize || i >= page * pageSize);
  if (pages > 1) root.insertAdjacentHTML('afterend', `<nav class="pagination" aria-label="${esc(key)} pagination"><button class="btn small" data-page-key="${key}" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button><button class="btn small" data-page-key="${key}" data-page="${page - 1}" aria-label="Previous page" ${page === 1 ? 'disabled' : ''}>←</button><span class="page-status" role="status">${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, items.length)} of ${items.length} · Page ${page}/${pages}</span><button class="btn small" data-page-key="${key}" data-page="${page + 1}" aria-label="Next page" ${page === pages ? 'disabled' : ''}>→</button><button class="btn small" data-page-key="${key}" data-page="${pages}" ${page === pages ? 'disabled' : ''}>Last</button></nav>`)
}

function changePage(key, page) { state.pages[key] = Number(page) || 1; render(); requestAnimationFrame(() => { const region = app.querySelector(`[data-scroll-key="${key}"]`); if (region) { region.scrollTop = 0; region.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' }) } }) }

function scrollQuestionTop() { requestAnimationFrame(() => app.querySelector('.q-panel')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })) }

function decorateTaxonomy() {
  if (state.view === 'review') applyPagination(app.querySelector('.review-queue-list'), '.review-item', 'review', 8, 'review-scroll');
  if (state.view === 'library') applyPagination(app.querySelector('.library-list'), '.review-item', 'library', 8, 'review-scroll');
  if (state.view === 'practice') {
    const q = currentQ(), attempt = q ? state.session?.answers?.[q.id] : null, metaLine = app.querySelector('.q-header .tiny.muted'), timerEl = app.querySelector('.section-head .row.wrap .pill:last-child'), flagButton = app.querySelector('[data-action="flag"]'), choices = app.querySelector('.choice')?.parentElement;
    if (q && metaLine) metaLine.textContent = `${q.family} · ${q.type} · ${displayTestTitle(q.corpus, q.test, q.section)}`;
    if (timerEl) timerEl.dataset.liveTimer = 'true';
    if (flagButton && !state.session?.paused) flagButton.insertAdjacentHTML('beforebegin', '<button class="btn small" data-action="pause-session">Pause</button>');
    const actions = app.querySelector('.q-actions'); if (actions?.firstElementChild) actions.firstElementChild.insertAdjacentHTML('afterend', `<div class="row wrap response-tools"><button class="btn small" data-action="clear-response" ${!attempt?.selected || isAnswerLocked(attempt) ? 'disabled' : ''}>Clear response</button><button class="btn small primary" data-action="check-answer" ${!attempt?.selected || attempt?.checked ? 'disabled' : ''}>${attempt?.checked ? 'Answer checked' : 'Check answer'}</button></div>`);
    if (q && attempt?.checked && choices) { choices.querySelectorAll('input[name="answer"]').forEach(input => input.disabled = true); choices.insertAdjacentHTML('beforeend', solutionHTML(q, attempt)) }
  }
  if (state.view === 'topics') app.querySelectorAll('.topic-card').forEach(card => { const topic = card.querySelector('[data-topic]')?.dataset.topic, label = card.querySelector('.tiny.muted'); if (topic && label) label.textContent = `${TOPIC_FAMILY[topic] || 'Other'} · CAT question type` });
  if (state.view === 'dashboard') { const backup = app.querySelector('[data-action="backup"]'); if (backup) backup.insertAdjacentHTML('afterend', '<button class="btn small danger" data-action="request-reset">Remove all progress</button>') }
  if (state.view === 'errors') { const rows = filteredErrors(); app.querySelectorAll('.review-item').forEach((item, i) => { const e = rows[i], status = item.querySelector('.row.between.wrap .pill'); if (!e) return; if (status) status.insertAdjacentHTML('beforebegin', `<span class="pill ${e.category === 'Incorrect' ? 'bad' : 'warn'}">${esc(e.category || 'Incorrect')}</span>`); item.insertAdjacentHTML('beforeend', `<button class="btn small" style="margin-top:9px" data-analyze-question="${esc(e.qid)}" data-session-id="${esc(e.sessionId)}">View solution</button>`) }) }
  if (state.view === 'result' && state._result) {
    const session = state._result, items = [...app.querySelectorAll('.review-item')], list = app.querySelector('.result-page .grid.two .card:nth-child(2)>.stack');
    const filters = [['all', 'All questions'], ['incorrect', 'Incorrect'], ['unanswered', 'Unanswered'], ['flagged', 'Flagged'], ['correct', 'Correct'], ['unscored', 'Not scored']];
    items.forEach(item => {
      const qid = item.dataset.qid;
      item.dataset.filteredOut = String(state.resultFilter !== 'all' && (state.resultFilter === 'flagged' ? !session.flags?.[qid] : item.dataset.reviewStatus !== state.resultFilter));
      if (qid) item.insertAdjacentHTML('beforeend', `<button class="btn small" style="margin-top:9px" data-analyze-question="${esc(qid)}" data-session-id="${esc(session.id)}">View solution</button>`)
    });
    if (list) {
      const count = items.filter(item => item.dataset.filteredOut !== 'true').length;
      list.insertAdjacentHTML('beforebegin', `<div class="review-filters row between wrap"><label class="tiny" for="result-filter">Show <select class="select" id="result-filter">${filters.map(([value, label]) => `<option value="${value}" ${state.resultFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><span class="tiny muted" role="status">${count} of ${items.length} questions</span></div>${count ? '' : '<div class="empty">No questions match this filter.</div>'}`)
    }
  }
  if (state.view === 'tests') applyPagination(app.querySelector('.test-list'), '.test-card', 'tests', 12, 'test-scroll');
  if (state.view === 'topics') applyPagination(app.querySelector('.topic-grid'), '.topic-card', 'topics', 9, 'topic-scroll');
  if (state.view === 'errors') applyPagination(app.querySelector('.main>.stack'), '.review-item', 'errors', 10, 'error-scroll');
  if (state.view === 'result') applyPagination(app.querySelector('.result-page .grid.two .card:nth-child(2)>.stack'), '.review-item', 'result', 8, 'review-scroll');
  if (state.view === 'reports') applyPagination(app.querySelector('.main>.card:last-child .table-wrap'), 'tbody tr', 'history', 10, 'history-scroll');
}

function viewIdentity() {
  return [state.view, state.view === 'practice' ? state.session?.id : state.view === 'result' ? state._result?.id : '', state.view === 'practice' ? state.session?.index : state.view === 'review' ? state.recall?.qid : ''].join('|')
}

function focusIdentity(el) {
  if (!el?.getAttribute || el === document.body) return null;
  const names = ['id', 'name', 'data-action', 'data-topic', 'data-note', 'data-go', 'data-jump', 'data-page-key', 'data-page', 'data-analyze-question', 'data-session-id', 'data-analyze-session', 'data-read-explanation', 'data-review-question', 'data-review-rating'];
  if (el.tagName === 'INPUT' && ['radio', 'checkbox'].includes(el.type)) names.push('value');
  const attributes = names.map(name => [name, el.getAttribute(name)]).filter(([, value]) => value != null);
  return attributes.length ? { tag: el.tagName, attributes, start: el.selectionStart, end: el.selectionEnd } : null
}

function findFocusTarget(ref) {
  if (!ref) return null;
  return [...app.querySelectorAll('button, input, textarea, select, summary, [tabindex]')].find(el => el.tagName === ref.tag && ref.attributes.every(([name, value]) => el.getAttribute(name) === value)) || null
}

function focusElement(el, ref) {
  if (!el || el.disabled) return;
  el.focus?.({ preventScroll: true });
  if (typeof ref?.start === 'number' && el.setSelectionRange) { try { el.setSelectionRange(ref.start, ref.end) } catch {} }
}

function handleDialogKeys(event) {
  const modal = app.querySelector('.modal'); if (!modal) return;
  if (event.key === 'Escape') {
    if (state.confirmReset) { event.preventDefault(); state.confirmReset = false; render() }
    else if (state.analysis) { event.preventDefault(); state.analysis = null; render() }
    return
  }
  if (event.key !== 'Tab') return;
  const targets = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]')].filter(el => !el.hidden && (!el.getClientRects || el.getClientRects().length));
  const first = targets[0], last = targets.at(-1);
  if (!first) { event.preventDefault(); return }
  if (!modal.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
    event.preventDefault(); focusElement(event.shiftKey ? last : first)
  }
}

function render() {
  const identity = viewIdentity(), sameView = identity === renderedViewKey, activeFocus = focusIdentity(document.activeElement);
  const positions = new Map([...app.querySelectorAll('[data-scroll-key]')].map(el => [el.dataset.scrollKey, [el.scrollTop, el.scrollLeft]]));
  const expanded = new Map([...app.querySelectorAll('details[data-details-key]')].map(el => [el.dataset.detailsKey, el.open]));
  const modalKey = state.confirmReset ? 'reset' : state.view === 'practice' && state.session?.paused ? 'pause' : state.analysis ? 'analysis-' + state.analysis.sessionId + '-' + state.analysis.qid : '';
  if (modalKey && !lastModalKey) modalReturnFocus = activeFocus;
  let body = '';
  if (state.view === 'dashboard') body = dashboard() + reviewDashboardCard(); else if (state.view === 'review') body = reviewView(); else if (state.view === 'library') body = libraryView(); else if (state.view === 'tests') body = testsView(); else if (state.view === 'topics') body = topicsView(); else if (state.view === 'errors') body = errorsView(); else if (state.view === 'reports') body = reportsView(); else if (state.view === 'help') body = helpView(); else if (state.view === 'practice') body = practiceView(); else if (state.view === 'result') body = resultView();
  const warning = state.storageWarning ? `<div class="storage-warning" role="alert"><span>${esc(state.storageWarning)}</span><button class="btn small" data-action="backup">Download backup</button></div>` : '';
  app.innerHTML = nav() + `<main class="main ${state.view === 'result' ? 'result-page' : ''}">${warning}${body}</main>${state.toast ? `<div class="toast" role="status" aria-live="polite">${esc(state.toast)}</div>` : ''}${modalKey === 'reset' ? resetWarning() : modalKey === 'pause' ? pauseOverlay() : modalKey ? analysisModal() : ''}`;
  decorateTaxonomy(); bind();
  const modal = app.querySelector('.modal');
  document.body?.classList?.toggle('modal-open', !!modal);
  app.querySelectorAll('.topbar, main').forEach(el => el.inert = !!modal);
  if (sameView) {
    app.querySelectorAll('details[data-details-key]').forEach(el => { if (expanded.has(el.dataset.detailsKey)) el.open = expanded.get(el.dataset.detailsKey) });
    app.querySelectorAll('[data-scroll-key]').forEach(el => { const position = positions.get(el.dataset.scrollKey); if (position) { el.scrollTop = position[0]; el.scrollLeft = position[1] } });
  }
  if (modal) {
    const priorTarget = sameView && modalKey === lastModalKey ? findFocusTarget(activeFocus) : null;
    focusElement(priorTarget && modal.contains(priorTarget) ? priorTarget : modal.querySelector('[data-action="cancel-reset"], [data-action="close-analysis"], [data-action="continue-session"], button'), activeFocus)
  } else if (lastModalKey) {
    focusElement(findFocusTarget(modalReturnFocus)); modalReturnFocus = null
  } else if (sameView) focusElement(findFocusTarget(activeFocus), activeFocus);
  else if (state.view === 'practice') focusElement(app.querySelector('.q-num'));
  lastModalKey = modalKey; renderedViewKey = identity
}

export { toastTimer, notify, changeView, reviewMistakes, analyzeSession, openQuestionAnalysis, bind, saveNote, toggleError, removeAllProgress, applyPagination, changePage, scrollQuestionTop, decorateTaxonomy, viewIdentity, focusIdentity, findFocusTarget, focusElement, handleDialogKeys, render, saveTimer, renderedViewKey, lastModalKey, modalReturnFocus };
