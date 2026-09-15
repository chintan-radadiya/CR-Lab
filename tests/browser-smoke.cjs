// Optional real-browser smoke test: node tests/browser-smoke.cjs
// Uses a disposable Chrome profile and loopback server; never touches user progress.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
const browserPath = process.env.CR_TEST_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cr-browser-smoke-'));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, send, spawnError;
const errors = [];
const server = http.createServer((req, res) => {
  const name = req.url === '/' ? 'index.html' : req.url.slice(1);
  if (!/^(?:index\.html|cr_(?:app_data|explanation_engine)\.js|(?:js|css|content)\/[a-z0-9-]+\.(?:js|css))$/.test(name) || !fs.existsSync(path.join(root, name))) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(path.join(root, name)));
});

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function click(selector) {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Missing control: ' + ${JSON.stringify(selector)}); el.focus(); el.click(); })()`);
}
async function setField(selector, value, event = 'change') {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event(${JSON.stringify(event)}, {bubbles: true})); })()`);
}
async function waitFor(expression, message) {
  for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(50); }
  assert.fail(message || `Timed out waiting for ${expression}`);
}
async function setTheme(value) {
  await setField('#theme-select', value);
  await waitFor(`window.CRTheme.getPreference() === ${JSON.stringify(value)} && document.querySelector('#theme-select').value === ${JSON.stringify(value)}`, `Theme preference ${value} is applied`);
  if (value !== 'system') await waitFor(`document.documentElement.dataset.theme === ${JSON.stringify(value)}`, `Resolved theme is ${value}`);
}
async function capture(name) {
  const screenshotPath = path.join(os.tmpdir(), `cr-lab-${name}.png`);
  fs.writeFileSync(screenshotPath, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  console.log('Screenshot:', screenshotPath);
}
async function assertContrast(selector, label) {
  const sample = await evaluate(`(${function (selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error('Missing contrast sample: ' + selector);
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = canvas.height = 1;
    const color = value => { context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data].map((n, i) => i === 3 ? n / 255 : n); };
    const blend = (foreground, background) => foreground.slice(0, 3).map((n, i) => n * foreground[3] + background[i] * (1 - foreground[3]));
    const chain = []; let node = element;
    while (node) { chain.unshift(node); node = node.parentElement; }
    let background = [255, 255, 255];
    for (const ancestor of chain) background = blend(color(getComputedStyle(ancestor).backgroundColor), background);
    const foreground = blend(color(getComputedStyle(element).color), background);
    const luminance = rgb => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
    const f = luminance(foreground), b = luminance(background);
    return { selector, theme: document.documentElement.dataset.theme, color: foreground, background, ratio: (Math.max(f, b) + .05) / (Math.min(f, b) + .05) };
  }.toString()})(${JSON.stringify(selector)})`);
  assert.ok(sample.ratio >= 4.5, `${label}: normal-text solid-surface contrast must be at least 4.5:1; ${JSON.stringify(sample)}`);
}
async function checkBothThemes(label, selectors, screenshotPrefix) {
  for (const theme of ['light', 'dark']) {
    await setTheme(theme);
    for (const selector of selectors) await assertContrast(selector, `${label} / ${theme}`);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${label} / ${theme}: no page overflow`);
    if (screenshotPrefix) await capture(`${screenshotPrefix}-${theme}`);
  }
}
async function assertThemeDoesNotTouchAnswer(label) {
  const sample = await evaluate(`(${function () {
    const original = localStorage.getItem('cr_practice_current_v1');
    const input = document.querySelector('input[name="answer"]:checked');
    const selection = input?.value, disabled = input?.disabled;
    const root = document.querySelector('.q-panel');
    const optionReview = document.querySelector('.choice-audit');
    const open = optionReview?.open;
    const control = document.querySelector('#theme-select');
    for (const theme of ['light', 'dark']) { control.value = theme; control.dispatchEvent(new Event('change', { bubbles: true })); }
    return { unchanged: original === localStorage.getItem('cr_practice_current_v1'), sameNode: root === document.querySelector('.q-panel'), sameSelection: selection === document.querySelector('input[name="answer"]:checked')?.value, sameDisabled: disabled === document.querySelector('input[name="answer"]:checked')?.disabled, sameExpanded: open === document.querySelector('.choice-audit')?.open };
  }.toString()})()`);
  assert.deepEqual(sample, { unchanged: true, sameNode: true, sameSelection: true, sameDisabled: true, sameExpanded: true }, `${label}: theme switching must not rerender, commit, reset time, or unlock a response`);
}

(async () => {
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/`;
    browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
    browser.on('error', error => { spawnError = error; });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) { if (spawnError) throw spawnError; if (browser.exitCode != null) throw new Error('Browser exited before debugging started'); await sleep(100); }
    assert.ok(fs.existsSync(portFile), 'Browser must expose its debugging port');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0;
    const pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
      if (message.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      if (message.id && pending.has(message.id)) { const { resolve, reject, timer } = pending.get(message.id); clearTimeout(timer); pending.delete(message.id); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result); }
    });
    send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await send('Page.navigate', { url });
    for (let i = 0; i < 100 && !(await evaluate('!!document.querySelector("[data-view=topics]")')); i++) await sleep(100);
    assert.equal(await evaluate('window.CR_DATA.questions.length'), 2060);
    assert.equal(await evaluate('window.CRTheme.getPreference()'), 'system');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light');
    await checkBothThemes('Desktop dashboard', ['.metric .label', '.metric .sub', '.resume-action:not(:disabled)', '.btn.primary:not(:disabled)', '.hero-primary:not(:disabled)', '.hero-secondary:not(:disabled)', '.nav button.active:not(:disabled)', '.nav button:not(.active):not(:disabled)'], 'dashboard');
    assert.equal(await evaluate('localStorage.getItem("cr_practice_theme_v1")'), 'dark');
    assert.equal(await evaluate('localStorage.getItem("cr_practice_lab_v1")'), null, 'Theme preference does not create study progress');
    await send('Page.reload');
    await waitFor('!!document.querySelector("#theme-select")', 'Dashboard reload is ready');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark', 'Manual dark preference survives reload');
    assert.equal(await evaluate('document.querySelector("#theme-select").value'), 'dark');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark', 'Manual preference ignores system light mode');
    await setTheme('system');
    await waitFor('document.documentElement.dataset.theme === "light"', 'System light theme is followed');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await waitFor('document.documentElement.dataset.theme === "dark"', 'System dark theme is followed');
    await setTheme('light');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light', 'Manual light preference ignores system dark mode');

    await click('[data-view="help"]');
    assert.equal(await evaluate('document.querySelectorAll("[data-help-section]").length'), 15, 'Help documents every application area');
    assert.equal(await evaluate('document.querySelectorAll(".help-topic-list > div").length'), 19, 'Help defines every question type');
    assert.match(await evaluate('document.querySelector("#help-solving").textContent'), /Clear response/);
    assert.match(await evaluate('document.querySelector("#help-data").textContent'), /No account or authentication/);
    await checkBothThemes('Help guide', ['.help-hero p', '.help-section p', '.help-toc button', '.help-callout span'], 'help');
    await setField('#help-search', 'timer', 'input');
    assert.ok(await evaluate('document.querySelectorAll("[data-help-section]:not([hidden])").length') > 0, 'Help search finds timer guidance');
    assert.ok(await evaluate('document.querySelectorAll("[data-help-section][hidden]").length') > 0, 'Help search filters unrelated sections');
    assert.match(await evaluate('document.querySelector("#help-search-status").textContent'), /guide sections match/);
    await click('[data-action="clear-help-search"]');
    assert.equal(await evaluate('document.querySelectorAll("[data-help-section]:not([hidden])").length'), 15, 'Clearing Help search restores the full handbook');
    for (const width of [320, 768]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 320 });
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `Help has no horizontal overflow at ${width}px`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

    await click('[data-view="topics"]');
    await click('[data-topic="Assumption"]');
    const topicSamples = ['.topic-card:not(.is-selected) h3', '.topic-card:not(.is-selected) .tiny.muted', '.topic-card.is-selected h3', '.topic-card.is-selected .tiny.muted', 'label.pill', '.btn.primary:not(:disabled)', '.nav button.active:not(:disabled)', '.nav button:not(.active):not(:disabled)'];
    await checkBothThemes('Desktop topic selection', topicSamples, 'topics');
    for (const width of [320, 768]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: width === 320 ? 844 : 1024, deviceScaleFactor: 1, mobile: width === 320 });
      await checkBothThemes(`Topic selection at ${width}px`, topicSamples, `topics-${width}`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await click('[data-topic="Assumption"]');
    assert.equal(await evaluate('document.querySelectorAll("[data-topic]:checked").length'), 0, 'Responsive theme checks leave the original balanced practice selection unchanged');
    await setField('#topic-count', '12', 'input');
    await evaluate('(() => { let seed = 42; Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); })()');
    await click('[data-action="start-topic"]');
    const firstId = await evaluate('JSON.parse(localStorage.cr_practice_current_v1).questionIds[0]');
    const incorrect = await evaluate(`window.CR_DATA.questions.find(q => q.id === ${JSON.stringify(firstId)}).choices.find(c => c.label !== window.CR_DATA.questions.find(q => q.id === ${JSON.stringify(firstId)}).answer).label`);
    await click(`input[name="answer"][value="${incorrect}"]`);
    assert.equal(await evaluate('!!document.querySelector(".solution-panel")'), false);
    await assertThemeDoesNotTouchAnswer('Provisional answer');
    await click('[data-action="clear-response"]');
    assert.equal(await evaluate('!!document.querySelector("input[name=answer]:checked")'), false);
    await click(`input[name="answer"][value="${incorrect}"]`);
    await click('[data-action="next"]'); await click('[data-action="prev"]');
    assert.equal(await evaluate('[...document.querySelectorAll("input[name=answer]")].every(el => el.disabled)'), true);
    await assertThemeDoesNotTouchAnswer('Submitted answer');
    const timeBefore = await evaluate(`JSON.parse(localStorage.cr_practice_current_v1).times[${JSON.stringify(firstId)}]`);
    await click('[data-action="check-answer"]');
    assert.match(await evaluate('document.querySelector(".solution-disclaimer").textContent'), /unverified|not human expert verification/);
    await click('.choice-audit summary');
    await click('[data-action="flag"]');
    assert.equal(await evaluate('document.querySelector(".choice-audit").open'), true);
    assert.equal(await evaluate(`JSON.parse(localStorage.cr_practice_current_v1).times[${JSON.stringify(firstId)}]`), timeBefore);
    await assertThemeDoesNotTouchAnswer('Checked answer with expanded solution');
    await checkBothThemes('Practice and solution', ['.q-stem', '.q-header .tiny.muted', '.solution-disclaimer', '.solution-reasoning', '.choice.selected > span:last-child', '.choice.selected .letter', '.q-actions .btn.primary:not(:disabled)', '.q-header .btn:not(.primary):not(:disabled)']);

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate('document.querySelector(".q-content").scrollTop = 200');
    const mobile = await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:getComputedStyle(document.querySelector(".q-content")).overflowY,footer:document.querySelector(".q-actions").getBoundingClientRect().bottom})');
    assert.ok(mobile.scroll <= mobile.width + 1, `No horizontal page overflow: ${JSON.stringify(mobile)}`);
    assert.equal(mobile.overflow, 'auto');
    assert.ok(mobile.footer <= 844, `Practice controls fit the mobile viewport: ${JSON.stringify(mobile)}`);
    await checkBothThemes('Mobile practice', ['.q-stem', '.solution-disclaimer', '.choice.selected > span:last-child', '.q-actions .btn.primary:not(:disabled)'], 'mobile-practice');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(os.tmpdir(), 'cr-lab-mobile-smoke.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Mobile screenshot:', screenshotPath);
    await click('[data-action="pause-session"]');
    assert.equal(await evaluate('document.querySelector("main").inert'), true);
    assert.equal(await evaluate('document.activeElement.dataset.action'), 'continue-session');
    await click('[data-action="continue-session"]');
    await click('[data-action="end"]');
    assert.equal(await evaluate('document.querySelectorAll(".review-item:not([hidden])").length'), 8);
    await setField('#result-filter', 'incorrect');
    assert.equal(await evaluate('document.querySelectorAll(".review-item:not([hidden])").length'), 1);
    await setField('#result-filter', 'unanswered');
    assert.equal(await evaluate('document.querySelectorAll(".review-item:not([hidden])").length'), 8);
    await click('[data-page-key="result"][data-page="2"]');
    assert.equal(await evaluate('document.querySelectorAll(".review-item:not([hidden])").length'), 3);

    await click('[data-action="review-mistakes"]');
    await setField('#error-category', 'Incorrect');
    assert.equal(await evaluate('document.querySelectorAll(".review-item").length'), 1);
    assert.equal(await evaluate('document.querySelector("[data-analyze-question]").dataset.analyzeQuestion'), firstId);
    await setField('[data-note]', 'My unsaved reasoning', 'input');
    await evaluate('window.__themeNoteInput = document.querySelector("[data-note]")');
    await checkBothThemes('Error log', ['.filter-toolbar label', '.review-item .tiny.muted', '[data-note]']);
    assert.equal(await evaluate('document.querySelector("[data-note]").value'), 'My unsaved reasoning', 'Theme switching preserves unsaved notes');
    assert.equal(await evaluate('window.__themeNoteInput === document.querySelector("[data-note]")'), true, 'Theme switching preserves the actual note input');
    await click('[data-analyze-question]');
    await click('[data-action="close-analysis"]');
    assert.equal(await evaluate('document.querySelector("[data-note]").value'), 'My unsaved reasoning');
    await click('[data-save-note]');
    await setField('#error-search', 'My unsaved', 'input');
    assert.equal(await evaluate('document.activeElement.id'), 'error-search');
    assert.equal(await evaluate('document.querySelectorAll(".review-item").length'), 1);
    const originalSessions = await evaluate('JSON.stringify(JSON.parse(localStorage.cr_practice_lab_v1).sessions)');
    await click('[data-view="reports"]');
    await checkBothThemes('Reports', ['.section-head p', '.table th', '.table td']);
    await click('[data-view="library"]');
    assert.equal(await evaluate('window.CR_DATA.questions.filter(q => q.explanation.specific).length'), 30);
    await setField('#library-filter', 'needs-review');
    assert.equal(await evaluate('document.querySelectorAll(".library-list .review-item").length'), 3);
    await checkBothThemes('Solution library', ['.library-list .tiny.muted', '.editorial-issue', '.filter-toolbar label']);
    fs.writeFileSync(path.join(os.tmpdir(), 'cr-lab-library-smoke.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    await click('[data-read-explanation="gmat-a-main-9"]');
    assert.match(await evaluate('document.querySelector(".editorial-issue").textContent'), /subgroup/);
    await click('[data-action="close-analysis"]');
    await setField('#library-filter', 'ai-reviewed');
    await setField('#library-search', 'gmat-a-main-1', 'input');
    assert.equal(await evaluate('document.activeElement.id'), 'library-search');
    await click('[data-read-explanation="gmat-a-main-1"]');
    assert.match(await evaluate('document.querySelector(".confidence-badge").textContent'), /independently AI-reviewed/);
    assert.match(await evaluate('document.querySelector(".editorial-meta").textContent'), /Independent AI review/);
    await click('[data-action="close-analysis"]');
    await click('[data-action="practice-reviewed"]');
    assert.equal(await evaluate('JSON.parse(localStorage.cr_practice_current_v1).questionIds.every(id => window.CR_DATA.questions.find(q => q.id === id).explanation.reviewStatus === "ai-reviewed")'), true);
    await click('[data-view="dashboard"]');
    await click('[data-action="discard"]');
    await click('[data-view="review"]');
    assert.equal(await evaluate('document.querySelectorAll("[data-review-question]").length'), 12);
    await checkBothThemes('Review queue', ['.review-summary .muted', '.review-item .tiny.muted']);
    await click(`[data-review-question="${firstId}"]`);
    assert.equal(await evaluate('!!document.querySelector(".recall-card .solution-panel")'), false);
    await click('input[name="review-answer"][value="A"]');
    await click('[data-action="reveal-recall"]');
    assert.equal(await evaluate('[...document.querySelectorAll("input[name=review-answer]")].every(el => el.disabled)'), true);
    assert.equal(await evaluate('document.querySelectorAll("[data-review-rating]").length'), 4);
    await checkBothThemes('Recall solution', ['.recall-card .q-stem', '.recall-card .solution-disclaimer']);
    fs.writeFileSync(path.join(os.tmpdir(), 'cr-lab-recall-smoke.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true);
    await click('[data-review-rating="good"]');
    assert.equal(await evaluate('JSON.parse(localStorage.cr_practice_lab_v1).reviewEvents.length'), 1);
    assert.equal(await evaluate('JSON.stringify(JSON.parse(localStorage.cr_practice_lab_v1).sessions)'), originalSessions);
    await setField('#review-filter', 'upcoming');
    assert.equal(await evaluate('document.querySelectorAll("[data-review-question]").length'), 1);
    await send('Page.reload');
    for (let i = 0; i < 100 && !(await evaluate('!!document.querySelector("[data-view=review]")')); i++) await sleep(100);
    await click('[data-view="review"]');
    await setField('#review-filter', 'upcoming');
    assert.equal(await evaluate('document.querySelectorAll("[data-review-question]").length'), 1);
    await click('[data-view="dashboard"]');
    await click('[data-action="request-reset"]');
    assert.equal(await evaluate('document.activeElement.dataset.action'), 'cancel-reset');
    await click('[data-action="cancel-reset"]');
    assert.equal(await evaluate('JSON.parse(localStorage.cr_practice_lab_v1).sessions.length'), 1);
    assert.equal(await evaluate('document.activeElement.dataset.action'), 'request-reset');
    await click('[data-action="request-reset"]');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 });
    assert.equal(await evaluate('document.activeElement.dataset.action'), 'confirm-reset');
    await click('[data-action="confirm-reset"]');
    assert.equal(await evaluate('localStorage.getItem("cr_practice_lab_v1")'), null);
    assert.equal(await evaluate('localStorage.getItem("cr_practice_current_v1")'), null);
    assert.equal(await evaluate('localStorage.getItem("cr_practice_theme_v1")'), 'dark', 'Clearing study progress preserves the separate theme preference');
    assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
    assert.equal(await evaluate('!!document.querySelector(".modal")'), false);
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('Browser smoke passed: searchable Help handbook, light/dark/system themes, persisted appearance, contrast samples, theme-safe answers and notes, native modules, authored solutions, review metadata, source warnings, spaced repetition, reload persistence, original-score integrity, mobile layout, and existing answer/dialog/reset behavior.');
  } finally {
    if (send && socket?.readyState === WebSocket.OPEN) await send('Browser.close').catch(() => {});
    socket?.close();
    if (browser && browser.exitCode === null && !spawnError) await Promise.race([once(browser, 'exit'), sleep(2000)]).catch(() => {});
    if (browser?.exitCode === null) browser.kill();
    server.close();
    const resolved = path.resolve(profile), tempRoot = path.resolve(os.tmpdir());
    if (path.dirname(resolved) === tempRoot && path.basename(resolved).startsWith('cr-browser-smoke-')) fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
