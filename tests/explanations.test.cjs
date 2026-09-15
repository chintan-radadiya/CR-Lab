const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(root, 'cr_app_data.js'), 'utf8'), context);
vm.runInContext(readFileSync(path.join(root, 'cr_explanation_engine.js'), 'utf8'), context);
const source = JSON.parse(JSON.stringify(context.window.CR_DATA.questions));
const originalById = new Map(source.map(question => [question.id, question]));
const questions = JSON.parse(JSON.stringify(source));
const engine = context.window.CRExplanationEngine;
engine.enrich(questions, question => { question.type = question.topic; });
const byId = new Map(questions.map(question => [question.id, question]));

test('a complete short question never inherits an unrelated preceding passage', () => {
  const id = 'gmat-iii-main-7';
  assert.equal(byId.get(id).prompt, originalById.get(id).prompt);
  assert.doesNotMatch(byId.get(id).prompt, /tobacco|lobbyists/);
});

test('a stem before the passage is separated from the passage being completed', () => {
  const question = byId.get('gmat-iii-main-7');
  const explanation = engine.build({ ...question, type: 'Complete the Passage' });
  assert.equal(explanation.stem, 'Which of the following best completes the passage below?');
  assert.match(explanation.stimulus, /^When a project is failing/);
  assert.match(explanation.conclusion, /New managers/);
  assert.doesNotMatch(explanation.stimulus, /Which of the following/);
});

test('explicit shared-passage groups are restored without modifying their source keys', () => {
  const groups = [
    ['lsat-7-Section I-18', 'lsat-7-Section I-19', /When Alicia Green/],
    ['lsat-16-Section III-24', 'lsat-16-Section III-25', /When volcanic lava solidifies/],
    ['lsat-oct-2002-Section I-17', 'lsat-oct-2002-Section I-18', /In order to determine automobile/],
    ['lsat-oct-2002-Section IV-18', 'lsat-oct-2002-Section IV-19', /Anders: The physical structure/]
  ];
  for (const [first, second, expected] of groups) {
    for (const id of [first, second]) {
      assert.match(byId.get(id).prompt, expected, id);
      assert.equal(byId.get(id).answer, originalById.get(id).answer, id);
    }
  }
  assert.doesNotMatch(byId.get('lsat-16-Section III-23').choices.at(-1).text, /When volcanic lava/);
});

test('the explicitly identified turtle follow-up retains its shared passage', () => {
  const question = byId.get('lsat-12-Section II-2');
  assert.match(question.prompt, /^Sea turtles nest only at their own birthplaces/);
  assert.match(question.prompt, /evaluating the hypothesis in the passages/);
});

test('repeated enrichment does not duplicate restored passages', () => {
  const snapshot = questions.map(question => question.prompt);
  engine.enrich(questions, question => { question.type = question.topic; });
  assert.deepEqual(questions.map(question => question.prompt), snapshot);
});

test('negation preserves the entire quantified and already-negative proposition', () => {
  const question = byId.get('gmat-6-main-4');
  const explanation = engine.build({ ...question, type: 'Assumption' });
  assert.match(explanation.why, /It is not true that \(Most private planes that use centrally located airports are not equipped with radar\)\./);
  assert.doesNotMatch(explanation.why, /\bnot\s+not\b/);
});

test('explicit first and second sentence references select the requested claim', () => {
  const first = engine.build({ ...byId.get('gmat-6-main-4'), type: 'Assumption' });
  const second = engine.build({ ...byId.get('gmat-6-main-5'), type: 'Strengthen' });
  assert.match(first.conclusion, /^If the airspace around centrally located airports/);
  assert.match(first.conclusion, /forced to use outlying airfields\.$/);
  assert.doesNotMatch(first.conclusion, /risk of midair collision/);
  assert.match(second.conclusion, /^Such a reduction/);
  assert.match(second.conclusion, /risk of midair collision/);
});

test('explicit last and final sentence references select the requested sentence', () => {
  const fixture = { ...byId.get('gmat-6-main-5'), type: 'Strengthen' };
  for (const ordinal of ['last', 'final']) {
    const explanation = engine.build({ ...fixture, prompt: `Therefore, the first plan is workable. There is also evidence for another plan. The second plan will succeed. Which of the following strengthens the claim in the ${ordinal} sentence?` });
    assert.equal(explanation.conclusion, 'The second plan will succeed.');
  }
});

test('first-sentence wording inside a different task does not select that sentence', () => {
  const explanation = engine.build({ ...byId.get('lsat-19-Section II-24'), type: 'Flaw' });
  assert.notEqual(explanation.conclusion, 'The role of the Uplandian supreme court is to protect all human rights against abuses of government power.');
});

test('a clearly sufficient assumption receives a sufficiency test instead of a necessity test', () => {
  const explanation = engine.build({ ...byId.get('gmat-4-main-17'), type: 'Assumption' });
  assert.match(explanation.method, /requests a sufficient assumption/);
  assert.match(explanation.why, /add it to the stated premises/);
  assert.doesNotMatch(explanation.why, /Test its necessity|It is not true that/);
  for (const choice of explanation.choiceAnalysis.filter(choice => !choice.correct)) {
    assert.match(choice.reason, /premises and this option hold but the conclusion is false/);
  }
});

test('a clearly necessary assumption retains the whole-proposition negation test', () => {
  const explanation = engine.build({ ...byId.get('gmat-6-main-4'), type: 'Assumption' });
  assert.match(explanation.method, /requests a necessary assumption/);
  assert.match(explanation.why, /Test its necessity/);
  assert.match(explanation.why, /It is not true that/);
});

test('an ambiguous assumption stem does not falsely assert necessity or sufficiency', () => {
  const explanation = engine.build({ ...byId.get('gmat-7-main-7'), type: 'Assumption' });
  assert.match(explanation.why, /Determine from the exact instruction/);
  assert.doesNotMatch(explanation.method, /This stem requests/);
  assert.doesNotMatch(explanation.why, /That is why this statement is necessary/);
});

test('negation inside the claim does not change a strengthen task into an exception task', () => {
  const question = byId.get('gmat-b-main-6');
  const explanation = engine.build({ ...question, type: 'Strengthen' });
  assert.match(explanation.stem, /most strengthen.*was not buried/);
  assert.doesNotMatch(explanation.why, /reverse-polarity|keyed exception/);
  assert.notEqual(explanation.conclusion, '415.');
});

test('not properly drawn unless remains an assumption task', () => {
  const question = byId.get('gmat-2-main-14');
  const explanation = engine.build({ ...question, type: 'Assumption' });
  assert.match(explanation.stem, /not properly drawn unless/);
  assert.doesNotMatch(explanation.why, /reverse-polarity|keyed exception/);
});

test('explicit EXCEPT and NOT supported instructions remain reverse tasks', () => {
  const fixture = {
    answer: 'A', type: 'Inference', choices: [{ label: 'A', text: 'Some birds cannot fly.' }]
  };
  for (const stem of [
    'Which of the following is NOT supported by these facts?',
    'Each of the following could be true EXCEPT:'
  ]) {
    const explanation = engine.build({ ...fixture, prompt: `Every bird in this aviary can fly. ${stem}` });
    assert.match(explanation.why, /reverse-polarity/);
  }
});

test('every generated record distinguishes the source key from explanation review status', () => {
  let keyed = 0;
  for (const question of questions) {
    const explanation = question.explanation;
    assert.equal(question.answer, originalById.get(question.id).answer);
    assert.equal(explanation.specific, false);
    if (question.answer) {
      keyed += 1;
      assert.equal(explanation.reviewStatus, 'draft', question.id);
      assert.equal(explanation.confidence, 'Automated draft · PDF key', question.id);
      assert.equal(explanation.choiceAnalysis.length, question.choices.length, question.id);
      assert.doesNotMatch(explanation.why, /\bnot\s+not\b/, question.id);
    } else {
      assert.equal(explanation.reviewStatus, 'unkeyed', question.id);
      assert.equal(explanation.keyed, false, question.id);
      assert.equal(explanation.choiceAnalysis.length, 0, question.id);
    }
  }
  assert.equal(keyed, 2055);
  assert.equal(questions.length - keyed, 5);
});

test('an unkeyed question does not acquire an answer or option-rejection claims', () => {
  const question = byId.get('gmat-12-main-19');
  assert.equal(question.explanation.answer, 'Source key unavailable');
  assert.equal(question.explanation.choiceAnalysis.length, 0);
  assert.equal(question.explanation.reviewStatus, 'unkeyed');
});

test('alternative-option guidance asks the learner to evaluate instead of asserting an unproved rejection', () => {
  const question = byId.get('gmat-b-main-6');
  const explanation = engine.build({ ...question, type: 'Strengthen' });
  for (const alternative of explanation.choiceAnalysis.filter(choice => !choice.correct)) {
    assert.match(alternative.reason, /Identify whether it increases/);
    assert.doesNotMatch(alternative.reason, /does not make|not the exception|leaves.*intact/);
  }
});
