// analytics — one responsibility, with explicit module dependencies.
import { qById, esc, pct, todayKey } from './core.js';

function questionAttempts(s) {
  return [...new Set(s.questionIds || [])].map(qid => {
    const q = qById.get(qid), a = s.answers?.[qid] || {}, selected = a.selected || '', keyed = !!(q?.answer && q.choices.some(choice => choice.label === q.answer));
    const savedTime = Number(s.times?.[qid] ?? a.time ?? 0), timestamp = a.committedAt ?? a.checkedAt ?? s.completedAt ?? s.createdAt;
    return { ...a, qid, q, session: s, selected, keyed, correct: selected && keyed ? selected === q.answer : null, time: Number.isFinite(savedTime) ? Math.max(0, savedTime) : 0, timestamp };
  });
}

function sessionSummary(s) {
  const attempts = questionAttempts(s), total = attempts.length, answered = attempts.filter(a => a.selected).length, keyed = attempts.filter(a => a.keyed).length, gradable = attempts.filter(a => a.selected && a.keyed).length, correct = attempts.filter(a => a.correct === true).length;
  return { total, answered, keyed, gradable, unkeyed: total - keyed, skipped: total - answered, correct, time: attempts.reduce((sum, a) => sum + a.time, 0), accuracy: pct(correct, gradable), score: pct(correct, keyed) };
}

function practiceAnalytics(sessions) {
  const attempts = sessions.flatMap(questionAttempts), answered = attempts.filter(a => a.selected), scored = answered.filter(a => a.keyed), correct = scored.filter(a => a.correct === true).length, topic = {}, daily = {};
  answered.forEach(a => {
    if (!a.q) return;
    const row = topic[a.q.topic] ??= { a: 0, g: 0, c: 0, t: 0 };
    row.a++; row.t += a.time;
    if (!a.keyed) return;
    row.g++; row.c += a.correct ? 1 : 0;
    const day = todayKey(a.timestamp); if (!day) return;
    const date = daily[day] ??= { a: 0, c: 0 }; date.a++; date.c += a.correct ? 1 : 0;
  });
  const topics = Object.entries(topic).map(([k, row]) => ({ k, ...row, acc: row.g ? pct(row.c, row.g) : null, avg: Math.round(row.t / row.a) })).sort((a, b) => b.a - a.a);
  return { attempts, answered, scored, correct, topics, daily, accuracy: scored.length ? pct(correct, scored.length) : null, averageTime: answered.length ? Math.round(answered.reduce((sum, a) => sum + a.time, 0) / answered.length) : 0 };
}

function lineChart(points) {
  const hasValue = point => Number.isFinite(point.v) && point.a !== 0;
  if (!points.some(hasValue)) return '<div class="empty">No scored answers in this period.</div>';
  const w = 640, h = 230, p = 30, innerW = w - p * 2, innerH = h - p * 2;
  const pts = points.map((point, i) => ({ ...point, x: points.length === 1 ? w / 2 : p + i / (points.length - 1) * innerW, y: h - p - Math.max(0, Math.min(100, point.v || 0)) / 100 * innerH }));
  const segments = []; let segment = [];
  pts.forEach(point => { if (hasValue(point)) segment.push(`${point.x},${point.y}`); else if (segment.length) { segments.push(segment); segment = [] } });
  if (segment.length) segments.push(segment);
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const description = points.map(point => `${point.d}: ${hasValue(point) ? point.v + '% accuracy' : 'no scored answers'}`).join('; ');
  return `<div class="line-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(description)}"><line class="axis" x1="${p}" y1="${h - p}" x2="${w - p}" y2="${h - p}"/><line class="axis" x1="${p}" y1="${h - p - innerH / 2}" x2="${w - p}" y2="${h - p - innerH / 2}"/>${segments.filter(part => part.length > 1).map(part => `<polyline class="line" points="${part.join(' ')}"/>`).join('')}${pts.map((point, i) => `${hasValue(point) ? `<circle class="dot" style="animation-delay:${.65 + i * .08}s" cx="${point.x}" cy="${point.y}" r="4"><title>${esc(point.d)}: ${point.v}%${point.a ? ` (${point.c}/${point.a} correct)` : ''}</title></circle><text class="legend" x="${point.x}" y="${point.y - 8}" text-anchor="middle">${point.v}%</text>` : ''}${i % labelEvery === 0 || i === pts.length - 1 ? `<text class="legend" x="${point.x}" y="${h - 7}" text-anchor="middle">${esc(String(point.d).slice(5))}</text>` : ''}`).join('')}</svg></div>`;
}

function barChart(rows) {
  if (!rows.length) return '<div class="empty">No topic data yet.</div>';
  return `<div class="bar-chart">${rows.map((r, i) => { const scored = Number.isFinite(r.acc), accuracy = scored ? Math.max(0, Math.min(100, r.acc)) : 0; return `<div class="bar-row"><div class="tiny">${esc(r.k)}${r.g != null ? `<div class="muted">${r.g} scored answer${r.g === 1 ? '' : 's'}</div>` : ''}</div><div class="bar-track" role="img" aria-label="${esc(r.k)}: ${scored ? accuracy + '% accuracy' : 'no scored answers'}"><div class="bar-fill" style="width:${accuracy}%;--delay:${i * 70}ms"></div></div><div class="tiny" style="text-align:right">${scored ? accuracy + '%' : '—'}</div></div>` }).join('')}</div>`;
}

export { questionAttempts, sessionSummary, practiceAnalytics, lineChart, barChart };
