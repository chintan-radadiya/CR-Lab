const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = vm.createContext({ window: {}, Date });
vm.runInContext(readFileSync(path.join(__dirname, '..', 'js', 'spaced-repetition.js'), 'utf8'), context);
const scheduler = context.window.CRSpacedRepetition;
const now = new Date(2026, 8, 15, 12, 0, 0).getTime();
const day = 24 * 60 * 60 * 1000;
const questions = [
  { id: 'gmat-1-main-1', answer: 'A', choices: [{ label: 'A' }, { label: 'B' }] },
  { id: 'lsat-1-Section I-1', answer: 'B', choices: [{ label: 'A' }, { label: 'B' }] },
  { id: 'unkeyed', answer: null, choices: [{ label: 'A' }, { label: 'B' }] },
  { id: 'invalid-key', answer: 'C', choices: [{ label: 'A' }, { label: 'B' }] }
];
const q1 = questions[0].id, q2 = questions[1].id;
const plain = value => JSON.parse(JSON.stringify(value));

function session(id, at, selected = 'B', qid = q1) {
  return { id, createdAt: at - 1000, completedAt: at, questionIds: [qid], answers: { [qid]: { selected, correct: selected !== 'B', committedAt: at } }, flags: {} };
}

function history() {
  const s = session('s1', now - day);
  return { sessions: [s], errors: [{ id: 'e1', sessionId: s.id, qid: q1, selected: 'B', category: 'Incorrect', status: 'Open', createdAt: s.createdAt }], reviewEvents: [] };
}

function freezeDeep(value) {
  Object.freeze(value);
  Object.values(value).forEach(child => { if (child && typeof child === 'object') freezeDeep(child); });
  return value;
}

test('empty history has a safe empty queue and stats', () => {
  assert.deepEqual(plain(scheduler.queue({}, questions, now)), []);
  assert.deepEqual(plain(scheduler.stats([], now)), { total: 0, due: 0, upcoming: 0, reviewed: 0, nextDueAt: null });
});

test('incorrect attempts are due immediately, deduplicated against their error-log records', () => {
  const rows = scheduler.queue(history(), questions, now);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].qid, q1);
  assert.equal(rows[0].dueAt, now - day);
  assert.equal(rows[0].lastIncidentAt, now - day);
  assert.equal(rows[0].reason, 'Incorrect');
  assert.equal(rows[0].isDue, true);
  assert.equal(rows[0].sessionId, 's1');
  assert.deepEqual(plain(rows[0].sourceErrorIds), ['e1']);
});

test('multiple errors for a question form one entry retaining source error IDs and reasons', () => {
  const data = history(), skipped = session('s2', now - 1000, '');
  skipped.flags[q1] = true;
  data.sessions.push(skipped);
  data.errors.push({ id: 'e2', sessionId: 's2', qid: q1, selected: '', category: 'Skipped', createdAt: now - 1000 });
  const [entry] = scheduler.queue(data, questions, now);
  assert.deepEqual(plain(entry.sourceErrorIds), ['e1', 'e2']);
  assert.deepEqual(plain(entry.reasons), ['Incorrect', 'Skipped', 'Flagged']);
  assert.equal(entry.sessionId, 's2');
  assert.equal(entry.lapses, 0);
});

test('answer keys override stale stored correctness, and unkeyed answers are not treated as incorrect', () => {
  const s = { id: 's', createdAt: now, questionIds: questions.map(q => q.id), answers: {
    [q1]: { selected: 'A', correct: false }, [q2]: { selected: 'A', correct: true },
    unkeyed: { selected: 'A', correct: false }, 'invalid-key': { selected: 'A', correct: false }
  } };
  assert.deepEqual(plain(scheduler.queue({ sessions: [s] }, questions, now).map(e => e.qid)), [q2]);
});

test('skipped, flagged, and guessed questions enter the queue without error-log records', () => {
  const s = { id: 's', createdAt: now, questionIds: [q1, q2, 'unkeyed'], answers: {
    [q1]: { selected: 'A', guessed: true }, [q2]: { selected: 'B' }
  }, flags: { [q2]: true } };
  const rows = scheduler.queue({ sessions: [s] }, questions, now);
  assert.equal(rows.length, 3);
  assert.equal(rows.find(e => e.qid === q1).reason, 'Guessed');
  assert.equal(rows.find(e => e.qid === q2).reason, 'Flagged');
  assert.equal(rows.find(e => e.qid === 'unkeyed').reason, 'Skipped');
});

test('marking an error-log row Reviewed does not silently self-rate recall', () => {
  const data = history(); data.errors[0].status = 'Reviewed';
  assert.equal(scheduler.queue(data, questions, now)[0].isDue, true);
});

test('Again schedules ten minutes and resets the successful repetition count', () => {
  const entry = scheduler.queue(history(), questions, now)[0];
  const review = scheduler.rate({ ...entry, repetitions: 4, intervalDays: 30, lapses: 2 }, 'again', now);
  assert.equal(review.dueAt, now + 600000);
  assert.equal(review.intervalDays, 0);
  assert.equal(review.repetitions, 0);
  assert.equal(review.lapses, 3);
});

test('first Hard, Good, and Easy ratings schedule one, three, and seven days', () => {
  const entry = scheduler.queue(history(), questions, now)[0];
  for (const [rating, days] of [['hard', 1], ['good', 3], ['easy', 7]]) {
    const review = scheduler.rate(entry, rating, now);
    assert.equal(review.intervalDays, days);
    assert.equal(review.dueAt, now + days * day);
    assert.equal(review.repetitions, 1);
    assert.equal(review.lapses, 0);
  }
});

test('successful reviews grow intervals with a one-year maximum', () => {
  const entry = { qid: q1, intervalDays: 10, repetitions: 2, lapses: 0 };
  assert.equal(scheduler.rate(entry, 'hard', now).intervalDays, 12);
  assert.equal(scheduler.rate(entry, 'good', now).intervalDays, 20);
  assert.equal(scheduler.rate(entry, 'easy', now).intervalDays, 30);
  assert.equal(scheduler.rate({ ...entry, intervalDays: 365 }, 'easy', now).intervalDays, 365);
});

test('review history replays deterministically and does not trust imported interval calculations', () => {
  const data = history(), first = scheduler.rate(scheduler.queue(data, questions, now)[0], 'good', now);
  data.reviewEvents = [{ ...first, intervalDays: 365, dueAt: now + 365 * day }];
  const [entry] = scheduler.queue(data, questions, now);
  assert.equal(entry.intervalDays, 3);
  assert.equal(entry.dueAt, now + 3 * day);
  assert.equal(entry.lastRating, 'good');
  assert.equal(entry.lastReviewedAt, now);
  assert.equal(entry.isDue, false);
  assert.deepEqual(plain(scheduler.stats([entry], now)), { total: 1, due: 0, upcoming: 1, reviewed: 1, nextDueAt: now + 3 * day });
  assert.equal(scheduler.queue(data, questions, now + 3 * day)[0].isDue, true);
});

test('new incorrect attempts reset an existing schedule immediately and count one recurrence', () => {
  const data = history();
  data.reviewEvents.push(scheduler.rate(scheduler.queue(data, questions, now)[0], 'easy', now));
  data.sessions.push(session('s2', now + day), session('s3', now + 2 * day));
  const [entry] = scheduler.queue(data, questions, now + 2 * day);
  assert.equal(entry.dueAt, now + 2 * day);
  assert.equal(entry.intervalDays, 0);
  assert.equal(entry.repetitions, 0);
  assert.equal(entry.lapses, 1);
  assert.equal(entry.lastRating, 'easy');
  assert.equal(entry.isDue, true);
  assert.equal(scheduler.rate(entry, 'good', now + 2 * day).intervalDays, 3);
});

test('a later healthy correct attempt does not silently override explicit recall scheduling', () => {
  const data = history();
  data.reviewEvents.push(scheduler.rate(scheduler.queue(data, questions, now)[0], 'good', now));
  data.sessions.push(session('s2', now + day, 'A'));
  assert.equal(scheduler.queue(data, questions, now + day)[0].dueAt, now + 3 * day);
});

test('out-of-order history and duplicate events do not inflate interval or repetition count', () => {
  const data = history(), first = scheduler.rate(scheduler.queue(data, questions, now)[0], 'good', now);
  data.reviewEvents.push({ ...first, id: 'r1' });
  const second = scheduler.rate(scheduler.queue(data, questions, now)[0], 'good', now + 3 * day);
  data.reviewEvents = [{ ...second, id: 'r2' }, { ...first, id: 'r1' }, { ...first, id: 'r1' }];
  const [entry] = scheduler.queue(data, questions, now + 3 * day);
  assert.equal(entry.intervalDays, 6);
  assert.equal(entry.repetitions, 2);
  assert.equal(entry.dueAt, now + 9 * day);
});

test('review-only restored history stays scheduled even if no original error record remains', () => {
  const rows = scheduler.queue({ reviewEvents: [{ qid: q2, rating: 'hard', reviewedAt: now }] }, new Map(questions.map(q => [q.id, q])), now);
  assert.equal(rows[0].qid, q2);
  assert.equal(rows[0].reason, 'Review');
  assert.equal(rows[0].dueAt, now + day);
});

test('timestamps prefer actual answer commitment over session-start dates', () => {
  const data = history();
  data.sessions[0].createdAt = now - 10 * day;
  data.sessions[0].answers[q1].committedAt = now - 1000;
  assert.equal(scheduler.queue(data, questions, now)[0].dueAt, now - 1000);
});

test('the module never mutates history, question data, or a previous schedule', () => {
  const data = freezeDeep(history()), bank = freezeDeep(plain(questions));
  const before = JSON.stringify(data), [entry] = scheduler.queue(data, bank, now);
  freezeDeep(entry);
  scheduler.rate(entry, 'good', now);
  assert.equal(JSON.stringify(data), before);
});

test('invalid ratings, question IDs, timestamps, and malformed schedule fields fail validation', () => {
  const entry = { qid: q1 };
  assert.throws(() => scheduler.rate(entry, 'perfect', now), /rating/);
  assert.throws(() => scheduler.rate({ qid: '' }, 'good', now), /question ID/);
  assert.throws(() => scheduler.rate(entry, 'good', NaN), /timestamp/);
  assert.throws(() => scheduler.rate({ ...entry, repetitions: -1 }, 'good', now), /non-negative integer/);
  assert.throws(() => scheduler.rate({ ...entry, lastReviewedAt: now + 1 }, 'good', now), /precede/);
  assert.throws(() => scheduler.rate({ ...entry, lastIncidentAt: now + 1 }, 'good', now), /precede/);
  assert.throws(() => scheduler.queue({}, questions, Infinity), /timestamp/);
  assert.throws(() => scheduler.validateReviewEvent({ qid: 'missing', rating: 'good', reviewedAt: now }, questions), /question bank/);
  assert.throws(() => scheduler.validateReviewEvent({ qid: q1, rating: 'good', reviewedAt: now, dueAt: now - 1 }, questions), /precede/);
  assert.throws(() => scheduler.validateReviewEvent({ qid: q1, rating: 'good', reviewedAt: now, intervalDays: 366 }, questions), /one year/);
  assert.throws(() => scheduler.validateReviewEvent({ qid: q1, rating: 'good', reviewedAt: now, version: 2 }, questions), /version/);
});

test('day intervals use calendar arithmetic across daylight-saving changes', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'America/New_York';
    const spring = new Date(2026, 2, 7, 12).getTime();
    const springDue = scheduler.rate({ qid: q1 }, 'hard', spring).dueAt;
    assert.equal(new Date(springDue).getHours(), 12);
    assert.equal(springDue - spring, 23 * 60 * 60 * 1000);
    const autumn = new Date(2026, 9, 31, 12).getTime();
    const autumnDue = scheduler.rate({ qid: q1 }, 'hard', autumn).dueAt;
    assert.equal(new Date(autumnDue).getHours(), 12);
    assert.equal(autumnDue - autumn, 25 * 60 * 60 * 1000);
  } finally {
    if (original == null) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
