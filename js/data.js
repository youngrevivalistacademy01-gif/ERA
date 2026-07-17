/* THE ERA — static game data
   All fictional entities (labels, festivals, platforms, events) live here,
   separate from simulation logic in simulation.js */

const GENRES = [
  'Hip-Hop', 'Trap', 'R&B', 'Pop', 'Alternative', 'Drill',
  'Afrobeats', 'Soul', 'Electronic', 'Indie', 'Reggaeton', 'Rock'
];

const SONG_TYPES = [
  'Love', 'Pain', 'Party', 'Flex', 'Street',
  'Storytelling', 'Experimental', 'Diss', 'Inspirational'
];

const STARTING_STORIES = [
  {
    id: 'bedroom',
    name: 'Bedroom Artist',
    blurb: "You've spent years making music alone in a bedroom. Nobody knows your name. You're talented but completely invisible.",
    money: 5000, fans: 0,
    stats: { talent: 5, songwriting: 8, performance: -3, charisma: -5, dance: -3, business: -5, creativity: 6 },
    industry: { fame: 2, hype: 3, credibility: 10, fanLoyalty: 30, industryRespect: 5, publicImage: 'Mysterious' }
  },
  {
    id: 'talentshow',
    name: 'Talent Show Finalist',
    blurb: 'You almost won a major televised talent show. The industry knows the face. Can you prove you\'re more than a TV moment?',
    money: 3000, fans: 8000,
    stats: { talent: 3, songwriting: -3, performance: 8, charisma: 5, dance: 5, business: -3, creativity: -3 },
    industry: { fame: 25, hype: 20, credibility: 15, fanLoyalty: 35, industryRespect: 10, publicImage: 'Underrated' }
  },
  {
    id: 'socialmedia',
    name: 'Social Media Star',
    blurb: 'You became famous online. Now you\'re trying to convince the music industry you\'re actually an artist.',
    money: 1500, fans: 40000,
    stats: { talent: -3, songwriting: -5, performance: -2, charisma: 10, dance: 3, business: 2, creativity: 3 },
    industry: { fame: 35, hype: 45, credibility: 8, fanLoyalty: 20, industryRespect: 3, publicImage: 'Industry Plant' }
  },
  {
    id: 'richfamily',
    name: 'Rich Family',
    blurb: 'You have money and access. But everyone believes you bought your way into music.',
    money: 100000, fans: 2000,
    stats: { talent: -2, songwriting: -3, performance: -3, charisma: 3, dance: -2, business: 8, creativity: -3 },
    industry: { fame: 15, hype: 15, credibility: 5, fanLoyalty: 15, industryRespect: 2, publicImage: 'Industry Plant' }
  },
  {
    id: 'musicschool',
    name: 'Music School Graduate',
    blurb: 'You understand music better than most people. Unfortunately, nobody knows who you are.',
    money: 4000, fans: 500,
    stats: { talent: 6, songwriting: 8, performance: 3, charisma: -5, dance: -2, business: -2, creativity: 5 },
    industry: { fame: 3, hype: 3, credibility: 20, fanLoyalty: 25, industryRespect: 15, publicImage: 'Respected' }
  },
  {
    id: 'formergroup',
    name: 'Former Group Member',
    blurb: 'Your former group broke up. The public still compares you to your old bandmates.',
    money: 7000, fans: 15000,
    stats: { talent: 3, songwriting: 2, performance: 8, charisma: 5, dance: 5, business: -3, creativity: -5 },
    industry: { fame: 30, hype: 20, credibility: 15, fanLoyalty: 40, industryRespect: 15, publicImage: 'Neutral' }
  },
  {
    id: 'wentviral',
    name: 'Gone Viral',
    blurb: 'You have one huge viral moment. The industry is waiting to see if you can do it again.',
    money: 2000, fans: 100000,
    stats: { talent: -2, songwriting: -3, performance: -3, charisma: 5, dance: 2, business: -2, creativity: 3 },
    industry: { fame: 40, hype: 55, credibility: 5, fanLoyalty: 15, industryRespect: 2, publicImage: 'Controversial' }
  },
  {
    id: 'industrychild',
    name: 'Industry Child',
    blurb: 'You grew up around music executives and artists. You know the industry. You also have something to prove.',
    money: 25000, fans: 5000,
    stats: { talent: 2, songwriting: -2, performance: 2, charisma: 5, dance: -2, business: 10, creativity: -5 },
    industry: { fame: 20, hype: 15, credibility: 10, fanLoyalty: 20, industryRespect: 10, publicImage: 'Industry Plant' }
  }
];

const RECORD_LABELS = [
  { id: 'velvet', name: 'Velvet Sound Group', focus: ['Pop', 'R&B'], power: 90, budget: 90, creativeFreedom: 25, marketing: 90 },
  { id: 'northstar', name: 'Northstar Records', focus: ['Hip-Hop', 'Pop', 'Trap'], power: 95, budget: 95, creativeFreedom: 20, marketing: 95 },
  { id: 'crownline', name: 'Crownline Music', focus: ['Pop'], power: 75, budget: 70, creativeFreedom: 20, marketing: 85 },
  { id: 'afterhours', name: 'Afterhours Records', focus: ['Alternative', 'Indie', 'Soul'], power: 55, budget: 45, creativeFreedom: 80, marketing: 55 },
  { id: 'statichouse', name: 'Static House', focus: ['Hip-Hop', 'Trap', 'Drill'], power: 70, budget: 65, creativeFreedom: 45, marketing: 75 },
  { id: 'monument', name: 'Monument Music', focus: ['Soul', 'R&B', 'Rock'], power: 85, budget: 75, creativeFreedom: 60, marketing: 70 }
];

const STREAMING_PLATFORMS = ['Soundwave', 'Echo', 'Vibebox'];
const DISTRIBUTOR = 'Distributr';

const VENUE_TIERS = [
  { id: 'small', name: 'Small Venue', capMin: 50, capMax: 500, fameReq: 5 },
  { id: 'club', name: 'Club', capMin: 500, capMax: 2000, fameReq: 20 },
  { id: 'theatre', name: 'Theatre', capMin: 2000, capMax: 5000, fameReq: 40 },
  { id: 'arena', name: 'Arena', capMin: 10000, capMax: 20000, fameReq: 65 },
  { id: 'stadium', name: 'Stadium', capMin: 40000, capMax: 80000, fameReq: 85 }
];

const FESTIVALS = [
  { id: 'sunset', name: 'Sunset Sound Festival', prestige: 90, genreFocus: null },
  { id: 'northshore', name: 'Northshore Live', prestige: 80, genreFocus: null },
  { id: 'echovalley', name: 'Echo Valley', prestige: 65, genreFocus: ['Indie', 'Alternative'] },
  { id: 'velvetnights', name: 'Velvet Nights', prestige: 70, genreFocus: ['R&B', 'Soul'] },
  { id: 'electrichorizon', name: 'Electric Horizon', prestige: 68, genreFocus: ['Electronic', 'Pop'] },
  { id: 'afterlight', name: 'The Afterlight Festival', prestige: 85, genreFocus: null },
  { id: 'citypulse', name: 'CityPulse', prestige: 60, genreFocus: null },
  { id: 'grandsound', name: 'The Grand Sound', prestige: 99, genreFocus: null }
];

const FESTIVAL_SLOTS = [
  { id: 'emerging', name: 'Emerging Artist', fameReq: 15 },
  { id: 'supporting', name: 'Supporting Artist', fameReq: 40 },
  { id: 'mainstage', name: 'Main Stage', fameReq: 65 },
  { id: 'headliner', name: 'Headliner', fameReq: 85 }
];

const CHARTS = {
  global100: { name: 'The Global 100', size: 100 },
  stream100: { name: 'The Stream 100', size: 100 }
};

const PUBLIC_IMAGES = [
  'Positive', 'Neutral', 'Controversial', 'Toxic', 'Mysterious',
  'Respected', 'Underrated', 'Industry Plant', 'Superstar'
];

const MANAGER_PERSONALITIES = ['Aggressive', 'Loyal', 'Ambitious', 'Lazy', 'Strategic', 'Greedy', 'Protective'];

/* Team hiring: gated by fame OR a flat fee (whichever the player can meet). */
const TEAM_ROLES = [
  { id: 'producer', name: 'Producer', fee: 8000, fameReq: 25, salary: 300, boosts: 'Song quality on future releases' },
  { id: 'publicist', name: 'Publicist', fee: 12000, fameReq: 35, salary: 350, boosts: 'Hype retention, damage control on negative events' },
  { id: 'lawyer', name: 'Lawyer', fee: 6000, fameReq: 20, salary: 250, boosts: 'Better label negotiation outcomes' },
  { id: 'bookingAgent', name: 'Booking Agent', fee: 7000, fameReq: 25, salary: 280, boosts: 'Better show/festival offers' },
  { id: 'creativeDirector', name: 'Creative Director', fee: 10000, fameReq: 30, salary: 320, boosts: 'Better music video quality' },
  { id: 'assistant', name: 'Personal Assistant', fee: 3000, fameReq: 10, salary: 150, boosts: 'Energy recovery' }
];

const ERA_TEMPLATES = [
  { id: 'unknown', name: 'The Unknown Era', color: '#5A5A66', minFame: 0 },
  { id: 'rise', name: 'The Rise Era', color: '#3FA796', minFame: 20 },
  { id: 'supernova', name: 'The Supernova Era', color: '#C9A24B', minFame: 60 },
  { id: 'fall', name: 'The Fall Era', color: '#7A2333', minFame: 0, requiresDecline: true },
  { id: 'rebirth', name: 'The Rebirth Era', color: '#4B6FC9', minFame: 0, requiresRebound: true },
  { id: 'legacy', name: 'The Legacy Era', color: '#8B6BC9', minFame: 80, minWeeks: 260 }
];

const NAME_POOL = {
  first: ['Marcus', 'Jasmine', 'Devon', 'Nia', 'Kai', 'Aaliyah', 'Theo', 'Zuri', 'Miles', 'Bianca', 'Jorge', 'Priya'],
  last: ['Vale', 'Okafor', 'Reyes', 'Sinclair', 'Duval', 'Marsh', 'Kanu', 'Delgado', 'Winters', 'Osei']
};

/* Career event pool. requirement(state) returns true/false for eligibility.
   effects are applied via simulation.applyEventOutcome */
const EVENT_POOL = [
  // --- CAREER OPPORTUNITY ---
  {
    id: 'lowlevel_manager', category: 'opportunity', weight: 20,
    requirement: (s) => !s.manager && s.artist.industry.fame < 40,
    title: 'A Manager Approaches',
    description: (s) => `You meet a young manager at a small local music event. They're hungry, cheap, and think they can build something with you.`,
    choices: [
      { id: 'hire', label: 'Hire the manager', effect: 'hireStarterManager' },
      { id: 'pass', label: 'Stay independent', effect: 'none' },
      { id: 'info', label: 'Ask for more information', effect: 'revealManagerInfo' }
    ]
  },
  {
    id: 'local_producer', category: 'opportunity', weight: 18,
    requirement: (s) => true,
    title: 'A Local Producer Reaches Out',
    description: () => `A local producer offers to work with you on a track — cheap rate, unpolished but hungry.`,
    choices: [
      { id: 'accept', label: 'Work with them (-€400, +song quality potential)', effect: 'localProducerBoost' },
      { id: 'decline', label: 'Pass', effect: 'none' }
    ]
  },
  {
    id: 'small_blog', category: 'opportunity', weight: 20,
    requirement: (s) => true,
    title: 'Small Blog Interview Request',
    description: () => `A small music blog wants to interview you about your come-up.`,
    choices: [
      { id: 'accept', label: 'Do the interview', effect: 'smallInterviewBoost' },
      { id: 'decline', label: 'Decline', effect: 'none' }
    ]
  },
  {
    id: 'opening_slot', category: 'opportunity', weight: 12,
    requirement: (s) => s.artist.industry.fame >= 15,
    title: 'Opening Slot Offer',
    description: () => `You're offered an opening slot for a bigger artist's show.`,
    choices: [
      { id: 'accept', label: 'Take the slot', effect: 'openingSlotBoost' },
      { id: 'decline', label: 'Decline', effect: 'none' }
    ]
  },
  {
    id: 'local_radio', category: 'opportunity', weight: 16,
    requirement: (s) => s.songs.some(sg => sg.status === 'Released'),
    title: 'Local Radio Wants In',
    description: () => `A local radio station wants to add your latest song to rotation.`,
    choices: [
      { id: 'accept', label: 'Accept', effect: 'localRadioBoost' },
      { id: 'decline', label: 'Decline', effect: 'none' }
    ]
  },
  {
    id: 'ar_notice', category: 'industry', weight: 8,
    requirement: (s) => s.artist.industry.fame >= 30 && !s.label,
    title: 'Label A&R Notices You',
    description: (s) => {
      const label = RECORD_LABELS[Math.floor(Math.random() * RECORD_LABELS.length)];
      return `An A&R from ${label.name} has been quietly watching your numbers.`;
    },
    choices: [
      { id: 'meeting', label: 'Take the meeting', effect: 'labelMeeting' },
      { id: 'ignore', label: 'Ignore for now', effect: 'none' }
    ]
  },
  {
    id: 'collab_request', category: 'industry', weight: 10,
    requirement: (s) => s.artist.industry.fame >= 20,
    title: 'A Rival Wants a Collaboration',
    description: () => `Another artist reaches out about a feature. Working together could help both of you — or make you look like you're riding their wave.`,
    choices: [
      { id: 'accept', label: 'Accept the feature', effect: 'collabAccept' },
      { id: 'decline', label: 'Decline', effect: 'none' }
    ]
  },
  {
    id: 'sponsorship', category: 'industry', weight: 10,
    requirement: (s) => s.artist.industry.fame >= 35,
    title: 'Brand Sponsorship Offer',
    description: () => `A brand wants to pay you for a sponsored post.`,
    choices: [
      { id: 'accept', label: 'Accept (+money, risk of "sellout" backlash)', effect: 'sponsorAccept' },
      { id: 'decline', label: 'Decline', effect: 'none' }
    ]
  },
  // --- PERSONAL ---
  {
    id: 'family_conflict', category: 'personal', weight: 10,
    requirement: (s) => true,
    title: 'Family Conflict',
    description: () => `Tension at home is pulling your focus. Something needs to give.`,
    choices: [
      { id: 'address', label: 'Take time to deal with it (-energy hit avoided)', effect: 'familyAddress' },
      { id: 'ignore', label: 'Push through it', effect: 'familyIgnore' }
    ]
  },
  {
    id: 'friend_money', category: 'personal', weight: 8,
    requirement: (s) => s.finances.balance > 1000,
    title: 'A Friend Asks for Money',
    description: () => `An old friend hits you up needing cash.`,
    choices: [
      { id: 'give', label: 'Help them out (-€500, +loyalty)', effect: 'friendGive' },
      { id: 'refuse', label: 'Say no', effect: 'friendRefuse' }
    ]
  },
  {
    id: 'exhaustion', category: 'personal', weight: 12,
    requirement: (s) => s.artist.energy < 35,
    title: "You're Exhausted",
    description: () => `The pace is catching up to you. Your body is telling you to slow down.`,
    choices: [
      { id: 'rest', label: 'Take the week to rest', effect: 'restWeek' },
      { id: 'push', label: 'Push through anyway', effect: 'pushThrough' }
    ]
  },
  {
    id: 'creative_block', category: 'personal', weight: 10,
    requirement: (s) => true,
    title: 'Creatively Lost',
    description: () => `Nothing you're writing feels honest right now.`,
    choices: [
      { id: 'step_away', label: 'Step away and reset', effect: 'creativeReset' },
      { id: 'force_it', label: 'Force yourself to write anyway', effect: 'creativeForce' }
    ]
  },
  // --- NEGATIVE ---
  {
    id: 'song_leak', category: 'negative', weight: 6,
    requirement: (s) => s.songs.some(sg => sg.status === 'Mastered' || sg.status === 'Scheduled'),
    title: 'A Song Leaked',
    description: () => `An unreleased song just leaked online. It's spreading fast.`,
    choices: [
      { id: 'embrace', label: 'Embrace it publicly', effect: 'leakEmbrace' },
      { id: 'damage_control', label: 'Try to contain it', effect: 'leakControl' }
    ]
  },
  {
    id: 'drive_failure', category: 'negative', weight: 6,
    requirement: (s) => s.songs.some(sg => sg.status === 'Draft' || sg.status === 'In Production'),
    title: 'Hard Drive Failure',
    description: () => `You lost unsaved studio work. It's gone.`,
    choices: [
      { id: 'accept', label: 'Accept the loss and move on', effect: 'driveFailure' }
    ]
  },
  {
    id: 'bad_interview', category: 'negative', weight: 8,
    requirement: (s) => s.artist.industry.fame >= 15,
    title: 'A Bad Interview Clip Is Going Around',
    description: () => `An old interview clip is being taken out of context online.`,
    choices: [
      { id: 'address', label: 'Address it directly', effect: 'badInterviewAddress' },
      { id: 'ignore', label: 'Say nothing', effect: 'badInterviewIgnore' }
    ]
  },
  {
    id: 'rival_attack', category: 'negative', weight: 8,
    requirement: (s) => s.artist.industry.fame >= 25,
    title: 'A Rival Artist Comes for You',
    description: () => `A rival artist posted something clearly aimed at you.`,
    choices: [
      { id: 'clapback', label: 'Clap back publicly', effect: 'rivalClapback' },
      { id: 'ignore', label: 'Rise above it', effect: 'rivalIgnore' }
    ]
  },
  {
    id: 'fake_rumor', category: 'negative', weight: 8,
    requirement: (s) => s.artist.industry.fame >= 20,
    title: 'A Fake Rumor Is Spreading',
    description: () => `A false story about you is gaining traction online.`,
    choices: [
      { id: 'deny', label: 'Publicly deny it', effect: 'rumorDeny' },
      { id: 'ignore', label: 'Let it die on its own', effect: 'rumorIgnore' }
    ]
  },
  // --- BREAKTHROUGH ---
  {
    id: 'viral_moment', category: 'breakthrough', weight: 5,
    requirement: (s) => s.songs.some(sg => sg.status === 'Released'),
    title: 'Unexpected Viral Moment',
    description: () => `A clip of one of your songs is suddenly everywhere.`,
    choices: [
      { id: 'ride_it', label: 'Ride the wave — post more', effect: 'viralRide' }
    ]
  },
  {
    id: 'celebrity_repost', category: 'breakthrough', weight: 4,
    requirement: (s) => s.songs.some(sg => sg.status === 'Released') && s.artist.industry.hype >= 30,
    title: 'A Major Celebrity Reposted You',
    description: () => `Someone with millions of followers just put your song on their story.`,
    choices: [
      { id: 'capitalize', label: 'Capitalize on it', effect: 'celebRepost' }
    ]
  },
  {
    id: 'great_beat', category: 'breakthrough', weight: 8,
    requirement: (s) => true,
    title: 'A Producer Sends an Incredible Beat',
    description: () => `An unsolicited beat lands in your inbox. It's genuinely special.`,
    choices: [
      { id: 'take', label: 'Take it (-€300 for the rights)', effect: 'greatBeat' },
      { id: 'pass', label: 'Pass', effect: 'none' }
    ]
  }
];
