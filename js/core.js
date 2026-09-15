// core — one responsibility, with explicit module dependencies.
import { dashboard } from './views.js';

const DATA = window.CR_DATA;

const STORE = 'cr_practice_lab_v1';

const CURRENT = 'cr_practice_current_v1';

const TOPICS = ['Assumption', 'Strengthen', 'Weaken', 'Paradox / Explain', 'Inference', 'Conclusion', 'Main Point', 'Flaw', 'Evaluate', 'Complete the Passage', 'Parallel Reasoning', 'Conditional / Deductive Logic', 'Principle', 'Method / Point at Issue', 'Role / Function', 'Argument Structure', 'Interpretation', 'Plan / Decision', 'Other'];

const TOPIC_FAMILY = { Assumption: 'Argument Evaluation', Strengthen: 'Argument Evaluation', Weaken: 'Argument Evaluation', 'Paradox / Explain': 'Argument Evaluation', Evaluate: 'Argument Evaluation', Flaw: 'Argument Analysis', 'Main Point': 'Argument Analysis', Conclusion: 'Argument Analysis', 'Method / Point at Issue': 'Argument Analysis', 'Role / Function': 'Argument Analysis', 'Argument Structure': 'Argument Analysis', Interpretation: 'Argument Analysis', Inference: 'Deduction', 'Conditional / Deductive Logic': 'Deduction', 'Complete the Passage': 'Deduction', 'Parallel Reasoning': 'Application', Principle: 'Application', 'Plan / Decision': 'Application', Other: 'Other' };

function classifyQuestion(q) {
  const p = q.prompt.replace(/\s+/g, ' ').toLowerCase(), tail = p.slice(-650); let topic = '';
  if (/which (one )?of the following statements provides? support for the claim/.test(p)) topic = 'Strengthen';
  else if (/complete(s)? (the )?(passage|argument)|best completes|most logical completion/.test(tail)) topic = 'Complete the Passage';
  else if (/point at issue|disagree about|disagreement between|logical relationship between .*arguments|consistent with .* claim but not|responds? to .* by/.test(tail)) topic = 'Method / Point at Issue';
  else if (/parallel|most similar (in|to)|most closely (parallels|resembles)|most like .*logical structure|logical structure most like|analogous pattern|same logical (error|features?|structure)|closest.*logical features/.test(tail)) topic = 'Parallel Reasoning';
  else if (/which (one )?of .*principle|best illustrates .*hypothesis|serve as an illustration|principle (above|stated)|conforms? to the (principle|rule|proposition)|application of .*principle|principle.*justif/.test(tail)) topic = 'Principle';
  else if (/resolve|reconcile|explain (the|this|why)|account for|best accounts? for|provides? a rationale|apparent (discrepancy|paradox|conflict)|contributes most to an explanation/.test(tail)) topic = 'Paradox / Explain';
  else if (/evaluat(e|ing|ion)|logical evaluation|most (useful|helpful) to know|most useful (for|in) (determining|assessing)|relevant to an evaluation|answer to which.*question/.test(tail)) topic = 'Evaluate';
  else if (/assum|unstated premise|depends? on|requires? which|presuppos|taken for granted|argument .* based on$/.test(tail)) topic = 'Assumption';
  else if (/weaken|undermine|cast.*doubt|refut|calls? into question|most damaging|best objection|counter .*point|invalidate .*use|indicates? .*insufficient|effectively defend .* against|challenge .*conclusion|evidence against|prediction .* inaccurate|challenge to the critics|allay|ease .* fear|argues? most strongly against/.test(tail)) topic = 'Weaken';
  else if (/strengthen|additional premise|would work best if|most important to establish|supports? (the|this|.* hypothesis|.* recommendation)|provides?.*(support|evidence)|support for the claim|gives? .*support|confirm|substantiat|soundness|justification for/.test(tail)) topic = 'Strengthen';
  else if (/flaw|identif(y|ies) an error|error of reasoning|reasoning error|vulnerable to .*criticism|weak(ness| point)|best critique|best basis for a criticism|reveal.*absurdity|questionable (because|technique)|criticism.*reasoning|jeopardizes? the validity|conclusion .* unsound|relies on$/.test(tail)) topic = 'Flaw';
  else if (/role .*play|function .*statement|serves? which.*(function|role)|use .*statement.*to/.test(tail)) topic = 'Role / Function';
  else if (/method of (reasoning|argument|persuasion)|author.s method|proceeds? by|argumentative strategy|strateg(y|ies) is used|technique of reasoning|organization of the argument|attempts? to prove.* by|does which .* in .* reply/.test(tail)) topic = 'Argument Structure';
  else if (/main point|main idea|primary purpose|best summarizes|central claim/.test(tail)) topic = 'Main Point';
  else if (/conclusion for which|author.*conclusion|conclusion of the argument|expresses? the conclusion|concludes? that|structured to lead to .*conclusion/.test(tail)) topic = 'Conclusion';
  else if (/cannot be true|not consistent|could be true except|must be false/.test(tail)) topic = 'Conditional / Deductive Logic';
  else if (/can be inferred|may be inferred|properly inferred|validly inferred|inferences? can be drawn|most reliable inference|must (also )?be true|must also be accurate|follows logically|conclusions? can .{0,25}drawn|most probably also true|conflicts with (the )?information|logically (derived|deduced|concluded)|most strongly supports? which|supported by the (statements|information)/.test(tail)) topic = 'Inference';
  else if (/interpreted .* to imply|clarify the meaning|opinion .* based primarily|invites? which.*conclusion|best describes how .* counters/.test(tail)) topic = 'Interpretation';
  else if (/which .*?(plan|policy|strategy|action|recommendation)|best prospects for|most likely to (minimize|reduce|decrease)|most effective way|least likely to contribute .*objective|would be beneficial to|should .* (do|use|adopt)|advisable to/.test(tail)) topic = 'Plan / Decision';
  if (topic) q.topic = topic;
  q.type = q.topic; q.family = TOPIC_FAMILY[q.topic] || 'Other';
}

const explanationLibrary = window.CRExplanationLibrary.create(DATA.questions, window.CR_AUTHORED_EXPLANATIONS || []);
window.CRExplanationEngine.enrich(DATA.questions, classifyQuestion);
explanationLibrary.apply(DATA.questions);

const state = { view: 'dashboard', selectedTest: null, selectedSection: null, topicFilter: new Set(), topicCount: 10, session: null, topicStrategy: 'random', errorFilter: 'All', errorStatus: 'Open', errorCategory: 'All', errorSearch: '', errorSessionId: null, resultFilter: 'all', noteDrafts: {}, pages: {}, confirmReset: false, analysis: null, toast: null, recall: null, reviewFilter: 'due', libraryFilter: 'authored', librarySearch: '' };

const app = document.getElementById('app');

const qById = new Map(DATA.questions.map(q => [q.id, q]));

const meta = DATA.metadata;

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function uid(prefix = 'id') { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8) }

function copyData(value) { return JSON.parse(JSON.stringify(value)) }

function isAnswerLocked(answer) { return !!(answer?.selected && (answer.submitted || answer.checked)) }

function fmtSec(sec) { sec = Math.max(0, Math.round(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}` }

function pct(a, b) { return b ? Math.round(a / b * 100) : 0 }

function todayKey(ts = Date.now()) { const date = new Date(ts); if (!Number.isFinite(date.getTime())) return ''; return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

function getQuestions(ids) { return ids.map(id => qById.get(id)).filter(Boolean) }

function displayTestTitle(corpus, test, section) {
  const groups = [...new Set(meta.map(m => m.corpus + '|' + m.test))], position = groups.indexOf(corpus + '|' + test);
  return `CAT${position >= 0 ? ' Set ' + (position + 1) : ''} · Test ${test}${section && section !== 'Main' ? ' · ' + section : ''}`
}

function sessionSourceTitle(s) {
  if (s.mode === 'topic') return `Focused practice · ${s.questionIds.length} questions`;
  const q = getQuestions(s.questionIds)[0];
  return displayTestTitle(q?.corpus || s.corpus, q?.test || s.test, s.sectionLabel || s.section || '')
}

export { explanationLibrary, DATA, STORE, CURRENT, TOPICS, TOPIC_FAMILY, classifyQuestion, state, app, qById, meta, esc, uid, copyData, isAnswerLocked, fmtSec, pct, todayKey, getQuestions, displayTestTitle, sessionSourceTitle };
