// Authored content is separate from heuristic coaching and from source answer keys.
(() => {
  'use strict';
  const STATUSES = ['authored', 'ai-reviewed', 'expert-reviewed', 'needs-review'];
  function fingerprint(question) {
    const text = JSON.stringify([question.id, question.prompt, question.choices.map(c => [c.label, c.text]), question.answer]);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return 'fnv1a-' + (hash >>> 0).toString(16).padStart(8, '0');
  }
  function validate(record, question) {
    if (!record || !question || record.qid !== question.id) throw new Error('Unknown question');
    if (!question.answer || record.sourceAnswer !== question.answer) throw new Error('Source answer does not match');
    if (record.sourceFingerprint !== fingerprint(question)) throw new Error('Question text or answer choices have changed; re-review required');
    for (const key of ['author', 'authoredAt', 'stimulusSummary', 'conclusion', 'reasoning', 'takeaway']) {
      if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error('Missing ' + key);
    }
    if (!Number.isInteger(record.version) || record.version < 1 || !STATUSES.includes(record.reviewStatus)) throw new Error('Invalid editorial version/status');
    if (!Array.isArray(record.choiceAnalysis) || record.choiceAnalysis.length !== question.choices.length) throw new Error('Explain every option');
    const labels = new Set();
    record.choiceAnalysis.forEach(item => {
      if (!question.choices.some(c => c.label === item.label) || labels.has(item.label) || typeof item.reason !== 'string' || !item.reason.trim()) throw new Error('Invalid option analysis');
      labels.add(item.label);
    });
    if (!Array.isArray(record.reviews)) throw new Error('Review history must be an array');
    record.reviews.forEach(review => {
      if (!['ai', 'human'].includes(review.kind) || !['approved', 'needs-review'].includes(review.verdict) || ['reviewer', 'reviewedAt', 'notes'].some(key => typeof review[key] !== 'string' || !review[key].trim())) throw new Error('Incomplete reviewer record');
    });
    const last = record.reviews.at(-1);
    if (record.reviewStatus === 'ai-reviewed' && !(last?.kind === 'ai' && last.verdict === 'approved')) throw new Error('Independent AI review required');
    if (record.reviewStatus === 'expert-reviewed' && !(last?.kind === 'human' && last.verdict === 'approved')) throw new Error('Named human expert review required');
    if (record.reviewStatus === 'needs-review' && (typeof record.issue !== 'string' || !record.issue.trim())) throw new Error('Describe the unresolved issue');
    return record;
  }
  function create(questions, records = []) {
    const bank = new Map(questions.map(q => [q.id, q])), accepted = new Map(), issues = [], seen = new Set();
    for (const record of records) {
      if (seen.has(record?.qid)) { accepted.delete(record.qid); issues.push({ qid: record.qid, issue: 'Duplicate authored record' }); continue; }
      seen.add(record?.qid);
      try { validate(record, bank.get(record?.qid)); accepted.set(record.qid, record); }
      catch (error) { issues.push({ qid: record?.qid || 'unknown', issue: error.message }); }
    }
    function apply(items) {
      items.forEach(q => {
        const record = accepted.get(q.id); if (!record) return;
        const draft = q.explanation;
        q.explanation = {
          ...draft, evidence: record.stimulusSummary, conclusion: record.conclusion,
          why: record.reasoning, method: 'Follow the question-specific argument below, then compare each alternative with the exact task.',
          choiceAnalysis: q.choices.map(c => ({ label: c.label, correct: c.label === q.answer, reason: record.choiceAnalysis.find(a => a.label === c.label).reason })),
          takeaway: record.takeaway, specific: true, reviewStatus: record.reviewStatus,
          confidence: { authored: 'AI-authored · awaiting review', 'ai-reviewed': 'AI-authored · independently AI-reviewed', 'expert-reviewed': 'Human expert reviewed', 'needs-review': 'Editorial issue · needs review' }[record.reviewStatus],
          editorial: record, issue: record.issue || ''
        };
      });
    }
    function stats() {
      const values = [...accepted.values()];
      return { total: questions.length, authored: values.length, aiReviewed: values.filter(r => r.reviewStatus === 'ai-reviewed').length, expertReviewed: values.filter(r => r.reviewStatus === 'expert-reviewed').length, needsReview: values.filter(r => r.reviewStatus === 'needs-review').length, drafts: questions.length - values.length, rejected: issues.length };
    }
    return { get: id => accepted.get(id), records: () => [...accepted.values()], issues, apply, stats };
  }
  window.CRExplanationLibrary = { create, validate, fingerprint, STATUSES };
})();
