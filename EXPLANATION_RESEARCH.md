# Critical Reasoning Explanation and Classification Standard

## Executive assessment

The source workbook is a 902-page compilation of short-form Critical Reasoning questions organized into 89 test/section records. The normalized application bank contains 2,060 questions, each with five choices. Of those questions, 2,055 have a usable answer key and five do not. The PDF supplies consolidated answer keys, but it does not supply authored, question-by-question explanations.^1

That distinction controls what can responsibly be published. A keyed answer can be displayed as a source fact. A detailed rationale created later is editorial analysis and must not be described as an official GMAT, LSAT, IIM, or CAT explanation. A perfect-accuracy claim is not supportable until every generated rationale and every source key has received independent expert review.

The application should therefore separate three concepts:

1. **Source key** — the answer recorded in `Q.pdf`.
2. **Coaching analysis** — a generated explanation of the reasoning method and keyed choice.
3. **Review status** — whether an expert has independently verified the key, category, and rationale.

This separation is especially important for candidates targeting the extreme upper tail. High-score preparation depends less on memorizing keyed options and more on identifying the conclusion, controlling scope, predicting the logical task, and diagnosing why attractive alternatives fail. GMAC’s own guidance emphasizes identifying exactly what a question asks, distinguishing stated facts from what follows, locating the conclusion, and judging how well claims are substantiated.^2

## Source-bank audit

| Audit field | Finding |
|---|---:|
| PDF pages | 902 |
| Normalized questions | 2,060 |
| Test/section metadata records | 89 |
| Questions with five choices | 2,060 |
| Duplicate question IDs | 0 |
| Empty prompts | 0 |
| Keys that point outside A–E choices | 0 |
| Missing or unusable keys | 5 |

The five unkeyed records are:

- `gmat-12-main-19`
- `gmat-12-main-20`
- `gmat-13-main-16`
- `lsat-3-Section I-24`
- `lsat-26-Section III-25`

The application must exclude these records from scored accuracy. It may still present them for reading or discussion, but it should label them “Source key unavailable” and avoid asserting a correct answer.

The final PDF pages illustrate another source-quality issue: some answer lines contain `N/A` or blank entries alongside numbered placeholders.^1 The normalized database correctly avoids mapping a nonexistent key to an answer choice. This is preferable to filling gaps by inference, because an inferred key would silently contaminate analytics and weaker-topic recommendations.

## Competency model

GMAC currently describes Verbal Reasoning as measuring reading comprehension and the ability to reason about and evaluate arguments. Critical Reasoning tasks cover making arguments, evaluating arguments, and formulating or evaluating a plan of action.^3 GMAC’s published verbal-skills framework also groups Critical Reasoning into analysis/critique and construction/plan.^4

The platform uses four learner-facing reasoning families consistent with that skills model:

| Reasoning family | Question types | Core learner behavior |
|---|---|---|
| Argument Evaluation | Assumption, Strengthen, Weaken, Evaluate, Paradox/Explain | Identify the conclusion and test the premise-to-conclusion link |
| Argument Analysis | Main Point, Conclusion, Flaw, Method/Point at Issue, Role/Function, Argument Structure, Interpretation | Map claims, roles, scope, and argumentative moves |
| Deduction | Inference, Conditional/Deductive Logic, Complete the Passage | Derive only what follows and control conditional direction |
| Application | Principle, Parallel Reasoning, Plan/Decision | Transfer a rule or logical structure to a new case |

“Other” remains a deliberate holding category. A classifier should not force an ambiguous item into a precise type merely to improve coverage statistics. After the latest ordered stem-pattern audit, 1,833 questions receive a specific type and 227 remain in Other. This reduces the fallback category to 11.0% of the bank while retaining an uncertainty boundary.

## Classification method

Classification is driven primarily by the task stem, not the subject matter of the stimulus. This matters because a passage may contain words such as “principle,” “assumption,” or “support” without asking a Principle, Assumption, or Strengthen question.

The ordered classifier gives priority to distinctive stems:

- “best completes the passage” → Complete the Passage
- “point at issue” or “disagree” → Method / Point at Issue
- “same logical structure/error” → Parallel Reasoning
- “conforms to the principle” → Principle
- “resolve/explain the discrepancy” → Paradox / Explain
- “most useful to know in evaluating” → Evaluate
- “depends on,” “assumes,” or “unstated premise” → Assumption
- “weaken,” “undermine,” “evidence against,” or “most damaging” → Weaken
- “strengthen,” “confirm,” “substantiate,” or “support the argument” → Strengthen
- “error of reasoning,” “vulnerable to criticism,” or “questionable technique” → Flaw
- “must be true,” “can be inferred,” or “logically follows” → Inference

Ordering reduces collisions, but automated classification is still editorial inference. Every item should eventually expose a review status such as `Generated`, `Expert verified`, or `Needs review`. Items in Other and regex-collision candidates should be prioritized for review.

## Explanation standard

Each in-app explanation should contain the following fields:

| Field | Purpose |
|---|---|
| Question family and type | Establish the exact reasoning task before discussing choices |
| Source key status | Distinguish a present PDF key from an unkeyed item |
| Keyed answer | Display the exact answer label and text |
| Reasoning method | State the correct operation: negation test, causal challenge, inference boundary, structural match, etc. |
| Evidence and claim map | Quote the concrete facts and result used in that individual item |
| Why the keyed answer wins | Connect the exact option text to the required logical operation |
| Option audit | Explain why each alternative does or does not perform the requested operation |
| High-score takeaway | Give one reusable behavior for future questions |
| Editorial disclaimer | Clarify that generated coaching is not source-authored explanation text |

For a genuinely expert-verified solution, “why the answer wins” must be question-specific. It should identify the stimulus conclusion and evidence, articulate the exact gap or deduction, and explain why each rejected option fails. A type-level template is useful coaching scaffolding, but it is not a substitute for that item-level proof.

## High-score review protocol

A candidate targeting a near-ceiling score needs a review loop that captures reasoning quality, not only correctness. GMAC recommends studying explanations for missed questions to understand how to answer them correctly in the future.^5 The platform should support this with the following sequence:

1. Identify the task before reading the choices.
2. Mark the conclusion and decisive evidence.
3. Predict the logical role of the correct answer.
4. Commit to an answer and record time.
5. Compare the selected answer with the source key.
6. Review the reasoning method and trap patterns.
7. Record the exact failure: conclusion error, scope shift, conditional reversal, causal gap, quantifier error, or time-pressure guess.
8. Revisit the item after a delay and require a fresh explanation before marking it reviewed.

This protocol aligns with the official emphasis on understanding the question, distinguishing facts from consequences, identifying conclusions, and assessing substantiation.^2 It also makes Error Log data actionable: a learner can distinguish a conceptual weakness from a pacing mistake or an attractive-distractor habit.

## Interface requirements

The explanation UI should support both immediate learning and historical analysis:

- Immediate feedback after a response is committed
- Locked first response so viewing the key cannot improve the recorded score
- Clear correct/incorrect/not-scored status
- Exact keyed choice and answer text
- Structured coaching sections rather than a dense paragraph
- Source-key confidence badge
- Mobile single-column explanation layout
- Scrollable analysis modal for long prompts and explanations
- Question-by-question solution buttons in historical sessions
- Paginated historical reviews and error logs
- Explicit labels for skipped, flagged, incorrect, and unkeyed items

The copy should motivate disciplined practice without promising a particular score or percentile. “High-score takeaway” is supportable; “guaranteed 800+” or “guaranteed 99.99 percentile” is not. Performance depends on the learner, test conditions, the representativeness of this older mixed-source corpus, and the current exam format.

## Quality-control recommendation

The present generated layer should be treated as a first editorial pass. Releasing 2,055 item-specific explanations with a “make no mistake” claim requires a separate verification workflow:

1. Independently solve each item without viewing the PDF key.
2. Compare the independent answer with the source key.
3. Escalate disagreements to a second reviewer.
4. Write a premise/conclusion/gap analysis for each keyed item.
5. Explain every rejected choice with a concrete scope, relevance, logic, or evidence reason.
6. Run consistency checks across paired questions sharing a stimulus.
7. Mark the item expert-verified only after the key, type, and rationale agree.
8. Version corrections so existing learner history is not silently regraded.

Until that workflow is complete, the app should say “PDF key present,” not “answer independently verified.” This is the only defensible way to combine ambitious exam coaching with zero-fabrication standards.

## Sources

1. `Q.pdf`, 902-page local source compilation, especially pp. 1–6 for question format and pp. 901–902 for consolidated-key examples; accessed locally at `D:\CAT\CAT VARC Resources\Q.pdf`.
2. GMAC. “[Verbal Reasoning Prep Strategies](https://www.mba.com/exams/gmat-exam/prep-for-the-exam/prep-strategies/verbal-reasoning).” Accessed September 2026.
3. GMAC. “[GMAT Exam Content](https://www.mba.com/exams/gmat-exam/about/exam-content).” Accessed September 2026.
4. GMAC. “[GMAT Verbal Skills](https://www.mba.com/exams-and-exam-prep/gmat-exam/gmat-esr-verbal-skills).” July 16, 2018.
5. GMAC. “[Prep for the GMAT Exam](https://www.mba.com/exams/gmat-exam/prep-for-the-exam).” Accessed September 2026.
6. IIM CAT. “[Mock Test Navigation Guideline](https://iimcat.ac.in/per/g01/pub/756/ASM/WebPortal/1/PDF/Mock_Test_Navigation_Guideline.pdf).” Official IIM CAT navigation reference; the linked document reflects its stated administration year and should not be treated as the current exam-pattern authority.
