import { app, state, DATA, explanationLibrary, esc, displayTestTitle } from './core.js';
import { setupSession } from './sessions.js';
import { render, openQuestionAnalysis, notify } from './ui.js';

const editorialLabels = { authored: 'Authored · awaiting review', 'ai-reviewed': 'AI-reviewed', 'expert-reviewed': 'Human expert reviewed', 'needs-review': 'Source issue · needs review', draft: 'Automated draft', unkeyed: 'Source key unavailable' };
function libraryQuestions() {
  const search = (state.librarySearch || '').trim().toLowerCase();
  return DATA.questions.filter(q => {
    const record = explanationLibrary.get(q.id), status = record?.reviewStatus || q.explanation.reviewStatus;
    return (state.libraryFilter === 'all' || (state.libraryFilter === 'authored' ? !!record : status === state.libraryFilter)) && (!search || [q.id, q.prompt, q.topic, q.test, record?.issue].join(' ').toLowerCase().includes(search));
  });
}
function libraryView() {
  const stats = explanationLibrary.stats(), rows = libraryQuestions();
  return `<div class="section-head"><div><h1>Solution library</h1><p>Question-specific reasoning, option-by-option analysis, and visible editorial review.</p></div><button class="btn primary" data-action="practice-reviewed" ${stats.aiReviewed + stats.expertReviewed ? '' : 'disabled'}>Practice reviewed questions</button></div>
  <div class="review-summary"><div class="card"><span class="muted tiny">Individually authored</span><strong>${stats.authored}/${stats.total}</strong></div><div class="card"><span class="muted tiny">Independent AI review passed</span><strong>${stats.aiReviewed}</strong></div><div class="card"><span class="muted tiny">Human expert reviewed</span><strong>${stats.expertReviewed}</strong></div></div>
  <p class="tiny muted">${stats.drafts} questions still use automated draft guidance; ${stats.needsReview} authored items have unresolved source issues. AI review is not human expert verification. The original source key is never silently changed.</p>
  ${stats.rejected ? `<div class="storage-warning" role="alert">${stats.rejected} authored record(s) failed validation and were not applied. Question wording or keys may have changed; editorial re-review is required.</div>` : ''}
  <div class="card filter-toolbar"><label for="library-search">Question or topic<input class="input" type="search" id="library-search" value="${esc(state.librarySearch || '')}" placeholder="Search question content or ID"></label><label for="library-filter">Editorial status<select class="select" id="library-filter">${[['authored', 'All authored'], ['ai-reviewed', 'AI-reviewed'], ['expert-reviewed', 'Human expert reviewed'], ['needs-review', 'Needs review'], ['draft', 'Automated drafts'], ['all', 'Entire bank']].map(([value, label]) => `<option value="${value}" ${state.libraryFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>
  <p class="tiny muted" role="status">${rows.length} matching questions</p>
  ${rows.length ? `<div class="stack library-list">${rows.map(q => { const record = explanationLibrary.get(q.id), status = record?.reviewStatus || q.explanation.reviewStatus; return `<article class="review-item"><div class="row between wrap"><strong>${esc(displayTestTitle(q.corpus, q.test, q.section))} · Q${q.number}</strong><span class="pill ${status === 'needs-review' ? 'warn' : record ? 'good' : ''}">${esc(editorialLabels[status] || status)}</span></div><p class="tiny muted">${esc(q.topic)} · ${esc(q.id)}</p><p>${esc((record?.stimulusSummary || q.prompt).slice(0, 210))}${(record?.stimulusSummary || q.prompt).length > 210 ? '…' : ''}</p>${record?.issue ? `<p class="editorial-issue">${esc(record.issue)}</p>` : ''}<button class="btn small" data-read-explanation="${esc(q.id)}">${record ? 'Read solution & review notes' : 'Inspect automated draft'}</button></article>`; }).join('')}</div>` : '<div class="empty">No questions match this search or review status.</div>'}`;
}
function practiceReviewed() {
  const pool = libraryQuestions().filter(q => ['ai-reviewed', 'expert-reviewed'].includes(explanationLibrary.get(q.id)?.reviewStatus));
  if (!pool.length) { notify('No reviewed questions match these filters. Select All authored or AI-reviewed.'); return; }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  setupSession(pool.slice(0, 10).map(q => q.id), { mode: 'topic', modeLabel: 'Reviewed-solution practice', corpus: 'CAT', test: 'Editorial set', section: 'Custom', sectionTimes: {} });
}
function bindLibrary() {
  const search = document.getElementById('library-search'); if (search) search.oninput = () => { state.librarySearch = search.value; state.pages.library = 1; render(); };
  const filter = document.getElementById('library-filter'); if (filter) filter.onchange = () => { state.libraryFilter = filter.value; state.pages.library = 1; render(); };
  app.querySelectorAll('[data-read-explanation]').forEach(button => button.onclick = () => openQuestionAnalysis('library', button.dataset.readExplanation));
  app.querySelectorAll('[data-action="practice-reviewed"]').forEach(button => button.onclick = practiceReviewed);
}
export { editorialLabels, libraryQuestions, libraryView, practiceReviewed, bindLibrary };
