// HOWL READ — Diagnostic Framework v1.0
// Six signals derived from the HOWL thesis. Each measures whether a brand
// is whispering, speaking, or howling its impact story.

export const FRAMEWORK_VERSION = '1.0';

// ============================================================================
// VERDICT TIERS — HOWL's voice for the overall stance
// ============================================================================

export const VERDICT_TIERS = [
  {
    id: 'whispering',
    name: 'Whispering',
    min: 0,
    max: 39,
    color: 'var(--howl-weak)',
    headline: "You're whispering in a room where everyone's shouting.",
    description: 'Your impact story signals obligation, complexity, or compromise. The work is buried. Sustainability sits beside the brand, not inside it. Audiences cannot find the version of the future you are building.',
  },
  {
    id: 'speaking',
    name: 'Speaking',
    min: 40,
    max: 69,
    color: 'var(--howl-mid)',
    headline: "You're speaking. Audiences are listening politely.",
    description: 'Your impact story is competent and present, but it is not pulling people in. The signals are there. The provocation is not. Without sharper integration and earned cultural moments, the work stays in the safe lane.',
  },
  {
    id: 'howling',
    name: 'Howling',
    min: 70,
    max: 100,
    color: 'var(--howl-strong)',
    headline: "You're howling. Keep the cage rattling.",
    description: 'Your impact story is integrated, distinctive, and earning attention beyond your owned channels. The brand and the cause are one thing. Protect the edge: the moment this softens into corporate wallpaper, the howl becomes a whisper again.',
  },
];

export function getVerdict(score) {
  return VERDICT_TIERS.find(t => score >= t.min && score <= t.max) || VERDICT_TIERS[0];
}

// ============================================================================
// IMPACT CATEGORIES — what kind of impact brand are we reading?
// ============================================================================

export const IMPACT_CATEGORIES = [
  { id: 'circular',     name: 'Circular Economy' },
  { id: 'climate-tech', name: 'Climate Tech' },
  { id: 'clean-energy', name: 'Clean Energy' },
  { id: 'cpg',          name: 'Sustainable Consumer Goods' },
  { id: 'fashion',      name: 'Sustainable Fashion' },
  { id: 'food-bev',     name: 'Sustainable Food & Beverage' },
  { id: 'mobility',     name: 'Mobility & EV' },
  { id: 'built-env',    name: 'Built Environment' },
  { id: 'finance',      name: 'Impact / Climate Finance' },
  { id: 'health',       name: 'Health & Wellbeing' },
  { id: 'social',       name: 'Social Impact' },
  { id: 'other',        name: 'Other' },
];

// ============================================================================
// THE SIX SIGNALS
// ============================================================================

export const SIGNALS = [
  {
    id: 'VOLUME',
    name: 'Volume',
    question: 'Are you cutting through, or whispering at the same frequency as everyone else?',
    thesis: 'Sustainability has been whispering in a room where everyone is shouting. At the same volume. At the same frequency. At the same time. The brands that move people sound like nobody else in the category.',
    color: '#F47245',
    strong: [
      'Distinctive voice that sounds like nobody else in the impact category',
      'Sharp point of view that takes a clear position, not hedged language',
      'Owned vocabulary — terms, phrases, or frames the brand introduced',
      'Headlines that would land even without the logo attached',
      'Visible willingness to be disagreed with',
    ],
    moderate: [
      'Recognisable brand voice but blends into category conventions',
      'Some original framing, but most messaging follows industry templates',
      'Confident but not provocative',
      'Distinct on owned channels, generic in earned',
    ],
    weak: [
      'Indistinguishable from other brands in the category',
      'Reliance on category clichés: "for a better tomorrow", "sustainability journey", "commitment to the planet"',
      'No identifiable point of view beyond "we care"',
      'Hedged, compliance-flavoured language',
      'Could swap the logo for a competitor with no edits needed',
    ],
  },
  {
    id: 'INTEGRATION',
    name: 'Integration',
    question: 'Is sustainability woven into the brand, or quarantined in an ESG silo?',
    thesis: 'The separately housed ESG report. The vanity URL. The Earth Day post. When sustainability sits outside the brand, it becomes performative. The signal of seriousness is integration — when impact lives in the product, the homepage, the campaign, the work.',
    color: '#0A0A0A',
    strong: [
      'Sustainability message present on homepage and in core brand narrative, not just a dedicated page',
      'Impact themes show up in product naming, packaging, or core marketing — not only in ESG content',
      'No separate vanity URL or microsite quarantining the work',
      'Voice, design system, and tone are consistent across brand and sustainability channels',
      'Sustainability leader visible in the brand, not just the report',
    ],
    moderate: [
      'Sustainability content exists in the brand site, but in a clearly separate section',
      'Some integration in campaigns, but mostly siloed comms calendar',
      'ESG report visually disconnected from the brand identity',
    ],
    weak: [
      'Sustainability lives entirely on a separate URL, microsite, or ESG portal',
      'Earth Day / Earth Month posts are the primary impact comms surface',
      'ESG report uses entirely different visual identity and voice from the brand',
      'No mention of impact on homepage or in core brand narrative',
      'Sustainability framed as a side initiative, not a brand attribute',
    ],
  },
  {
    id: 'IDENTITY',
    name: 'Identity',
    question: 'Is impact embodied in who you are, or communicated as a side note?',
    thesis: 'Consequential brands do not communicate impact. They embody it. The work breaks through when sustainability sharpens what a brand stands for and strengthens what it creates — not when it is framed as a sacrifice, a scold, or a side note.',
    color: '#D85726',
    strong: [
      'Removing sustainability would meaningfully change what the brand is',
      'Impact is a product attribute, not a marketing layer',
      'Founders, leadership, or culture visibly embody the cause',
      'Better-for-the-planet is framed as "better, full stop" — value first, virtue second',
      'Brand identity (name, design, story) would not survive intact without the impact lens',
    ],
    moderate: [
      'Impact contributes to brand identity but is not load-bearing',
      'Some product or experience evidence of embodied values',
      'Leadership references impact but is not synonymous with it',
    ],
    weak: [
      'Sustainability is a message wrapper around an unrelated product or service',
      'Impact framed entirely as plea ("better for the planet") not as benefit',
      'Brand identity is intact whether or not the impact lens exists',
      'Sustainability content reads as scold, sacrifice, or obligation',
      'No human face to the cause inside the brand',
    ],
  },
  {
    id: 'CANDOR',
    name: 'Candor',
    question: 'Are you showing scars as well as vision, or only the polished aspiration?',
    thesis: 'Audiences have finely tuned BS detectors. Inauthenticity is invisibility. The brands building real belief are honest about complexity — they admit hard-to-reach emissions, acknowledge what they do not yet know, and show progress AND challenges, not just aspiration.',
    color: '#1F7A4D',
    strong: [
      'Public acknowledgement of hard-to-abate emissions, supply chain limits, or unsolved trade-offs',
      'Progress reported with what is not yet working, not just what is',
      'Specific numbers and methodologies, not round numbers and adjectives',
      'Third-party verification or audit clearly surfaced',
      'Visible language for what the brand does not yet know',
    ],
    moderate: [
      'Some honest framing of challenges, but mostly aspirational tone',
      'Progress reported numerically but without contextual challenges',
      'External validation present but not prominent',
    ],
    weak: [
      'Only aspirational language: "net zero by", "100% by", "commit to"',
      'No acknowledgement of complexity, trade-offs, or unresolved problems',
      'Round numbers, no methodology',
      'No third-party validation visible',
      'The brand is winning on every front of its own report — a credibility flag',
    ],
  },
  {
    id: 'DESIRE',
    name: 'Desire',
    question: 'Are you inviting people into a future they want, or instructing them to comply?',
    thesis: 'Sustainability messaging works when it connects to identity, not guilt. When people see themselves in the future you are building. When it becomes a choice they want to make, not an instruction they try to avoid. Benefit. Authenticity. Desire. Momentum.',
    color: '#F4A672',
    strong: [
      'Imagery and language depict an aspirational future people would choose',
      'Customer is positioned as a co-creator or insider, not a beneficiary of a lecture',
      'Benefit precedes virtue in messaging hierarchy',
      'Cultural reference points the audience already values appear in the work',
      'Tone of voice would survive in a consumer context outside the impact category',
    ],
    moderate: [
      'Mix of invitation and instruction',
      'Benefit and virtue compete for top billing',
      'Aspirational imagery present but generic',
    ],
    weak: [
      'Tone reads as scold, lecture, or sacrifice',
      'Customer positioned as someone who should do better',
      'Heavy reliance on stat-shaming or doom framing',
      'No discernible desire built into the brand expression',
      'Guilt-as-engine: the work assumes the audience must be shamed into action',
    ],
  },
  {
    id: 'MOMENTUM',
    name: 'Momentum',
    question: 'Are you earning cultural attention, or fading quietly into the feed?',
    thesis: 'PLAY. Campaigns, provocations, earned-first creative, and content systems built for cultural sharpness. Ideas that do not fade quietly into the feed. Momentum is built when the work earns conversation that owned channels cannot manufacture.',
    color: '#0A0A0A',
    strong: [
      'Earned media coverage that uses the brand as a primary source on impact topics, not just a subject',
      'Visible community or third-party amplification of recent impact work',
      'A recent provocation, stunt, or position that drew commentary',
      'Content cadence on impact with an identifiable point of view',
      'Cultural references — collaborators, platforms, or partners — that signal the brand sits inside culture, not beside it',
    ],
    moderate: [
      'Steady earned coverage but mostly reactive or category roundups',
      'Active content but no breakout moment in the last 12 months',
      'Some partnerships, but conventional ones for the category',
    ],
    weak: [
      'No earned coverage of impact work; only owned channels carry the message',
      'Content cadence is volume-without-point-of-view',
      'No identifiable provocations or breakout moments',
      'Partnerships and collaborators are all the predictable category names',
      'The impact story has not moved beyond the brand\'s own real estate',
    ],
  },
];

// ============================================================================
// RECOMMENDATION LIBRARY — EDGE and PLAY plays, mapped to weak signals.
// The AI will select from these as well as generate brand-specific moves.
// ============================================================================

export const EDGE_PLAYBOOK = {
  VOLUME: [
    { title: 'Voice Sharpening', description: 'Re-write the brand\'s impact vocabulary from scratch with the goal of saying things no competitor would. Audit every line for category cliché and replace with owned language.' },
    { title: 'Position Stake', description: 'Identify the one position the brand will hold that others will not. Make it the spine of the next 12 months of comms.' },
  ],
  INTEGRATION: [
    { title: 'Homepage Integration', description: 'Move the impact story onto the homepage and into the core brand narrative. Retire the standalone microsite or fold it into the main brand site as a chapter, not a hideout.' },
    { title: 'Brand-ESG System Unification', description: 'Apply the brand\'s design system, voice, and tone to the sustainability report and all impact comms. End the visual quarantine.' },
  ],
  IDENTITY: [
    { title: 'Identity Audit', description: 'Test what survives if you remove every sustainability claim. If the brand is intact, impact is not embodied — it is decoration. Use the audit to identify where impact must become structural.' },
    { title: 'Better, Full Stop', description: 'Re-frame every "better for the planet" line as a benefit-first claim. Lead with what is sharper, faster, more beautiful, more reliable, more useful. Let virtue follow.' },
  ],
  CANDOR: [
    { title: 'Scars Report', description: 'Publish a counterpart to the progress report: what is not working, what is hardest, what is unresolved. Treat candor as a credibility asset.' },
    { title: 'Methodology in the Open', description: 'Surface measurement, methodology, and verification on every public claim. Replace adjectives with footnotes.' },
  ],
  DESIRE: [
    { title: 'Re-frame from Guilt to Gain', description: 'Re-write the top of the messaging hierarchy from sacrifice language to invitation language. The customer is choosing into a future, not opting out of a problem.' },
    { title: 'Cultural Vector', description: 'Identify the cultural reference points the audience already moves toward — design, music, sport, food, travel — and route impact through those. Sustainability through, not beside, the things people love.' },
  ],
  MOMENTUM: [
    { title: 'Earned-First Calendar', description: 'Replace the monthly content calendar with an earned-first calendar: every quarter, one provocation built to be picked up, not pushed out.' },
    { title: 'Source-of-Record Strategy', description: 'Position leadership as the go-to expert source on a specific narrow impact question. Build the relationships and the proof before the next news cycle, not during it.' },
  ],
};

export const PLAY_PLAYBOOK = {
  VOLUME: [
    { title: 'Anti-Wallpaper Campaign', description: 'A creative platform built specifically to fail every test of corporate sustainability marketing. Wrong colours. Wrong typography. Wrong tone. Right brand.' },
    { title: 'Named Adversary', description: 'Pick the specific status quo the brand is against and name it. Run a campaign that makes the adversary impossible to ignore.' },
  ],
  INTEGRATION: [
    { title: 'Impact in the Product', description: 'A creative campaign built around moments where impact shows up in the product itself — packaging, ingredients, sourcing, repair. Make the proof the campaign.' },
    { title: 'One Brand, One Story', description: 'Run a single integrated campaign across brand and impact channels with shared creative, voice, and KPIs. Use it to retire any separate sustainability comms calendar.' },
  ],
  IDENTITY: [
    { title: 'Founder Provocation', description: 'A platform that puts founders or leadership in front of culture taking a specific position they would lose sleep defending. Identity built through visible conviction.' },
    { title: 'The Better Product Spot', description: 'A campaign that argues the product is better — full stop — and treats the impact benefit as the reason it is better, not as a separate plea.' },
  ],
  CANDOR: [
    { title: 'The Honest Annual', description: 'A campaign-grade annual report that leads with what failed, what is hardest, and what is unknown. Built to be quoted by journalists, not buried by investor relations.' },
    { title: 'Live Receipt', description: 'A public, real-time tracker of one specific impact metric — including bad weeks. Make the brand legible in numbers it cannot edit.' },
  ],
  DESIRE: [
    { title: 'Future Self Campaign', description: 'A creative platform that shows the customer who they become by choosing the brand. Identity-forward, not issue-forward.' },
    { title: 'Cultural Drop', description: 'A collaboration with a non-impact cultural partner — artist, designer, label, athlete — that puts the brand inside something people already want, not next to it.' },
  ],
  MOMENTUM: [
    { title: 'Earned Stunt', description: 'A single, well-engineered provocation designed to be picked up: an open letter, a public dare, a product hack, a public refusal. One thing built to land in earned, not paid.' },
    { title: 'POV Channel', description: 'A serialised content channel — podcast, newsletter, video series — with a sharp recurring point of view. Built for cumulative authority, not one-off engagement.' },
  ],
};
