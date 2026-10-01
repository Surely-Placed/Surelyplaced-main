export const EXPLAINER_STORIES = {
  grad: {
    tag: 'Final-year grad',
    tone: 'teal',
    quote:
      'I started in my last semester with no interviews. We built the search around my OPT start date, and I signed an offer before graduation.',
    by: 'Product Analyst · F-1 → OPT',
  },
  switcher: {
    tag: 'H-1B switcher',
    tone: 'blue',
    quote:
      "I'd been underpaid for two years. We planned the transfer first, then targeted employers who sponsor — I moved without a gap.",
    by: 'Senior Software Engineer · H-1B transfer',
  },
  layoff: {
    tag: 'Laid off on H-1B',
    tone: 'warning',
    quote:
      'Within two weeks I had a rewritten resume, a clear list of sponsors and interviews lined up. I signed inside my grace period.',
    by: 'Data Engineer · H-1B',
  },
  explorer: {
    tag: 'Started abroad',
    tone: 'neutral',
    quote:
      'I spent a few months just understanding the routes. When I committed to a master’s in the US, I already knew what employers wanted.',
    by: 'ML Engineer · pre-arrival → F-1 → STEM OPT',
  },
};

export const EXPLAINER_INTRO = {
  grad: 'How we help final-year students turn the months before OPT into a structured search — and what the first weeks look like.',
  switcher:
    'How H-1B professionals plan a move to a better-fit, better-paid role — without leaving their status to chance.',
  layoff:
    'How a coach helps you use your grace period well: who to target, how to position yourself, and how to prepare fast.',
  explorer:
    'An honest look at the routes international candidates take into US tech — so you can decide with the full picture.',
  stemopt:
    'How we help STEM OPT candidates use the extension well — E-Verified employers, sponsorship history and a plan around the lottery.',
  greencard:
    'How we position fully work-authorized candidates so recruiters stop asking visa questions and start talking about the role.',
  citizen:
    'How we reposition an international background so it reads as range and experience, not a question mark.',
  h4: 'How we help H4 EAD holders restart after a gap — and explain their status in one confident sentence.',
  l2: 'How we help L2 EAD holders rebuild a US career within the time the assignment allows.',
  o1a: 'How our consultative search works for senior and specialist candidates on, or working towards, O-1A.',
  phd: 'How we translate a research record into an industry resume, the right target roles and a clear interview story.',
};

export const EXPLAINER_STORY_ALIAS = {
  stemopt: 'grad',
  greencard: 'switcher',
  citizen: 'switcher',
  h4: 'explorer',
  l2: 'explorer',
  o1a: 'switcher',
  phd: 'grad',
};

export const EXPLAINER_CTA = {
  grad: 'Ready to plan your search around your OPT date?',
  switcher: 'Ready to plan your next move?',
  layoff: 'Let’s use the days you have well.',
  explorer: 'Curious whether this path fits you?',
  stemopt: 'Ready to plan around your extension?',
  greencard: 'Ready for a search about the role, not your status?',
  citizen: 'Ready to turn your background into an edge?',
  h4: 'Ready to plan your restart?',
  l2: 'Ready to make the assignment count?',
  o1a: 'Ready to discuss your case?',
  phd: 'Ready to translate your research?',
};

export const EXPLAINER_STEPS = [
  {
    n: '01',
    title: 'Map your timeline',
    body: 'We start with your visa status and your real deadlines — OPT start, grace period, or a move you’re planning — and set target roles that fit them.',
  },
  {
    n: '02',
    title: 'Rebuild your resume and LinkedIn',
    body: 'Rewritten for the roles you’re targeting, so recruiters see a fit in the first ten seconds — not a generic profile.',
  },
  {
    n: '03',
    title: 'Run a structured search',
    body: 'Mass applying is a waste of time. You work a focused list of employers with a track record of sponsoring, tracked weekly.',
  },
  {
    n: '04',
    title: 'Prepare and interview',
    body: 'Mock interviews and 1:1 mentorship until you walk into every round ready.',
  },
  {
    n: '05',
    title: 'Offer and negotiation',
    body: 'Support through offers, negotiation and the paperwork steps with your new employer.',
  },
];

export const EXPLAINER_VISAS = [
  {
    tag: 'F-1 / OPT',
    tone: 'teal',
    title: 'Graduating on F-1',
    body: 'Planning the search before and during your OPT period.',
  },
  {
    tag: 'STEM OPT',
    tone: 'teal',
    title: 'On STEM OPT',
    body: 'Using the extension window to land a role with sponsorship.',
  },
  {
    tag: 'H-1B',
    tone: 'blue',
    title: 'Employed on H-1B',
    body: 'Moving to a better-fit employer through a transfer.',
  },
  {
    tag: 'H-1B',
    tone: 'warning',
    title: 'Laid off on H-1B',
    body: 'A focused search while your grace period runs.',
  },
  {
    tag: 'Pre-arrival',
    tone: 'neutral',
    title: 'Still abroad',
    body: 'Understanding the routes before you commit to a move.',
  },
  {
    tag: 'H4 / L2 EAD',
    tone: 'teal',
    title: 'On a dependent EAD',
    body: 'Restarting or rebuilding a career with employers who understand EAD.',
  },
  {
    tag: 'O-1A',
    tone: 'blue',
    title: 'Extraordinary ability',
    body: 'A consultative search for senior and specialist roles.',
  },
  {
    tag: 'Authorized',
    tone: 'success',
    title: 'Green card or citizen',
    body: 'Positioning so your background reads as an asset.',
  },
  {
    tag: 'PhD',
    tone: 'neutral',
    title: 'Academia to industry',
    body: 'Translating research into an industry resume and story.',
  },
];
