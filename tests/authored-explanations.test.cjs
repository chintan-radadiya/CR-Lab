const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['cr_app_data.js', 'js/explanation-library.js', 'content/explanations-batch-a.js', 'content/explanations-batch-b.js']) {
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const clone = value => JSON.parse(JSON.stringify(value));
const questions = clone(context.window.CR_DATA.questions);
const records = clone(context.window.CR_AUTHORED_EXPLANATIONS);
const registry = context.window.CRExplanationLibrary;
const byId = new Map(questions.map(question => [question.id, question]));
const reviewedRecord = records.find(record => record.reviewStatus === 'ai-reviewed');

function fixture() {
  return { record: clone(reviewedRecord), question: clone(byId.get(reviewedRecord.qid)) };
}

function assertRejected(record, question, expected) {
  assert.throws(() => registry.validate(record, question), expected);
  const library = registry.create([question], [record]);
  assert.equal(library.records().length, 0);
  assert.equal(library.stats().rejected, 1);
  assert.match(library.issues[0].issue, expected);
}

test('authored-library coverage reports actual AI review and unresolved issues without claiming human expertise', () => {
  const library = registry.create(questions, records);
  assert.deepEqual(clone(library.stats()), {
    total: 2060, authored: 30, aiReviewed: 27, expertReviewed: 0,
    needsReview: 3, drafts: 2030, rejected: 0
  });
  assert.equal(new Set(records.map(record => record.qid)).size, 30);
  assert.deepEqual(records.map(record => record.qid), questions.slice(0, 30).map(question => question.id));
  for (const record of records) {
    assert.equal(record.author, 'AI-assisted editorial');
    assert.ok(record.reviews.length > 0, record.qid);
    assert.ok(record.reviews.every(review => review.kind === 'ai'), record.qid);
    if (record.reviewStatus === 'needs-review') assert.ok(record.issue.trim(), record.qid);
  }
});

test('every authored explanation matches the exact source fingerprint, key, and complete option set', () => {
  for (const record of records) {
    const question = byId.get(record.qid);
    assert.ok(question, record.qid);
    assert.equal(record.sourceAnswer, question.answer, record.qid);
    assert.equal(record.sourceFingerprint, registry.fingerprint(question), record.qid);
    assert.equal(registry.validate(record, question), record);
    assert.equal(record.choiceAnalysis.length, 5, record.qid);
    assert.deepEqual(record.choiceAnalysis.map(choice => choice.label), question.choices.map(choice => choice.label), record.qid);
    // Structural quality gates do not certify the correctness of editorial prose.
    assert.ok(record.reasoning.trim().length > 100, record.qid);
    assert.ok(record.stimulusSummary.trim().length > 30, record.qid);
    for (const choice of record.choiceAnalysis) assert.ok(choice.reason.trim().length > 30, `${record.qid}/${choice.label}`);
    assert.equal(new Set(record.choiceAnalysis.map(choice => choice.reason)).size, 5, record.qid);
  }
  assert.equal(new Set(records.map(record => record.reasoning)).size, 30);
});

test('applying authored records replaces only covered explanations and preserves all source content', () => {
  const items = clone(questions);
  for (const question of items) question.explanation = { reviewStatus: 'draft', why: 'Existing heuristic draft', sourceMarker: question.id };
  const untouched = new Map(items.map(question => [question.id, question.explanation]));
  const sourceSnapshot = JSON.stringify(items.map(({ explanation, ...question }) => question));
  const recordSnapshot = JSON.stringify(records);
  const library = registry.create(items, records);
  library.apply(items);
  assert.equal(JSON.stringify(items.map(({ explanation, ...question }) => question)), sourceSnapshot);
  assert.equal(JSON.stringify(records), recordSnapshot);
  let authoredCount = 0, retainedCount = 0;
  for (const question of items) {
    const record = library.get(question.id);
    if (record) {
      authoredCount++;
      assert.notEqual(question.explanation, untouched.get(question.id));
      assert.equal(question.explanation.why, record.reasoning);
      assert.equal(question.explanation.evidence, record.stimulusSummary);
      assert.equal(question.explanation.conclusion, record.conclusion);
      assert.equal(question.explanation.reviewStatus, record.reviewStatus);
      assert.equal(question.explanation.sourceMarker, question.id);
      assert.equal(question.explanation.editorial, record);
      assert.equal(question.explanation.issue, record.issue || '');
      for (const choice of question.explanation.choiceAnalysis) {
        assert.equal(choice.reason, record.choiceAnalysis.find(item => item.label === choice.label).reason);
        assert.equal(choice.correct, choice.label === question.answer);
      }
      assert.doesNotMatch(question.explanation.confidence, /human expert reviewed/i);
    } else {
      retainedCount++;
      assert.equal(question.explanation, untouched.get(question.id));
      assert.equal(question.explanation.reviewStatus, 'draft');
    }
  }
  assert.equal(authoredCount, 30);
  assert.equal(retainedCount, 2030);
});

test('duplicate authored IDs invalidate the ambiguous item without dropping unrelated records', () => {
  const library = registry.create(questions, [...records, clone(records[0]), clone(records[0])]);
  assert.equal(library.get(records[0].qid), undefined);
  assert.equal(library.records().length, 29);
  assert.equal(library.get(records[1].qid), records[1]);
  assert.equal(library.issues.length, 2);
  assert.ok(library.issues.every(issue => issue.issue === 'Duplicate authored record'));
});

test('an invalid first record cannot allow a later duplicate ID to be accepted', () => {
  const { record, question } = fixture();
  const invalid = clone(record);
  invalid.reasoning = '';
  const library = registry.create([question], [invalid, record, clone(record)]);
  assert.equal(library.get(record.qid), undefined);
  assert.equal(library.records().length, 0);
  assert.equal(library.issues.length, 3);
  assert.match(library.issues[0].issue, /Missing reasoning/);
  assert.equal(library.issues[1].issue, 'Duplicate authored record');
  assert.equal(library.issues[2].issue, 'Duplicate authored record');
});

test('a mismatched or unknown question ID is rejected', () => {
  const { record, question } = fixture();
  record.qid = 'not-a-source-question';
  assertRejected(record, question, /Unknown question/);
});

test('a changed source answer key cannot silently reuse an explanation', () => {
  const { record, question } = fixture();
  question.answer = question.choices.find(choice => choice.label !== question.answer).label;
  assertRejected(record, question, /Source answer does not match/);
});

test('source prompt changes require a fresh review even when the answer key is unchanged', () => {
  const { record, question } = fixture();
  question.prompt += ' Additional condition changes the argument.';
  assertRejected(record, question, /Question text or answer choices have changed/);
});

test('source choice text changes require a fresh review', () => {
  const { record, question } = fixture();
  question.choices[0].text += ' unless another condition applies';
  assertRejected(record, question, /Question text or answer choices have changed/);
});

test('missing fingerprints cannot be treated as source-matched editorial content', () => {
  const { record, question } = fixture();
  delete record.sourceFingerprint;
  assertRejected(record, question, /Question text or answer choices have changed/);
});

test('every source option must have its own explanation', () => {
  const { record, question } = fixture();
  record.choiceAnalysis.pop();
  assertRejected(record, question, /Explain every option/);
});

test('duplicate option labels are rejected even when the paragraph count is correct', () => {
  const { record, question } = fixture();
  record.choiceAnalysis[1].label = record.choiceAnalysis[0].label;
  assertRejected(record, question, /Invalid option analysis/);
});

test('empty option paragraphs are rejected', () => {
  const { record, question } = fixture();
  record.choiceAnalysis[0].reason = '   ';
  assertRejected(record, question, /Invalid option analysis/);
});

test('AI-reviewed status requires an approving AI review, not merely an author label', () => {
  const { record, question } = fixture();
  record.reviews = [];
  assertRejected(record, question, /Independent AI review required/);
});

test('a later review concern invalidates an old AI approval', () => {
  const { record, question } = fixture();
  record.reviews.push({ reviewer: 'Second reviewer', kind: 'ai', reviewedAt: '2026-09-16', verdict: 'needs-review', notes: 'A choice needs further scrutiny.' });
  assertRejected(record, question, /Independent AI review required/);
});

test('expert-reviewed status cannot be assigned on the strength of AI reviews alone', () => {
  const { record, question } = fixture();
  record.reviewStatus = 'expert-reviewed';
  assertRejected(record, question, /Named human expert review required/);
});

test('needs-review status must describe the unresolved issue', () => {
  const { record, question } = fixture();
  record.reviewStatus = 'needs-review';
  delete record.issue;
  assertRejected(record, question, /Describe the unresolved issue/);
});

test('whitespace-only review identity, date, or notes cannot establish editorial approval', () => {
  for (const key of ['reviewer', 'reviewedAt', 'notes']) {
    const { record, question } = fixture();
    record.reviews[0][key] = ' \t\n ';
    assertRejected(record, question, /Incomplete reviewer record/);
  }
  const { record, question } = fixture();
  record.reviewStatus = 'expert-reviewed';
  record.reviews = [{ reviewer: '   ', kind: 'human', reviewedAt: '2026-09-15', verdict: 'approved', notes: 'Test-only synthetic review; not actual human review.' }];
  assertRejected(record, question, /Incomplete reviewer record/);
});

test('a whitespace-only issue cannot satisfy the needs-review warning requirement', () => {
  const { record, question } = fixture();
  record.reviewStatus = 'needs-review';
  record.issue = ' \t\n ';
  assertRejected(record, question, /Describe the unresolved issue/);
});

test('incomplete review history and missing editorial sections are rejected', () => {
  const { record, question } = fixture();
  record.reviews[0].notes = '';
  assertRejected(record, question, /Incomplete reviewer record/);
  const missingReasoning = fixture();
  missingReasoning.record.reasoning = '';
  assertRejected(missingReasoning.record, missingReasoning.question, /Missing reasoning/);
});
