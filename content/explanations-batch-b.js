(function () {
  'use strict';
  const records = [
    {
      qid: 'gmat-a-main-16', sourceAnswer: 'C', version: 1,
      sourceFingerprint: 'fnv1a-ef9ceb0c',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the completion against every remedy. C uniquely targets the expressly emphasized television opinion-poll coverage; voter literature does not itself reform television coverage."}],
      stimulusSummary: 'Television election coverage emphasizes who is winning, especially opinion polls, instead of candidates’ positions on substantive issues.',
      conclusion: 'A first reform should reduce the television practices that create this horse-race emphasis.',
      reasoning: 'The missing ending must respond to the problem the author actually diagnoses: television’s allocation of attention. The passage singles out an obsession with opinion polls as especially responsible for turning elections into sporting contests. Reducing television coverage of those polls therefore directly reduces a named source of the problem. C need not guarantee excellent issue coverage or solve every problem; the author asks only for a plausible first step. D is attractive because it supplies substantive information, but it changes what voters can read elsewhere without necessarily changing television’s coverage.',
      choiceAnalysis: [
        { label: 'A', reason: 'Shorter campaigns could still receive coverage dominated by polls and campaign strategy. Nothing connects campaign duration to the stated imbalance in television content.' },
        { label: 'B', reason: 'A spending limit concerns campaign finances, whereas the complaint concerns editorial coverage. Broadcasters could continue focusing on who is ahead regardless of campaign budgets.' },
        { label: 'C', reason: 'Opinion-poll coverage is explicitly identified as an especially important source of the horse-race atmosphere. Reducing it directly addresses the diagnosed television problem.' },
        { label: 'D', reason: 'Voter-education literature may inform the public, but it does not itself reform television’s tendency to substitute poll standings for issue coverage.' },
        { label: 'E', reason: 'The criticism targets interviews, strategy discussions, and polls, not the number or length of paid political advertisements. Limiting advertisements does not target the identified cause.' }
      ],
      takeaway: 'For a proposed-reform completion, match the remedy to the precise diagnosed mechanism, not merely to the broad subject of elections.'
    },
    {
      qid: 'gmat-a-main-17', sourceAnswer: 'B', version: 1,
      sourceFingerprint: 'fnv1a-e116b72e',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'needs-review', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"needs-review","notes":"B is defensible as the intended conclusion, not a deductively established universal. Found a source arithmetic discrepancy: 750 × 1.02^11 is about 932.53, not 914; 914 corresponds to approximately ten increases. Source wording needs confirmation."}],
      issue: 'The source arithmetic is inconsistent: $750 compounded at 2 percent for 11 years is approximately $932.53, not $914. The stated $914 corresponds approximately to ten annual increases. B remains defensible as the intended conclusion, but the source numbers should be checked before this item is considered fully reviewed.',
      stimulusSummary: 'Two owners of identical houses pay approximately $914 and $2,000 under Proposition 13; without it, each would pay $6,000.',
      conclusion: 'Repealing Proposition 13 would likely cause substantial property-tax increases for homeowners.',
      reasoning: 'The comparison is structured around the change from the current tax system to the situation without Proposition 13. Both illustrative owners would pay substantially more: about $5,086 more for the long-standing owner and $4,000 more for the recent buyer. That shared consequence supports the likely argumentative purpose in B: warning homeowners about the tax increases that repeal would bring. E accurately notices unequal savings, but the final comparison emphasizes that both owners benefit relative to repeal. This is a most-likely-intended-conclusion question, not a must-be-true question: the two examples illustrate B but do not deductively prove its literal claim about every homeowner. Separately, the source calculation is inconsistent: $750 multiplied by 1.02 eleven times is approximately $932.53, whereas $914 corresponds approximately to ten increases. This arithmetic defect does not reverse the large tax-increase comparison, but the original numbers require correction or clarification.',
      choiceAnalysis: [
        { label: 'A', reason: 'Different tax bills do not by themselves establish unconstitutionality. The passage supplies no constitutional rule or legal argument.' },
        { label: 'B', reason: 'Both examples move to a much larger $6,000 tax bill without Proposition 13. This captures the warning about repeal most naturally suggested by the before-and-after comparison.' },
        { label: 'C', reason: 'The example does not say Proposition 13 prevents property values from rising. The recent purchaser pays $200,000 for a house that previously cost $75,000; the policy limits the tax burden rather than establishing an anti-inflation effect on prices.' },
        { label: 'D', reason: 'The passage shows different tax amounts because of different assessment bases, with both calculations starting from a 1 percent rate. It does not primarily argue for a prediction about different statutory tax rates.' },
        { label: 'E', reason: 'The older owner does receive a larger saving, so this is a supported observation. However, it describes only the difference between the owners, whereas the final comparison stresses the substantial increase both face without the proposition.' }
      ],
      takeaway: 'Distinguish an intended main conclusion from a fact that the example also supports. Do not convert an illustrative generalization into a logically guaranteed universal claim.',
      pitfalls: 'The phrase “every homeowner” is broader than the two examples establish. The PDF key is defensible as an intended conclusion, not as a deductively necessary inference.'
    },
    {
      qid: 'gmat-a-main-18', sourceAnswer: 'D', version: 1,
      sourceFingerprint: 'fnv1a-3a24e441',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Verified that the rhetorical question supplies wood’s existing suitability for hulls. The analysis correctly avoids inventing durability or research-payback facts."}],
      stimulusSummary: 'A company has spent heavily to turn wood fibers into plastic suitable for small sailboat hulls. The author mocks this as excessive enthusiasm for technology.',
      conclusion: 'The author regards this application of the new process as an unnecessary technological detour.',
      reasoning: 'The rhetorical question about what sailboat hulls used to be made of supplies the key to the author’s reaction: wood already serves that purpose. Converting wood into another material merely to make an object that can already be made from wood appears redundant to the author. D states this unstated background fact. The question asks what the opinion is based on, not whether the opinion is ultimately justified. The passage does not prove that plastic lacks performance advantages, nor does it give enough financial information to establish that the research can never pay for itself.',
      choiceAnalysis: [
        { label: 'A', reason: 'No durability comparison is supplied. The author’s joke depends on wood’s existing use, not on a demonstrated failure of plastic hulls.' },
        { label: 'B', reason: 'The research cost is described as enormous, but no possible savings, sales volumes, or other uses are quantified. A complete cost-benefit conclusion goes beyond the stated basis of the criticism.' },
        { label: 'C', reason: 'Whether a sailboat is usually called high-tech does not explain why this particular conversion seems wasteful. The relevant point is that the original material already has the proposed use.' },
        { label: 'D', reason: 'Wood can already be used to construct small sailboat hulls. This is the fact implied by the rhetorical question and the immediate basis of the author’s allegation of technological excess.' },
        { label: 'E', reason: 'The passage never compares boatbuilding with other research priorities. Introducing more deserving fields does not identify the author’s stated line of thought.' }
      ],
      takeaway: 'Translate a rhetorical question into its implied factual answer, then separate identifying an argument’s basis from endorsing its validity.'
    },
    {
      qid: 'gmat-a-main-19', sourceAnswer: 'A', version: 1,
      sourceFingerprint: 'fnv1a-54254d7e',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Confirmed that A supplies relevant functional advantages over wood. Tax treatment and supplier status do not challenge the alleged technological redundancy as directly."}],
      stimulusSummary: 'The author calls an expensive process that turns wood into plastic for sailboat hulls an example of technological excess, because hulls can already be made of wood.',
      conclusion: 'Converting wood to this plastic for boat hulls is an unjustified or pointless technological detour.',
      reasoning: 'The criticism treats the ability to serve the same broad use as sufficient reason not to develop a substitute material. A attacks that comparison by identifying substantial improvements in properties directly relevant to hulls: lower weight, greater strength, and better watertightness. The conversion would therefore do more than return wood to a use it already had; it could create materially better hulls. These advantages do not establish that every possible research expenditure is economically justified, but they substantially weaken the author’s claim that the process is merely a technological mania.',
      choiceAnalysis: [
        { label: 'A', reason: 'The new material improves three central hull properties. This provides a concrete functional reason to convert wood into plastic and undermines the suggestion that the conversion accomplishes nothing useful.' },
        { label: 'B', reason: 'A shortage of the wood used as input does not show that converting it is beneficial. Without evidence that the process conserves wood, this could make the proposal harder to justify.' },
        { label: 'C', reason: 'Higher hull-production costs add a disadvantage. Without an offsetting benefit, a 10–15 percent increase reinforces rather than weakens the concern about unnecessary expense.' },
        { label: 'D', reason: 'A tax write-off may reduce the company’s after-tax burden, but it does not establish that the resulting material performs better or that society gains from the process. It is less direct than A.' },
        { label: 'E', reason: 'Becoming a large supplier would benefit the company commercially, but the expectation does not explain why the conversion represents useful technology rather than the excess the author alleges.' }
      ],
      takeaway: 'When an argument dismisses a substitute because the original already works, test whether the substitute offers relevant improvements rather than merely the same basic function.'
    },
    {
      qid: 'gmat-a-main-20', sourceAnswer: 'D', version: 1,
      sourceFingerprint: 'fnv1a-945d7bbe',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the two exchanges: the student already demonstrates effort and determination, while the repeated demand for faster mastery exposes impatience. D best explains the doubled estimate."}],
      stimulusSummary: 'A would-be swordsman asks how quickly he can achieve mastery. When he proposes working continuously to accelerate the process, the teacher doubles the predicted training time.',
      conclusion: 'Mastery requires patience; urgency to obtain the result can impede learning.',
      reasoning: 'The student’s second offer displays more effort and determination, yet the teacher responds with a longer training period. The contrast therefore cannot sensibly be read as a lesson that effort or determination is missing. What the second question reveals is greater impatience: the student is trying to force mastery into a shorter time frame. D captures the teacher’s implied correction. The passage does not offer a literal formula connecting hours practiced to years required; it uses the surprising reply to communicate the importance of allowing mastery to develop.',
      choiceAnalysis: [
        { label: 'A', reason: 'The story does not show the student claiming superiority or refusing to learn. Humility could be valuable, but impatience is the trait directly exposed by his demand for speed.' },
        { label: 'B', reason: 'The student already offers to work night and day. If more willingness to work were the central missing quality, the longer estimate would not address that deficiency.' },
        { label: 'C', reason: 'The student seeks instruction from the greatest teacher; no clear disrespect toward elders drives the exchange. Age is not the logical focus of the reply.' },
        { label: 'D', reason: 'The repeated attempt to shorten the process shows impatience, and the teacher’s doubled estimate challenges it. Patience best explains the lesson conveyed by the paradoxical response.' },
        { label: 'E', reason: 'The student’s journey and offer of constant work already demonstrate determination. The teacher is cautioning against haste, not asking for a stronger commitment.' }
      ],
      takeaway: 'In a short illustrative story, identify what changes between the first and second exchange; the author’s point often lies in that contrast.'
    },
    {
      qid: 'gmat-b-main-1', sourceAnswer: 'D', version: 1,
      sourceFingerprint: 'fnv1a-98ff4fe6',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Verified all quantifier and legal-status distinctions. D restates continued six-year growth without requiring a constant growth rate; no conviction does not entail acquittal or factual innocence."}],
      stimulusSummary: 'A corporate chairman answers demands for resignation by noting the absence of a criminal conviction, the presumption of innocence, and the corporation’s unbroken six-year record of growth.',
      conclusion: 'The chairman wants shareholders to view him as entitled to remain in office; the inference question asks what the excerpt itself supports.',
      reasoning: 'The excerpt explicitly describes an unbroken six-year record of corporate growth. D is a restrained restatement: the corporation expanded throughout that period. It does not require the growth rate to be identical each year. By contrast, the chairman’s legal defense carefully establishes only the absence of a guilty finding, not factual innocence or an acquittal. His reference to people seeking corporate control also does not establish that every person demanding resignation has that motive. The safest inference preserves the scope and strength of the information actually supplied.',
      choiceAnalysis: [
        { label: 'A', reason: 'The chairman identifies self-interested people who have demanded resignation, but the excerpt does not say they are the only people making that demand. “All” adds an unsupported universal claim.' },
        { label: 'B', reason: 'The claimed success of his official duties does not explain the motives for any possible misdeeds. Beneficial business results and the reasons for misconduct are distinct issues.' },
        { label: 'C', reason: 'Not having been found guilty does not prove that no offense occurred. A legal presumption of innocence is not evidence establishing factual innocence.' },
        { label: 'D', reason: 'An unbroken six-year record of growth supports the statement that the corporation expanded steadily over those years, understood as continued growth rather than a mathematically constant rate.' },
        { label: 'E', reason: 'Proceedings could be pending, dismissed, or never initiated. No guilty finding does not entail that every proceeding ended with an acquittal.' }
      ],
      takeaway: 'In inference questions, preserve quantifiers and distinguish absence of conviction, acquittal, and factual innocence.'
    },
    {
      qid: 'gmat-b-main-2', sourceAnswer: 'A', version: 1,
      sourceFingerprint: 'fnv1a-98520866',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the argument’s causal, observational, transfer, and value assumptions. Industrial pollution need not constitute almost all pollution for regulating it to help, making A the intended exception."}],
      stimulusSummary: 'More bird species have been seen around London since industrial air-pollution rules were introduced. The argument recommends similar rules for other major cities.',
      conclusion: 'Other major cities should adopt similar industrial air-pollution regulations.',
      reasoning: 'The argument relies on treating the observed increase as a real and desirable environmental improvement, connecting the rules to cleaner air, and regarding other cities as sufficiently comparable for the policy to transfer. A is the exception: industry does not have to cause almost all pollution for regulating it to make a worthwhile difference. Even if traffic and other sources produce most pollution, reducing a meaningful industrial contribution could still improve conditions for birds. Negating A therefore leaves the policy argument viable. The other options correspond to links in the argument’s intended observation–causation–recommendation chain.',
      choiceAnalysis: [
        { label: 'A', reason: 'The near-exclusive-source claim is unnecessary. Industrial rules could create a useful improvement even if industry accounts for only part of a city’s pollution.' },
        { label: 'B', reason: 'If the regulations have no meaningful effect on air quality, the argument loses its proposed connection between imposing those rules and obtaining an environmental improvement.' },
        { label: 'C', reason: 'The recommendation transfers London’s policy to other cities. It relies on relevant similarity in their air-pollution problems so that London’s experience is applicable; it does not require every detail to be identical.' },
        { label: 'D', reason: 'The bird-species increase is offered as a reason cities should act. That move treats the increase as a benefit rather than as an irrelevant or undesirable consequence.' },
        { label: 'E', reason: 'More sightings could otherwise reflect more observers or better reporting instead of more species. The argument treats sightings as evidence of an actual ecological improvement.' }
      ],
      takeaway: 'An assumption-EXCEPT answer often exaggerates a sufficient contribution into near-total responsibility. A policy can help without addressing the sole source of a problem.'
    },
    {
      qid: 'gmat-b-main-3', sourceAnswer: 'E', version: 1,
      sourceFingerprint: 'fnv1a-823b2de0',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Verified the contrast concerns government intervention rather than restrictive morality alone. E supplies explicit state control; the other alternatives leave that mechanism unstated or contradict the contrast."}],
      stimulusSummary: 'Some conservatives invoke limited government to oppose business regulation. The passage then introduces a paradox about their treatment of private sexual morality.',
      conclusion: 'The completion should show those same people supporting greater government intervention in private behavior.',
      reasoning: 'The pivot “Yet, paradoxically” requires a contrast on the same dimension: how much control government should exercise. E supplies exactly that contrast. People who ask government to stop regulating business are described as seeking an increased governmental role in regulating private sexual conduct. Merely favoring restrictive moral standards would not establish the stated paradox, because people can advocate voluntarily observed standards while still opposing government coercion. The completion must explicitly connect moral restrictions to governmental power.',
      choiceAnalysis: [
        { label: 'A', reason: 'People could advocate Victorian sexual standards as personal or community values without asking government to enforce them. Restrictive morality alone does not contradict a limited-government position.' },
        { label: 'B', reason: 'Giving families a stronger role could replace rather than expand government control. This does not deliver the required reversal on government intervention.' },
        { label: 'C', reason: 'Limiting provocative media might involve government, but the option does not specify who imposes the limit or how. E states the governmental expansion directly and is therefore the better completion.' },
        { label: 'D', reason: 'Greater individual freedom is consistent with wanting government to get off people’s backs. It removes rather than completes the promised contrast.' },
        { label: 'E', reason: 'This explicitly contrasts opposition to government regulation of business with support for increased government regulation of private sexual behavior.' }
      ],
      takeaway: 'For a contrast completion, keep the comparison on the precise axis established by the passage: government intervention, not simply permissive versus restrictive morality.'
    },
    {
      qid: 'gmat-b-main-4', sourceAnswer: 'B', version: 1,
      sourceFingerprint: 'fnv1a-f36af2af',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked both possible answers to B: baseline comparability strengthens the treatment comparison, and pre-existing group differences weaken causal attribution. The explanation does not claim comparability proves causation."}],
      stimulusSummary: 'Babies in a nursery playing classical music later cried less, had fewer minor ailments, and gained more weight than babies in a nursery playing rock music.',
      conclusion: 'The experiment suggests that the music caused the developmental differences between the groups.',
      reasoning: 'A causal comparison requires knowing whether the groups were comparable before treatment. B checks whether nursery A already contained healthier or happier babies. If it did, their better subsequent outcomes could reflect pre-existing differences rather than classical music. If both groups were initially comparable, that particular alternative explanation becomes less plausible, though other confounders could remain. This two-way impact makes B especially useful for evaluating the experiment. Knowing merely that nursery A outperformed B after two weeks is not enough to attribute the difference to the type of music.',
      choiceAnalysis: [
        { label: 'A', reason: 'The parents’ preferences do not establish the babies’ starting condition or identify a stated route by which those preferences changed the outcomes. This is much less direct than baseline comparability.' },
        { label: 'B', reason: 'Initial health and happiness can affect crying, illness, and growth. Whether these were comparable directly tests a major alternative explanation for the observed group difference.' },
        { label: 'C', reason: 'Loud rock music might damage hearing, but the experiment does not say the rock music was loud, and hearing damage is not the measured outcome. This is narrower and more conditional than B.' },
        { label: 'D', reason: 'Average weights would provide detail about one outcome, but the option does not clearly compare initial health and happiness across the two groups. B addresses a broader, central requirement for the causal comparison.' },
        { label: 'E', reason: 'The playback schedule describes the treatment, but simply learning continuous versus intermittent exposure does not establish that the two groups started comparable or that their later differences were caused by music.' }
      ],
      takeaway: 'To evaluate a treatment comparison, ask whether the treatment groups differed before treatment; a post-treatment difference is not automatically a treatment effect.'
    },
    {
      qid: 'gmat-b-main-5', sourceAnswer: 'C', version: 1,
      sourceFingerprint: 'fnv1a-9d01f8f2',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Verified the three-arm comparison: classical versus rock cannot distinguish a classical benefit from rock harm; C adds the no-music baseline. Other options do not resolve that ambiguity as directly."}],
      stimulusSummary: 'Newborns hearing classical music had better outcomes than newborns hearing rock music. The question asks for additional evidence that classical music itself is beneficial.',
      conclusion: 'Classical music improves newborn development, rather than merely being less harmful than rock music.',
      reasoning: 'The original comparison establishes only that the classical-music nursery did better than the rock-music nursery. That result is compatible with classical music having no benefit and rock music causing harm. C adds the missing no-music comparison: the classical group also does better than newborns receiving no music. This supports a positive effect of classical music, assuming the usual relevant comparability of groups. It still does not prove causation beyond all possible confounders, but it targets the exact ambiguity left by the initial two-group design.',
      choiceAnalysis: [
        { label: 'A', reason: 'No music outperforming rock would support the possibility that rock is harmful. It does not show classical music is better than no music, so classical music could still be neutral.' },
        { label: 'B', reason: 'The greater proportion of premature babies introduces a group difference. Its implications for the measured outcomes require additional medical assumptions and do not directly establish a benefit over no music.' },
        { label: 'C', reason: 'Classical music outperforming a no-music group supplies the relevant baseline and supports a positive benefit, not just relative superiority to rock.' },
        { label: 'D', reason: 'Different volumes create an additional treatment difference. Any observed effect could then depend on loudness rather than the classical character of the music.' },
        { label: 'E', reason: 'The classical nursery had fewer nurses per newborn, which might complicate one care-quality explanation, but nurse ratios alone do not establish the effect of classical music compared with no music.' }
      ],
      takeaway: '“A is better than B” does not establish that A is beneficial: B may be harmful. A neutral control group helps resolve that ambiguity.'
    },
    {
      qid: 'gmat-b-main-6', sourceAnswer: 'B', version: 1,
      sourceFingerprint: 'fnv1a-db813053',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked source dates and the relationship of each artifact to the burial. B is strongest under the explicitly disclosed original-deposit assumption; later mentions or coverings do not establish continued survival."}],
      stimulusSummary: 'The author disputes the claim that Cephesa was buried in A.D. 310, arguing that it survived until another eruption around A.D. 415.',
      conclusion: 'Cephesa was not buried by the A.D. 310 eruption.',
      reasoning: 'B places coins associated with an emperor from around A.D. 410 within the ruins preserved by the material that buried the city. On the ordinary reading that these coins belong to the original sealed archaeological deposit, that deposit cannot have been closed in A.D. 310: the objects date from roughly a century later. This is physical evidence connecting the buried city to the later period. A city can be mentioned long after its destruction, its exported art can survive elsewhere, and a later lava deposit can cover a site that was already ruined; those alternatives do not establish that the city escaped burial in 310 as directly.',
      choiceAnalysis: [
        { label: 'A', reason: 'A work written in A.D. 400 could describe an earlier city or recount its destruction. The date of a text is not necessarily the date of the events or place it discusses.' },
        { label: 'B', reason: 'Coins from around A.D. 410 preserved in the city’s burial deposit support a burial after that period, contradicting the proposed A.D. 310 burial date.' },
        { label: 'C', reason: 'A thick layer deposited in 415 could have covered ruins already buried or destroyed in 310. This establishes a later deposit, not by itself the absence of an earlier burial.' },
        { label: 'D', reason: 'Cephesan artworks could have been moved to the other city before 310. Their presence in a city destroyed in 420 does not date Cephesa’s destruction.' },
        { label: 'E', reason: 'A later text’s reference to the 415 eruption supports that an eruption occurred, but does not establish what happened to Cephesa in 310.' }
      ],
      takeaway: 'Dating evidence is strongest when the dated object is tied to the event’s original context. A later mention or later covering layer does not alone establish continued survival.',
      pitfalls: 'The archaeological inference assumes the later coins are part of the original preserved deposit, not later intrusions. The answer strengthens the claim; it is not a claim of infallible dating.'
    },
    {
      qid: 'gmat-b-main-7', sourceAnswer: 'D', version: 1,
      sourceFingerprint: 'fnv1a-59ace05e',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Rebuilt the ordering June > Kristin = Nancy > Maria and checked the numerical counterexamples. Only D is forced; Letty remains unranked relative to the upper three people."}],
      stimulusSummary: 'June is taller than Kristin; Kristin and Nancy are equal; Nancy is taller than Maria; Letty is also taller than Maria.',
      conclusion: 'June must be taller than Maria. Letty’s position relative to June, Kristin, and Nancy is not fixed.',
      reasoning: 'Write the linked comparisons as June > Kristin = Nancy > Maria. Transitivity immediately gives June > Maria, which is D. Letty contributes only a separate condition, Letty > Maria. Sharing Maria as a shorter person does not order Letty relative to the others. For example, heights Maria 150, Letty 155, Kristin = Nancy 160, and June 170 satisfy every premise. This single valid arrangement makes A, B, and C false, showing that none must hold. E directly reverses the established relation Kristin > Maria.',
      choiceAnalysis: [
        { label: 'A', reason: 'Letty and Nancy are both taller than Maria, but either could be taller than the other. Maria 150, Letty 155, Nancy 160 is a valid counterexample.' },
        { label: 'B', reason: 'Letty’s height is not linked to June’s except through a common shorter person. A valid arrangement has Letty 155 and June 170, so this is not required.' },
        { label: 'C', reason: 'Since Kristin equals Nancy, this would require Letty to exceed Nancy, which is not established. Kristin 160 and Letty 155 satisfy the original conditions.' },
        { label: 'D', reason: 'June exceeds Kristin, Kristin equals Nancy, and Nancy exceeds Maria. The complete chain therefore forces June to exceed Maria.' },
        { label: 'E', reason: 'Kristin equals Nancy, and Nancy is taller than Maria. Thus Kristin is taller, not shorter, than Maria; this option contradicts the premises.' }
      ],
      takeaway: 'Chain only comparisons that actually connect. Two people both exceeding a third does not determine their order relative to each other.'
    },
    {
      qid: 'gmat-b-main-8', sourceAnswer: 'D', version: 1,
      sourceFingerprint: 'fnv1a-ae0d00c8',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked statements independently. I and II directly evidence public costs; III concerns recipients’ wealth and does not establish the alleged price or taxpayer burden. Combination D is correct."}],
      stimulusSummary: 'The author criticizes farm policy for raising food prices and costing taxpayers billions. Three proposed supporting statements concern subsidy costs, ethanol-support costs, and farmers’ wealth.',
      conclusion: 'Current farm policy imposes substantial financial burdens on consumers and taxpayers.',
      reasoning: 'Statement I directly quantifies both alleged burdens: $20 billion in federal payments and $12 billion in higher food prices. Statement II provides a concrete farm-policy example in which a dollar of benefits to producers costs consumers and taxpayers four dollars. Both support the asserted financial burden. Statement III describes farmers’ net worth, not the cost imposed by the policy. Wealthy farmers could exist under policies that lower consumer prices, and poorer farmers could receive policies that raise them. Recipient wealth may matter to a separate fairness debate, but it does not establish the causal cost claim made here. The correct combination is therefore I and II only.',
      choiceAnalysis: [
        { label: 'A', reason: 'I does support both the taxpayer-cost and higher-price claims, but selecting I alone wrongly excludes II’s additional evidence of consumer and taxpayer costs.' },
        { label: 'B', reason: 'II supports the claim by quantifying the burden of an ethanol-production benefit, but this answer wrongly excludes the especially direct evidence in I.' },
        { label: 'C', reason: 'III gives recipients’ average net worth, which does not establish that the policy raises prices or imposes the stated costs. It also excludes the relevant evidence in I and II.' },
        { label: 'D', reason: 'I quantifies the overall public burden, and II provides a specific costly subsidy example. III does not address those costs, so I and II only is the correct combination.' },
        { label: 'E', reason: 'Including III confuses the financial condition of the beneficiaries with evidence about the burden on consumers and taxpayers.' }
      ],
      takeaway: 'Evaluate each numbered statement against the exact conclusion before combining them. A fact relevant to fairness is not automatically evidence of a claimed economic cost.'
    },
    {
      qid: 'gmat-b-main-9', sourceAnswer: 'E', version: 1,
      sourceFingerprint: 'fnv1a-a6c69a82',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'ai-reviewed', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Verified that Anne concedes the failed program and supplies school counterexamples, identifying overgeneralization. The explanation appropriately separates her actual reply from an invented reward-versus-penalty objection."}],
      stimulusSummary: 'Reva generalizes from the failure of one license-revocation program to the ineffectiveness of outside incentives. Anne accepts that failure but cites successful incentive programs in other schools.',
      conclusion: 'According to Anne, Reva treats one potentially unrepresentative failure as grounds for dismissing incentive programs generally.',
      reasoning: 'Anne does not deny Reva’s example. Instead, she adds examples in which incentive programs improved attendance and reduced discipline problems. Her response attacks the move from one unsuccessful program to a broad conclusion about incentives. That is precisely the overgeneralization in E. D may sound plausible because revoking a license is a penalty, but Anne never specifies that the successful programs relied on positive rewards. The question asks for the weakness identified by Anne’s actual response, not any objection that could independently be invented. Also note that attendance and discipline are not identical to inner attitudes; the task is to identify Anne’s objection, not prove that her response settles every aspect of Reva’s claim.',
      choiceAnalysis: [
        { label: 'A', reason: 'Whether potential dropouts possess licenses could explain the particular failure, but Anne neither mentions nor relies on that explanation.' },
        { label: 'B', reason: 'Anne explicitly accepts that the program failed. Her reply does not demand better numerical measurement of that failure.' },
        { label: 'C', reason: 'Anne cites schools, not years of successful incentive use by parents and employers. This supplies evidence different from the evidence in her response.' },
        { label: 'D', reason: 'Anne does not identify the successful programs as prize- or reward-based. A positive-versus-negative distinction is not the distinction her stated reply establishes.' },
        { label: 'E', reason: 'The successful school programs are counterexamples to treating the West Virginia failure as representative of all incentive programs. This matches Anne’s actual criticism.' }
      ],
      takeaway: 'When asked what a speaker’s reply identifies, match the reply’s actual evidence and strategy; do not choose a merely conceivable criticism.'
    },
    {
      qid: 'gmat-b-main-10', sourceAnswer: 'C', version: 1,
      sourceFingerprint: 'fnv1a-4ecef4d4',
      author: 'AI-assisted editorial', authoredAt: '2026-09-15', reviewStatus: 'needs-review', reviews: [{"reviewer":"Independent AI review A","kind":"ai","reviewedAt":"2026-09-15","verdict":"needs-review","notes":"Confirmed C best fits the low-market-share puzzle, with the stated caveat about profitability. Source option D is grammatically damaged; the analysis responsibly marks its interpretation as provisional rather than silently reconstructing it."}],
      issue: 'The imported text of option D is grammatically incomplete or corrupted: it joins accepting validity with “advertised and promoted” without a clear object. C fits the market-share question, but the complete original wording of D should be checked against the PDF before this item is treated as fully reviewed.',
      stimulusSummary: 'Surveys indicated willingness to pay up to 10 percent extra for environmentally sound products, but a detergent priced 5 percent above typical alternatives failed to gain significant market share.',
      conclusion: 'The question seeks the least relevant information for explaining why consumers did not buy enough Bleach-O Green.',
      reasoning: 'The puzzle concerns demand at the stated retail price, not merely the company’s profit per unit. Cleaning effectiveness, competing green detergents, consumer acceptance of the environmental claim, and promotional reach can all affect whether people buy the product. C instead asks about manufacturing costs. At an already specified selling price, those costs affect the producer’s margin more directly than consumers’ buying decisions, so C is the PDF key and the strongest fit for least relevant. Higher production costs could help explain a later withdrawal on profitability grounds, but they do not by themselves explain the stated failure to capture market share. Because option D is corrupted in the imported bank, its precise comparison cannot be certified from this text alone.',
      choiceAnalysis: [
        { label: 'A', reason: 'Consumers may be unwilling to pay extra for a detergent that cleans poorly, even if they prefer environmentally sound products. Product effectiveness is relevant to low demand.' },
        { label: 'B', reason: 'Competing environmentally promoted detergents could divide demand or offer buyers better alternatives. The number of such competitors is relevant to market share.' },
        { label: 'C', reason: 'Manufacturing cost bears directly on the company’s margin, while the consumer price is already given. It is least directly relevant to why consumers did not buy enough of the product, which is the stated market-share failure.' },
        { label: 'D', reason: 'The imported wording is damaged. If the intended question concerns consumers accepting the validity of the environmental claim, that would be relevant: willingness to pay for a genuinely green product does not imply willingness to pay for an untrusted claim. That reconstruction is provisional and must not be treated as the exact source wording.' },
        { label: 'E', reason: 'If consumers did not encounter or understand the promotion, survey willingness would not translate into purchases of this particular detergent. Advertising effectiveness is relevant to low market share.' }
      ],
      takeaway: 'Separate failure to attract buyers from failure to earn a profit. Production cost and consumer demand answer different questions, and damaged option text should be flagged rather than silently repaired.',
      pitfalls: 'The word “failure” also precedes withdrawal from sale, so production cost is not absolutely irrelevant to every commercial outcome. C is least relevant to the specific low-market-share puzzle; option D requires source verification.'
    }
  ];
  window.CR_AUTHORED_EXPLANATIONS = [...(window.CR_AUTHORED_EXPLANATIONS || []), ...records];
})();
