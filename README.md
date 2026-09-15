# CAT Critical Reasoning Practice Lab

A self-contained, responsive browser practice application built from the supplied `Q.pdf`.

## Included

- Prism Study visual theme: coordinated ivory/ink light and dark modes, teal/coral/gold/violet components, and an appearance selector with automatic system matching. The preference is saved separately from practice data and switching does not interrupt timers or notes.
- Searchable in-app Help handbook covering every screen, answer lifecycle, timers, review scheduling, explanation confidence, analytics, exports, local data, mobile navigation, and troubleshooting.
- A unified CAT test library containing every Critical Reasoning set from the supplied source bank.
- Original source identifiers are retained internally for question integrity, while the learner-facing experience uses CAT throughout.
- Test/section selection matching the source structure.
- Focused CAT practice with multi-topic selection, custom question count, balanced random sets, and weaker-skill targeting.
- Stem-based classification into 19 focused question types and four reasoning families: Argument Evaluation, Argument Analysis, Deduction, and Application.
- Provisional response selection with Clear response and Check answer controls.
- Leaving a question via Next, Previous, or the navigator submits the selected option, locks it, and freezes its recorded time. Blank questions stay unanswered and can be attempted later. Check answer reveals feedback without changing a submitted response or its time.
- Submitted choices and frozen times persist through review, reload, and pause/resume. Section countdowns retain their remaining time when reviewing answered questions or switching sections.
- Leaving practice pauses automatically; Resume continues in one click. Explicit pauses stay paused. Reopening the app offers the saved session without charging dashboard or offline time.
- Solution library with 30 individually AI-authored, question-specific explanations and full option analyses: 27 independently AI-reviewed, 3 flagged source issues, zero human-expert verifications. The remaining 2,030 questions retain clearly labeled automated draft guidance.
- Source fingerprints, per-item editorial versions, reviewer notes, and validation prevent mismatched explanations from silently replacing source-keyed answers.
- Reviewed-question practice excludes unresolved editorial issues; the library supports content search, status filters, and pagination.
- Full historical-session analysis with question-by-question solution review.
- Paginated, self-contained scroll regions for long test, topic, error-log, history, and result views.
- Per-question timing and section countdown timers where the PDF provides timings.
- Automatic local browser persistence using `localStorage`.
- Dashboard with overall accuracy, recent sessions, 7-day accuracy and topic accuracy.
- Detailed Reports with daily accuracy, topic accuracy and average time.
- Error Log for incorrect questions, notes, and review status.
- Real `.xlsx` report export generated in-browser with no external libraries.
- Spaced-repetition queue for incorrect, skipped, and flagged questions. Recall first, reveal the solution, then rate Again / Hard / Good / Easy without modifying the original locked answer or test score.
- First intervals: Again 10 minutes, Hard 1 day, Good 3 days, Easy 7 days. Subsequent successful intervals grow; a new mistake makes the question due again. Due/upcoming filters and dashboard counts help plan reviews.
- Version 3 JSON backups include recall-rating history and active practice. Legacy and version 2 backups still import; Excel adds review-history and upcoming-schedule sheets.
- Searchable error log with status/category filters and session-specific review; unsaved note drafts survive in-app redraws.
- Past-session review filters for incorrect, unanswered, flagged, correct, and unscored questions.
- Scrollable question content, persistent navigation controls, keyboard-focus handling, and accessible confirmation dialogs.
- Backup validation, paused active-session backups, and visible storage-error recovery warnings.
- Distinct CAT set labels preserve the original source question text and identifiers.

## Run

Run `npm start`, then open `http://127.0.0.1:4173` in a modern browser. No dependency install is needed: the development server and tests use Node.js built-ins. Use a current Node.js version (tested on Node 24).

The app now uses native JavaScript modules, so opening `index.html` directly with `file://` is not supported. GitHub Pages serves modules normally: publish `index.html`, both root `cr_*.js` files, and the complete `js/`, `css/`, and `content/` directories. No build step, backend, authentication, or runtime framework is required. The provided local server exposes only public app assets, not backups or repository files.

## Verify behavior

Run `node --test --test-isolation=none` with a current Node.js version. The regression tests exercise the actual application script, including answer locking, navigation, timing, scoring, exports, storage recovery, and explanation-engine safeguards.

Equivalent: `npm test`. Run `npm run audit:content` to validate authored records and inspect coverage/source issues. Unit tests concatenate the production module bodies inside isolated test VMs; the browser test additionally validates native module imports and rendered behavior.

Optional Windows Chrome check: `npm run test:browser`. It uses a disposable profile and a loopback-only server to check native modules, authored solutions, review scheduling, reload persistence, mobile layout, answer locks, review filters, pagination, note drafts, keyboard focus, and confirmed/cancelled reset. Set `CR_TEST_BROWSER` to override the browser executable path. Your normal browser profile and saved practice are not accessed.

## Data notes

The application uses the supplied 902-page PDF as its question source and answer-key source. Topic labels are inferred from ordered question-stem patterns; the PDF itself does not provide a topic taxonomy, so an `Other` category is retained for ambiguous formats. The fallback explanation engine combines passage extracts and keyed options with topic-based templates. These drafts are not independently authored question-specific solutions. The separate authored library currently covers only 30 of 2,060 questions; AI review is not human expert verification. Completing and independently reviewing the remaining bank is outstanding editorial work.

Three authored items remain flagged: `gmat-a-main-9` (answer-choice scope), `gmat-a-main-17` (compound-interest arithmetic), and `gmat-b-main-10` (damaged option wording). Their source keys and passages are preserved, not silently corrected. See [the authoring protocol](docs/EXPLANATION_AUTHORING.md) for the complete review workflow and status requirements.

Accuracy means correct answers divided by answered questions with a usable key. Session score uses all questions with a usable key, including skipped questions. Inactive dates are not represented as 0% accuracy. Practice data belongs to the browser profile and site origin; there is no account or cross-device synchronization. Back up before clearing browser data or moving devices. JSON backups can transfer history and an active practice session.

Five source questions do not have an answer key entry in the supplied answer pages; those are shown as `Source key unavailable` and excluded from scored accuracy rather than being marked arbitrarily.

## Files

- `EXPLANATION_RESEARCH.md` — source audit, classification standard, explanation schema, and quality-control protocol.

- `index.html` — small page shell and script entry points.
- `css/app.css` — shared design tokens, coordinated light/dark palettes, responsive components, charts, and review layouts.
- `js/theme.js` — pre-paint appearance preference, system-theme changes, and cross-tab synchronization.
- `js/icons.js` — local SVG interface symbols and decorative dashboard artwork.
- `js/main.js` — bootstrap and browser lifecycle handling.
- `js/core.js` — shared state, taxonomy, source data, and small formatting helpers.
- `js/sessions.js` — test lifecycle, answer locks, timers, and practice selection.
- `js/storage.js` — validation, persistence, and recovery.
- `js/analytics.js` / `js/exports.js` — metrics, charts, backups, and Excel.
- `js/views.js` / `js/ui.js` — page rendering, navigation, event bindings, and accessibility.
- `js/spaced-repetition.js` / `js/review-ui.js` — pure scheduling rules and recall workflow.
- `js/help-ui.js` — searchable in-app handbook, topic reference, and contextual usage guidance.
- `js/explanation-library.js` / `js/library-ui.js` / `js/solutions-ui.js` — editorial validation, library browsing, and solution presentation.
- `content/explanations-batch-*.js` — individually authored solutions and review histories.
- `cr_app_data.js` — embedded question bank, metadata, topic tags and source answer keys.
- `cr_explanation_engine.js` — fallback automated draft guidance.
- `scripts/` — local static server and editorial validation commands.
- `tests/` — regression suites and a disposable real-browser smoke test.
- `README.md` — this guide.
