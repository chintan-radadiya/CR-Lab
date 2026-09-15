import { state } from './core.js';
import { loadCurrent, saveCurrent } from './storage.js';
import { pausedSessionSnapshot } from './exports.js';
import { tickTimer, pauseSession } from './sessions.js';
import { render } from './ui.js';

// Theme changes update CSS in-place: do not redraw a running question or notes.
window.addEventListener?.('cr-theme-change', () => {
  const select = document.getElementById('theme-select');
  if (select) select.value = window.CRTheme.getPreference();
});

setInterval(() => { if (!state.session?.paused) tickTimer() }, 500);
setInterval(() => { if (state.session) { saveCurrent() } }, 5000);

// Recover through the last saved instant; time spent away is not practice time.
state.session = loadCurrent();
if (state.session && !state.session.paused) {
  const capturedAt = Math.min(Date.now(), state.session.updatedAt ?? state.session.createdAt);
  state.session = pausedSessionSnapshot(state.session, capturedAt);
  state.session.pauseReason = 'navigation'; saveCurrent();
}
window.addEventListener?.('pagehide', () => { if (state.view === 'practice' && state.session && !state.session.paused) pauseSession(false, 'navigation') });
window.addEventListener?.('pageshow', event => { if (event.persisted && state.session?.paused) { state.view = 'dashboard'; render() } });
render();
