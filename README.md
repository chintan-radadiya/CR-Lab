# CAT Critical Reasoning Practice Lab

A self-contained, responsive browser practice application built from the supplied `Q.pdf`.

## Included

- A unified CAT test library containing every Critical Reasoning set from the supplied source bank.
- Original source identifiers are retained internally for question integrity, while the learner-facing experience uses CAT throughout.
- Test/section selection matching the source structure.
- Focused CAT practice with multi-topic selection, custom question count, balanced random sets, and weaker-skill targeting.
- Stem-based classification into 19 focused question types and four reasoning families: Argument Evaluation, Argument Analysis, Deduction, and Application.
- Immediate answer-key feedback with generated reasoning guidance for every keyed question.
- Full historical-session analysis with question-by-question solution review.
- Paginated, self-contained scroll regions for long test, topic, error-log, history, and result views.
- Per-question timing and section countdown timers where the PDF provides timings.
- Automatic local browser persistence using `localStorage`.
- Dashboard with overall accuracy, recent sessions, 7-day accuracy and topic accuracy.
- Detailed Reports with daily accuracy, topic accuracy and average time.
- Error Log for incorrect questions, notes, and review status.
- Real `.xlsx` report export generated in-browser with no external libraries.
- JSON backup and restore.

## Run

Open `index.html` in a modern browser. Keep `cr_app_data.js` in the same folder.

For the cleanest local development experience, serve the folder with any simple static server, then open `index.html`.

## Data notes

The application uses the supplied 902-page PDF as its question source and answer-key source. Topic labels are inferred from ordered question-stem patterns; the PDF itself does not provide a topic taxonomy, so an `Other` category is retained for ambiguous formats rather than inventing unsupported labels. The displayed reasoning guidance is generated from the classified question type and keyed answer; it is not official authored explanation text from the PDF.

Five source questions do not have an answer key entry in the supplied answer pages; those are shown as `Source key unavailable` and excluded from scored accuracy rather than being marked arbitrarily.

## Files

- `index.html` — application UI and logic.
- `cr_app_data.js` — embedded question bank, metadata, topic tags and source answer keys.
- `README.md` — this guide.
