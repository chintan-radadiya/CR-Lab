(function () {
  'use strict';
  const records = [
    {
      qid: 'gmat-a-main-1',
      sourceFingerprint: 'fnv1a-5e23d010',
      sourceAnswer: 'A',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the dialogue against all choices. Correctly distinguishes Janeck’s electability prediction from the qualification claim Siuzdak attributes to him."}],
      stimulusSummary: 'Janeck predicts Stevenson will lose because voters are reluctant to elect a politically inexperienced businessman. Siuzdak replies that managing a major corporation prepares someone to govern a state.',
      conclusion: 'Siuzdak takes Janeck to be questioning Stevenson’s qualifications for the governorship.',
      reasoning: 'The question asks what Siuzdak understands Janeck to mean, not what Janeck’s words strictly establish. Janeck actually discusses voters’ willingness to elect Stevenson: that is a prediction about electoral prospects. Siuzdak answers by defending the usefulness of Stevenson’s business experience: that is a claim about fitness for office. Her reply makes sense as a rebuttal only if she interprets Janeck’s remark as implying that Stevenson is unqualified. A identifies that interpretation. Notice the mismatch: being qualified does not guarantee that voters will recognize those qualifications or elect the candidate. We therefore need not accept Siuzdak’s reply as a successful refutation to identify the claim she thinks she is refuting.',
      choiceAnalysis: [
        { label: 'A', reason: 'Correct. Her defense of corporate leadership as preparation for state leadership directly answers a supposed claim that Stevenson lacks the qualifications needed to be governor.' },
        { label: 'B', reason: 'Janeck says few voters are willing to support such a candidate, not that no inexperienced candidate has ever won. Siuzdak offers no historical election example that would rebut this absolute historical claim.' },
        { label: 'C', reason: 'The analogy between business and political leadership is Siuzdak’s own basis for defending Stevenson. She does not interpret Janeck as already accepting the analogy she uses against him.' },
        { label: 'D', reason: 'Neither speaker discusses profit-seeking as a threat to fair government. This introduces an ethical concern different from the stated issue of political inexperience.' },
        { label: 'E', reason: 'Janeck’s description of voters does not say they overestimate political experience, and Siuzdak does not explicitly discuss how voters assign weight to qualifications.' }
      ],
      takeaway: 'In dialogue questions, identify the claim a reply addresses. Do not confuse the original speaker’s actual claim with the claim the respondent attributes to that speaker.',
      pitfalls: 'Do not turn an electability prediction into an objective qualification judgment unless the question specifically asks how the respondent interpreted it.'
    },
    {
      qid: 'gmat-a-main-2',
      sourceFingerprint: 'fnv1a-a5cd0287',
      sourceAnswer: 'D',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked nominal versus effective tax rates and all alternatives. D stays within the criticism of the existing system; the explanation does not infer revenue or universal superiority of a flat tax."}],
      stimulusSummary: 'A progressive system nominally taxes high incomes at higher rates, but the current system’s deductions and loopholes primarily benefit high-income taxpayers and can leave them paying lower effective rates than lower-income taxpayers.',
      conclusion: 'The present system’s apparent progressivity is undermined by the tax rates people actually pay.',
      reasoning: 'The passage contrasts statutory rates with effective rates. Higher nominal rates on higher incomes make the current system look progressive. However, deductions, exemptions, credits, and loopholes can reverse that relationship in practice. The conclusion should capture this contrast: D says that the present system’s progressive character is more apparent than real. This does not establish which replacement system would be fairest, how much revenue a flat tax would raise, or which taxpayers would support a proposal. Those questions require information the passage does not supply, including the proposed flat rate and which allowances it would retain.',
      choiceAnalysis: [
        { label: 'A', reason: 'High-income taxpayers currently benefit from loopholes. They might oppose losing those benefits; the passage supplies neither their preferences nor the terms needed to predict their support.' },
        { label: 'B', reason: 'Removing deductions can broaden the tax base, but total revenue also depends on the flat rate and other factors. A substantial increase cannot be inferred without those figures.' },
        { label: 'C', reason: 'The evidence concerns existing advantages enjoyed by higher earners. It does not establish that a new flat tax would penalize lower earners, since no proposed rate or distributional calculation is given.' },
        { label: 'D', reason: 'Correct. The supposed progression from lower to higher tax rates can disappear or reverse once high-income taxpayers use the current system’s concessions.' },
        { label: 'E', reason: 'The phrase “any progressive tax system” goes far beyond the criticism of the present system. A progressive system without these loopholes could distribute burdens differently.' }
      ],
      takeaway: 'Complete an argument at the level its evidence supports: criticism of one existing policy does not prove the superiority of every feature of an alternative.'
    },
    {
      qid: 'gmat-a-main-3',
      sourceFingerprint: 'fnv1a-9b5002b3',
      sourceAnswer: 'D',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the operative confidentiality exception. D governs disclosure; the remaining phrases do not resolve the information-release standard."}],
      stimulusSummary: 'The proposed identity-card system collects personal information and promises confidentiality, subject to release by authorized personnel under “appropriate circumstances.”',
      conclusion: 'To judge the risk of information misuse, clarify the conditions under which disclosure is permitted.',
      reasoning: 'The confidentiality assurance is not unconditional. Its practical protection depends on the exception: information may be released under “appropriate circumstances.” If that means narrowly specified, independently supervised situations, the protection may be substantial. If it allows disclosure whenever an official finds it convenient, the promise may protect very little. D therefore targets the undefined standard that governs the very conduct the concerned person wants to evaluate. The question does not ask which term is vague in the abstract; it asks which ambiguity matters most to possible misuse of confidential information.',
      choiceAnalysis: [
        { label: 'A', reason: 'Clarifying who must produce a card may affect the system’s coverage, but it does not establish when officials may disclose information already collected.' },
        { label: 'B', reason: '“However slight” characterizes the claimed size of the risk. A more precise risk estimate could be useful, but explaining the actual disclosure exception more directly reveals how misuse might occur.' },
        { label: 'C', reason: '“Civil liberties” names a broad class of interests. Defining that category does not specify the rules that would permit or prohibit release of personal records.' },
        { label: 'D', reason: 'Correct. This phrase defines the exception to confidentiality. Without knowing its scope, one cannot assess whether the promise prevents arbitrary or abusive disclosure.' },
        { label: 'E', reason: 'Knowing which laws citizens must obey would not itself reveal how their confidential records could be released. Lawful behavior does not automatically guarantee protection against disclosure.' }
      ],
      takeaway: 'When a policy promises protection subject to an exception, scrutinize the exception’s operational limits, not merely the reassuring language surrounding it.'
    },
    {
      qid: 'gmat-a-main-4',
      sourceFingerprint: 'fnv1a-50a81d55',
      sourceAnswer: 'E',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the high-technology scope and EXCEPT polarity. E concerns culinary reputation. Softened the branding explanation so an inferred marketing expectation is not presented as a proven fact."}],
      stimulusSummary: 'American appliance, automobile, and electronics firms now borrow European or Japanese personnel, styling, and quality associations. The author treats this as evidence that America has lost international prestige in high technology.',
      conclusion: 'Choose the example that does not add relevant support for the claimed loss of high-technology prestige.',
      reasoning: 'The argument uses imitation and appeals to foreign quality as evidence that foreign producers have become the prestige benchmarks. A through D extend that same pattern in cameras, stereo components, video games, or televisions. E also invokes European prestige, but only in cuisine. A preference for French or Italian food is not evidence that American high-technology industries have lost status. Since this is an EXCEPT question, E is correct because it fails to support the specified conclusion; it need not prove the conclusion false. The argument’s broad historical claim is not conclusively established by any single example, but the four technological examples at least point in its evidential direction.',
      choiceAnalysis: [
        { label: 'A', reason: 'Comparing American cameras favorably with Swiss imports treats the imported technological product as a quality benchmark. This adds an example of the prestige pattern described.' },
        { label: 'B', reason: 'An American stereo maker copying a popular Japanese firm adds another case of imitation within the electronics industry, directly matching the author’s evidence.' },
        { label: 'C', reason: 'Choosing a Japanese-sounding video-game brand suggests that the maker expects the foreign association to help its product appeal. This adds support for the claimed prestige of foreign technology, without proving the marketing actually succeeds.' },
        { label: 'D', reason: 'Adopting German television-manufacturing techniques adds a technological example in which an American firm looks abroad for a model. It supports the direction of the argument, even though technical learning alone does not prove a complete loss of prestige.' },
        { label: 'E', reason: 'Correct. European-style meals and French or Italian chefs invoke culinary reputation, not high-technology reputation. The example is outside the conclusion’s relevant domain.' }
      ],
      takeaway: 'For Strengthen EXCEPT, test each option against the exact scope of the conclusion. A vivid parallel in a different domain can still be irrelevant.'
    },
    {
      qid: 'gmat-a-main-5',
      sourceFingerprint: 'fnv1a-fd1a3b24',
      sourceAnswer: 'B',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the concession, central criticism, and modifiers. B captures the dash-standardization problem; A adds the unsupported claim that distortions are equally serious."}],
      stimulusSummary: 'The author accepts Johnson’s criticism of earlier Dickinson editors but argues that Johnson’s standardization of unclear punctuation as dashes creates a false impression of Dickinson’s deliberate punctuation choices.',
      conclusion: 'Johnson’s use of dashes misrepresents Dickinson’s intentions.',
      reasoning: 'The opening concession gives Johnson credit for identifying distortions by earlier editors. “Yet” then introduces the author’s own criticism, and the remaining sentences explain it: Johnson makes casual, unresolved handwritten marks appear to be a settled authorial preference for dashes. B captures that specific central claim. A is tempting because it follows the concession-and-criticism structure, but it adds that Johnson’s distortions are “equally serious.” The passage does not compare their seriousness; indeed, it describes Johnson’s text as more faithful. A faithful summary must preserve both the main criticism and the limits of what is asserted.',
      choiceAnalysis: [
        { label: 'A', reason: 'It captures the broad contrast but adds an unsupported equality of seriousness between Johnson’s distortions and the earlier editors’ distortions.' },
        { label: 'B', reason: 'Correct. The criticism developed in the passage is that systematically printing dashes falsely suggests Dickinson deliberately chose that punctuation as characteristic of her poetry.' },
        { label: 'C', reason: 'The passage says Dickinson did not expect a casual mode of phrasing to appear in print. It does not establish that she expected none of her poetry to be published or that virtually every editorial intervention must violate her wishes.' },
        { label: 'D', reason: 'The author criticizes Johnson’s editorial decision, not the thoroughness of his research, and does not state that his motives were well-meaning.' },
        { label: 'E', reason: 'Deciphering handwriting is background to the problem. The central criticism is the misleading certainty created by standardization, not a general assessment of every editor’s deciphering ability.' }
      ],
      takeaway: 'A main-point answer can be narrower and more accurate than a broad summary containing an unsupported comparison. Check modifiers such as “equally.”'
    },
    {
      qid: 'gmat-a-main-6',
      sourceFingerprint: 'fnv1a-9927b512',
      sourceAnswer: 'C',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the international comparison and its limitation. C is the strongest offered economic counterevidence, but does not prove zero harm or resolve country-level confounding; the explanation acknowledges this."}],
      stimulusSummary: 'The argument opposes legally mandated unpaid parental leave on the ground that it would damage national business competitiveness.',
      conclusion: 'Businesses should be free from mandatory parental-leave regulations because those regulations would harm competitiveness.',
      reasoning: 'The economic premise is the reason offered for rejecting regulation. C supplies relevant counterevidence: strong parental-leave rules coexist with some of the world’s most competitive businesses. That makes it harder to treat freedom from such rules as necessary for competitiveness and weakens the policy argument on its own economic terms. C does not prove that the proposed domestic law would have no costs; differences between countries may matter, and competitive businesses might have been even more competitive without regulation. A weakening answer need only reduce support for the conclusion, however, and C challenges the claimed incompatibility more directly than the alternatives.',
      choiceAnalysis: [
        { label: 'A', reason: 'A family benefit supplies a possible competing policy goal but does not undermine the argument’s specific claim about economic competitiveness.' },
        { label: 'B', reason: 'Voluntary leave policies show that some firms find leave workable. However, those firms may have selected arrangements suited to their circumstances; this does not directly show that a mandatory policy would be economically harmless.' },
        { label: 'C', reason: 'Correct. Highly competitive businesses operating under strong leave regulations provide directly relevant evidence against the contention that businesses must be free of those regulations to compete successfully.' },
        { label: 'D', reason: 'Exempting smaller firms limits coverage, but large covered firms could still suffer the alleged harm. Nothing states how much of national competitiveness depends on either group.' },
        { label: 'E', reason: 'Public approval measures popularity, not economic consequences. A popular policy could still impose the claimed competitive disadvantage.' }
      ],
      takeaway: 'Attack the reason actually offered. Evidence that a predicted obstacle coexists with success weakens a necessity claim without proving that the obstacle has zero cost.'
    },
    {
      qid: 'gmat-a-main-7',
      sourceFingerprint: 'fnv1a-5ab656f5',
      sourceAnswer: 'C',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Verified the conditional chain, contrapositive, and counterassignments. C follows from A implies D; inverse and converse alternatives are correctly rejected."}],
      stimulusSummary: 'The premises give the conditional chain A implies B, B implies C, and C implies D.',
      conclusion: 'If D is false, A must be false.',
      reasoning: 'Linking the premises gives A → B → C → D, so A → D. Its contrapositive is not D → not A, which is option C. A direct contradiction check confirms it: suppose D were false but A true. A would force B, B would force C, and C would force D, contradicting the starting supposition. Importantly, none of the premises says that A is the only way for D to be true. D can therefore be true without A, and the chain cannot be read backward. In the answer choices, the letter labels name options while A, B, C, D, and E inside the statements name propositions; keep those roles separate.',
      choiceAnalysis: [
        { label: 'A', reason: 'This reverses A → D. A sufficient condition need not be necessary: assigning A, B, and C false and D true satisfies all premises while making D → A false.' },
        { label: 'B', reason: 'This is the inverse of B → C, not its contrapositive. B can be false while C and D are true, with A false, without violating the premises.' },
        { label: 'C', reason: 'Correct. Taking the contrapositive of the linked conditional A → D gives not D → not A.' },
        { label: 'D', reason: 'No premise connects proposition D with proposition E. D can be true and E false without violating any stated conditional.' },
        { label: 'E', reason: 'This is the inverse of A → D. The absence of A does not rule out D, because the premises do not say that D requires A.' }
      ],
      takeaway: 'Chain conditionals forward; contrapose by reversing direction and negating both ends. Reversing alone or negating alone is invalid.'
    },
    {
      qid: 'gmat-a-main-8',
      sourceFingerprint: 'fnv1a-db99cf4a',
      sourceAnswer: 'A',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the capacity comparison and quantifiers. The letter supports applicants exceeding positions, not that the recipient is qualified, funding absolutely tiny, or most applicants qualified."}],
      stimulusSummary: 'A government office rejects an applicant and explains that limited summer-job funding makes it impossible to hire everyone who wants a job, forcing rejection even of many highly qualified applicants.',
      conclusion: 'There were more applicants than available summer positions.',
      reasoning: 'The letter identifies a capacity shortage: the office cannot offer jobs to all who apply because funding limits the number of positions. That directly supports A, the comparison between applications and available jobs. The letter’s statement that many highly qualified applicants are rejected does not identify this particular recipient as one of them. Nor does “limited” mean a small absolute amount of money: a large budget may still be insufficient for an even larger applicant pool. The warranted inference is the relative shortage, not a flattering description of the recipient or a judgment about the office’s review process.',
      choiceAnalysis: [
        { label: 'A', reason: 'Correct. Rejections forced by an inability to fund positions for all applicants imply that demand for the jobs exceeded the number available.' },
        { label: 'B', reason: '“Many highly qualified applicants” describes a group of rejected people. The letter does not establish that this recipient belongs to that group.' },
        { label: 'C', reason: 'Funding can be limited relative to demand without being very small in absolute terms. No amount or benchmark is supplied.' },
        { label: 'D', reason: 'The office offers no description of its screening process or of the attention given to this specific application.' },
        { label: 'E', reason: '“Many” is not “most,” and the letter does not supply the fraction of all applicants who were qualified.' }
      ],
      takeaway: 'Separate relative shortages from absolute amounts, and do not transfer a property of many group members to one named or addressed individual.'
    },
    {
      qid: 'gmat-a-main-9',
      sourceFingerprint: 'fnv1a-1376baae',
      sourceAnswer: 'A',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'needs-review',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"needs-review","notes":"The answer identifies the intended fault-attribution gap, but A covers most fatal accidents overall rather than the selected driver-survives/passenger-dies subgroup. It is not a rigorously necessary assumption as worded. Retain the PDF key with a source-item warning and seek editorial adjudication."}],
      issue: "The PDF-keyed option A generalizes across most fatal accidents, while the argument concerns a narrower survivor–fatality subgroup. It identifies the intended attribution of fault, but is not strictly necessary for that subgroup inference. Source wording and answer-choice scope need editorial review.",
      stimulusSummary: 'In fatal accidents where one car occupant dies and another survives, the passenger is more often the victim. The author calls this ironic because the passenger supposedly suffers for the driver’s carelessness.',
      conclusion: 'The casualty pattern is unfair because the supposedly culpable driver survives while an innocent passenger dies.',
      reasoning: 'The study reports who dies, not who causes the crash. To describe passengers as suffering for their own driver’s carelessness, the author has to add a fault attribution that the statistics do not establish. A supplies that missing link by assigning fault, in most fatal accidents, to the driver of the car containing the victim. If the crashes were instead generally caused by other drivers, road conditions, or mechanical failures, the contrast between an innocent passenger and a culpable surviving driver would lose its basis. A is the intended and best available answer. Its wording concerns most fatal accidents overall, while the reported study emphasizes a particular survivor–fatality subgroup; the passage does not justify treating those populations as identical. Read A as capturing the author’s unstated general attribution of fault, not as a conclusion proved by the casualty data.',
      choiceAnalysis: [
        { label: 'A', reason: 'Correct as the intended causal assumption. It supplies the otherwise missing reason for treating the driver in the victim’s car as responsible rather than merely as another person involved in the crash.' },
        { label: 'B', reason: 'The study compares driver and passenger deaths within a restricted set of accidents. The irony does not require drivers to be rarely killed across all automobile accidents.' },
        { label: 'C', reason: 'The argument compares occupants of the same automobile. The proportion of overall traffic deaths involving pedestrians does not establish who is culpable in those crashes.' },
        { label: 'D', reason: 'A recommendation to improve passenger protection could follow from the casualty pattern, but the author’s attribution of blame does not depend on what safety experts should do.' },
        { label: 'E', reason: 'Passenger involvement in causing crashes would challenge the blanket description of passengers as innocent; it does not supply the missing link from driver survival to driver fault.' }
      ],
      takeaway: 'An outcome statistic does not establish responsibility for that outcome. Identify the separate, unstated causal or moral attribution.',
      pitfalls: 'The PDF key identifies the intended gap, but its population wording is broader than the study subgroup. Do not treat a broadly worded keyed assumption as a rigorously proved statistical equivalence.'
    },
    {
      qid: 'gmat-a-main-10',
      sourceFingerprint: 'fnv1a-3a9df5b1',
      sourceAnswer: 'C',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the analogy mapping: hostile lies/fire, retaliatory lies/more fire, truth/water. Correctly distinguishes method identification from proving propaganda effectiveness."}],
      stimulusSummary: 'Defenders of American disinformation argue that Soviet lies must be countered with American lies: “fight fire with fire.” The author replies that firefighters find water more effective.',
      conclusion: 'The author supports truth rather than counter-disinformation by comparing truth’s role to water’s role in fighting fire.',
      reasoning: 'The question concerns method, not whether the proposed propaganda strategy actually works. In the defenders’ metaphor, hostile disinformation is fire and retaliatory disinformation is more fire. The author extends the comparison but changes the remedy: just as water is more effective against a literal fire, truth is presented as more effective against disinformation. That makes C the description of the reasoning used. No actual propaganda campaign is examined, and no firefighter is presented as an expert on international information policy. The analogy supplies the rhetorical support; it does not independently demonstrate the empirical effectiveness of truth in every political setting.',
      choiceAnalysis: [
        { label: 'A', reason: 'The definition explains disinformation as spreading untruths to advance political interests. It does not define the term by repeating the conclusion that the practice is ineffective.' },
        { label: 'B', reason: 'The passage gives no concrete case in which a lying campaign failed. Fire suppression is an analogy, not an observed example from propaganda warfare.' },
        { label: 'C', reason: 'Correct. Truth is mapped onto water, the contrasting remedy used against the metaphorical “fire” of falsehood.' },
        { label: 'D', reason: 'The fire department is used to illustrate how literal fires are fought, not cited as an authority on the effectiveness of political propaganda.' },
        { label: 'E', reason: 'The author criticizes a practice and its defense, not the personal character of particular intelligence agents as a substitute for addressing the practice.' }
      ],
      takeaway: 'For method questions, map the elements of an analogy explicitly and distinguish analogy from a real-world example or a relevant expert’s testimony.'
    },
    {
      qid: 'gmat-a-main-11',
      sourceFingerprint: 'fnv1a-a4d57118',
      sourceAnswer: 'E',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the practical-versus-ethical distinction. E is the closest offered intended main point. The explanation appropriately notes that preferring truth does not demonstrate every disinformation instance is ineffective."}],
      stimulusSummary: 'The author calls truth the nation’s surest propaganda weapon and rejects the defense of American disinformation as necessary retaliation against Soviet falsehoods.',
      conclusion: 'Disinformation campaigns are not an effective way to advance United States political interests.',
      reasoning: 'The author frames the disagreement in terms of effectiveness: truth is the “surest weapon,” defenders say lying is “necessary,” and the final analogy proposes a “more effective” response than fighting fire with fire. E best captures the intended strategic objection to disinformation. The author may also dislike lying morally, but the passage does not develop an ethical rule, an argument about national moral standing, or a time-based comparison of short-term gains and long-term losses. Be precise about strength: the passage favors truth and rejects the defenders’ effectiveness rationale; it does not demonstrate that every individual false statement must fail in every circumstance. E is the closest offered main-point statement, not a reason to amplify the argument into that absolute claim.',
      choiceAnalysis: [
        { label: 'A', reason: 'This concedes effectiveness and relocates the objection to ethics. The author’s explicit comparison is about what works better, not a moral prohibition overriding successful results.' },
        { label: 'B', reason: 'The passage describes political interests and effective propaganda weapons, not an argument that national moral standing depends on consistent truthfulness.' },
        { label: 'C', reason: 'No short-term/long-term sequence is presented. This supplies a specific mechanism of eventual failure that the author never states.' },
        { label: 'D', reason: 'The author does not measure the harm caused by Soviet campaigns in Europe. Their existence is part of the opposing side’s justification, not the conclusion being defended.' },
        { label: 'E', reason: 'Correct. It captures the author’s rejection of disinformation as an effective instrument of American political interests and the preference for truth as the better response.' }
      ],
      takeaway: 'Identify whether an objection is practical or moral from the reasons actually given. Disapproval of a practice does not automatically make the argument ethical.'
    },
    {
      qid: 'gmat-a-main-12',
      sourceFingerprint: 'fnv1a-35140b37',
      sourceAnswer: 'D',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the ownership-to-local-voice inference. D directly adds local editorial knowledge; duration of publication and the rival’s audience or advertisers do not repair that inference."}],
      stimulusSummary: 'The Daily Clarion claims to be Gotham’s only real local voice because its rival, the Daily Bugle, is owned by an out-of-town syndicate portrayed as indifferent to Gotham’s residents.',
      conclusion: 'The Bugle’s out-of-town ownership supposedly prevents it from representing local people.',
      reasoning: 'The advertisement moves from the owners’ location and alleged indifference to a judgment about the newspaper’s local voice. It overlooks the people who make editorial decisions. D provides direct evidence that the Bugle’s entire editorial staff has longstanding experience living and working in Gotham. Such staff could understand and represent local concerns even if ownership is external. This challenges the ownership-to-editorial-voice link itself. It does not prove that the Bugle always represents residents well, but it directly undercuts the advertisement’s reason for dismissing it. By contrast, facts about the Clarion’s advertisers or readers chiefly attack the advertiser’s own purity rather than show why the Bugle can be a local voice.',
      choiceAnalysis: [
        { label: 'A', reason: 'Outside advertising revenue does not by itself establish outside editorial control or a lack of concern for Gotham. It also does not directly defend the Bugle against the argument about its ownership.' },
        { label: 'B', reason: 'Allocating more pages to out-of-town news does not show that the Clarion fails to represent local interests; local readers may want that coverage. Page allocation is less direct than evidence about the Bugle’s editorial staff.' },
        { label: 'C', reason: 'Having some nonresident readers is compatible with representing Gotham residents. The audience’s location does not establish the paper’s editorial priorities.' },
        { label: 'D', reason: 'Correct. The people producing the Bugle’s editorial content have substantial local roots, directly challenging the inference that external ownership makes a newspaper incapable of being a local voice.' },
        { label: 'E', reason: 'A longer publication history does not establish the interests or local knowledge of the current owners and staff. Longevity alone does not repair the relevant link.' }
      ],
      takeaway: 'To refute a source-based dismissal, supply evidence about the mechanism that actually determines the product’s quality or perspective, rather than merely attacking the rival.'
    },
    {
      qid: 'gmat-a-main-13',
      sourceFingerprint: 'fnv1a-898bdcf7',
      sourceAnswer: 'E',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the national-remedy/global-effect link and the meaning of curbing growth. E states the needed connection without claiming the cap is sufficient or the only solution."}],
      stimulusSummary: 'Resource depletion is globally excessive. The proposed remedy is to keep United States resource consumption from rising above its current level for many years.',
      conclusion: 'Capping United States consumption is needed to address the excessive rate of global resource depletion.',
      reasoning: 'The problem is global, but the proposed intervention is national. The argument therefore needs a link between controlling United States consumption and materially slowing global depletion. E states that link. If curbing U.S. consumption would not significantly retard worldwide depletion, the passage has not explained why this domestic cap would correct the stated problem. “Curbing” here can mean restraining future growth: keeping consumption at its present level does not require an immediate reduction below that level. The assumption does not prove that the cap alone is sufficient, or that it is the only possible policy. It establishes the meaningful effect the argument must presume for the proposed remedy.',
      choiceAnalysis: [
        { label: 'A', reason: 'Consumption need not be at an all-time per-person high for limiting its future growth to help. Total consumption and its global effect, not a historical per-capita record, drive the argument.' },
        { label: 'B', reason: 'Even resources used efficiently are depleted when consumed. The remedy does not require that current U.S. use include waste.' },
        { label: 'C', reason: 'The United States could be a major but not the largest consumer and still have enough impact for a consumption cap to matter. A ranking is unnecessary.' },
        { label: 'D', reason: 'Resources are part of the earth’s stock whether obtained domestically or imported. Their country of origin does not determine whether controlling U.S. use slows global depletion.' },
        { label: 'E', reason: 'Correct. It connects the proposed U.S. restraint to the worldwide problem the argument says that restraint will help correct.' }
      ],
      takeaway: 'For a local remedy to a global problem, look for the assumption that the targeted actor’s behavior has a meaningful effect on the global outcome.'
    },
    {
      qid: 'gmat-a-main-14',
      sourceFingerprint: 'fnv1a-ca454fc8',
      sourceAnswer: 'B',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked all strengthening alternatives. B supplies a concrete substantial U.S. share; D may help cooperation but leaves that magnitude unresolved. The explanation does not claim constant use eliminates depletion."}],
      stimulusSummary: 'The argument recommends freezing United States resource consumption at current levels to address excessive worldwide resource depletion.',
      conclusion: 'Restraining the growth of United States consumption would be an important part of addressing global depletion.',
      reasoning: 'The main gap is the scale of the proposed intervention: why single out the United States when the problem concerns the whole world? B answers with a directly relevant magnitude. If one country accounts for one-third of world resource use, controlling growth in its consumption affects a large portion of the activity causing depletion. That makes the recommendation substantially more relevant and potentially consequential. D is tempting because international coordination can help, but it leaves the size and likely impact of the U.S. contribution unknown. Other countries’ agreements alone do not tell us why the particular U.S. cap is a significant remedy. B provides the most direct support for that missing connection. Neither answer establishes that holding current usage steady will by itself reduce depletion to an acceptable rate.',
      choiceAnalysis: [
        { label: 'A', reason: 'Discovering more deposits may reduce the perceived urgency of conserving known supplies. It does not show that the proposed U.S. restraint would meaningfully address depletion.' },
        { label: 'B', reason: 'Correct. A one-third share establishes that U.S. consumption is a large part of the global total, giving a concrete reason its restraint could materially affect the problem.' },
        { label: 'C', reason: 'Relative development needs could support a fairness argument about who should sacrifice, but the passage’s central issue is whether the U.S. cap meaningfully addresses resource depletion.' },
        { label: 'D', reason: 'International caps may make collective restraint more feasible, but this says nothing about the U.S. share of resource use. It supports cooperation less directly than B supports the importance of the proposed domestic intervention.' },
        { label: 'E', reason: 'Prior conservation does not quantify U.S. consumption or show whether keeping it at present levels would correct the current global problem.' }
      ],
      takeaway: 'When an argument targets one contributor to a collective problem, evidence of that contributor’s substantial share can strengthen the remedy-to-outcome link.'
    },
    {
      qid: 'gmat-a-main-15',
      sourceFingerprint: 'fnv1a-eb62dfa9',
      sourceAnswer: 'C',
      version: 1,
      author: 'AI-assisted editorial',
      authoredAt: '2026-09-15',
      reviewStatus: 'ai-reviewed',
      reviews: [{"reviewer":"Independent AI review B","kind":"ai","reviewedAt":"2026-09-15","verdict":"approved","notes":"Checked the sequence of claim, counterevidence, and dismissal. C identifies reliance on the disputed weak-on-crime belief, while sponsorship alone is not presented as conclusive proof of strength."}],
      stimulusSummary: 'Alba claims Senator Frank is weak on crime. When Tam points to Frank’s sponsorship of an anticrime law, Alba declares that the law must be weak because Frank sponsored it.',
      conclusion: 'Alba preserves her claim that Frank is weak on crime by assuming that same claim when evaluating counterevidence.',
      reasoning: 'Tam offers evidence that could challenge Alba’s assessment: sponsoring an anticrime law may indicate commitment to fighting crime. Alba does not inspect the law’s provisions or effects. Instead, she treats Frank’s sponsorship as enough to show the law is weak. That judgment depends on the very belief under dispute—that Frank does not strongly support anticrime measures. The belief is then protected from revision by classifying any apparent counterexample in accordance with it. C precisely describes this circular, self-protecting reasoning. Tam’s evidence need not conclusively prove Frank is strong on crime for Alba’s response to be flawed; the problem is dismissing potentially contrary evidence solely by assuming the disputed assessment.',
      choiceAnalysis: [
        { label: 'A', reason: 'This broadly says the evidence is insufficient, but it does not identify the specific mechanism: Alba uses her unsupported assessment of Frank to disqualify evidence that might challenge that assessment.' },
        { label: 'B', reason: 'Alba need not believe crime is the single most important election issue to regard Frank’s position on it as a reason not to vote for her. The dialogue’s flaw concerns evaluating evidence, not issue rankings.' },
        { label: 'C', reason: 'Correct. Alba assumes Frank is weak on crime to infer that Frank’s law is weak, thereby dismissing the counterevidence without independently establishing either claim.' },
        { label: 'D', reason: 'The dispute concerns Frank’s policy commitment and legislation, which are relevant to political leadership. It is not a personal-character attack unrelated to her political performance.' },
        { label: 'E', reason: 'Other voting issues might matter, but focusing on one issue does not explain the circular dismissal of the anticrime law. The passage does not require a comprehensive voting analysis.' }
      ],
      takeaway: 'Watch for an argument that evaluates apparent counterevidence by assuming the disputed conclusion. Ask what independent evidence supports the dismissal.'
    }
  ];
  window.CR_AUTHORED_EXPLANATIONS = [...(window.CR_AUTHORED_EXPLANATIONS || []), ...records];
}());
