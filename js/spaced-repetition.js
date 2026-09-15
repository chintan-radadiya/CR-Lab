/* Local, deterministic review scheduling. No account or network is required. */
(function (root) {
  'use strict';

  const RATINGS = Object.freeze(['again', 'hard', 'good', 'easy']);
  const DAY_LIMIT = 365;
  const MAX_DATE = 8640000000000000;
  const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/;
  const REASON_ORDER = ['Incorrect', 'Skipped', 'Guessed', 'Flagged', 'Review'];

  function timestamp(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_DATE) {
      throw new TypeError(`${label} must be a valid non-negative timestamp`);
    }
    return value;
  }

  function identifier(value, label) {
    if (typeof value !== 'string' || !ID_PATTERN.test(value)) throw new TypeError(`${label} is invalid`);
    return value;
  }

  function questionIdentifier(value) {
    if (typeof value !== 'string' || !value.trim() || value.length > 300 || /[\u0000-\u001f\u007f]/.test(value)) {
      throw new TypeError('Review question ID is invalid');
    }
    return value;
  }

  function questionMap(questions) {
    if (questions instanceof Map) return questions;
    const rows = Array.isArray(questions) ? questions : questions && typeof questions.values === 'function' ? [...questions.values()] : null;
    if (!rows) throw new TypeError('Questions must be an array or Map');
    return new Map(rows.filter(q => q && typeof q.id === 'string').map(q => [q.id, q]));
  }

  function dateOf(...values) {
    return values.find(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_DATE) ?? 0;
  }

  function addCalendarDays(now, days) {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return timestamp(date.getTime(), 'Next review date');
  }

  function count(value, label) {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer`);
    return value;
  }

  function validateReviewEvent(value, questions) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Review event must be an object');
    const qid = questionIdentifier(value.qid);
    if (questions != null && !questionMap(questions).has(qid)) throw new TypeError('Review question is not in the question bank');
    if (!RATINGS.includes(value.rating)) throw new TypeError('Unknown review rating');
    const result = { version: 1, qid, rating: value.rating, reviewedAt: timestamp(value.reviewedAt, 'Review date') };
    if (value.version != null && value.version !== 1) throw new TypeError('Unsupported review event version');
    if (value.id != null) result.id = identifier(value.id, 'Review event ID');
    if (value.dueAt != null) {
      result.dueAt = timestamp(value.dueAt, 'Next review date');
      if (result.dueAt < result.reviewedAt) throw new TypeError('Next review cannot precede the review');
    }
    for (const name of ['intervalDays', 'repetitions', 'lapses']) {
      if (value[name] != null) result[name] = count(value[name], `Review ${name}`);
    }
    if (result.intervalDays > DAY_LIMIT) throw new TypeError('Review interval exceeds one year');
    return result;
  }

  function rate(previous, rating, now = Date.now()) {
    if (!previous || typeof previous !== 'object') throw new TypeError('A scheduled question is required');
    const qid = questionIdentifier(previous.qid);
    if (!RATINGS.includes(rating)) throw new TypeError('Unknown review rating');
    timestamp(now, 'Review date');
    if (previous.lastReviewedAt != null && now < timestamp(previous.lastReviewedAt, 'Previous review date')) {
      throw new TypeError('A review cannot precede the previous review');
    }
    if (previous.lastIncidentAt != null && now < timestamp(previous.lastIncidentAt, 'Practice date')) {
      throw new TypeError('A review cannot precede its practice attempt');
    }
    const previousInterval = count(previous.intervalDays ?? 0, 'Previous interval');
    const previousRepetitions = count(previous.repetitions ?? 0, 'Previous repetitions');
    const previousLapses = count(previous.lapses ?? 0, 'Previous lapses');
    const initial = { hard: 1, good: 3, easy: 7 }, multiplier = { hard: 1.2, good: 2, easy: 3 };
    const intervalDays = rating === 'again' ? 0 : Math.min(DAY_LIMIT, Math.max(initial[rating], Math.ceil(previousInterval * multiplier[rating])));
    const dueAt = rating === 'again' ? timestamp(now + 10 * 60 * 1000, 'Next review date') : addCalendarDays(now, intervalDays);
    return {
      version: 1, qid, rating, reviewedAt: now, dueAt, intervalDays,
      repetitions: rating === 'again' ? 0 : previousRepetitions + 1,
      lapses: previousLapses + (rating === 'again' ? 1 : 0)
    };
  }

  function queue(history = {}, questions = [], now = Date.now()) {
    timestamp(now, 'Current date');
    const bank = questionMap(questions), candidates = new Map(), sessions = new Map();
    const getCandidate = qid => {
      if (!candidates.has(qid)) candidates.set(qid, { qid, incidents: new Map(), reviews: [], reasons: new Set(), sourceErrorIds: new Set() });
      return candidates.get(qid);
    };
    const addIncident = (qid, sessionId, at, reasons, errorId) => {
      if (!bank.has(qid) || !reasons.length) return;
      const candidate = getCandidate(qid), key = sessionId || `error:${errorId || at}`;
      const existing = candidate.incidents.get(key);
      if (!existing || at > existing.at) candidate.incidents.set(key, { at, sessionId: sessionId || null });
      reasons.forEach(reason => candidate.reasons.add(reason));
      if (typeof errorId === 'string') candidate.sourceErrorIds.add(errorId);
    };

    for (const session of history.sessions || []) {
      if (!session || typeof session !== 'object') continue;
      if (session.id) sessions.set(session.id, session);
      for (const qid of new Set(session.questionIds || [])) {
        const q = bank.get(qid); if (!q) continue;
        const answer = session.answers?.[qid] || {}, selected = answer.selected || '';
        const keyed = !!(q.answer && q.choices?.some(choice => choice.label === q.answer));
        const reasons = [];
        if (!selected) reasons.push('Skipped');
        else if (keyed && selected !== q.answer) reasons.push('Incorrect');
        if (answer.guessed) reasons.push('Guessed');
        if (session.flags?.[qid]) reasons.push('Flagged');
        addIncident(qid, session.id, dateOf(answer.committedAt, answer.checkedAt, session.completedAt, session.createdAt), reasons);
      }
    }

    for (const error of history.errors || []) {
      if (!error || !bank.has(error.qid)) continue;
      const session = sessions.get(error.sessionId), q = bank.get(error.qid), answer = session?.answers?.[error.qid];
      const selected = answer?.selected ?? error.selected ?? '';
      const keyed = !!(q.answer && q.choices?.some(choice => choice.label === q.answer));
      const reasons = [];
      if (!selected) reasons.push('Skipped');
      else if (keyed && selected !== q.answer) reasons.push('Incorrect');
      if (error.category === 'Guessed' || answer?.guessed) reasons.push('Guessed');
      if (error.category === 'Flagged' || session?.flags?.[error.qid]) reasons.push('Flagged');
      // Old error logs may lack a category or selected option; retain their review context.
      if (!reasons.length) reasons.push('Review');
      addIncident(error.qid, error.sessionId, dateOf(answer?.committedAt, answer?.checkedAt, session?.completedAt, error.createdAt, session?.createdAt), reasons, error.id);
    }

    const reviewIds = new Set();
    for (const value of history.reviewEvents || []) {
      const event = validateReviewEvent(value, bank);
      const duplicateKey = event.id ? `id:${event.id}` : `event:${event.qid}:${event.reviewedAt}:${event.rating}`;
      if (reviewIds.has(duplicateKey)) continue;
      reviewIds.add(duplicateKey);
      getCandidate(event.qid).reviews.push(event);
    }

    const entries = [];
    for (const candidate of candidates.values()) {
      const timeline = [
        ...[...candidate.incidents.values()].map(incident => ({ ...incident, type: 'incident' })),
        ...candidate.reviews.map(review => ({ at: review.reviewedAt, type: 'review', review }))
      ].sort((a, b) => a.at - b.at || (a.type === b.type ? 0 : a.type === 'incident' ? -1 : 1));
      const entry = { qid: candidate.qid, dueAt: 0, intervalDays: 0, repetitions: 0, lapses: 0, lastReviewedAt: null, lastRating: null, lastIncidentAt: null, sessionId: null };
      for (const event of timeline) {
        if (event.type === 'incident') {
          if (entry.lastReviewedAt != null && event.at > entry.lastReviewedAt) {
            // Count a recurrence once; multiple mistakes before a new review form one lapse.
            if (entry.repetitions > 0 || entry.intervalDays > 0) entry.lapses++;
            entry.repetitions = 0;
            entry.intervalDays = 0;
          }
          entry.dueAt = event.at;
          entry.lastIncidentAt = event.at;
          entry.sessionId = event.sessionId;
        } else {
          const reviewed = rate(entry, event.review.rating, event.at);
          Object.assign(entry, { dueAt: reviewed.dueAt, intervalDays: reviewed.intervalDays, repetitions: reviewed.repetitions, lapses: reviewed.lapses, lastReviewedAt: event.at, lastRating: reviewed.rating });
        }
      }
      entry.reasons = REASON_ORDER.filter(reason => candidate.reasons.has(reason));
      if (!entry.reasons.length) entry.reasons.push('Review');
      entry.reason = entry.reasons.join(' · ');
      entry.sourceErrorIds = [...candidate.sourceErrorIds];
      entry.isDue = entry.dueAt <= now;
      entries.push(entry);
    }
    return entries.sort((a, b) => a.dueAt - b.dueAt || a.qid.localeCompare(b.qid));
  }

  function stats(entries = [], now = Date.now()) {
    timestamp(now, 'Current date');
    const upcoming = entries.filter(entry => entry.dueAt > now);
    return {
      total: entries.length,
      due: entries.length - upcoming.length,
      upcoming: upcoming.length,
      reviewed: entries.filter(entry => entry.lastReviewedAt != null).length,
      nextDueAt: upcoming.length ? Math.min(...upcoming.map(entry => entry.dueAt)) : null
    };
  }

  root.CRSpacedRepetition = Object.freeze({ RATINGS, queue, rate, stats, validateReviewEvent });
})(typeof window !== 'undefined' ? window : globalThis);
