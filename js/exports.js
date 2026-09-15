// exports — one responsibility, with explicit module dependencies.
import { state, qById, copyData, isAnswerLocked, sessionSourceTitle } from './core.js';
import { persistence, dataObject, dataNumber, validateSession, validateHistory, loadStore, saveStore, loadCurrent, saveCurrent, store } from './storage.js';
import { sessionSummary, practiceAnalytics } from './analytics.js';
import { notify } from './ui.js';

function pausedSessionSnapshot(session, capturedAt) {
  const s = copyData(session), qid = s.questionIds[s.index];
  if (!s.paused && !isAnswerLocked(s.answers[qid]) && s._qStartedAt != null) {
    const endedAt = s.sectionEndsAt != null ? Math.min(capturedAt, s.sectionEndsAt) : capturedAt;
    s.times[qid] = (s.times[qid] || 0) + Math.max(0, (endedAt - s._qStartedAt) / 1000);
    if (s.answers[qid]) s.answers[qid].time = s.times[qid];
  }
  if (!s.paused) s.pausedSectionRemainingMs = s.sectionEndsAt != null ? Math.max(0, s.sectionEndsAt - capturedAt) : null;
  s._qStartedAt = null; s.sectionEndsAt = null; s.paused = true; s.pausedAt = capturedAt;
  return s;
}

function exportBackupData() {
  const exportedAt = Date.now(), history = loadStore(), current = state.session || loadCurrent();
  const backup = { format: 'cr-practice-lab', version: 3, exportedAt, ...history, activeSession: current ? pausedSessionSnapshot(current, exportedAt) : null };
  if (persistence.blocked.size) backup.recoveryData = Object.fromEntries(persistence.blocked);
  return backup;
}

function restoreBackupData(value) {
  const source = dataObject(value, 'Backup');
  if ((source.format != null && source.format !== 'cr-practice-lab') || (source.version != null && ![2, 3].includes(source.version))) throw new Error('Unsupported backup format or version');
  if (source.exportedAt != null) dataNumber(source.exportedAt, 'Backup date');
  const existing = loadStore(), incoming = validateHistory(source, existing.sessions);
  const incomingActive = source.activeSession == null ? null : validateSession(source.activeSession);
  const mergeById = (current, imported) => { const ids = new Set(current.map(item => item.id)); return [...current, ...imported.filter(item => !ids.has(item.id))] };
  const merged = validateHistory({ sessions: mergeById(existing.sessions, incoming.sessions), errors: mergeById(existing.errors, incoming.errors), notes: { ...incoming.notes, ...existing.notes }, reviewEvents: mergeById(existing.reviewEvents, incoming.reviewEvents) });
  const mayRestoreActive = incomingActive && !state.session && !loadCurrent() && !merged.sessions.some(s => s.id === incomingActive.id);
  let saved = saveStore(merged);
  if (mayRestoreActive) {
    state.session = pausedSessionSnapshot(incomingActive, source.exportedAt ?? incomingActive.updatedAt ?? incomingActive.createdAt);
    saved = saveCurrent() && saved;
  }
  return { saved, restoredActive: !!mayRestoreActive, addedSessions: merged.sessions.length - existing.sessions.length, addedReviews: merged.reviewEvents.length - existing.reviewEvents.length };
}

function backupJson() { const blob = new Blob([JSON.stringify(exportBackupData(), null, 2)], { type: 'application/json' }); downloadBlob(blob, 'cr-practice-backup.json'); notify('Backup downloaded, including your review schedule and current session.') }

function restoreJson(ev) {
  const file = ev.target.files?.[0]; if (!file) return; const reader = new FileReader();
  reader.onload = () => {
    try { const result = restoreBackupData(JSON.parse(reader.result)); notify(result.saved ? `Backup merged: ${result.addedSessions} new session(s), ${result.addedReviews} review(s). Existing records kept.${result.restoredActive ? ' Current practice restored paused.' : ''}` : 'Backup loaded in this tab, but browser storage failed. Keep this tab open and download a backup.') }
    catch (error) { notify(`Restore failed: ${error.message || 'invalid backup file'}. No backup records were written.`) }
    ev.target.value = '';
  };
  reader.onerror = () => { notify('Restore failed: the backup file could not be read.'); ev.target.value = '' };
  reader.readAsText(file);
}

function downloadBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500) }

// Minimal XLSX writer (stored ZIP entries; no external libraries)

const crcTable = (() => { let t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++)c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0 } return t })();

function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }

function u16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]) } function u32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]) }

function concatBytes(parts) { let n = parts.reduce((a, b) => a + b.length, 0), o = new Uint8Array(n), p = 0; parts.forEach(b => { o.set(b, p); p += b.length }); return o }

function zipStored(files) { const enc = new TextEncoder(), locals = [], centrals = []; let offset = 0; files.forEach(f => { const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data); const lh = concatBytes([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data]); locals.push(lh); const ch = concatBytes([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]); centrals.push(ch); offset += lh.length }); const central = concatBytes(centrals), body = concatBytes(locals), eocd = concatBytes([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(body.length), u16(0)]); return new Blob([body, central, eocd], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) }

function xesc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;') }

function sheetXml(rows) { return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => { const ref = colName(ci) + (ri + 1); if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`; if (typeof v === 'boolean') return `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>`; return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xesc(v)}</t></is></c>` }).join('')}</row>`).join('')}</sheetData></worksheet>` }

function colName(n) { let s = ''; n++; while (n) { let r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26) } return s }

function xlsxWorkbook(sheets) { const ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>', ...sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`), '</Types>'].join(''); const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'; const wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`; const wbr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`; const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="1"><xf/></cellXfs></styleSheet>'; const files = [{ name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: rels }, { name: 'xl/workbook.xml', data: wb }, { name: 'xl/_rels/workbook.xml.rels', data: wbr }, { name: 'xl/styles.xml', data: styles }]; sheets.forEach((s, i) => files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s.rows) })); return zipStored(files) }

function buildReportSheets(st) {
  const sessions = st.sessions || [], { attempts, topics } = practiceAnalytics(sessions);
  const sessionRows = [['Session ID', 'Started', 'Mode', 'Practice set', 'Correct', 'Keyed questions', 'Total questions', 'Answered', 'Unanswered', 'No answer key', 'Scored answers', 'Score %', 'Accuracy %', 'Time (sec)'], ...sessions.map(s => {
    const x = sessionSummary(s);
    return [s.id, new Date(s.createdAt).toLocaleString(), s.modeLabel, sessionSourceTitle(s), x.correct, x.keyed, x.total, x.answered, x.skipped, x.unkeyed, x.gradable, x.keyed ? x.score : '', x.gradable ? x.accuracy : '', Math.round(x.time)];
  })];
  const qRows = [['Session ID', 'Question ID', 'Answer date', 'Mode', 'Practice set', 'Source bank', 'Test', 'Section', 'Question', 'Topic', 'Selected', 'Answer key', 'Outcome', 'Time (sec)', 'Flagged', 'Answer checked'], ...attempts.map(a => {
    const q = a.q, s = a.session, outcome = !a.selected ? 'Unanswered' : !a.keyed ? 'Not scored' : a.correct ? 'Correct' : 'Incorrect';
    return [s.id, a.qid, a.selected ? new Date(a.timestamp).toLocaleString() : '', s.modeLabel, sessionSourceTitle(s), q?.corpus || s.corpus, q?.test ?? s.test, q?.section || s.sectionLabel, q?.number ?? '', q?.topic || '', a.selected, q?.answer || '', outcome, Math.round(a.time), s.flags?.[a.qid] ? 'Yes' : 'No', a.checked ? 'Yes' : 'No'];
  })];
  const topicRows = [['Topic', 'Attempts', 'Scored answers', 'Correct', 'Accuracy %', 'Average time (sec)'], ...topics.map(r => [r.k, r.a, r.g, r.c, r.acc === null ? '' : r.acc, r.avg])];
  const errRows = [['Error ID', 'Session ID', 'Question ID', 'Date', 'Source bank', 'Test', 'Section', 'Question', 'Topic', 'Your answer', 'Answer key', 'Time (sec)', 'Category', 'Status', 'Note'], ...(st.errors || []).map(e => {
    const q = qById.get(e.qid);
    return [e.id, e.sessionId, e.qid, new Date(e.createdAt).toLocaleString(), q?.corpus || e.corpus, q?.test ?? e.test, q?.section || e.section, q?.number ?? e.number, q?.topic || e.topic, e.selected || '', q?.answer || e.answer || '', Math.round(e.time || 0), e.category || 'Incorrect', e.status, e.note || ''];
  })];
  const reviewRows = [['Review ID', 'Question ID', 'Reviewed at', 'Recall rating', 'Scheduled next review', 'Interval (days)', 'Successful repetitions', 'Lapses'], ...(st.reviewEvents || []).map(event => [event.id, event.qid, new Date(event.reviewedAt).toLocaleString(), event.rating, event.dueAt == null ? '' : new Date(event.dueAt).toLocaleString(), event.intervalDays ?? '', event.repetitions ?? '', event.lapses ?? ''])];
  const scheduleRows = [['Question ID', 'Topic', 'Review reasons', 'Next review', 'Due now', 'Interval (days)', 'Successful repetitions', 'Lapses', 'Last reviewed', 'Last rating', 'Source session ID'], ...window.CRSpacedRepetition.queue(st, qById).map(entry => [entry.qid, qById.get(entry.qid)?.topic || '', entry.reason, new Date(entry.dueAt).toLocaleString(), entry.isDue, entry.intervalDays, entry.repetitions, entry.lapses, entry.lastReviewedAt == null ? '' : new Date(entry.lastReviewedAt).toLocaleString(), entry.lastRating || '', entry.sessionId || ''])];
  return [{ name: 'Sessions', rows: sessionRows }, { name: 'Question Log', rows: qRows }, { name: 'Topic Summary', rows: topicRows }, { name: 'Error Log', rows: errRows }, { name: 'Review History', rows: reviewRows }, { name: 'Review Schedule', rows: scheduleRows }];
}

function exportXlsx() { downloadBlob(xlsxWorkbook(buildReportSheets(store())), 'cr-practice-report.xlsx'); notify('Excel report downloaded.'); }

export { pausedSessionSnapshot, exportBackupData, restoreBackupData, backupJson, restoreJson, downloadBlob, crcTable, crc32, u16, concatBytes, zipStored, xesc, sheetXml, colName, xlsxWorkbook, buildReportSheets, exportXlsx, u32 };
