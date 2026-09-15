import { app, state, qById, esc, uid, displayTestTitle } from './core.js';
import { store, saveStore } from './storage.js';
import { solutionHTML } from './solutions-ui.js';
import { render, notify, changeView } from './ui.js';

function reviewQueue(now = Date.now()) { return window.CRSpacedRepetition.queue(store(), qById, now); }
function dueLabel(timestamp, now = Date.now()) {
  if (timestamp == null || !Number.isFinite(timestamp)) return 'Not scheduled';
  if (timestamp <= now) return 'Due now';
  if (timestamp - now < 3600000) return `In ${Math.ceil((timestamp - now) / 60000)} min`;
  return new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function reviewDashboardCard() {
  const stats = window.CRSpacedRepetition.stats(reviewQueue());
  return `<div class="card review-promo"><div><span class="eyebrow">SPACED REPETITION</span><h2>${stats.due} question${stats.due === 1 ? '' : 's'} ready to revisit</h2><p class="muted">${stats.upcoming} scheduled for later. Recall the reasoning before revealing the solution.</p></div><button class="btn primary" data-view="review">Open review queue</button></div>`;
}
function reviewView() {
  const queue = reviewQueue(), stats = window.CRSpacedRepetition.stats(queue), active = state.recall && queue.find(item => item.qid === state.recall.qid);
  const rows = queue.filter(item => state.reviewFilter === 'all' || (state.reviewFilter === 'upcoming' ? !item.isDue : item.isDue));
  return `<div class="section-head"><div><h1>Review queue</h1><p>Short, spaced revisits to incorrect, skipped, and flagged questions.</p></div><button class="btn primary" data-action="start-due-review" ${stats.due ? '' : 'disabled'}>Review due (${stats.due})</button></div>
  <div class="review-summary"><div class="card"><span class="muted tiny">Due now</span><strong>${stats.due}</strong></div><div class="card"><span class="muted tiny">Upcoming</span><strong>${stats.upcoming}</strong></div><div class="card"><span class="muted tiny">Unique questions</span><strong>${stats.total}</strong></div></div>
  <p class="tiny muted">Again: 10 min · First Hard: 1 day · Good: 3 days · Easy: 7 days. Later ratings expand the interval. A new mistake makes a question due again. Ratings do not change past test answers or scores.</p>
  ${active ? recallCard(active) : ''}
  <div class="card filter-toolbar"><label for="review-filter">Schedule<select class="select" id="review-filter">${[['due', 'Due now'], ['upcoming', 'Upcoming'], ['all', 'All scheduled']].map(([value, label]) => `<option value="${value}" ${state.reviewFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><span class="tiny muted" role="status">${rows.length} questions</span></div>
  ${rows.length ? `<div class="stack review-queue-list">${rows.map(entry => { const q = qById.get(entry.qid); return `<article class="review-item"><div class="row between wrap"><strong>${esc(displayTestTitle(q.corpus, q.test, q.section))} · Q${q.number}</strong><span class="pill ${entry.isDue ? 'warn' : ''}">${esc(dueLabel(entry.dueAt))}</span></div><p class="tiny muted">${esc(q.topic)} · ${esc(entry.reasons.join(', '))} · ${entry.repetitions} successful revisit${entry.repetitions === 1 ? '' : 's'}</p><div class="row between wrap"><span class="tiny muted">${entry.lastReviewedAt ? 'Last reviewed ' + new Date(entry.lastReviewedAt).toLocaleDateString() : 'Not revisited yet'}</span><button class="btn small" data-review-question="${esc(q.id)}">${entry.isDue ? 'Recall question' : 'Review early'}</button></div></article>` }).join('')}</div>` : `<div class="empty">${stats.total ? 'No questions in this schedule filter.' + (stats.nextDueAt != null ? ' Next review: ' + esc(dueLabel(stats.nextDueAt)) + '.' : ' All scheduled questions are currently due.') : 'Complete a practice session first. Mistakes, skips, and flagged questions will appear here automatically.'}</div>`}`;
}
function recallCard(entry) {
  const q = qById.get(entry.qid), recall = state.recall;
  const clockBehind = Date.now() < Math.max(entry.lastReviewedAt || 0, entry.lastIncidentAt || 0);
  return `<section class="card recall-card" aria-labelledby="recall-title"><div class="row between wrap"><h2 id="recall-title" tabindex="-1">Recall · Q${q.number}</h2><button class="btn small" data-action="close-recall">Close recall</button></div><div class="recall-content" data-scroll-key="recall-${esc(q.id)}" tabindex="0" role="region" aria-label="Recall question and solution"><div class="q-stem">${esc(q.prompt)}</div>${q.choices.map(choice => `<label class="choice ${recall.selected === choice.label ? 'selected' : ''}"><input type="radio" name="review-answer" value="${choice.label}" ${recall.selected === choice.label ? 'checked' : ''} ${recall.revealed ? 'disabled' : ''}><span class="letter">${choice.label}</span><span>${esc(choice.text)}</span></label>`).join('')}${recall.revealed ? solutionHTML(q, { selected: recall.selected }) : '<p class="tiny muted">Try to explain the key logical link before revealing the answer. This revisit is separate from your original locked response.</p>'}</div>
  <div class="recall-actions">${recall.revealed ? clockBehind ? '<p class="editorial-issue" role="alert">This question has a saved attempt or review dated in the future. Check your device clock before adding a rating.</p>' : `<p class="tiny muted">How well could you recall and explain the reasoning?</p><div class="rating-grid">${['again', 'hard', 'good', 'easy'].map(rating => { const next = window.CRSpacedRepetition.rate(entry, rating); return `<button class="btn ${rating === 'again' ? 'danger' : rating === 'good' ? 'primary' : ''}" data-review-rating="${rating}"><strong>${rating[0].toUpperCase() + rating.slice(1)}</strong><span class="tiny">${esc(dueLabel(next.dueAt))}</span></button>` }).join('')}</div>` : '<button class="btn primary" data-action="reveal-recall">Reveal solution</button>'}</div></section>`;
}
function openRecall(qid) {
  if (!reviewQueue().some(entry => entry.qid === qid)) { notify('This question is no longer in the review queue.'); return; }
  state.recall = { qid, selected: '', revealed: false }; changeView('review');
  requestAnimationFrame(() => { const title = document.getElementById('recall-title'); title?.focus?.({ preventScroll: true }); app.querySelector('.recall-card')?.scrollIntoView?.({ block: 'start', behavior: 'auto' }); });
}
function startDueReview() { const entry = reviewQueue().find(item => item.isDue); if (entry) openRecall(entry.qid); else notify('You are up to date. No reviews are due.'); }
function selectRecall(label) {
  const recall = state.recall, q = recall && qById.get(recall.qid);
  if (!q || recall.revealed || !q.choices.some(choice => choice.label === label)) return;
  recall.selected = label; render();
}
function revealRecall() {
  if (!state.recall) return;
  state.recall.revealed = true; render();
  requestAnimationFrame(() => {
    const region = app.querySelector('.recall-content'), panel = region?.querySelector('.solution-panel');
    if (panel) region.scrollTop += panel.getBoundingClientRect().top - region.getBoundingClientRect().top;
  });
}
function rateRecall(rating) {
  const recall = state.recall; if (!recall?.revealed) return;
  const entry = reviewQueue().find(item => item.qid === recall.qid); if (!entry) return;
  let event; try { event = { id: uid('rev'), ...window.CRSpacedRepetition.rate(entry, rating) }; } catch { return; }
  const history = store(); history.reviewEvents ??= []; history.reviewEvents.push(event);
  // Persistence failure leaves the queued event in the recovery cache. Clear the
  // card to prevent accidental double ratings, and make the failure explicit.
  const saved = saveStore(history); state.recall = null;
  notify(saved ? `Review saved. Next revisit: ${dueLabel(event.dueAt)}.` : 'Review kept in this tab only. Download a backup before closing.');
}
function bindReview() {
  document.getElementById('review-filter')?.addEventListener('change', event => { state.reviewFilter = event.target.value; state.pages.review = 1; render(); });
  app.querySelectorAll('[data-review-question]').forEach(button => button.onclick = () => openRecall(button.dataset.reviewQuestion));
  app.querySelectorAll('input[name="review-answer"]').forEach(input => input.onchange = () => selectRecall(input.value));
  app.querySelectorAll('[data-review-rating]').forEach(button => button.onclick = () => rateRecall(button.dataset.reviewRating));
  app.querySelectorAll('[data-action="start-due-review"]').forEach(button => button.onclick = startDueReview);
  app.querySelectorAll('[data-action="reveal-recall"]').forEach(button => button.onclick = revealRecall);
  app.querySelectorAll('[data-action="close-recall"]').forEach(button => button.onclick = () => { state.recall = null; render(); });
}
export { reviewQueue, dueLabel, reviewDashboardCard, reviewView, recallCard, openRecall, startDueReview, selectRecall, revealRecall, rateRecall, bindReview };
