const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

process.env.TZ = 'Asia/Kolkata';
const root = path.resolve(__dirname, '..');
const inlineScript = require('./app-source.cjs').loadAppScript();
const exposedScript = inlineScript.replace(/\}\)\(\);\s*$/, `
  globalThis.__test = { state, qById, todayKey, questionAttempts, sessionSummary,
    practiceAnalytics, lineChart, barChart, resultView, dashboard, reportsView,
    buildReportSheets, sheetXml, saveStore, setupSession, selectAnswer, finishSession };
})();`);
const bank = vm.createContext({ window: {} });
vm.runInContext(readFileSync(path.join(root, 'cr_app_data.js'), 'utf8'), bank);
const fixture = JSON.parse(JSON.stringify({
  questions: bank.window.CR_DATA.questions.slice(0, 4),
  metadata: bank.window.CR_DATA.metadata.slice(0, 1)
}));
const explanationScript = readFileSync(path.join(root, 'cr_explanation_engine.js'), 'utf8');

function createApp() {
  const storage = new Map(), app = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
  const context = vm.createContext({
    window: { CR_DATA: JSON.parse(JSON.stringify(fixture)), matchMedia: () => ({ matches: true }) },
    document: { getElementById: id => id === 'app' ? app : null, createTreeWalker: () => ({ nextNode: () => null }) },
    NodeFilter: { SHOW_TEXT: 4 },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
    setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: callback => callback(),
    confirm: () => true, TextEncoder, Blob, Date
  });
  vm.runInContext(explanationScript, context);
  vm.runInContext(exposedScript, context);
  const api = context.__test, ids = fixture.questions.map(q => q.id);
  ids.forEach((id, i) => Object.assign(api.qById.get(id), { answer: i === 2 ? null : i === 1 ? 'B' : 'A', topic: i === 2 ? 'Unkeyed topic' : 'Keyed topic' }));
  const session = {
    id: 'test-session', createdAt: Date.parse('2026-09-15T18:00:00Z'), mode: 'topic', modeLabel: 'Focused practice', corpus: 'CAT', test: 'Custom', sectionLabel: 'Main',
    questionIds: ids, answers: {
      [ids[0]]: { selected: 'A', correct: false, time: 999, committedAt: Date.parse('2026-09-15T19:00:00Z') },
      [ids[1]]: { selected: 'A', correct: false },
      [ids[2]]: { selected: 'A', correct: false },
      orphan: { selected: 'A', correct: true }
    }, times: { [ids[0]]: 10, [ids[1]]: 20, [ids[2]]: 30, [ids[3]]: 5, orphan: 100 }, flags: { [ids[1]]: true }
  };
  return { api, session, ids };
}

test('session score uses all keyed questions while accuracy uses only answered keyed questions', () => {
  const { api, session } = createApp(), summary = api.sessionSummary(session);
  assert.equal(summary.total, 4);
  assert.equal(summary.answered, 3);
  assert.equal(summary.keyed, 3);
  assert.equal(summary.gradable, 2);
  assert.equal(summary.correct, 1);
  assert.equal(summary.unkeyed, 1);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.time, 65);
  assert.equal(summary.accuracy, 50);
  assert.equal(summary.score, 33);
});

test('analytics resolves legacy answer keys, recomputes correctness, and excludes unkeyed answers from accuracy', () => {
  const { api, session, ids } = createApp(), data = api.practiceAnalytics([session]);
  assert.equal(data.attempts.length, 4);
  assert.equal(data.answered.length, 3);
  assert.equal(data.scored.length, 2);
  assert.equal(data.accuracy, 50);
  assert.equal(data.averageTime, 20);
  assert.equal(data.attempts.find(a => a.qid === ids[0]).time, 10);
  assert.equal(data.topics.find(row => row.k === 'Keyed topic').acc, 50);
  assert.equal(data.topics.find(row => row.k === 'Unkeyed topic').acc, null);
});

test('daily accuracy uses local answer dates across midnight, with session dates for legacy answers', () => {
  const { api, session } = createApp(), data = api.practiceAnalytics([session]);
  assert.equal(api.todayKey(Date.parse('2026-09-15T19:00:00Z')), '2026-09-16');
  assert.equal(data.daily['2026-09-16'].c, 1);
  assert.equal(data.daily['2026-09-16'].a, 1);
  assert.equal(data.daily['2026-09-15'].c, 0);
  assert.equal(data.daily['2026-09-15'].a, 1);
  assert.equal(api.todayKey('invalid-date'), '');
});

test('daily chart omits inactive dates instead of drawing zero accuracy', () => {
  const { api } = createApp();
  assert.match(api.lineChart([{ d: '2026-09-15', a: 0, v: null }]), /No scored answers/);
  const chart = api.lineChart([
    { d: '2026-09-12', a: 1, c: 1, v: 100 },
    { d: '2026-09-13', a: 0, c: 0, v: null },
    { d: '2026-09-14', a: 1, c: 0, v: 0 },
    { d: '2026-09-15', a: 2, c: 1, v: 50 }
  ]);
  assert.equal((chart.match(/<circle /g) || []).length, 3);
  assert.equal((chart.match(/<polyline /g) || []).length, 1);
  assert.match(chart, /2026-09-13: no scored answers/);
  assert.match(chart, /2026-09-14: 0% accuracy/);
  assert.match(chart, /role="img"/);
});

test('result review distinguishes unanswered and unscored questions', () => {
  const { api, session } = createApp();
  api.state._result = session;
  const markup = api.resultView();
  assert.match(markup, /class="score">1\/3</);
  assert.match(markup, /class="score">50%</);
  assert.equal((markup.match(/data-review-status="correct"/g) || []).length, 1);
  assert.equal((markup.match(/data-review-status="incorrect"/g) || []).length, 1);
  assert.equal((markup.match(/data-review-status="unscored"/g) || []).length, 1);
  assert.equal((markup.match(/data-review-status="unanswered"/g) || []).length, 1);
});

test('Excel exports every question including skips and keeps scoring denominators explicit', () => {
  const { api, session, ids } = createApp(), sheets = api.buildReportSheets({ sessions: [session], errors: [] });
  function records(name) {
    const [headings, ...rows] = sheets.find(sheet => sheet.name === name).rows;
    return rows.map(row => Object.fromEntries(headings.map((heading, i) => [heading, row[i]])));
  }
  const log = records('Question Log');
  assert.equal(log.length, 4);
  assert.equal(log.find(row => row['Question ID'] === ids[2]).Outcome, 'Not scored');
  assert.equal(log.find(row => row['Question ID'] === ids[3]).Outcome, 'Unanswered');
  assert.equal(log.find(row => row['Question ID'] === ids[3])['Time (sec)'], 5);
  assert.equal(log.find(row => row['Question ID'] === ids[1]).Flagged, 'Yes');
  const summary = records('Sessions')[0];
  assert.equal(summary['Keyed questions'], 3);
  assert.equal(summary['Scored answers'], 2);
  assert.equal(summary['Accuracy %'], 50);
  assert.equal(summary['Score %'], 33);
  assert.equal(records('Topic Summary').find(row => row.Topic === 'Unkeyed topic')['Accuracy %'], '');
});

test('an entirely unkeyed session displays no accuracy rather than an incorrect zero', () => {
  const { api, session, ids } = createApp();
  session.questionIds = [ids[2]];
  api.state._result = session;
  assert.equal(api.practiceAnalytics([session]).accuracy, null);
  assert.match(api.resultView(), /class="score">—</);
  assert.doesNotMatch(api.resultView(), /data-review-status="incorrect"/);
  assert.match(api.barChart(api.practiceAnalytics([session]).topics), /no scored answers/);
});

test('Excel metrics are numeric cells and notes remain literal escaped text', () => {
  const { api } = createApp();
  const xml = api.sheetXml([[12, 0, 1.5, true, false, '=SUM(A1:A2)', '<note>&', ' leading space ']]);
  assert.match(xml, /<c r="A1"><v>12<\/v><\/c>/);
  assert.match(xml, /<c r="B1"><v>0<\/v><\/c>/);
  assert.match(xml, /<c r="C1"><v>1\.5<\/v><\/c>/);
  assert.match(xml, /<c r="D1" t="b"><v>1<\/v><\/c>/);
  assert.match(xml, /<c r="E1" t="b"><v>0<\/v><\/c>/);
  assert.match(xml, /<t xml:space="preserve">=SUM\(A1:A2\)<\/t>/);
  assert.match(xml, /&lt;note&gt;&amp;/);
  assert.match(xml, /<t xml:space="preserve"> leading space <\/t>/);
});

test('finishing a new practice resets filters and pagination from past session reviews', () => {
  const { api, ids } = createApp();
  api.state.resultFilter = 'incorrect';
  api.state.pages.result = 3;
  api.setupSession([ids[0]], { mode: 'topic', modeLabel: 'New practice', section: 'Main' });
  api.selectAnswer('A');
  api.finishSession();
  assert.equal(api.state.view, 'result');
  assert.equal(api.state.resultFilter, 'all');
  assert.equal(api.state.pages.result, 1);
});
