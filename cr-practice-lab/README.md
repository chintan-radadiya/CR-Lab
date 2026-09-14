# CR Practice Lab — GMAT & LSAT

A self-contained, responsive browser practice application built from the supplied `Q.pdf`.

## Included

- GMAT practice tests from the source: A–D, I–III, and numbered Tests 1–20.
- LSAT practice tests from the source: numbered Tests 1–28 plus the dated tests represented in the PDF.
- Test/section selection matching the source structure.
- Topic practice with multi-topic selection and custom question count.
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

The application uses the supplied PDF as its question source and answer-key source. Topic labels are automatically inferred from question stems; the PDF itself does not provide a clean topic taxonomy, so an `Other` category is retained rather than inventing unsupported labels.

Five source questions do not have an answer key entry in the supplied answer pages; those are shown as `Source key unavailable` and excluded from scored accuracy rather than being marked arbitrarily.

## Files

- `index.html` — application UI and logic.
- `cr_app_data.js` — embedded question bank, metadata, topic tags and source answer keys.
- `README.md` — this guide.
