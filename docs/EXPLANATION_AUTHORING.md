# Explanation authoring and review

## Current coverage

The normalized bank contains 2,060 questions. The initial editorial library covers 30 questions individually: `gmat-a-main-1` through `gmat-a-main-20` and `gmat-b-main-1` through `gmat-b-main-10`. Each has a question-specific argument analysis and a separate explanation of every option. Independent AI review approved 27; three remain flagged for source or logical-scope issues. None has been human-expert verified.

The other 2,030 questions retain automated draft coaching. Do not describe those drafts as individually authored explanations, count them as reviewed coverage, or imply that repeating topic guidance constitutes analysis of each question. Independent AI review is an additional check, not a guarantee of correctness.

## Files and loading

- `cr_app_data.js`: imported question wording, choices, and source answer keys.
- `content/explanations-batch-*.js`: separately maintained editorial records.
- `js/explanation-library.js`: validation, original-source fingerprints, status checks, coverage counts, and application of accepted records.
- `cr_explanation_engine.js`: fallback automated coaching; it is not the editorial library.
- `index.html`: explicitly loads each content batch before `js/main.js` initializes the application.

A new batch must append to the shared array, not replace another batch:

```js
(function () {
  'use strict';
  const records = [/* complete records matching the schema below */];
  window.CR_AUTHORED_EXPLANATIONS = [
    ...(window.CR_AUTHORED_EXPLANATIONS || []),
    ...records
  ];
}());
```

Add its script tag beside the existing batch tags in `index.html`, before the module entry point:

```html
<script src="content/explanations-batch-c.js"></script>
```

Keep question IDs unique across all loaded batches. Duplicate accepted IDs are rejected rather than resolved by silently choosing one explanation.

## Record schema

| Field | Requirement |
| --- | --- |
| `qid` | Exact existing question ID. |
| `sourceAnswer` | Exact original answer-key label; it must match the bank. |
| `sourceFingerprint` | Fingerprint of the original ID, prompt, ordered option labels/text, and answer key. |
| `version` | Positive integer; increment when editorial content changes. |
| `author` | Honest authorship attribution, such as `AI-assisted editorial`. |
| `authoredAt` | Authorship date in `YYYY-MM-DD` form. |
| `reviewStatus` | One of the four statuses described below. |
| `reviews` | Review-history array; an unreviewed record begins with `[]`. |
| `stimulusSummary` | Accurate summary of this particular stimulus, not a topic definition. |
| `conclusion` | Precise conclusion, inference, or task target; distinguish the author's claim from established fact. |
| `reasoning` | Content-specific account of why the keyed answer best fits the task, including necessary qualifications. |
| `choiceAnalysis` | One `{label, reason}` entry for every source option, with no duplicate or invented labels. |
| `takeaway` | Transferable lesson grounded in the question's particular reasoning. |
| `issue` | Required when `reviewStatus` is `needs-review`; describe the unresolved problem specifically. |
| `pitfalls` | Optional additional caveat or tempting misreading. |

Each review has this shape:

```js
{
  reviewer: 'Independent AI review A',
  kind: 'ai',                    // 'ai' or 'human'
  reviewedAt: '2026-09-15',
  verdict: 'approved',           // 'approved' or 'needs-review'
  notes: 'Version 1: checked the causal gap and all five alternatives.'
}
```

Use specific audit notes identifying what was checked or what needs correction. Never invent a reviewer or describe an AI reviewer as human. A human-review record must identify the actual human reviewer and the review that took place; metadata alone does not establish expertise.

| Status | Meaning and promotion rule |
| --- | --- |
| `authored` | Individually written, awaiting independent approval. This is not an expert-verification claim. |
| `ai-reviewed` | The last review must have `kind: 'ai'` and `verdict: 'approved'`. The writer and independent review should be separate passes/agents. |
| `expert-reviewed` | The last review must be an actual named human review with `kind: 'human'` and `verdict: 'approved'`. Do not use this for AI-only work. |
| `needs-review` | An unresolved content/source issue remains. Supply `issue`; do not hide the warning to increase coverage numbers. |

## Authoring workflow

1. Read the entire original prompt, every option, and the source key. For shared passages, verify the actual shared stimulus rather than borrowing the previous question automatically. Check the PDF when wording or extraction is doubtful; document uncertainty if the source cannot be confirmed.
2. Identify the exact task, including EXCEPT/LEAST polarity, speaker attribution, conclusion strength, and relevant populations. Solve independently before attempting to explain the provided key.
3. Write the argument or inference in the question's own terms. Explain the bridge from evidence to the answer and the limitations of that bridge. A strengthening answer need not prove the conclusion; an intended-conclusion answer need not be a deductively necessary inference.
4. Explain each alternative separately. Identify its specific reversal, unsupported assumption, irrelevant comparison, population shift, or other mismatch. Do not merely say that an option is outside the topic or does not satisfy a generic test.
5. If the source key seems wrong, an option is damaged, or no choice is fully defensible, retain `sourceAnswer` and flag `needs-review`. Do not force a justification or silently change the bank's key. Any eventual source correction should be an explicit, documented change followed by fresh review.
6. Start at `authored`, calculate the original-source fingerprint, and run the validation checks below.

## Independent review and revisions

The reviewer should solve the item from its original prompt and options, then compare the proposed explanation with that solution. Check every option, quantifier, arithmetic step, causal link, and hidden assumption. A second pass that merely repeats the author's answer is not independent verification.

Record the specific findings in `reviews`. Approve only when the explanation is defensible at the strength required by the task. If a material concern remains, set `needs-review`, explain it in `issue`, and preserve the caveat in the learner-facing reasoning. Do not upgrade an AI-reviewed item to human-expert reviewed without a real human review.

When changing reasoning or option analysis, increment `version` and return the record to `authored` or `needs-review` until re-reviewed. Retain earlier review entries as history and identify the new version in the next review's notes. An old approval does not verify a newly edited explanation.

## Fingerprints and checks

Calculate fingerprints from `cr_app_data.js` before any topic classification, shared-passage inference, or other enrichment changes the question. Use the audit utility:

```powershell
node scripts/content-audit.cjs --fingerprint gmat-a-main-1
node scripts/content-audit.cjs
node --test --test-isolation=none
```

Copy the calculated fingerprint to `sourceFingerprint`. It is an FNV-1a change detector, not a cryptographic signature or proof of correctness. A changed prompt, option order/text, or key invalidates the previous fingerprint and causes the record to be rejected. Review the changed source before recalculating; never refresh hashes merely to suppress errors. Changes to explanation text itself are handled through editorial versions and re-review, not this source hash.

Before publishing, ensure the content audit and full regression suite pass, including in CI. Check reported authored/reviewed/rejected counts against the actual loaded batches. Open an approved item and a flagged item in the browser to confirm that reasoning, all alternatives, status, author/reviewer information, and unresolved warnings display correctly. A new batch tag must be present for that content to reach learners.

## Outstanding source issues

- `gmat-a-main-9`: keyed assumption A concerns most fatal accidents, while the argument's casualty evidence concerns a narrower survivor–fatality subgroup. It identifies the intended fault-attribution gap but is not strictly necessary for that subgroup inference. The scope needs editorial/source review.
- `gmat-a-main-17`: the source says $750 compounded at 2% for 11 years is approximately $914. It is approximately $932.53; $914.25 corresponds to ten increases. The keyed answer is defensible as the intended conclusion, not as a universal deduction from two examples. Confirm the source numbers and wording.
- `gmat-b-main-10`: imported option D joins consumer acceptance of validity with advertising language in a grammatically incomplete sentence. C fits the low-market-share puzzle, but the complete wording of D needs PDF verification; its provisional interpretation is not a source correction.
