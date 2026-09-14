(() => {
  'use strict';

  const GUIDES = {
    Assumption: 'Find the exact gap between the evidence and the claim. Negate the keyed statement: if the reasoning loses essential support, the statement is required.',
    Strengthen: 'Hold the evidence fixed and identify what the keyed fact changes about the probability of the claim.',
    Weaken: 'Hold the evidence fixed and identify how the keyed fact makes the claim less secure.',
    'Paradox / Explain': 'Keep both reported facts true and find the distinction or mechanism that lets them coexist.',
    Inference: 'Combine only the stated information and prefer the narrow consequence that is forced.',
    Conclusion: 'Separate supporting statements from the claim the author wants the reader to accept.',
    'Main Point': 'Track the passage as a whole and select the position the other statements develop or defend.',
    Flaw: 'Name the exact invalid move from this evidence to this conclusion.',
    Evaluate: 'Test the keyed issue in both directions: one result should help the claim and the opposite result should hurt it.',
    'Complete the Passage': 'Continue the argument already in motion, preserving its direction and strength.',
    'Parallel Reasoning': 'Abstract the original into evidence, conclusion, and logical move; verify that the keyed argument reproduces all three.',
    'Conditional / Deductive Logic': 'Translate the rules and apply only licensed implications; do not reverse a condition.',
    Principle: 'State the rule’s conditions, then verify that the keyed case satisfies them and reaches the licensed judgment.',
    'Method / Point at Issue': 'Identify what each speaker affirms, denies, or uses as support.',
    'Role / Function': 'Locate the referenced statement in the reasoning chain and determine what it supports and what supports it.',
    'Argument Structure': 'Follow the sequence of claims and identify the concrete reasoning device used.',
    Interpretation: 'Read the disputed wording in context and choose the meaning required by the surrounding claims.',
    'Plan / Decision': 'Connect the plan’s action to its objective, then test the constraint that could make it succeed or fail.',
    Other: 'Use the exact instruction in the stem, map it to the passage, and do not import outside facts.'
  };

  const STOP_WORDS = new Set('a an and are as at be because been being but by can could did do does for from had has have he her hers him his how i if in into is it its may might more most must no not of on one only or our should so some such than that the their them then there these they this those to too under up was we were what when where which while who will with would you your'.split(' '));
  const CUES = [
    /which one of the following/ig, /which of the following/ig,
    /the argument['’]s reasoning/ig, /the reasoning in the argument/ig,
    /the reasoning above/ig, /the conclusion above/ig,
    /the argument (?:above|in the passage) (?:depends|would|is based)/ig,
    /the statements above[^.?!]{0,90}(?:support|provide|justify|if)/ig,
    /the dialogue most supports/ig, /the claims made above/ig,
    /in evaluating .{0,80}?argument/ig, /the main (?:point|conclusion|idea) of/ig,
    /it can (?:properly )?be inferred/ig, /if the statements above/ig,
    /each of the following/ig,
    /the author['’]s (?:main point|opinion|method)/ig,
    /according to .{0,80}?(?:weak point|criticism)/ig,
    /the .{0,70}? plan assumes that/ig, /the opponents could .{0,90}? by/ig,
    /the passage is structured to/ig, /the statements above best support/ig,
    /the findings above can/ig,
    /the objection implied above/ig, /to support a conclusion that/ig,
    /fact \d+ would/ig, /the simultaneous-action provision/ig,
    /[a-z]+['’]s argument is structured/ig
  ];

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function clip(value, max = 330) {
    const text = clean(value);
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(', '));
    return (stop > max * 0.55 ? cut.slice(0, stop + 1) : cut) + '…';
  }

  function sentences(value) {
    return (clean(value).match(/[^.!?]+(?:[.!?]+|$)/g) || []).map(clean).filter(Boolean);
  }

  function splitQuestion(prompt) {
    const text = clean(prompt);
    let splitAt = -1;
    let explicit = [...text.matchAll(/\bWhich\b/g)].filter(match => match.index > 20);
    if (!explicit.length) explicit = [...text.matchAll(/\bOf the following\b/g)].filter(match => match.index > 20 && /(?:^|[.!?]\s*)$/.test(text.slice(0, match.index)));
    if (explicit.length) {
      splitAt = explicit[explicit.length - 1].index;
      const boundary = Math.max(text.lastIndexOf('.', splitAt - 1), text.lastIndexOf('?', splitAt - 1), text.lastIndexOf('!', splitAt - 1)) + 1;
      const lead = clean(text.slice(boundary, splitAt));
      if (lead.length && lead.length < 190 && /\b(?:argument|reasoning|statements|claims|conclusion|passage|dialogue|evaluat|assumption|support|follows|inferred)\b/i.test(lead)) splitAt = boundary;
    }
    else {
      const candidates = [];
      CUES.forEach(pattern => {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text))) if (match.index > text.length * 0.18) candidates.push(match.index);
      });
      if (candidates.length) {
        const last = Math.max(...candidates);
        const boundary = Math.max(text.lastIndexOf('.', last - 1), text.lastIndexOf('?', last - 1), text.lastIndexOf('!', last - 1)) + 1;
        splitAt = Math.min(...candidates.filter(index => index >= boundary));
      }
    }
    if (splitAt > 0) {
      const boundary = Math.max(text.lastIndexOf('.', splitAt - 1), text.lastIndexOf('?', splitAt - 1), text.lastIndexOf('!', splitAt - 1)) + 1;
      const lead = clean(text.slice(boundary, splitAt));
      if (lead.length && lead.length < 190 && /\b(?:argument|reasoning|statements|claims|conclusion|passage|dialogue|evaluat|assumption|support|follows|inferred|vulnerable|seeks)\b/i.test(lead)) splitAt = boundary;
    }
    if (splitAt < 0) {
      const parts = sentences(text);
      const last = parts[parts.length - 1] || text;
      if (parts.length > 1 && /\?|_{2,}|except|following|argument|inferred|assumption|conclusion|principle|role|function|weakens|strengthens|\b(?:is that|because|is to)\s*$/i.test(last)) {
        splitAt = text.lastIndexOf(last);
      }
    }
    if (splitAt <= 0) {
      return { stimulus: text, stem: 'Apply the instruction expressed in the question’s final sentence.' };
    }
    return { stimulus: clean(text.slice(0, splitAt)), stem: clean(text.slice(splitAt)) };
  }

  function conclusionOf(stimulus) {
    const parts = sentences(stimulus);
    if (!parts.length) return 'No independent claim was cleanly separable from the source text.';
    let result = '';
    parts.forEach(sentence => {
      const marker = sentence.match(/\b(?:therefore|thus|hence|consequently|accordingly|clearly|it follows that|we can conclude that|so)\b[:,]?\s*(.+)/i);
      if (marker && marker[1]) result = marker[1];
    });
    if (result) return clip(result);

    const becauseIndex = parts.findIndex(sentence => /^(?:this is )?because\b/i.test(sentence));
    if (becauseIndex > 0) return clip(parts[becauseIndex - 1]);
    const containsBecause = parts.find(sentence => /\b(?:because|since|for)\b/i.test(sentence));
    if (containsBecause) {
      const lead = containsBecause.split(/\b(?:because|since|for)\b/i)[0];
      if (clean(lead).length > 24) return clip(lead);
    }
    return clip(parts[parts.length - 1]);
  }

  function evidenceOf(stimulus, conclusion) {
    const conclusionMarkers = /\b(?:therefore|thus|hence|consequently|accordingly|clearly|it follows that|we can conclude that|so)\b/i;
    const parts = sentences(stimulus).map(sentence => {
      const markerAt = sentence.search(conclusionMarkers);
      if (markerAt === 0) return '';
      if (markerAt > 0) return clean(sentence.slice(0, markerAt).replace(/[;, ]+$/, ''));
      return sentence;
    }).filter(sentence => sentence && clean(sentence) !== clean(conclusion));
    if (!parts.length) return clip(stimulus);
    const signalled = parts.filter(sentence => /\b(?:because|since|after all|given that|evidence|study|found|shows?|reveals?|indicates?)\b/i.test(sentence));
    return clip((signalled.length ? signalled : parts).slice(-2).join(' '), 430);
  }

  function terms(value) {
    const words = clean(value).toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [];
    return [...new Set(words.filter(word => !STOP_WORDS.has(word)))];
  }

  function quotedTerms(words, fallback = 'the passage’s central relationship') {
    return words.length ? words.map(word => `“${word}”`).join(', ') : fallback;
  }

  function focusTerms(value, reference = '') {
    const known = new Set(terms(reference));
    const words = terms(value);
    const distinctive = words.filter(word => !known.has(word));
    return (distinctive.length ? distinctive : words).slice(0, 4);
  }

  function negate(value) {
    const swaps = [
      [/\ball\b/i, 'not all'], [/\bevery\b/i, 'not every'], [/\bno\b/i, 'at least one'],
      [/\bnever\b/i, 'sometimes'], [/\balways\b/i, 'not always'], [/\bonly\b/i, 'not only'],
      [/\bcannot\b/i, 'can'], [/\bcan\b/i, 'cannot'], [/\bmust\b/i, 'need not'],
      [/\bwill\b/i, 'will not'], [/\bare\b/i, 'are not'], [/\bis\b/i, 'is not']
    ];
    for (const [pattern, replacement] of swaps) {
      if (pattern.test(value)) return clean(value.replace(pattern, replacement));
    }
    return `It is not true that ${clean(value).replace(/[.?!]+$/, '')}.`;
  }

  function restoreSharedStimuli(questions) {
    const lookup = new Map();
    questions.forEach(question => {
      lookup.set(`${question.corpus}|${question.test}|${question.section}|${question.number}`, question);
    });
    questions.forEach(question => (question.choices || []).forEach(choice => {
      const marker = choice.text.match(/\bQuestions?\s+(\d+)\s*[-–—]\s*(\d+)\b/i);
      if (!marker || !marker.index) return;
      const shared = clean(choice.text.slice(marker.index + marker[0].length));
      if (shared.length < 80) return;
      choice.text = clean(choice.text.slice(0, marker.index));
      for (let number = Number(marker[1]); number <= Number(marker[2]); number += 1) {
        const target = lookup.get(`${question.corpus}|${question.test}|${question.section}|${number}`);
        if (target && !target.prompt.includes(shared.slice(0, 80))) {
          target.prompt = `${shared} ${target.prompt}`;
        }
      }
    }));
    questions.forEach(question => {
      const prompt = clean(question.prompt);
      if (prompt.length > 240 || !/^(?:Which|The (?:argument|statement|claim|hypothesis)|In evaluating)\b/i.test(prompt) || !/\b(?:passage|argument|hypothesis|above|dialogue|statements?)\b/i.test(prompt)) return;
      const previous = lookup.get(`${question.corpus}|${question.test}|${question.section}|${Number(question.number) - 1}`);
      if (!previous) return;
      const shared = splitQuestion(previous.prompt).stimulus;
      if (shared.length >= 80 && !prompt.includes(shared.slice(0, 60))) question.prompt = `${shared} ${prompt}`;
    });
  }

  function bridgeDescription(answer, evidence, conclusion) {
    const answerTerms = terms(answer);
    const evidenceTerms = new Set(terms(evidence));
    const conclusionTerms = new Set(terms(conclusion));
    const linked = answerTerms.filter(word => evidenceTerms.has(word) || conclusionTerms.has(word)).slice(0, 4);
    const added = answerTerms.filter(word => !evidenceTerms.has(word) && !conclusionTerms.has(word)).slice(0, 3);
    if (linked.length && added.length) {
      return `It connects ${quotedTerms(linked)} in the argument with the added consideration of ${quotedTerms(added)}.`;
    }
    if (linked.length) {
      return `It directly bears on ${quotedTerms(linked)}, the same concepts used in the evidence-to-claim move.`;
    }
    return `It adds the previously unstated consideration of ${quotedTerms(added)}, changing whether the evidence supports the claim.`;
  }

  function isReverseStem(stem) {
    return /\bEXCEPT\b|\bNOT\b|least (?:supports|weakens|helps)|cannot be true|must be false/i.test(stem);
  }

  function quotedClaim(stem) {
    const text = clean(stem);
    const direct = text.match(/the statement\s+[“"](.+?)[”’"]\s+serves/i);
    if (direct) return clean(direct[1]);
    const matches = [...text.matchAll(/[“"]([^”’"]{12,})[”’"]/g)];
    return matches.length ? clean(matches[matches.length - 1][1]) : '';
  }

  function parallelParts(answer) {
    const clauses = clean(answer).split(/\s*;\s*/).filter(Boolean);
    if (clauses.length > 1 && /^(?:do not|don’t|should|should not|ought|ought not|must|cannot|therefore|thus|hence)\b/i.test(clauses[0])) {
      return { conclusion: clauses[0], evidence: clauses.slice(1).join('; ') };
    }
    const conclusion = conclusionOf(answer);
    return { conclusion, evidence: evidenceOf(answer, conclusion) };
  }

  function romanStatements(prompt) {
    const match = clean(prompt).match(/\bI\.\s*(.+?)\s+\bII\.\s*(.+?)(?:\s+\bIII\.\s*(.+))?$/i);
    if (!match) return [];
    return [match[1] && { label: 'I', text: clean(match[1]) }, match[2] && { label: 'II', text: clean(match[2]) }, match[3] && { label: 'III', text: clean(match[3]) }].filter(Boolean);
  }

  function romanReason(question, parts, answer, statements) {
    const positiveAnswer = clean(answer).split(/\b(?:but\s+)?not\b/i)[0];
    const selected = new Set(positiveAnswer.match(/\b(?:III|II|I)\b/g) || []);
    const operation = {
      Strengthen: 'supplies a concrete instance or fact that supports the passage’s claim',
      Weaken: 'creates the counterexample or complication needed to weaken the passage’s claim',
      Assumption: 'states a condition required by the evidence-to-conclusion move',
      Inference: 'is licensed by the stated information without an extra premise',
      'Conditional / Deductive Logic': 'follows from the stated rules in their valid direction'
    }[question.type] || 'satisfies the logical test stated in the stem';
    const rejected = {
      Strengthen: 'does not show the relationship asserted in the passage and therefore supplies no comparable support',
      Weaken: 'does not damage the decisive link in the argument',
      Assumption: 'is not required; the argument can proceed even if it is false',
      Inference: 'is not forced by the stated information',
      'Conditional / Deductive Logic': 'is not entailed by the stated rules'
    }[question.type] || 'does not satisfy that same test';
    const audit = statements.map(statement => selected.has(statement.label)
      ? `Statement ${statement.label} — “${clip(statement.text, 250)}” — ${operation}.`
      : `Statement ${statement.label} — “${clip(statement.text, 250)}” — ${rejected}.`).join(' ');
    return `Option ${question.answer} selects ${[...selected].join(' and ')}. The controlling claim is “${clip(parts.conclusion, 260)}”. ${audit} That is why the keyed combination is “${clip(answer, 120)}”.`;
  }

  function correctReason(question, parts, answer) {
    const { evidence, conclusion, stem } = parts;
    const bridge = bridgeDescription(answer, evidence, conclusion);
    const cited = quotedClaim(`${parts.stimulus} ${stem}`);
    const answerMap = parallelParts(answer);
    const answerConclusion = answerMap.conclusion;
    const answerEvidence = answerMap.evidence;
    const numberedStatements = romanStatements(parts.prompt);
    if (numberedStatements.length > 1 && /\b(?:III|II|I)\b/.test(answer)) return romanReason(question, parts, answer, numberedStatements);
    if (isReverseStem(stem)) {
      return `This is a reverse-polarity stem. Option ${question.answer} — “${clip(answer, 260)}” — is the keyed exception: unlike the other choices, it does not satisfy the property requested in “${clip(stem, 210)}”. Against the passage’s position — “${clip(conclusion, 250)}” — it is the choice that conflicts with, is not licensed by, or otherwise fails the stated test.`;
    }
    if (question.type === 'Role / Function') {
      const target = cited ? `The cited statement is “${clip(cited, 260)}”. ` : '';
      if (/subsidiary|intermediate/i.test(answer)) return `${target}It is supported by “${clip(evidence, 250)}” and is then used to support “${clip(conclusion, 230)}”. Option ${question.answer} therefore correctly identifies it as “${clip(answer, 300)}”: it is a conclusion relative to the earlier evidence but a premise relative to the final conclusion.`;
      if (/main conclusion|primary conclusion/i.test(answer)) return `${target}The surrounding reasoning is organized to establish this statement, rather than using it to establish a later claim. Option ${question.answer} therefore correctly calls it “${clip(answer, 300)}”; “${clip(evidence, 260)}” supplies its support.`;
      if (/premise|evidence|support/i.test(answer)) return `${target}The author offers it to help establish “${clip(conclusion, 250)}”; the argument does not first derive it as a conclusion. That is why option ${question.answer} correctly describes it as “${clip(answer, 300)}”.`;
      if (/background|context/i.test(answer)) return `${target}It frames the dispute summarized by “${clip(conclusion, 250)}” but is not offered as the inferential basis for that conclusion. Option ${question.answer} accurately describes this contextual role as “${clip(answer, 300)}”.`;
      return `${target}Within the chain from “${clip(evidence, 250)}” to “${clip(conclusion, 230)}”, it performs the function stated in option ${question.answer}: “${clip(answer, 300)}”. That support relationship, not shared subject matter, fixes its role.`;
    }

    const reason = {
      Assumption: `The argument uses “${clip(evidence, 270)}” to reach “${clip(conclusion, 250)}”. Option ${question.answer} states “${clip(answer, 280)}”. ${bridge} Negate it — “${clip(negate(answer), 260)}” — and the evidence can remain true while the conclusion loses the link it needs. That is why this statement is necessary, not merely helpful.`,
      Strengthen: `The claim to support is “${clip(conclusion, 260)}”. Option ${question.answer} adds “${clip(answer, 290)}”. ${bridge} With that fact in place, the evidence is more diagnostic of the claim and a competing interpretation is less plausible, so the conclusion becomes more likely.`,
      Weaken: `The argument moves from “${clip(evidence, 270)}” to “${clip(conclusion, 250)}”. Option ${question.answer} adds “${clip(answer, 290)}”. ${bridge} The same evidence is now compatible with the conclusion being false or less certain; the premise may stand, but it supports the claimed result less strongly.`,
      'Paradox / Explain': `The passage asks us to preserve the reported facts while explaining their tension. Option ${question.answer} supplies the missing circumstance: “${clip(answer, 300)}”. ${bridge} Once that distinction is added, the observations in “${clip(evidence, 270)}” can coexist rather than contradict one another.`,
      Inference: `Option ${question.answer} says “${clip(answer, 300)}”. This is the limited consequence supported by “${clip(evidence, 280)}” together with “${clip(conclusion, 240)}”. ${bridge} It requires no extra causal story or stronger universal claim, so it is the result the stated information licenses.`,
      Conclusion: `Option ${question.answer} — “${clip(answer, 300)}” — matches what the supporting material is offered to establish: “${clip(conclusion, 300)}”. The remaining statements are evidence or context; this option captures the author’s destination rather than a step used to reach it.`,
      'Main Point': `The passage develops the position “${clip(conclusion, 310)}”. Option ${question.answer} expresses that controlling idea as “${clip(answer, 300)}”. It has the scope of the whole discussion rather than that of one premise or example.`,
      Flaw: `The evidence is “${clip(evidence, 270)}”, but the argument concludes “${clip(conclusion, 250)}”. Option ${question.answer} identifies the invalid move: “${clip(answer, 300)}”. That description fits this exact transition: the premise does not rule out the distinction or possibility named by the option, so the stronger conclusion is not established.`,
      Evaluate: `The conclusion is “${clip(conclusion, 250)}”. Option ${question.answer} asks whether “${clip(answer, 300)}”. A result favorable to the argument makes the evidence-to-conclusion link more credible; the opposite result exposes an alternative or failed link. The two answers therefore move the conclusion in opposite directions.`,
      'Complete the Passage': `The existing line of thought reaches “${clip(conclusion, 260)}”. Option ${question.answer} completes it with “${clip(answer, 300)}”. ${bridge} It continues the passage’s direction and certainty instead of starting a new issue.`,
      'Parallel Reasoning': `Original pattern: “${clip(evidence, 220)}” is used to reach “${clip(conclusion, 210)}”. In option ${question.answer}, “${clip(answerEvidence, 220)}” is used to reach “${clip(answerConclusion, 210)}”. Both make the same kind of premise-to-conclusion move with the same direction and logical force; only the subject matter changes.`,
      'Conditional / Deductive Logic': `The controlling statements are “${clip(evidence, 300)}”. Option ${question.answer} gives the consequence “${clip(answer, 300)}”. That result follows by applying the stated conditions in their licensed direction; it does not reverse a rule or assume that a sufficient condition is necessary.`,
      Principle: `The passage supplies the rule or judgment “${clip(conclusion, 270)}”. Option ${question.answer} applies it to “${clip(answer, 300)}”. The choice satisfies the operative condition and reaches the judgment the rule permits, without adding a broader requirement.`,
      'Method / Point at Issue': `The exchange turns on “${clip(conclusion, 270)}”. Option ${question.answer} states the relevant commitment as “${clip(answer, 300)}”. One position affirms or relies on that proposition while the other rejects or challenges it, so the speakers would answer it differently.`,
      'Role / Function': `Option ${question.answer} correctly identifies the cited statement’s function as “${clip(answer, 300)}”.`,
      'Argument Structure': `The passage moves from “${clip(evidence, 260)}” to “${clip(conclusion, 250)}”. Option ${question.answer} describes that move as “${clip(answer, 300)}”. It accounts for both what the author does and how that step advances the conclusion.`,
      Interpretation: `In context, the relevant position is “${clip(conclusion, 280)}”. Option ${question.answer} renders it as “${clip(answer, 300)}”. That reading preserves the surrounding contrast and scope instead of broadening the speaker’s claim.`,
      'Plan / Decision': `The objective is represented by “${clip(conclusion, 270)}”. Option ${question.answer} contributes “${clip(answer, 300)}”. ${bridge} This directly affects whether the proposed action can achieve the objective under the passage’s constraints.`,
      Other: `The stem asks: “${clip(stem, 260)}” The passage provides “${clip(evidence, 260)}” and reaches “${clip(conclusion, 230)}”. Option ${question.answer} answers that task with “${clip(answer, 300)}”. ${bridge} It stays within the scope and force of the information given.`
    };
    return reason[question.type] || reason.Other;
  }

  function wrongReason(question, choice, parts) {
    const focus = quotedTerms(focusTerms(choice.text, `${parts.evidence} ${parts.conclusion}`), 'a side issue');
    const strong = /\b(?:all|any|every|never|none|only|always|completely|entirely)\b/i.test(choice.text);
    if (isReverseStem(parts.stem)) return `This choice satisfies the ordinary property named in the reverse-polarity stem, so it is not the exception. Its focus on ${focus} can remain consistent with the passage.`;
    if (question.type === 'Assumption') return `This focuses on ${focus}, but the argument does not require that exact claim. Denying it need not destroy the evidence-to-conclusion link.`;
    if (question.type === 'Strengthen') return `This introduces ${focus}, but it does not make the specific conclusion more probable on the stated evidence.`;
    if (question.type === 'Weaken') return `This concerns ${focus}, yet it leaves the key evidence-to-conclusion link intact or needs another unstated fact before it would hurt the claim.`;
    if (question.type === 'Paradox / Explain') return `This discusses ${focus}, but it gives no mechanism that makes both sides of the discrepancy true together.`;
    if (question.type === 'Inference' || question.type === 'Conditional / Deductive Logic') return `This turns to ${focus}${strong ? ' and uses language stronger than the stimulus supports' : ''}. The stated facts do not force it.`;
    if (question.type === 'Flaw') return `This describes a concern involving ${focus}, not the gap created by moving from the quoted evidence to the quoted conclusion.`;
    if (question.type === 'Evaluate') return `A yes or no about ${focus} would not produce opposite effects on the conclusion.`;
    if (question.type === 'Parallel Reasoning') return `Its treatment of ${focus} changes the original argument’s premise/conclusion pattern or logical force.`;
    if (question.type === 'Principle') return `This case emphasizes ${focus}, but misses or changes a condition required by the stated principle.`;
    if (['Role / Function', 'Argument Structure', 'Method / Point at Issue'].includes(question.type)) return `This centers on ${focus}, but assigns the statement or speaker a logical job not performed here.`;
    if (question.type === 'Conclusion' || question.type === 'Main Point') return `This captures ${focus}, a premise, example, or narrower side point rather than the controlling conclusion.`;
    return `This shifts attention to ${focus}; it does not perform the exact operation requested in the stem.`;
  }

  function build(question) {
    const keyedChoice = question.choices.find(choice => choice.label === question.answer);
    const split = splitQuestion(question.prompt);
    const conclusion = conclusionOf(split.stimulus);
    const evidence = evidenceOf(split.stimulus, conclusion);
    const parts = { ...split, conclusion, evidence, prompt: question.prompt };

    if (!question.answer || !keyedChoice) {
      return {
        answer: 'Source key unavailable', answerText: '',
        method: 'Do not manufacture an answer where the source provides no usable key.',
        why: 'No answer is asserted because the supplied PDF does not contain a usable key for this item.',
        stimulus: split.stimulus, stem: split.stem, evidence, conclusion, choiceAnalysis: [],
        takeaway: 'Treat this question as unscored until an independent expert review establishes the answer.',
        confidence: 'Unkeyed source item', keyed: false, specific: true
      };
    }

    const choiceAnalysis = question.choices.map(choice => ({
      label: choice.label,
      correct: choice.label === question.answer,
      reason: choice.label === question.answer
        ? correctReason(question, parts, choice.text)
        : wrongReason(question, choice, parts)
    }));

    return {
      answer: `Option ${question.answer}`,
      answerText: keyedChoice.text,
      method: GUIDES[question.type] || GUIDES.Other,
      why: correctReason(question, parts, keyedChoice.text),
      stimulus: split.stimulus,
      stem: split.stem,
      evidence,
      conclusion,
      choiceAnalysis,
      takeaway: `Reduce this item to: “${clip(evidence, 190)}” → “${clip(conclusion, 170)}”. Option ${question.answer} is keyed because it performs the stem’s requested operation on that exact link.`,
      confidence: 'PDF key · item-specific analysis',
      keyed: true,
      specific: true
    };
  }

  function enrich(questions, classify) {
    restoreSharedStimuli(questions);
    questions.forEach(question => {
      classify(question);
      question.explanation = build(question);
    });
    return questions;
  }

  window.CRExplanationEngine = { build, enrich };
})();
