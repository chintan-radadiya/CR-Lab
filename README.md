# CAT Critical Reasoning Practice Lab

A self-contained, responsive browser practice application built from the supplied `Q.pdf`.

## Included

- A unified CAT test library containing every Critical Reasoning set from the supplied source bank.
- Original source identifiers are retained internally for question integrity, while the learner-facing experience uses CAT throughout.
- Test/section selection matching the source structure.
- Focused CAT practice with multi-topic selection, custom question count, balanced random sets, and weaker-skill targeting.
- Stem-based classification into 19 focused question types and four reasoning families: Argument Evaluation, Argument Analysis, Deduction, and Application.
- Provisional response selection with Clear response and Check answer controls.
- Question-specific reasoning for every keyed item: evidence/claim map, keyed-answer rationale, negation or counterfactual test where applicable, and a scrollable option audit.
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

Open `index.html` in a modern browser. Keep `cr_app_data.js` and `cr_explanation_engine.js` in the same folder.

For the cleanest local development experience, serve the folder with any simple static server, then open `index.html`.

## Data notes

The application uses the supplied 902-page PDF as its question source and answer-key source. Topic labels are inferred from ordered question-stem patterns; the PDF itself does not provide a topic taxonomy, so an `Other` category is retained for ambiguous formats rather than inventing unsupported labels. The explanation engine processes each record separately using its full stimulus, question stem, evidence/conclusion map, keyed option, and alternatives. These are independent generated coaching analyses, not official authored explanations from the PDF.

Five source questions do not have an answer key entry in the supplied answer pages; those are shown as `Source key unavailable` and excluded from scored accuracy rather than being marked arbitrarily.

## Files

- `EXPLANATION_RESEARCH.md` — source audit, classification standard, explanation schema, and quality-control protocol.

- `index.html` — application UI and logic.
- `cr_app_data.js` — embedded question bank, metadata, topic tags and source answer keys.
- `cr_explanation_engine.js` — per-question argument mapping and answer-choice analysis.
- `README.md` — this guide.
