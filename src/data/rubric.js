// HOWL READ. Diagnostic Framework v2.0
// Six signals, four evidence surfaces, three verdict tiers.
// Brand-agnostic: applies to any brand trying to be more consequential,
// not only sustainability or impact brands.

export const FRAMEWORK_VERSION = '2.1';

// ============================================================================
// VERDICT TIERS. HOWL's voice for the overall stance
// ============================================================================

export const VERDICT_TIERS = [
  {
    id: 'whispering',
    name: 'Whispering',
    min: 0,
    max: 39,
    color: 'var(--howl-weak)',
    headline: "You're whispering in a room where everyone's shouting.",
    description: 'The brand is technically present but commercially invisible. Voice blends into category sameness. Owned channels run on autopilot, reputation drifts, and earned attention is absent. Audiences can describe what you do, but not why it matters.',
  },
  {
    id: 'speaking',
    name: 'Speaking',
    min: 40,
    max: 69,
    color: 'var(--howl-mid)',
    headline: "You're speaking. Audiences are listening politely.",
    description: 'The brand is competent and present, but it is not pulling people in. The signals are there. The provocation is not. Without sharper identity and earned cultural moments, the work stays in the safe lane.',
  },
  {
    id: 'howling',
    name: 'Howling',
    min: 70,
    max: 100,
    color: 'var(--howl-strong)',
    headline: "You're howling. Keep the cage rattling.",
    description: 'The brand is distinctive, integrated, and earning attention beyond its owned channels. Identity, expression, and execution are pulling in one direction. Protect the edge: the moment this softens into corporate wallpaper, the howl becomes a whisper again.',
  },
];

export function getVerdict(score) {
  return VERDICT_TIERS.find(t => score >= t.min && score <= t.max) || VERDICT_TIERS[0];
}

// ============================================================================
// EVIDENCE SURFACES, every signal is scored against these four surfaces.
// Together they cover the seven things a brand is judged on: website, social,
// AI representation, reputation, trust, third-party conversation, earned media.
// ============================================================================

export const SURFACES = [
  {
    id: 'WEBSITE',
    name: 'Website',
    color: '#D85726',
    description: 'Homepage, About, product pages, blog, any owned digital surface.',
    looks_for: [
      'Voice, headline, and hierarchy on the homepage',
      'How the brand introduces itself in the About page',
      'Product and category page language',
      'Whether purpose, point of view, and proof show up where they matter',
    ],
  },
  {
    id: 'SOCIAL',
    name: 'Social',
    color: '#F47245',
    description: 'Owned social channels: LinkedIn, Instagram, X, TikTok, YouTube.',
    looks_for: [
      'Distinctiveness of voice and visual identity in feed',
      'Engagement quality, not just volume',
      'Whether platform behaviour is native or broadcast',
      'Cadence and consistency of point of view',
    ],
  },
  {
    id: 'REPUTATION',
    name: 'Reputation',
    color: '#C29469',
    description: 'AI engine descriptions, third-party reviews, Glassdoor, Reddit, certifications, trust marks.',
    looks_for: [
      'How major AI engines describe the brand unprompted',
      'Wikipedia presence and external citations',
      'Reviews on Trustpilot, Glassdoor, App stores, etc.',
      'Certifications, audits, and third-party trust signals',
      'Disconnect between owned messaging and external perception',
    ],
  },
  {
    id: 'EARNED',
    name: 'Earned',
    color: '#0A0A0A',
    description: 'Press coverage, podcast appearances, awards, third-party conversation, organic mentions.',
    looks_for: [
      'Tier-one media coverage and the framing used',
      'Whether journalists treat the brand as a source or a subject',
      'Podcast appearances and the substance of the conversations',
      'Awards and industry recognition',
      'Organic conversation on forums, communities, and creator channels',
    ],
  },
];

export const SURFACE_IDS = SURFACES.map(s => s.id);

// ============================================================================
// CATEGORIES, broader industry list. The tool applies to any brand.
// ============================================================================

export const CATEGORIES = [
  { id: 'tech',         name: 'Technology / SaaS',            color: '#F47245' }, // coral
  { id: 'cpg',          name: 'Consumer Goods / CPG',         color: '#6B8E5A' }, // sage
  { id: 'retail',       name: 'Retail / E-commerce',          color: '#D85726' }, // deep coral
  { id: 'fashion',      name: 'Fashion / Apparel',            color: '#A0537B' }, // plum
  { id: 'food-bev',     name: 'Food & Beverage',              color: '#C29469' }, // tan
  { id: 'health',       name: 'Health & Wellness',            color: '#4A7BA1' }, // steel blue
  { id: 'finance',      name: 'Finance / Fintech',            color: '#2E2E2E' }, // charcoal
  { id: 'media',        name: 'Media / Entertainment',        color: '#B57E2C' }, // mustard
  { id: 'energy',       name: 'Energy / Utilities',           color: '#6E8F8F' }, // slate teal
  { id: 'mobility',     name: 'Mobility / Automotive',        color: '#8B3A1F' }, // rust
  { id: 'b2b-services', name: 'B2B / Professional Services',  color: '#5C5048' }, // warm gray
  { id: 'agency',       name: 'Marketing / Agency',           color: '#BE5E76' }, // rose
  { id: 'hospitality',  name: 'Hospitality / Travel',         color: '#946241' }, // caramel
  { id: 'real-estate',  name: 'Real Estate / Property',       color: '#4F644E' }, // forest
  { id: 'industrial',   name: 'Manufacturing / Industrial',   color: '#36454F' }, // dark slate
  { id: 'education',    name: 'Education',                    color: '#7B6FAB' }, // lavender
  { id: 'impact',       name: 'Sustainability / Impact / Climate', color: '#3D7048' }, // impact green
  { id: 'nonprofit',    name: 'Nonprofit / Mission',          color: '#835E32' }, // bronze
  { id: 'other',        name: 'Other',                        color: '#8B7E5E' }, // sand
];

export const BUSINESS_MODELS = [
  { id: 'b2c',   name: 'B2C' },
  { id: 'b2b',   name: 'B2B' },
  { id: 'b2b2c', name: 'B2B2C / Hybrid' },
];

// ============================================================================
// THE SIX SIGNALS
// Brand-agnostic. Each signal is scored against all four evidence surfaces.
// ============================================================================

export const SIGNALS = [
  {
    id: 'VOLUME',
    name: 'Volume',
    question: 'Are you cutting through, or whispering at the same frequency as everyone else?',
    thesis: 'Everyone is shouting at the same volume, at the same frequency, at the same time. Integrity is an outlier. The truth stands out. Brands that move people sound like nobody else in their category.',
    strong: [
      'Distinctive voice that sounds like nobody else in the category',
      'Sharp, identifiable point of view, not hedged or "balanced"',
      'Owned vocabulary: terms, phrases, or frames the brand introduced',
      'Headlines that would land even without the logo attached',
      'Visible willingness to be disagreed with',
    ],
    moderate: [
      'Recognisable voice but follows category conventions',
      'Some original framing, but most messaging is template',
      'Confident, not provocative',
      'Distinct on owned channels, generic in earned',
    ],
    weak: [
      'Indistinguishable from other brands in the category',
      'Reliance on cliché: "innovating for a better tomorrow", "passionate about", "committed to excellence"',
      'No identifiable point of view beyond competence',
      'Hedged, corporate-flavoured language',
      'Could swap the logo for a competitor with no edits needed',
    ],
  },
  {
    id: 'INTEGRATION',
    name: 'Integration',
    question: 'Is what makes you distinctive woven into the brand, or quarantined into corporate corners?',
    thesis: 'The separately housed report. The vanity URL. The Earth Day post. The "About" page nobody reads. When a brand\'s point of view sits outside the brand itself, it becomes performative. The signal of seriousness is integration, when conviction lives in the homepage, product, and campaign, not in a sub-section.',
    strong: [
      'Brand point of view present on homepage and in core narrative, not just an "About" page',
      'Distinctive positioning shows up in product naming, packaging, or core marketing',
      'No separate microsite or vanity URL quarantining the work',
      'Voice, design system, and tone are consistent across every channel',
      'Leadership visible in the brand, not just in corporate communications',
    ],
    moderate: [
      'Distinctive elements exist on the site but are clearly partitioned',
      'Some integration in campaigns, but mostly siloed comms calendar',
      'Investor or corporate content uses a different identity from the brand',
    ],
    weak: [
      'Distinctiveness lives entirely on a separate URL, microsite, or sub-brand',
      'Holiday or moment-based posts are the primary surface for what matters',
      'Corporate reports use entirely different visual identity and voice from the brand',
      'No mention of the brand\'s real distinctiveness on the homepage',
      'Point of view framed as a side initiative, not a brand attribute',
    ],
  },
  {
    id: 'IDENTITY',
    name: 'Identity',
    question: 'Is your distinctiveness embodied in who you are, or communicated as a side note?',
    thesis: 'Consequential brands do not communicate their values. They embody them. The work breaks through when distinctiveness sharpens what a brand stands for and strengthens what it creates, not when it is framed as a sacrifice, a virtue, or a side note.',
    strong: [
      'Remove the brand\'s point of view and the brand fundamentally changes',
      'Distinctiveness is a product attribute, not a marketing layer',
      'Founders, leadership, or culture visibly embody the values',
      'Benefits framed first, virtues second, "better, full stop"',
      'Brand identity (name, design, story) would not survive intact without the lens',
    ],
    moderate: [
      'Distinctiveness contributes to identity but is not load-bearing',
      'Some product or experience evidence of embodied values',
      'Leadership references values but is not synonymous with them',
    ],
    weak: [
      'Brand voice is a message wrapper around an unrelated product or service',
      'Position framed entirely as plea or virtue, not as benefit',
      'Brand identity is intact whether or not the values lens exists',
      'Communications read as scold, sacrifice, or obligation',
      'No human face to the brand inside the brand',
    ],
  },
  {
    id: 'CANDOR',
    name: 'Candor',
    question: 'Are you showing scars as well as vision, or only the polished aspiration?',
    thesis: 'Audiences have finely tuned BS detectors. Inauthenticity is invisibility. The brands building real belief are honest about complexity, they acknowledge where the work is hardest, admit what they do not yet know, and show progress AND challenges, not just aspiration.',
    strong: [
      'Public acknowledgement of trade-offs, limits, or unsolved problems',
      'Progress reported with what is not yet working, not just what is',
      'Specific numbers and methodology, not round numbers and adjectives',
      'Third-party verification or audit surfaced prominently',
      'Visible language for what the brand does not yet know',
    ],
    moderate: [
      'Some honest framing of challenges, but mostly aspirational tone',
      'Progress reported numerically but without contextual challenges',
      'External validation present but not prominent',
    ],
    weak: [
      'Only aspirational language: "leading the way", "committed to", "on a mission to"',
      'No acknowledgement of complexity, trade-offs, or unresolved problems',
      'Round numbers, no methodology',
      'No third-party validation visible',
      'The brand is winning on every front of its own reporting, a credibility flag',
    ],
  },
  {
    id: 'DESIRE',
    name: 'Desire',
    question: 'Are you inviting people into a future they want, or instructing them to comply?',
    thesis: 'Marketing works when it connects to identity, not duty. When people see themselves in the future you are building. When choosing the brand becomes something they want to do, not something they are told to do. Benefit. Authenticity. Desire. Momentum.',
    strong: [
      'Imagery and language depict an aspirational future people would choose',
      'Customer positioned as a co-creator or insider, not a beneficiary of a lecture',
      'Benefit precedes virtue in messaging hierarchy',
      'Cultural reference points the audience already values appear in the work',
      'Tone of voice would survive in a context outside the brand\'s category',
    ],
    moderate: [
      'Mix of invitation and instruction',
      'Benefit and virtue compete for top billing',
      'Aspirational imagery present but generic',
    ],
    weak: [
      'Tone reads as scold, lecture, or compliance reminder',
      'Customer positioned as someone who should do better',
      'Heavy reliance on stat-shaming or doom framing',
      'No discernible desire built into the brand expression',
      'Duty-as-engine: the work assumes the audience must be obligated into action',
    ],
  },
  {
    id: 'MOMENTUM',
    name: 'Momentum',
    question: 'Are you earning cultural attention, or fading quietly into the feed?',
    thesis: 'PLAY. Campaigns, provocations, earned-first creative, and content systems built for cultural sharpness. Ideas that do not fade quietly into the feed. Momentum is built when the work earns conversation that owned channels cannot manufacture.',
    strong: [
      'Earned media coverage that uses the brand as a primary source, not just a subject',
      'Visible community or third-party amplification of recent work',
      'A recent provocation, stunt, or position that drew commentary',
      'Cadence on owned channels with an identifiable point of view',
      'Cultural references, collaborators, platforms, partners, that signal the brand sits inside culture, not beside it',
    ],
    moderate: [
      'Steady earned coverage but mostly reactive or category roundups',
      'Active content but no breakout moment in the last 12 months',
      'Some partnerships, but conventional ones for the category',
    ],
    weak: [
      'No earned coverage; only owned channels carry the message',
      'Content cadence is volume-without-point-of-view',
      'No identifiable provocations or breakout moments',
      'Partnerships and collaborators are the predictable category names',
      'The brand\'s story has not moved beyond its own real estate',
    ],
  },
];

// ============================================================================
// BELIEF DIMENSIONS
// How consumers and audiences judge the brand on sustainability, social
// impact, and positive impact. Trust, evidence, and the invitation to
// participate in the brand's purpose (especially circular economy).
// Evaluated separately from the six signals because this is reception, not
// expression.
// ============================================================================

export const BELIEF_DIMENSIONS = [
  {
    id: 'TRUSTED',
    name: 'Trusted',
    question: 'Do audiences accept your sustainability and impact claims, or do they suspect spin?',
    thesis: 'Trust is awarded slowly and revoked quickly. The brands that hold it are the ones audiences see as transparent about intent, not just outcome. Skepticism is the default in 2026, and the burden of proof has shifted to the brand.',
    strong: [
      'External commentary treats brand impact claims as credible',
      'Reddit, forums, and creator discourse do not flag greenwashing',
      'AI engines describe impact work matter-of-factly, not with hedging language',
      'No recent credibility ruptures in earned coverage',
      'Glassdoor and employee reviews track close to the public narrative',
    ],
    weak: [
      'Forums (Reddit, Trustpilot, X) actively question motives or call out greenwashing',
      'Glassdoor reviews undercut the public narrative',
      'AI engines hedge or qualify when describing impact work',
      'Recent earned coverage uses words like "claims", "allegedly", "purports"',
      'Public posture and internal practice are visibly out of step',
    ],
  },
  {
    id: 'PROVEN',
    name: 'Proven',
    question: 'Is positive impact on the world backed by evidence audiences can verify?',
    thesis: 'Aspirational targets without methodology are red flags now, not green ones. Proven brands lead with audited numbers, name their adverse data, and make verification easy. Everyone else is asking audiences to take their word for it, and audiences increasingly will not.',
    strong: [
      'Third-party verification, audits, or certifications visible and accessible',
      'Specific metrics with methodology, not round numbers and adjectives',
      'Year-over-year reporting with apples-to-apples comparisons',
      'Adverse data published alongside good news',
      'Independent ratings (B Corp, SBTi, ISS, MSCI, etc.) referenced openly',
    ],
    weak: [
      'Claims dominate, evidence is buried or absent',
      'Round-number commitments with no methodology articulated',
      'No independent verification visible to audiences',
      'Glossy infographics that obscure rather than reveal',
      'Sustainability page tone is marketing, not measurement',
    ],
  },
  {
    id: 'PARTICIPATORY',
    name: 'Participatory',
    question: 'Are consumers invited into the impact story (circular economy, advocacy, co-creation), or only marketed to about it?',
    thesis: 'A circular economy is not a corporate program, it is a relationship. Consumers want a role, not a brochure. Brands that activate participation turn customers into advocates and the brand into a system. Brands that broadcast at consumers keep impact as a marketing claim, not a shared project.',
    strong: [
      'Active take-back, return, repair, or refill programs with visible consumer participation',
      'Community spaces where consumers contribute, advocate, or co-create',
      'Loyalty or rewards tied to participation, not just consumption',
      'Visible advocates who are not paid spokespeople',
      'Clear, easy entry points for consumers to act on the brand\'s purpose',
    ],
    weak: [
      'Consumers positioned as recipients of impact messaging only',
      'Circular economy mentioned but no consumer-facing role',
      'No peer community around the brand purpose',
      'Calls to action are buy, not participate',
      'Impact work happens to consumers, not with them',
    ],
  },
];

export const BELIEF_IDS = BELIEF_DIMENSIONS.map((d) => d.id);

// ============================================================================
// CONDUCT DIMENSIONS, three reads of competitive and market behavior. Independent
// of communication strength: a brand can howl loudly AND behave well, or
// quietly while behaving badly. Higher score = healthier, more proportionate
// and more open. Lower score = signals of dominance abuse, anti-competitive
// tactics, or designed-in lock-in.
// ============================================================================

export const CONDUCT_DIMENSIONS = [
  {
    id: 'PROPORTION',
    name: 'Proportion',
    question: 'Is the brand\'s market position proportionate to the value it creates, or maintained through gatekeeping?',
    thesis: 'Scale earned through better product, service, or economics is healthy. Scale maintained through gatekeeping, killer acquisitions, or rule-bending is parasitism. Audiences and regulators are increasingly willing to make the distinction, and to act on it.',
    strong: [
      'Market position is demonstrably earned through product, service, or economic advantage',
      'Multiple credible competitors exist and are growing',
      'Acquisitions, when made, expand capability rather than eliminate emerging challengers',
      'No active antitrust action, consent decree, or regulatory concern in the past five years',
      'Industry analysts describe the brand as a category leader, not a category captor',
    ],
    weak: [
      'Dominant share in a category with active gatekeeping behavior',
      'Documented pattern of "killer acquisitions" of nascent competitors',
      'Antitrust investigations, fines, or consent decrees in the past five years',
      'Press, analysts, or watchdogs use the words monopoly, gatekeeper, or dominant when describing the brand',
      'Pricing or market power that extracts rent beyond what value created would suggest',
    ],
  },
  {
    id: 'FAIR',
    name: 'Fair',
    question: 'Does the brand compete on merit, or use anti-competitive tactics to suppress alternatives?',
    thesis: 'Fair play means winning by building, not by smothering. Out-competing on product and reputation belongs in the win column. Predatory pricing, frivolous IP suits, non-competes on rank-and-file workers, vertical foreclosure, and lobbying for regulatory moats are a different game, and audiences increasingly recognize it.',
    strong: [
      'Competes on product, brand, and price within normal market dynamics',
      'No documented history of predatory pricing followed by post-failure price increases',
      'IP enforcement is targeted at clear infringement, not used as a strategic weapon against rivals',
      'Treats partners, suppliers, and workers as participants in growth rather than extractive surfaces',
      'Lobbying activity, where it exists, is transparent and proportional to the brand\'s size',
    ],
    weak: [
      'Documented predatory pricing patterns: loss-leading until rivals fail, then price increases',
      'Patent thickets, frivolous lawsuits, or IP weaponization against legitimate competitors',
      'Non-compete clauses imposed on rank-and-file workers, not just executives with real trade secrets',
      'Vertical foreclosure, exclusivity demands, or self-preferencing on its own platforms',
      'Outsized lobbying spend used to raise barriers to entry, capture regulators, or rewrite rules in its favor',
    ],
  },
  {
    id: 'OPEN',
    name: 'Open',
    question: 'Can customers, partners, and workers leave when they want to, or are they trapped by design?',
    thesis: 'The cheapest moat is friction. Make leaving hard enough and growth looks like loyalty even when it isn\'t. Walled gardens, opaque contracts, hard-to-cancel subscriptions, format lock-in, and non-competes are all the same move dressed differently. Open brands build moats out of value. Closed brands build them out of barriers.',
    strong: [
      'Account closure, data portability, and cancellation paths are clear and one-click-style',
      'Interoperable standards, open formats, or genuine third-party integration without artificial gating',
      'Workers can leave without legal threats; partners can switch without punitive penalties',
      'Switching costs that exist are real (training, integration) rather than manufactured (DRM, format lock)',
      'Public stance and operational policy on customer and worker exit are coherent with each other',
    ],
    weak: [
      'Cancellation flows are deliberately byzantine, with dark patterns and retention mazes',
      'Proprietary formats, DRM, or platform lock-in designed primarily to raise switching costs',
      'Aggressive non-compete or trade-secret litigation against departing employees',
      'Partner agreements that include exclusivity clauses or punishing exit penalties',
      'Customers, employees, or partners publicly describe the brand as hard to leave even when relationships sour',
    ],
  },
];

export const CONDUCT_IDS = CONDUCT_DIMENSIONS.map((d) => d.id);

// ============================================================================
// RECOMMENDATION PLAYBOOKS. EDGE (strategy) and PLAY (creative)
// Reference patterns. The AI generates brand-specific moves at runtime.
// ============================================================================

export const EDGE_PLAYBOOK = {
  VOLUME: [
    { title: 'Voice Sharpening', description: 'Re-write the brand\'s public vocabulary with the goal of saying things no competitor would. Audit every line for category cliché and replace with owned language.' },
    { title: 'Position Stake', description: 'Identify the one position the brand will hold that others will not. Make it the spine of the next 12 months of communications.' },
  ],
  INTEGRATION: [
    { title: 'Homepage Integration', description: 'Move the brand\'s real point of view onto the homepage and into the core narrative. Retire any standalone microsite or fold it into the main brand site as a chapter, not a hideout.' },
    { title: 'System Unification', description: 'Apply the brand\'s design system, voice, and tone to corporate communications and reporting. End the visual quarantine.' },
  ],
  IDENTITY: [
    { title: 'Identity Audit', description: 'Test what survives if you remove every distinctive claim. If the brand is intact, distinctiveness is decoration, not structure. Use the audit to identify where it must become load-bearing.' },
    { title: 'Better, Full Stop', description: 'Re-frame every virtue-led line as a benefit-first claim. Lead with what is sharper, faster, more beautiful, more reliable, more useful. Let virtue follow.' },
  ],
  CANDOR: [
    { title: 'Scars Report', description: 'Publish a counterpart to the progress narrative: what is not working, what is hardest, what is unresolved. Treat candor as a credibility asset.' },
    { title: 'Methodology in the Open', description: 'Surface measurement, methodology, and verification on every public claim. Replace adjectives with footnotes.' },
  ],
  DESIRE: [
    { title: 'Re-frame from Duty to Desire', description: 'Re-write the top of the messaging hierarchy from instruction language to invitation language. The customer is choosing into a future, not opting out of a problem.' },
    { title: 'Cultural Vector', description: 'Identify the cultural reference points the audience already moves toward, design, music, sport, food, travel, and route the brand through those. Through, not beside, the things people love.' },
  ],
  MOMENTUM: [
    { title: 'Earned-First Calendar', description: 'Replace the monthly content calendar with an earned-first calendar: every quarter, one provocation built to be picked up, not pushed out.' },
    { title: 'Source-of-Record Strategy', description: 'Position leadership as the go-to expert source on a specific narrow question. Build the relationships and the proof before the next news cycle, not during it.' },
  ],
};

export const PLAY_PLAYBOOK = {
  VOLUME: [
    { title: 'Anti-Wallpaper Campaign', description: 'A creative platform built specifically to fail every test of corporate sameness. Wrong colours. Wrong typography. Wrong tone. Right brand.' },
    { title: 'Named Adversary', description: 'Pick the specific status quo the brand is against and name it. Run a campaign that makes the adversary impossible to ignore.' },
  ],
  INTEGRATION: [
    { title: 'Point of View in the Product', description: 'A creative campaign built around moments where distinctiveness shows up in the product itself, packaging, naming, sourcing, ritual. Make the proof the campaign.' },
    { title: 'One Brand, One Story', description: 'Run a single integrated campaign across brand and corporate channels with shared creative, voice, and KPIs. Use it to retire any separate communications calendar.' },
  ],
  IDENTITY: [
    { title: 'Founder Provocation', description: 'A platform that puts founders or leadership in front of culture taking a specific position they would lose sleep defending. Identity built through visible conviction.' },
    { title: 'The Better Product Spot', description: 'A campaign that argues the product is better, full stop, and treats the distinctive lens as the reason it is better, not as a separate plea.' },
  ],
  CANDOR: [
    { title: 'The Honest Annual', description: 'A campaign-grade annual report that leads with what failed, what is hardest, and what is unknown. Built to be quoted by journalists, not buried by investor relations.' },
    { title: 'Live Receipt', description: 'A public, real-time tracker of one metric the brand can be measured on, including bad weeks. Make the brand legible in numbers it cannot edit.' },
  ],
  DESIRE: [
    { title: 'Future Self Campaign', description: 'A creative platform that shows the customer who they become by choosing the brand. Identity-forward, not issue-forward.' },
    { title: 'Cultural Drop', description: 'A collaboration with a non-category cultural partner, artist, designer, label, athlete, that puts the brand inside something people already want, not next to it.' },
  ],
  MOMENTUM: [
    { title: 'Earned Stunt', description: 'A single, well-engineered provocation designed to be picked up: an open letter, a public dare, a product hack, a public refusal. One thing built to land in earned, not paid.' },
    { title: 'POV Channel', description: 'A serialised content channel, podcast, newsletter, video series, with a sharp recurring point of view. Built for cumulative authority, not one-off engagement.' },
  ],
};
